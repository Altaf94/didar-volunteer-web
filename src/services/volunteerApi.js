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

const API_BASE_URL = 'https://api-volunteer.azurewebsites.net';
const USE_MOCK_API = true; // Enable mock mode for development

// ============================================
// MOCK DATA GENERATOR
// ============================================

const getAccessLevelName = (level) => {
  const names = {
    [AccessLevel.STAGE]: 'Stage',
    [AccessLevel.PANDAL]: 'Pandal',
    [AccessLevel.OUTSIDE_HOLDING_AREA]: 'Outside Holding Area',
    [AccessLevel.OUTSIDE_AREA]: 'Outside Area',
    [AccessLevel.HEALTH_AREA]: 'Health Area',
  };
  return names[level] || `Level ${level}`;
};

const generateMockVolunteers = (count = 50) => {
  const statuses = [
    VolunteerStatus.VALID,
    VolunteerStatus.PENDING,
    VolunteerStatus.DISCREPANT,
    VolunteerStatus.APPROVED,
    VolunteerStatus.PRINTED,
  ];
  
  const volunteers = [];
  
  for (let i = 1; i <= count; i++) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)].value;
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const dutyType = DUTY_TYPES[Math.floor(Math.random() * DUTY_TYPES.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const source = DATA_SOURCES[Math.floor(Math.random() * DATA_SOURCES.length)].value;
    
    volunteers.push({
      id: `vol-${i}`,
      volunteerId: `VID-${String(i).padStart(6, '0')}`,
      cnic: `${12345 + i}-${1234567 + i}-${i % 10}`,
      name: `Volunteer ${i}`,
      eventId: event.id,
      eventNumber: event.eventNumber,
      dutyTypeId: dutyType.id,
      dutyTypeName: dutyType.name,
      accessLevel: dutyType.accessLevel,
      accessLevelName: getAccessLevelName(dutyType.accessLevel),
      region,
      source,
      sourceEntityId: `source-${i}`,
      sourceEntityName: `Source Entity ${i}`,
      uploadBatchId: `batch-${Math.ceil(i / 10)}`,
      status,
      validationErrors: [],
      printStatus: status === VolunteerStatus.PRINTED ? PrintStatus.PRINTED : PrintStatus.NOT_PRINTED,
      cnicVerified: status !== VolunteerStatus.PENDING,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return volunteers;
};

// Clear mock volunteers for a fresh start in the UI
let mockVolunteers = [];

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
  // VOLUNTEER CRUD OPERATIONS
  // ============================================

  async getVolunteers(filters = {}) {
    if (USE_MOCK_API) {
      let filtered = [...mockVolunteers];
      
      if (filters.region) {
        filtered = filtered.filter(v => v.region === filters.region);
      }
      if (filters.status) {
        filtered = filtered.filter(v => v.status === filters.status);
      }
      if (filters.eventId) {
        filtered = filtered.filter(v => v.eventId === filters.eventId);
      }
      if (filters.accessLevel) {
        filtered = filtered.filter(v => v.accessLevel === filters.accessLevel);
      }
      if (filters.cnic) {
        filtered = filtered.filter(v => v.cnic.includes(filters.cnic));
      }
      if (filters.name) {
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(filters.name.toLowerCase())
        );
      }
      
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return {
        data: filtered.slice(start, end),
        pagination: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize),
          hasNext: end < filtered.length,
          hasPrevious: page > 1,
        },
      };
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(`/api/volunteers?${queryParams}`);
  }

  async getVolunteerById(id) {
    if (USE_MOCK_API) {
      const volunteer = mockVolunteers.find(v => v.id === id);
      if (!volunteer) throw new Error('Volunteer not found');
      return volunteer;
    }

    return this.makeRequest(`/api/volunteers/${id}`);
  }

  async getVolunteerByCnic(cnic) {
    if (USE_MOCK_API) {
      return mockVolunteers.filter(v => v.cnic === cnic);
    }

    return this.makeRequest(`/api/volunteers/cnic/${cnic}`);
  }

  // ============================================
  // UPLOAD & VALIDATION
  // ============================================

  async uploadVolunteerData(formData) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        id: `batch-${Date.now()}`,
        fileName: 'volunteers.xlsx',
        region: formData.region,
        uploadedBy: 'current-user',
        uploadedByName: 'Current User',
        totalRecords: 50,
        validRecords: 40,
        rejectedRecords: 5,
        discrepantRecords: 5,
        status: 'completed',
        source: formData.source,
        sourceEntityId: formData.sourceEntityId,
        sourceEntityName: 'Source Entity',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      };
    }

    const body = new FormData();
    body.append('file', formData.file);
    body.append('region', formData.region);
    body.append('source', formData.source);
    body.append('sourceEntityId', formData.sourceEntityId);

    return this.makeRequest('/api/volunteers/upload', {
      method: 'POST',
      headers: {},
      body: body,
    });
  }

  async validateCnic(cnic) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isValid = Math.random() > 0.1;
      return {
        isValid,
        isRegistered: isValid,
        name: isValid ? 'Mock User Name' : undefined,
        message: isValid ? 'CNIC verified successfully' : 'CNIC not found in system',
      };
    }

    return this.makeRequest(`/api/enrollment/validate/${cnic}`);
  }

  async getValidationResult(batchId) {
    if (USE_MOCK_API) {
      const batchVolunteers = mockVolunteers.filter(v => v.uploadBatchId === batchId);
      
      return {
        batchId,
        totalRecords: batchVolunteers.length,
        validRecords: batchVolunteers.filter(v => v.status === VolunteerStatus.VALID),
        rejectedRecords: batchVolunteers
          .filter(v => v.status === VolunteerStatus.REJECTED)
          .map(v => ({ ...v, errors: v.validationErrors })),
        discrepantRecords: batchVolunteers
          .filter(v => v.status === VolunteerStatus.DISCREPANT)
          .map(v => ({ ...v, errors: v.validationErrors })),
      };
    }

    return this.makeRequest(`/api/volunteers/validation/${batchId}`);
  }

  // ============================================
  // MAKER WORKFLOW
  // ============================================

  async approveVolunteers(data) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, approved: data.volunteerIds.length };
    }

    return this.makeRequest('/api/volunteers/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitVolunteers(volunteerIds) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, submitted: volunteerIds.length };
    }

    return this.makeRequest('/api/volunteers/submit', {
      method: 'POST',
      body: JSON.stringify({ volunteerIds }),
    });
  }

  // ============================================
  // CHECKER WORKFLOW
  // ============================================

  async approveForPrinting(volunteerIds) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, approved: volunteerIds.length };
    }

    return this.makeRequest('/api/volunteers/approve-printing', {
      method: 'POST',
      body: JSON.stringify({ volunteerIds }),
    });
  }

  // ============================================
  // UPLOAD BATCHES
  // ============================================

  async getUploadBatches(region) {
    if (USE_MOCK_API) {
      // Return an empty list of upload batches so Recent Uploads is cleared
      return [];
    }

    const params = region ? `?region=${region}` : '';
    return this.makeRequest(`/api/volunteers/batches${params}`);
  }

  // ============================================
  // PRINT BATCHES
  // ============================================

  async createPrintBatch(data) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `print-${Date.now()}`,
        region: data.region,
        volunteerIds: data.volunteerIds,
        totalBadges: data.volunteerIds.length,
        printedBy: 'current-user',
        printedByName: 'Current User',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    return this.makeRequest('/api/volunteers/print-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async printBadges(printBatchId) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, printBatchId };
    }

    return this.makeRequest(`/api/volunteers/print/${printBatchId}`, {
      method: 'POST',
    });
  }

  async generateCoveringSheet(printBatchId) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [{
        id: `sheet-${Date.now()}`,
        printBatchId,
        region: REGIONS[0].value,
        accessLevel: AccessLevel.STAGE,
        bandColor: '#FFD700',
        volunteers: [],
        generatedAt: new Date().toISOString(),
        generatedBy: 'current-user',
      }];
    }

    return this.makeRequest(`/api/volunteers/covering-sheet/${printBatchId}`);
  }

  // ============================================
  // DISPATCH PACKAGES
  // ============================================

  async prepareDispatchPackage(data) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `package-${Date.now()}`,
        printBatchIds: data.printBatchIds,
        region: data.region,
        destination: data.destination,
        destinationEntityId: data.destinationEntityId,
        destinationEntityName: 'Destination Entity',
        totalBadges: 50,
        status: 'prepared',
        preparedBy: 'current-user',
        preparedByName: 'Current User',
        createdAt: new Date().toISOString(),
      };
    }

    return this.makeRequest('/api/volunteers/dispatch-package', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async dispatchPackage(packageId) {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, packageId };
    }

    return this.makeRequest(`/api/volunteers/dispatch/${packageId}`, {
      method: 'POST',
    });
  }

  async getDispatchPackages(region) {
    if (USE_MOCK_API) {
      const packages = [];
      for (let i = 1; i <= 3; i++) {
        packages.push({
          id: `package-${i}`,
          printBatchIds: [`print-${i}`],
          region: region || REGIONS[Math.floor(Math.random() * REGIONS.length)].value,
          destination: DATA_SOURCES[Math.floor(Math.random() * DATA_SOURCES.length)].value,
          destinationEntityId: `dest-${i}`,
          destinationEntityName: `Destination Entity ${i}`,
          totalBadges: 30 + Math.floor(Math.random() * 20),
          status: Math.random() > 0.5 ? 'dispatched' : 'prepared',
          preparedBy: 'user-1',
          preparedByName: 'Checker User',
          dispatchedBy: 'user-1',
          dispatchedByName: 'Checker User',
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          dispatchedAt: new Date().toISOString(),
        });
      }
      return packages;
    }

    const params = region ? `?region=${region}` : '';
    return this.makeRequest(`/api/volunteers/dispatch-packages${params}`);
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats(filters = {}) {
    if (USE_MOCK_API) {
      const totalRequired = 35000;
      const totalReceived = Math.floor(totalRequired * 0.75);
      const totalPrinted = Math.floor(totalReceived * 0.6);
      const totalDispatched = Math.floor(totalPrinted * 0.4);

      const byRegion = REGIONS.map(region => ({
        region: region.value,
        regionName: region.label,
        required: Math.floor(totalRequired / REGIONS.length),
        received: Math.floor((totalRequired / REGIONS.length) * (0.5 + Math.random() * 0.4)),
        printed: Math.floor((totalRequired / REGIONS.length) * (0.3 + Math.random() * 0.3)),
        dispatched: Math.floor((totalRequired / REGIONS.length) * (0.1 + Math.random() * 0.2)),
      }));

      const byAccessLevel = Object.values(AccessLevel).filter(v => typeof v === 'number').map(level => ({
        accessLevel: level,
        accessLevelName: getAccessLevelName(level),
        required: Math.floor(totalRequired / 5),
        received: Math.floor((totalRequired / 5) * (0.5 + Math.random() * 0.4)),
      }));

      return {
        totalRequired,
        totalReceived,
        totalPrinted,
        totalDispatched,
        receivedPercentage: Math.round((totalReceived / totalRequired) * 100),
        printedPercentage: Math.round((totalPrinted / totalRequired) * 100),
        byRegion,
        byAccessLevel,
        lastUpdated: new Date().toISOString(),
      };
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(`/api/volunteers/dashboard?${queryParams}`);
  }

  // ============================================
  // MASTER DATA
  // ============================================

  async getLocalCouncils(region) {
    if (USE_MOCK_API) {
      const councils = [];
      for (let i = 1; i <= 5; i++) {
        councils.push({
          id: `lc-${i}`,
          regionalCouncilId: `rc-1`,
          name: `Local Council ${i}`,
          code: `LC${i}`,
          createdAt: new Date().toISOString(),
        });
      }
      return councils;
    }

    const params = region ? `?region=${region}` : '';
    return this.makeRequest(`/api/local-councils${params}`);
  }

  async getJamatKhanas(localCouncilId) {
    if (USE_MOCK_API) {
      const jks = [];
      for (let i = 1; i <= 3; i++) {
        jks.push({
          id: `jk-${i}`,
          localCouncilId: localCouncilId || 'lc-1',
          name: `Jamat Khana ${i}`,
          code: `JK${i}`,
          region: REGIONS[0].value,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
      return jks;
    }

    const params = localCouncilId ? `?localCouncilId=${localCouncilId}` : '';
    return this.makeRequest(`/api/jamat-khanas${params}`);
  }
}

const volunteerApiService = new VolunteerApiService();
// Utility methods for development/testing when using mock API
// Clear all mock data (useful for resetting maker/demo data)
volunteerApiService.clearMockData = () => {
  if (!USE_MOCK_API) return false;
  mockVolunteers.length = 0;
  console.log('Mock volunteers cleared');
  return true;
};

// Reset mock data with an optional count (default 100)
volunteerApiService.resetMockData = (count = 100) => {
  if (!USE_MOCK_API) return false;
  mockVolunteers = generateMockVolunteers(count);
  console.log(`Mock volunteers reset to ${count} records`);
  return true;
};

// Remove maker-specific localStorage items
volunteerApiService.clearMakerLocalStorage = () => {
  const keys = [
    'uploadBatches',
    'applicationDraft',
    'selectedJamatkhanaData',
    'selectedJamatkhana',
    'maker_filters',
  ];
  keys.forEach(k => localStorage.removeItem(k));
  console.log('Cleared maker-related localStorage keys');
  return true;
};
export default volunteerApiService;
