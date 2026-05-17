// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - TYPE DEFINITIONS
// Didar Mubarak Pakistan
// ============================================

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const Region = {
  GILGIT: 'gilgit',
  HUNZA: 'hunza',
  GUPIS: 'gupis',
  ISHKOMAN: 'ishkoman',
  LOWER_CHITRAL: 'lower_chitral',
  UPPER_CHITRAL: 'upper_chitral',
};

export const UserLevel = {
  NATIONAL: 'national',
  REGIONAL: 'regional',
  LOCAL: 'local',
  NATIONAL_ADMIN: 'national admin',
};

export const UserRole = {
  VIEW_ONLY: 'view_only',
  MAKER: 'maker',
  CHECKER: 'checker',
};

export const AccessLevel = {
  STAGE: 1,
  PANDAL: 2,
  OUTSIDE_HOLDING_AREA: 3,
  OUTSIDE_AREA: 4,
  HEALTH_AREA: 5,
};

export const VolunteerStatus = {
  PENDING: 'pending',
  VALID: 'valid',
  REJECTED: 'rejected',
  DISCREPANT: 'discrepant',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PRINTED: 'printed',
  DISPATCHED: 'dispatched',
};

export const ValidationError = {
  CNIC_NOT_FOUND: 'cnic_not_found',
  DUPLICATE_SAME_DUTY: 'duplicate_same_duty',
  DISCREPANT_DIFFERENT_DUTIES: 'discrepant_different_duties',
  DISCREPANT_MULTIPLE_TEAMS: 'discrepant_multiple_teams',
  DISCREPANT_MULTIPLE_EVENTS: 'discrepant_multiple_events',
};

export const ValidationStatusDisplay = {
  OK: 'ok',
  DISCREPANT: 'discrepant',
  REJECTED: 'rejected',
};

export const KitStatus = {
  NOT_PREPARED: 'not_prepared',
  PREPARING: 'preparing',
  PREPARED: 'prepared',
  DISPATCHED: 'dispatched',
  RECEIVED: 'received',
};

export const DataSource = {
  LOCAL_COUNCIL: 'local_council',
  REGIONAL_EVENT_MANAGER: 'regional_event_manager',
  ITREB: 'itreb',
  HEALTH_BOARD: 'health_board',
};

export const PrintStatus = {
  NOT_PRINTED: 'not_printed',
  PRINTING: 'printing',
  PRINTED: 'printed',
  DISPATCHED: 'dispatched',
};

// Access Level Names
export const ACCESS_LEVEL_NAMES = {
  [AccessLevel.STAGE]: 'Stage',
  [AccessLevel.PANDAL]: 'Pandal',
  [AccessLevel.OUTSIDE_HOLDING_AREA]: 'Outside Holding Area',
  [AccessLevel.OUTSIDE_AREA]: 'Outside Area',
  [AccessLevel.HEALTH_AREA]: 'Health Area',
};

// Access Level Band Colors
export const ACCESS_LEVEL_BAND_COLORS = {
  [AccessLevel.STAGE]: '#FFD700',
  [AccessLevel.PANDAL]: '#4169E1',
  [AccessLevel.OUTSIDE_HOLDING_AREA]: '#32CD32',
  [AccessLevel.OUTSIDE_AREA]: '#FFA500',
  [AccessLevel.HEALTH_AREA]: '#FF0000',
};

// Alert types
export const AlertType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};
