// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - API SERVICE
// Didar Mubarak Pakistan
// ============================================

import { API_BASE_URL } from '../apiBaseUrl';
import { tokenService } from './tokenService';

// ============================================
// API SERVICE CLASS
// ============================================

class VolunteerApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const token = tokenService.getAccessToken();
    
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    console.log('Volunteer API Request:', { url, method: config.method || 'GET' });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Volunteer API Error:', error);
      throw error;
    }
  }

  // POST simplified maker-approved array to /api/maker-approved
  async postMakerApprovedArray(recordsArray) {
    const url = `${this.baseUrl}/api/maker-approved`;
    const token = tokenService.getAccessToken();
    try {
      // eslint-disable-next-line no-console
      console.debug('postMakerApprovedArray POST', { url, count: (recordsArray || []).length });
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(recordsArray),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      const json = await resp.json().catch(() => null);
      // eslint-disable-next-line no-console
      console.debug('postMakerApprovedArray response', { status: resp.status, json });
      return json;
    } catch (err) {
      console.error('postMakerApprovedArray error:', err);
      throw err;
    }
  }



  // ============================================
  // MAKER WORKFLOW
  // ============================================

  async approveVolunteers(data) {
    return this.makeRequest('/api/volunteers/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitMakerDecisions(decisions) {
    return this.makeRequest('/api/volunteers/maker-decisions', {
      method: 'POST',
      body: JSON.stringify(decisions),
    });
  }

  async submitVolunteers(volunteerIds) {
    return this.makeRequest('/api/volunteers/submit', {
      method: 'POST',
      body: JSON.stringify({ volunteerIds }),
    });
  }

  async createRecord(record) {
    return this.makeRequest('/api/volunteers/record', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async getVolunteersByImportOrUser(data) {
    return this.makeRequest('/api/volunteers/by-import-or-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


}

const volunteerApiService = new VolunteerApiService();
export default volunteerApiService;
