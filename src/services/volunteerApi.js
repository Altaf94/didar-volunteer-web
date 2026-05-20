// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - API SERVICE
// Didar Mubarak Pakistan
// ============================================

import { API_BASE_URL } from '../apiBaseUrl';
import { tokenService } from './tokenService';

/**
 * These GET routes are not available on all backends. When unset/false, the app uses in-memory
 * empty data (no network). Set to `true` in .env when your API implements:
 * GET /api/volunteers, GET /api/volunteers/dashboard/stats, GET /api/volunteers/dispatch-packages
 */
const USE_HTTP_VOLUNTEER_LIST_DASHBOARD =
  process.env.REACT_APP_VOLUNTEER_HTTP_LIST_DASHBOARD === 'true';

function emptyVolunteersListResponse(filters = {}) {
  const page = Number(filters.page) || 1;
  const pageSize = Number(filters.pageSize) || 20;
  return {
    data: [],
    pagination: { total: 0, page, pageSize },
  };
}

function emptyDashboardStats() {
  return {
    totalRequired: 0,
    totalReceived: 0,
    receivedPercentage: 0,
    totalPrinted: 0,
    printedPercentage: 0,
    totalDispatched: 0,
    byRegion: [],
    byAccessLevel: [],
    lastUpdated: new Date().toISOString(),
  };
}

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
        throw new Error(errorData.message || errorData.detail?.message || `HTTP ${response.status}`);
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

  /** GET list grouped by import (checker role). */
  async getMakerDecisions(userId) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.makeRequest(`/api/volunteers/maker-decisions${query}`, { method: 'GET' });
  }

  /** GET approved maker decisions ready for printing. */
  async getMakerDecisionsOk(userId) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.makeRequest(`/api/volunteers/maker-decisions-ok${query}`, { method: 'GET' });
  }

  /** Directly insert maker decisions with decision_status='Ok'. */
  async insertOkMakerDecisions(records) {
    return this.makeRequest('/api/volunteers/maker-decisions/ok', {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }

  /** Checker submits approve/reject for an import. */
  async submitMakerDecisionsByImport(body) {
    return this.makeRequest('/api/volunteers/maker-decisions/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /** Mark maker decisions as printed for a given import ID. */
  async markMakerDecisionsPrinted(importId) {
    return this.makeRequest(`/api/volunteers/maker-decisions/mark-printed?importId=${encodeURIComponent(importId)}`, {
      method: 'PATCH',
    });
  }

  /** Send forgot-password email (no auth required). */
  async forgotPassword(email) {
    return this.makeRequest('/api/volunteers/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /** Reset password using token from email. */
  async resetPassword(token, newPassword) {
    return this.makeRequest('/api/volunteers/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  /** Check whether an import ID exists in maker_decisions table. */
  async getImportStatus(importId) {
    return this.makeRequest(`/api/volunteers/import-status?importId=${encodeURIComponent(importId)}`, {
      method: 'GET',
    });
  }

  /** Update remaining counts in event_access_level_duty_requirements based on approved maker_decisions. */
  async updateRemainingCounts() {
    return this.makeRequest('/api/volunteers/event-access-level-duty-requirements/update-remaining', {
      method: 'POST',
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

  // ============================================
  // CHECKER / LIST + DASHBOARD
  // (Expected response shapes match VolunteerContext)
  // ============================================

  buildQuery(filters = {}) {
    const q = new URLSearchParams();
    const entries = {
      page: filters.page,
      pageSize: filters.pageSize,
      status: filters.status,
      region: filters.region,
      eventId: filters.eventId,
      dutyTypeId: filters.dutyTypeId,
    };
    Object.entries(entries).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        q.set(key, String(val));
      }
    });
    return q.toString();
  }

  async getVolunteers(filters = {}) {
    if (!USE_HTTP_VOLUNTEER_LIST_DASHBOARD) {
      return Promise.resolve(emptyVolunteersListResponse(filters));
    }
    const qs = this.buildQuery(filters);
    const path = qs ? `/api/volunteers?${qs}` : '/api/volunteers';
    return this.makeRequest(path, { method: 'GET' });
  }

  async getUploadBatches(region) {
    const q = region ? `?region=${encodeURIComponent(region)}` : '';
    return this.makeRequest(`/api/volunteers/upload-batches${q}`, { method: 'GET' });
  }

  async getDispatchPackages(region) {
    if (!USE_HTTP_VOLUNTEER_LIST_DASHBOARD) {
      return Promise.resolve([]);
    }
    const q = region ? `?region=${encodeURIComponent(region)}` : '';
    return this.makeRequest(`/api/volunteers/dispatch-packages${q}`, { method: 'GET' });
  }

  async getDashboardStats(filters = {}) {
    if (!USE_HTTP_VOLUNTEER_LIST_DASHBOARD) {
      return Promise.resolve(emptyDashboardStats());
    }
    const qs = this.buildQuery(filters);
    const path = qs ? `/api/volunteers/dashboard/stats?${qs}` : '/api/volunteers/dashboard/stats';
    return this.makeRequest(path, { method: 'GET' });
  }

  async getLocalCouncils(region) {
    const q = region ? `?region=${encodeURIComponent(region)}` : '';
    return this.makeRequest(`/api/volunteers/local-councils${q}`, { method: 'GET' });
  }

  async getJamatKhanas(localCouncilId) {
    if (localCouncilId == null || localCouncilId === '') {
      return Promise.resolve([]);
    }
    return this.makeRequest(
      `/api/volunteers/jamat-khanas?localCouncilId=${encodeURIComponent(localCouncilId)}`,
      { method: 'GET' },
    );
  }

  async createPrintBatch(data) {
    return this.makeRequest('/api/volunteers/print-batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async printBadges(printBatchId) {
    return this.makeRequest(`/api/volunteers/print-batches/${encodeURIComponent(printBatchId)}/print`, {
      method: 'POST',
    });
  }

  async generateCoveringSheet(printBatchId) {
    return this.makeRequest(
      `/api/volunteers/print-batches/${encodeURIComponent(printBatchId)}/covering-sheet`,
      { method: 'GET' },
    );
  }

  async prepareDispatchPackage(data) {
    return this.makeRequest('/api/volunteers/dispatch-packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async dispatchPackage(packageId) {
    return this.makeRequest(
      `/api/volunteers/dispatch-packages/${encodeURIComponent(packageId)}/dispatch`,
      { method: 'POST' },
    );
  }
}

const volunteerApiService = new VolunteerApiService();
export default volunteerApiService;
