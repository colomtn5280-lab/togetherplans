export const API_BASE_URL = 'https://api.togetherplans.app';

export const COLORS = {
  primary: '#FF4081',
  primaryDark: '#C60055',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const INVITE_METHODS = ['LINK', 'EMAIL', 'SMS', 'QR', 'USERNAME'] as const;
export type InviteMethod = (typeof INVITE_METHODS)[number];
