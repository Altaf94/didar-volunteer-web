// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - API SERVICE
// Didar Mubarak Pakistan
// ============================================

import { tokenService } from './tokenService';
import {
  VolunteerStatus,
  PrintStatus,
  AccessLevel,
} from '../types/volunteer';
import { EVENTS, DUTY_TYPES, REGIONS, DATA_SOURCES } from '../constants/volunteerConstants';

const API_BASE_URL = 'http://127.0.0.1:8001';

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



  // ============================================
  // MAKER WORKFLOW
  // ============================================

  async approveVolunteers(data) {
    return this.makeRequest('/api/volunteers/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitVolunteers(volunteerIds) {
    return this.makeRequest('/api/volunteers/submit', {
      method: 'POST',
      body: JSON.stringify({ volunteerIds }),
    });
  }


}

const volunteerApiService = new VolunteerApiService();
export default volunteerApiService;
