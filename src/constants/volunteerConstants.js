// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - CONSTANTS & MASTER DATA
// Didar Mubarak Pakistan
// ============================================

import {
  Region,
  UserRole,
  UserLevel,
  AccessLevel,
  DataSource,
  VolunteerStatus,
  PrintStatus,
  ACCESS_LEVEL_BAND_COLORS,
  ACCESS_LEVEL_NAMES,
} from '../types/volunteer';

// ============================================
// REGION CONFIGURATION (6 Regions)
// ============================================

export const REGIONS = [
  { value: Region.GILGIT, label: 'Gilgit', code: 'GLT' },
  { value: Region.HUNZA, label: 'Hunza', code: 'HNZ' },
  { value: Region.GUPIS, label: 'Gupis', code: 'GPS' },
  { value: Region.ISHKOMAN, label: 'Ishkoman', code: 'ISH' },
  { value: Region.LOWER_CHITRAL, label: 'Lower Chitral', code: 'LCH' },
  { value: Region.UPPER_CHITRAL, label: 'Upper Chitral', code: 'UCH' },
];

export const getRegionLabel = (region) => {
  return REGIONS.find(r => r.value === region)?.label || region;
};

export const getRegionCode = (region) => {
  return REGIONS.find(r => r.value === region)?.code || region.substring(0, 3).toUpperCase();
};

// ============================================
// USER ROLES & LEVELS
// ============================================

export const USER_ROLES = [
  {
    value: UserRole.VIEW_ONLY,
    label: 'View Only',
    description: 'Dashboard access for National and Regional leadership to monitor real-time progress',
    permissions: {
      canUpload: false,
      canApprove: false,
      canReject: false,
      canPrint: false,
      canDispatch: false,
      canViewDashboard: true,
      canViewAllRegions: true,
    },
  },
  {
    value: UserRole.MAKER,
    label: 'Maker',
    description: 'Responsible for data upload, validation, resolving discrepancies, and final submission',
    permissions: {
      canUpload: true,
      canApprove: true,
      canReject: true,
      canPrint: false,
      canDispatch: false,
      canViewDashboard: true,
      canViewAllRegions: false,
    },
  },
  {
    value: UserRole.CHECKER,
    label: 'Checker',
    description: 'Authorized to approve validated data, badge printing (after approval), and manage dispatch',
    permissions: {
      canUpload: false,
      canApprove: true,
      canReject: true,
      canPrint: true,
      canDispatch: true,
      canViewDashboard: true,
      canViewAllRegions: true,
    },
  },
];

export const USER_LEVELS = [
  { value: UserLevel.NATIONAL, label: 'National Level', canViewAllRegions: true },
  { value: UserLevel.REGIONAL, label: '', canViewAllRegions: false },
  { value: UserLevel.LOCAL, label: 'Local Level', canViewAllRegions: false },
];

export const getRoleLabel = (role) => {
  return USER_ROLES.find(r => r.value === role)?.label || role;
};

export const getLevelLabel = (level) => {
  return USER_LEVELS.find(l => l.value === level)?.label || level;
};

// ============================================
// EVENTS (MASTER DATA - 9 EVENTS)
// ============================================

export const EVENTS = [
  { id: '1', name: "Gilgit" },
  { id: '7', name: "Lower Chitral" },
  { id: '4', name: "Hunza" },
  { id: '5', name: "Ishkoman Puniyal Day 1" },
  { id: '6', name: "Ishkoman Puniyal Day 2" },
  { id: '8', name: "Upper Chitral Day 1" },
  { id: '9', name: "Upper Chitral Day 2" },
  { id: '2', name: "Gupis Yasin Day 1" },
  { id: '3', name: "Gupis Yasin Day 2" },
];

export const getEventById = (id) => {
  return EVENTS.find(e => e.id === id);
};

export const getEventByNumber = (number) => {
  return EVENTS.find(e => e.eventNumber === number);
};

// ============================================
// ACCESS LEVELS
// ============================================

export const ACCESS_LEVELS = [
  {
    value: AccessLevel.STAGE,
    label: ACCESS_LEVEL_NAMES[AccessLevel.STAGE],
    bandColor: ACCESS_LEVEL_BAND_COLORS[AccessLevel.STAGE],
    description: 'Most restricted - Stage area access only',
    sortOrder: 1,
  },
  {
    value: AccessLevel.PANDAL,
    label: ACCESS_LEVEL_NAMES[AccessLevel.PANDAL],
    bandColor: ACCESS_LEVEL_BAND_COLORS[AccessLevel.PANDAL],
    description: 'Pandal area access',
    sortOrder: 2,
  },
  {
    value: AccessLevel.OUTSIDE_HOLDING_AREA,
    label: ACCESS_LEVEL_NAMES[AccessLevel.OUTSIDE_HOLDING_AREA],
    bandColor: ACCESS_LEVEL_BAND_COLORS[AccessLevel.OUTSIDE_HOLDING_AREA],
    description: 'Outside holding area access',
    sortOrder: 3,
  },
  {
    value: AccessLevel.OUTSIDE_AREA,
    label: ACCESS_LEVEL_NAMES[AccessLevel.OUTSIDE_AREA],
    bandColor: ACCESS_LEVEL_BAND_COLORS[AccessLevel.OUTSIDE_AREA],
    description: 'Outside area access',
    sortOrder: 4,
  },
  {
    value: AccessLevel.HEALTH_AREA,
    label: ACCESS_LEVEL_NAMES[AccessLevel.HEALTH_AREA],
    bandColor: ACCESS_LEVEL_BAND_COLORS[AccessLevel.HEALTH_AREA],
    description: 'Health/Medical area access',
    sortOrder: 5,
  },
];

export const getAccessLevelLabel = (level) => {
  return ACCESS_LEVEL_NAMES[level] || `Level ${level}`;
};

export const getAccessLevelColor = (level) => {
  return ACCESS_LEVEL_BAND_COLORS[level] || '#808080';
};

// ============================================
// DUTY TYPES (Per Document Specification)
// ============================================

export const DUTY_TYPES = [
  // Stage Duties (Access Level 1)
  { id: 'duty-1', name: 'Reciter', code: 'RCT', accessLevel: AccessLevel.STAGE, isActive: true },
  { id: 'duty-2', name: 'Volunteer', code: 'VOL', accessLevel: AccessLevel.STAGE, isActive: true },
  
  // Health Area Duties (Access Level 5)
  { id: 'duty-3', name: 'Doctor', code: 'DOC', accessLevel: AccessLevel.HEALTH_AREA, isActive: true },
  { id: 'duty-4', name: 'Nurse', code: 'NUR', accessLevel: AccessLevel.HEALTH_AREA, isActive: true },
  
  // Pandal Duties (Access Level 2)
  { id: 'duty-5', name: 'Red Carpet', code: 'RCP', accessLevel: AccessLevel.PANDAL, isActive: true },
  { id: 'duty-6', name: 'Medical Area', code: 'MDA', accessLevel: AccessLevel.PANDAL, isActive: true },
  { id: 'duty-7', name: 'Amaldar Area', code: 'AML', accessLevel: AccessLevel.PANDAL, isActive: true },
  { id: 'duty-8', name: 'Pani Services', code: 'PNS', accessLevel: AccessLevel.PANDAL, isActive: true },
  { id: 'duty-9', name: 'Washroom', code: 'WSH', accessLevel: AccessLevel.PANDAL, isActive: true },
  { id: 'duty-10', name: 'Security', code: 'SEC', accessLevel: AccessLevel.PANDAL, isActive: true },
  
  // Holding Area Duties (Access Level 3)
  { id: 'duty-11', name: 'Access Control', code: 'ACC', accessLevel: AccessLevel.OUTSIDE_HOLDING_AREA, isActive: true },
  { id: 'duty-12', name: 'Pani', code: 'PNI', accessLevel: AccessLevel.OUTSIDE_HOLDING_AREA, isActive: true },
  { id: 'duty-13', name: 'Security', code: 'SCH', accessLevel: AccessLevel.OUTSIDE_HOLDING_AREA, isActive: true },
  { id: 'duty-14', name: 'Washroom', code: 'WSH', accessLevel: AccessLevel.OUTSIDE_HOLDING_AREA, isActive: true },
  
  // Outside Area Duties (Access Level 4)
  { id: 'duty-15', name: 'Pani', code: 'PNO', accessLevel: AccessLevel.OUTSIDE_AREA, isActive: true },
  { id: 'duty-16', name: 'Security', code: 'SCO', accessLevel: AccessLevel.OUTSIDE_AREA, isActive: true },
  { id: 'duty-17', name: 'Transport', code: 'TRN', accessLevel: AccessLevel.OUTSIDE_AREA, isActive: true },
];

export const getDutyById = (id) => {
  return DUTY_TYPES.find(d => d.id === id);
};

export const getDutyByCode = (code) => {
  return DUTY_TYPES.find(d => d.code === code);
};

export const getDutiesByAccessLevel = (accessLevel) => {
  return DUTY_TYPES.filter(d => d.accessLevel === accessLevel);
};

// ============================================
// DATA SOURCES
// ============================================

export const DATA_SOURCES = [
  {
    value: DataSource.ITREB,
    label: 'ITREB',
    description: 'Data submitted by ITREB',
  },
  {
    value: DataSource.LOCAL_COUNCIL,
    label: 'Council',
    description: 'Data submitted by Local Council',
  },
  {
    value: DataSource.HEALTH_BOARD,
    label: 'Health Board',
    description: 'Data submitted by Health Board',
  },
];

export const getDataSourceLabel = (source) => {
  return DATA_SOURCES.find(s => s.value === source)?.label || source;
};

// ============================================
// VOLUNTEER STATUS CONFIGURATION
// ============================================

export const VOLUNTEER_STATUSES = [
  {
    value: VolunteerStatus.PENDING,
    label: 'Pending',
    description: 'Awaiting validation',
    color: '#FEF3C7',
    textColor: '#92400E',
  },
  {
    value: VolunteerStatus.VALID,
    label: 'Valid',
    description: 'Validated and ready for submission',
    color: '#D1FAE5',
    textColor: '#065F46',
  },
  {
    value: VolunteerStatus.REJECTED,
    label: 'Rejected',
    description: 'Invalid record, rejected',
    color: '#FEE2E2',
    textColor: '#991B1B',
  },
  {
    value: VolunteerStatus.DISCREPANT,
    label: 'Discrepant',
    description: 'Needs manual review',
    color: '#FED7AA',
    textColor: '#9A3412',
  },
  {
    value: VolunteerStatus.SUBMITTED,
    label: 'Submitted',
    description: 'Submitted for approval',
    color: '#DBEAFE',
    textColor: '#1E40AF',
  },
  {
    value: VolunteerStatus.APPROVED,
    label: 'Approved',
    description: 'Approved by checker',
    color: '#D1FAE5',
    textColor: '#065F46',
  },
  {
    value: VolunteerStatus.PRINTED,
    label: 'Printed',
    description: 'Badge printed',
    color: '#E0E7FF',
    textColor: '#3730A3',
  },
  {
    value: VolunteerStatus.DISPATCHED,
    label: 'Dispatched',
    description: 'Package dispatched',
    color: '#C4B5FD',
    textColor: '#5B21B6',
  },
];

export const getStatusConfig = (status) => {
  return VOLUNTEER_STATUSES.find(s => s.value === status) || {
    label: status,
    color: '#F3F4F6',
    textColor: '#374151',
  };
};

// ============================================
// PRINT STATUS CONFIGURATION
// ============================================

export const PRINT_STATUSES = [
  {
    value: PrintStatus.NOT_PRINTED,
    label: 'Not Printed',
    color: '#F3F4F6',
    textColor: '#374151',
  },
  {
    value: PrintStatus.PRINTING,
    label: 'Printing',
    color: '#FEF3C7',
    textColor: '#92400E',
  },
  {
    value: PrintStatus.PRINTED,
    label: 'Printed',
    color: '#D1FAE5',
    textColor: '#065F46',
  },
  {
    value: PrintStatus.DISPATCHED,
    label: 'Dispatched',
    color: '#C4B5FD',
    textColor: '#5B21B6',
  },
];

export const getPrintStatusConfig = (status) => {
  return PRINT_STATUSES.find(s => s.value === status) || {
    label: status,
    color: '#F3F4F6',
    textColor: '#374151',
  };
};

// ============================================
// PROGRESS COLOR HELPER
// ============================================

export const getProgressColor = (percentage) => {
  if (percentage >= 75) return '#10B981';
  if (percentage >= 50) return '#F59E0B';
  if (percentage >= 25) return '#F97316';
  return '#EF4444';
};
