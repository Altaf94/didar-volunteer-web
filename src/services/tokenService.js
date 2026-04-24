// Token service for handling access and refresh tokens in React Web
import { atob } from '../utils/base64';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001';

class TokenService {
  static instance = null;

  static getInstance() {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // Get access token from localStorage
  getAccessToken() {
    return localStorage.getItem('token');
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  // Set tokens in localStorage
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Clear tokens from localStorage
  clearTokens() {
    console.log('clearTokens called, removing tokens from localStorage');
    const keys = [
      'token',
      'refresh_token',
      'user',
      'selectedJamatkhana',
      'selectedJamatkhanaData',
      'applicationDraft',
      'formId',
      'lookupTables',
      'rememberedEmail',
      'rememberMe',
    ];
    keys.forEach(key => localStorage.removeItem(key));
    console.log('Tokens cleared from localStorage');
  }

  // Logout function
  logout() {
    console.log('Logout called, clearing all authentication data...');
    this.clearTokens();
    console.log('All authentication data cleared');
  }

  // Safe base64 decoding
  safeBase64Decode(str) {
    try {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return atob(padded);
    } catch (error) {
      console.warn('Failed to decode base64:', error);
      throw error;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      if (!token || token.split('.').length !== 3) {
        return true;
      }

      const payload = JSON.parse(this.safeBase64Decode(token.split('.')[1]));
      
      if (!payload.exp) {
        return false;
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60 * 1000; // 1 minute buffer

      return currentTime >= expirationTime - bufferTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Get user role from token
  getUserRole() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(this.safeBase64Decode(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Get user scope (e.g., 'national' or 'regional') from token
  getUserScope() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(this.safeBase64Decode(token.split('.')[1]));
      return payload.scope || null;
    } catch (error) {
      console.error('Error getting user scope:', error);
      return null;
    }
  }

  // Get user's assigned region id from token (if any)
  getUserRegionId() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(this.safeBase64Decode(token.split('.')[1]));
      return payload.region_id || null;
    } catch (error) {
      console.error('Error getting user region id:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken() {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    if (!this.isTokenExpired(token)) {
      return token;
    }

    // Try to refresh the token
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/volunteers/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.setTokens(data.access_token, data.refresh_token || refreshToken);
        return data.access_token;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }
}

export const tokenService = TokenService.getInstance();
