// Theme colors for MHIP / Volunteer Management application
export const colors = {
  // Primary colors
  primary: '#306F45',
  primaryLight: '#40AF65',
  primaryDark: '#1A4D2E',
  
  // Background colors
  background: '#F8FAFD',
  backgroundGreen: '#F4F9F6',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#111C2D',
  textSecondary: '#111C2D99',
  textMuted: '#6B7280',
  textDark: '#2A3547',
  
  // Status colors
  success: '#306F45',
  error: '#B2382C',
  errorLight: '#EA4535',
  warning: '#EDC215',
  info: '#3B82F6',
  
  // Badge colors
  badgeGray: { bg: '#F3F4F6', fg: '#374151' },
  badgeGreen: { bg: '#D1FAE5', fg: '#065F46' },
  badgeYellow: { bg: '#FEF3C7', fg: '#92400E' },
  badgeRed: { bg: '#FEE2E2', fg: '#991B1B' },
  badgeBlue: { bg: '#E0F2FE', fg: '#075985' },
  badgePurple: { bg: '#EDE9FE', fg: '#6B21A8' },
  badgeOrange: { bg: '#FFEDD5', fg: '#9A3412' },
  
  // UI colors
  border: '#E5E7EB',
  borderLight: '#D1D5DB',
  inputBg: '#FFFFFF',
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.3)',
  
  // Avatar
  avatarBg: '#6E9179',
  
  // Status badges
  roleColors: {
    enumerator: { bg: '#DBEAFE', fg: '#1E40AF' },
    checker: { bg: '#FEF3C7', fg: '#92400E' },
    admin: { bg: '#EDE9FE', fg: '#6B21A8' },
    jkAdmin: { bg: '#FCE7F3', fg: '#BE185D' },
    maker: { bg: '#DBEAFE', fg: '#1E40AF' },
    viewOnly: { bg: '#F3F4F6', fg: '#374151' },
  },
  statusColors: {
    active: { bg: '#D1FAE5', fg: '#065F46' },
    inactive: { bg: '#FEE2E2', fg: '#991B1B' },
    suspended: { bg: '#FFEDD5', fg: '#9A3412' },
    pending: { bg: '#FEF3C7', fg: '#92400E' },
    approved: { bg: '#D1FAE5', fg: '#065F46' },
    rejected: { bg: '#FEE2E2', fg: '#991B1B' },
    discrepant: { bg: '#FED7AA', fg: '#9A3412' },
    submitted: { bg: '#DBEAFE', fg: '#1E40AF' },
    printed: { bg: '#E0E7FF', fg: '#3730A3' },
    dispatched: { bg: '#C4B5FD', fg: '#5B21B6' },
  },
  
  // Access Level Band Colors (Volunteer Management)
  accessLevelColors: {
    stage: '#FFD700',       // Gold
    pandal: '#4169E1',      // Royal Blue
    holdingArea: '#32CD32', // Lime Green
    outsideArea: '#FFA500', // Orange
    healthArea: '#FF0000',  // Red
  },
  
  // Progress colors
  progressColors: {
    low: '#EF4444',
    medium: '#F97316',
    good: '#F59E0B',
    high: '#10B981',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
