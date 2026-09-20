// ─────────────────────────────────────────────────────────────────────────────
// DateNight Design Tokens — v2 (Teal + Lime, Sora + DM Sans)
// HANDOFF_README.md § Design tokens
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = 'https://api.togetherplans.app';

// ── Colors ────────────────────────────────────────────────────────────────────
export const COLORS = {
  // Background / surface
  bg:            '#F4F6F8',
  bgDark:        '#0F1519',
  surface:       '#FFFFFF',
  surfaceDark:   '#18212A',

  // Ink
  ink:           '#101820',
  inkDark:       '#EEF3F6',
  ink2:          '#5D6B76',
  ink2Dark:      '#93A3AF',
  line:          '#DDE3E8',
  lineDark:      '#2A3641',

  // Primary — teal
  primary:       '#0E8C8C',
  primaryDark:   '#2FC4C1',
  primaryDeep:   '#086B6B',
  primaryDeepDark: '#5AD6D3',
  primarySoft:   '#D9F1F0',
  primarySoftDark: '#123637',
  onPrimary:     '#FFFFFF',
  onPrimaryDark: '#0F1519',

  // Lime — partner / celebration
  lime:          '#7CB518',
  limeDark:      '#A8E04B',
  limeSoft:      '#EAF6D3',
  limeSoftDark:  '#253A0F',
  onLime:        '#101820',

  // Semantic
  success:       '#1E9A55',
  successDark:   '#3FC77A',
  successSoft:   '#DDF4E6',
  successSoftDark: '#173B27',

  warning:       '#E39B12',
  warningDark:   '#F3B84A',
  warningSoft:   '#FBEFD3',
  warningSoftDark: '#3D2E12',
  onWarningSoft: '#8A5A00',
  onWarningSoftDark: '#F3B84A',

  error:         '#D63A3A',
  errorDark:     '#FF6B6B',
  errorSoft:     '#FBE0E0',
  errorSoftDark: '#3D1A1A',

  // Extra member avatar colors
  cobalt:        '#2D6CDB',
  cobaltText:    '#FFFFFF',

  // Shortcuts (used throughout app — default to light)
  background:    '#F4F6F8',
  text:          '#101820',
  textSecondary: '#5D6B76',
  border:        '#DDE3E8',
} as const;

// ── Light / Dark palette helpers ───────────────────────────────────────────────
export function palette(dark: boolean) {
  return {
    bg:            dark ? COLORS.bgDark         : COLORS.bg,
    surface:       dark ? COLORS.surfaceDark    : COLORS.surface,
    ink:           dark ? COLORS.inkDark        : COLORS.ink,
    ink2:          dark ? COLORS.ink2Dark       : COLORS.ink2,
    line:          dark ? COLORS.lineDark       : COLORS.line,
    primary:       dark ? COLORS.primaryDark    : COLORS.primary,
    primaryDeep:   dark ? COLORS.primaryDeepDark : COLORS.primaryDeep,
    primarySoft:   dark ? COLORS.primarySoftDark : COLORS.primarySoft,
    onPrimary:     dark ? COLORS.onPrimaryDark  : COLORS.onPrimary,
    lime:          dark ? COLORS.limeDark       : COLORS.lime,
    limeSoft:      dark ? COLORS.limeSoftDark   : COLORS.limeSoft,
    success:       dark ? COLORS.successDark    : COLORS.success,
    warning:       dark ? COLORS.warningDark    : COLORS.warning,
    warningSoft:   dark ? COLORS.warningSoftDark : COLORS.warningSoft,
    onWarningSoft: dark ? COLORS.onWarningSoftDark : COLORS.onWarningSoft,
    error:         dark ? COLORS.errorDark      : COLORS.error,
    errorSoft:     dark ? COLORS.errorSoftDark  : COLORS.errorSoft,
  };
}

// ── Typography ─────────────────────────────────────────────────────────────────
export const FONTS = {
  // Loaded via useFonts() in App.tsx — see font loading below
  display:  'Sora_800ExtraBold',
  title:    'Sora_800ExtraBold',
  heading:  'Sora_800ExtraBold',
  button:   'Sora_700Bold',
  sticker:  'Sora_800ExtraBold',
  body:     'DMSans_400Regular',
  rowLabel: 'DMSans_600SemiBold',
  secondary:'DMSans_400Regular',
  section:  'DMSans_700Bold',
  // Fallback until fonts load
  regular:  'System',
  medium:   'System',
  bold:     'System',
} as const;

export const TYPE = {
  display:   { fontFamily: FONTS.display,  fontSize: 40, letterSpacing: -1.6, lineHeight: 40 },
  title:     { fontFamily: FONTS.title,    fontSize: 30, letterSpacing: -0.9, lineHeight: 34 },
  heading:   { fontFamily: FONTS.heading,  fontSize: 17, letterSpacing: -0.34, lineHeight: 22 },
  heading19: { fontFamily: FONTS.heading,  fontSize: 19, letterSpacing: -0.38, lineHeight: 24 },
  button:    { fontFamily: FONTS.button,   fontSize: 15, letterSpacing: 0 },
  buttonSm:  { fontFamily: FONTS.button,   fontSize: 13, letterSpacing: 0 },
  sticker:   { fontFamily: FONTS.sticker,  fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  body:      { fontFamily: FONTS.body,     fontSize: 15, lineHeight: 22.5 },
  body16:    { fontFamily: FONTS.body,     fontSize: 16, lineHeight: 24 },
  rowLabel:  { fontFamily: FONTS.rowLabel, fontSize: 15 },
  secondary: { fontFamily: FONTS.secondary,fontSize: 13, lineHeight: 19.5 },
  section:   { fontFamily: FONTS.section,  fontSize: 11, letterSpacing: 1.32, textTransform: 'uppercase' as const },
} as const;

// ── Spacing ────────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  gutter: 20,
} as const;

// ── Border radii — asymmetric "sticker" shape language ─────────────────────────
// card: rotate through [30,22,34,20] → [22,34,20,30] → [34,20,30,22] → [22,30,24,34]
export const CARD_RADII = [
  { topLeft: 30, topRight: 22, bottomRight: 34, bottomLeft: 20 },
  { topLeft: 22, topRight: 34, bottomRight: 20, bottomLeft: 30 },
  { topLeft: 34, topRight: 20, bottomRight: 30, bottomLeft: 22 },
  { topLeft: 22, topRight: 30, bottomRight: 24, bottomLeft: 34 },
] as const;

export const OPTION_RADII = [
  { topLeft: 28, topRight: 40, bottomRight: 24, bottomLeft: 44 },
  { topLeft: 40, topRight: 24, bottomRight: 44, bottomLeft: 28 },
  { topLeft: 24, topRight: 44, bottomRight: 28, bottomLeft: 40 },
  { topLeft: 44, topRight: 28, bottomRight: 40, bottomLeft: 24 },
] as const;

export const RADII = {
  button:       { topLeft: 28, topRight: 20, bottomRight: 28, bottomLeft: 20 },
  buttonSec:    { topLeft: 20, topRight: 28, bottomRight: 20, bottomLeft: 28 },
  input:        18,
  sticker:      { topLeft: 12, topRight: 6,  bottomRight: 14, bottomLeft: 6 },
  stickerSm:    { topLeft: 10, topRight: 4,  bottomRight: 10, bottomLeft: 4 },
  chip:         { topLeft: 18, topRight: 12, bottomRight: 18, bottomLeft: 12 },
  chipAlt:      { topLeft: 12, topRight: 18, bottomRight: 12, bottomLeft: 18 },
  iconButton:   999,
  qrCard:       20,
  fab:          { topLeft: 28, topRight: 20, bottomRight: 28, bottomLeft: 20 },
  dock:         { topLeft: 34, topRight: 28, bottomRight: 32, bottomLeft: 30 },
} as const;

// ── Shadows ────────────────────────────────────────────────────────────────────
export const SHADOWS = {
  card: {
    shadowColor: '#101820',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 4,
  },
  dock: {
    shadowColor: '#101820',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

// ── Sticker rotation presets ────────────────────────────────────────────────────
export const STICKER_ROTATIONS = ['-4deg', '+3deg', '-3deg', '+4deg'] as const;

// ── Avatar blob radii ──────────────────────────────────────────────────────────
// expressed as percentage strings for RN's borderRadius (uniform fallback: 999)
// true blob shapes require SVG or masking in RN; approximate with high radius
export const AVATAR_SIZES = { xs: 28, sm: 42, md: 54, lg: 76 } as const;

// ── Invite methods ─────────────────────────────────────────────────────────────
export const INVITE_METHODS = ['LINK', 'EMAIL', 'SMS', 'QR', 'USERNAME'] as const;
export type InviteMethod = (typeof INVITE_METHODS)[number];
