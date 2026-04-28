// API service for handling all API calls
import { API_BASE_URL, HEALTH_CHECK_URL } from '../apiBaseUrl';
import { tokenService } from './tokenService';
import { btoa } from '../utils/base64';
const USE_MOCK_API = false; // Set to true to use mock data instead of real API

console.log('API Configuration:', {
  API_BASE_URL,
  USE_MOCK_API,
});

class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('API Service initialized with base URL:', this.baseUrl);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log('Making API request:', {
      url,
      method: config.method || 'GET',
    });

    try {
      const response = await fetch(url, config);

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('API Error Response:', errorData);
        throw new Error(this.formatError(errorData));
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const textResponse = await response.text();
        try {
          return JSON.parse(textResponse);
        } catch (parseError) {
          return { message: textResponse };
        }
      }
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server');
      }
      throw error;
    }
  }

  formatError(errorData) {
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map(err => err.msg).join(', ');
      }
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }
    }
    return errorData.message || 'An error occurred';
  }

  // Test API connectivity
  async testConnection() {
    if (USE_MOCK_API) {
      console.log('Using mock API - connection test will always pass');
      return true;
    }

    try {
      console.log('Testing API connection to:', HEALTH_CHECK_URL);
      const response = await fetch(HEALTH_CHECK_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log('Health check response:', response.status);
      return response.ok;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }

  async login(credentials) {
    console.log('Login attempt with credentials:', {
      username: credentials.username,
      password: credentials.password ? '[REDACTED]' : 'undefined',
    });

    if (USE_MOCK_API) {
      console.log('Using mock API for login');
      return new Promise(resolve => {
        setTimeout(() => {
          const email = credentials.username.toLowerCase();
          let userRole = 3;
          let userId = 1;

          if (email.includes('maker')) {
            userRole = 1;
            userId = 3;
          } else if (email.includes('checker')) {
            userRole = 2;
            userId = 2;
          } else if (email.includes('admin')) {
            userRole = 3;
            userId = 1;
          }

          const mockPayload = {
            sub: String(userId),
            username: credentials.username,
            email: credentials.username,
            role: userRole,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          };

          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(JSON.stringify(mockPayload));
          const signature = 'mock_signature';
          const mockToken = `${header}.${payload}.${signature}`;

          resolve({
            access_token: mockToken,
            refresh_token: 'mock_refresh_token_' + Date.now(),
            token_type: 'bearer',
            user: {
              id: userId,
              username: credentials.username,
              email: credentials.username,
              role: userRole,
            },
          });
        }, 1000);
      });
    }

    // Real backend call
    try {
      const loginUrl = `${this.baseUrl}/api/volunteers/auth/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        let textBody = null;
        try {
          textBody = await response.text();
        } catch (e) {
          console.warn('Failed to read error response text:', e);
        }

        let errBody = {};
        try {
          errBody = textBody ? JSON.parse(textBody) : {};
        } catch (e) {
          errBody = { message: textBody || `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('Login failed:', {
          url: loginUrl,
          status: response.status,
          statusText: response.statusText,
          rawBody: textBody,
          parsedBody: errBody,
        });

        const errMsg =
          typeof errBody.detail === 'string'
            ? errBody.detail
            : Array.isArray(errBody.detail)
              ? errBody.detail.map((e) => e.msg).join(', ')
              : errBody.message || `Login failed (HTTP ${response.status})`;

        throw new Error(errMsg);
      }

      const data = await response.json();

      const access_token = data.access_token || data.token || data.accessToken || null;
      const refresh_token = data.refresh_token || data.refreshToken || data.refresh || null;

      return {
        access_token,
        refresh_token,
        token_type: data.token_type || data.tokenType || 'bearer',
        user: data.user || data.user_data || data.profile || null,
        message: data.message,
      };
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async logout() {
    return this.makeRequest('/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email) {
    return this.makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getProfile() {
    const isAuth = tokenService.isAuthenticated();
    if (!isAuth) {
      throw new Error('No authentication token available');
    }

    const token = await tokenService.getValidAccessToken();
    return this.makeRequest('/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Get users with filters
  async getUsers(filters = {}) {
    console.log('Getting users with filters:', filters);

    if (USE_MOCK_API) {
      return new Promise(resolve => {
        setTimeout(() => {
          const mockUsers = [
            {
              Id: '1',
              Email: 'admin@mhip.com',
              FullName: 'Administrator',
              PhoneNumber: '+1234567890',
              RoleId: 3,
              StatusId: 1,
              JamatKhanaIds: ['JK001', 'JK002'],
              IsActive: true,
              CreatedAt: new Date().toISOString(),
              UpdatedAt: null,
            },
            {
              Id: '2',
              Email: 'checker@mhip.com',
              FullName: 'Checker User',
              PhoneNumber: '+1234567891',
              RoleId: 2,
              StatusId: 1,
              JamatKhanaIds: ['JK001'],
              IsActive: true,
              CreatedAt: new Date().toISOString(),
              UpdatedAt: null,
            },
            {
              Id: '3',
              Email: 'maker@mhip.com',
              FullName: 'Maker User',
              PhoneNumber: '+1234567892',
              RoleId: 1,
              StatusId: 1,
              JamatKhanaIds: ['JK001'],
              IsActive: true,
              CreatedAt: new Date().toISOString(),
              UpdatedAt: null,
            },
          ];

          resolve({
            Users: mockUsers,
            Pagination: {
              Total: mockUsers.length,
              Page: filters.PageNumber || 1,
              TotalPages: 1,
              PageSize: filters.PageSize || 10,
              HasNext: false,
              HasPrevious: false,
              NextPage: null,
              PreviousPage: null,
            },
          });
        }, 500);
      });
    }

    const isAuth = tokenService.isAuthenticated();
    if (!isAuth) {
      throw new Error('No authentication token available');
    }

    const queryParams = new URLSearchParams();
    if (filters.RoleId) queryParams.append('RoleId', filters.RoleId.toString());
    if (filters.StatusId) queryParams.append('StatusId', filters.StatusId.toString());
    if (filters.Email) queryParams.append('Email', filters.Email);
    if (filters.JamatKhanaId) queryParams.append('JamatKhanaId', filters.JamatKhanaId);
    if (filters.PageNumber) queryParams.append('PageNumber', filters.PageNumber.toString());
    if (filters.PageSize) queryParams.append('PageSize', filters.PageSize.toString());

    const endpoint = `/users/?${queryParams.toString()}`;

    const token = await tokenService.getValidAccessToken();
    return this.makeRequest(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

const apiService = new ApiService();
export default apiService;
