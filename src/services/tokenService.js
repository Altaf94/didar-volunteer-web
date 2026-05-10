// Token service for handling access and refresh tokens in React Web
import { atob } from '../utils/base64';
import { API_BASE_URL } from '../apiBaseUrl';

class TokenService {
  static instance = null;

  static getInstance() {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }

    return TokenService.instance;
  }

  getAccessToken() {
    return localStorage.getItem('token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

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

    keys.forEach((key) => localStorage.removeItem(key));

    console.log('Tokens cleared from localStorage');
  }

  logout() {
    console.log('Logout called, clearing all authentication data...');
    this.clearTokens();
    console.log('All authentication data cleared');
  }

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

  decodeTokenPayload(token) {
    try {
      if (!token || token.split('.').length !== 3) {
        return null;
      }

      return JSON.parse(this.safeBase64Decode(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token payload:', error);
      return null;
    }
  }

  normalizeRole(role) {
    if (role === null || role === undefined) {
      return null;
    }

    if (typeof role === 'number') {
      return role;
    }

    const roleString = String(role).trim().toLowerCase();

    if (/^\d+$/.test(roleString)) {
      return Number(roleString);
    }

    if (roleString.includes('maker')) {
      return 2;
    }

    if (roleString.includes('checker')) {
      return 3;
    }

    if (roleString.includes('admin')) {
      return 1;
    }

    return role;
  }

  isTokenExpired(token) {
    try {
      const payload = this.decodeTokenPayload(token);

      if (!payload) {
        return true;
      }

      if (!payload.exp) {
        return false;
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60 * 1000;

      return currentTime >= expirationTime - bufferTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  getUserRole() {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return null;
    }

    return this.normalizeRole(payload.role);
  }

  getUserScope() {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return null;
    }

    return payload.scope || null;
  }

  getUserRegionId() {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return null;
    }

    return payload.region_id || null;
  }

  getUserPermissions() {
    const token = this.getAccessToken();

    if (!token) {
      return {
        canView: false,
        canMake: false,
        canCheck: false,
      };
    }

    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return {
        canView: false,
        canMake: false,
        canCheck: false,
      };
    }

    const role = this.normalizeRole(payload.role);

    const canView =
      payload.can_view !== undefined && payload.can_view !== null
        ? payload.can_view
        : true;

    const canMake =
      payload.can_make !== undefined && payload.can_make !== null
        ? payload.can_make
        : role === 2 || role === 5;

    const canCheck =
      payload.can_check !== undefined && payload.can_check !== null
        ? payload.can_check
        : role === 3 || role === 6;

    return {
      canView,
      canMake,
      canCheck,
    };
  }

  canView() {
    const permissions = this.getUserPermissions();
    return permissions && permissions.canView ? true : false;
  }

  canMake() {
    const permissions = this.getUserPermissions();
    return permissions && permissions.canMake ? true : false;
  }

  canCheck() {
    const permissions = this.getUserPermissions();
    return permissions && permissions.canCheck ? true : false;
  }

  isAuthenticated() {
    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  async getValidAccessToken() {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('No access token available');
    }

    if (!this.isTokenExpired(token)) {
      return token;
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      throw new Error('No refresh token available');
    }

    try {
      const refreshUrl = `${API_BASE_URL}/refresh`;

      console.log('Refreshing token using:', refreshUrl);

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: HTTP ${response.status}`);
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