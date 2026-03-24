/**
 * Peakked theme color variables (app-wide; default matches logo palette).
 * Each theme uses the same semantic keys so you can swap themes without changing component code.
 * Usage: import { themes, themeKeys } from './theme/colors';
 *        const colors = themes.arena;  // or themes.darkNeon, etc.
 */

export const themeKeys = {
  background: 'background',
  surface: 'surface',
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  text: 'text',
  textSecondary: 'textSecondary',
  border: 'border',
  success: 'success',
  error: 'error',
};

/**
 * Arena / Court – stadium feel (wood, jerseys, scoreboard)
 */
export const arena = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  primary: '#E65100',
  secondary: '#FFB300',
  accent: '#FFB300',
  text: '#FFF8E7',
  textSecondary: '#B3A898',
  border: '#3A3A3C',
  success: '#4CAF50',
  error: '#EF5350',
};

/**
 * Dark + Neon — Peakked logo palette: black, white, #1aff1a + complementary chart colors.
 * primary = players / brand UI; secondary = streams (cyan); tertiary/views = 3rd metric (magenta).
 */
export const darkNeon = {
  background: '#000000',
  surface: '#0A0A0A',
  primary: '#1aff1a',
  secondary: '#00E5FF',
  accent: '#1aff1a',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#1F1F1F',
  success: '#5EEB6A',
  error: '#FF4D5C',
  /** Compare slot 3 / views sparkline — complements green + cyan */
  tertiary: '#E040FB',
  /** Alias for view-count series (detail modal, share card) */
  views: '#E040FB',
};

/**
 * Clean / Editorial – sports magazine, stats hub
 */
export const cleanEditorial = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  primary: '#0A1628',
  secondary: '#64748B',
  accent: '#DC2626',
  text: '#0F172A',
  textSecondary: '#6B7280',
  border: '#E2E8F0',
  success: '#15803D',
  error: '#B91C1C',
};

/**
 * Shaq Personality – bold, fun, confident
 */
export const shaqPersonality = {
  background: '#0F0F0F',
  surface: '#1F1F1F',
  primary: '#6B21A8',
  secondary: '#EAB308',
  accent: '#EAB308',
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  border: '#404040',
  success: '#16A34A',
  error: '#DC2626',
};

/**
 * Fresh / Modern – teal, contemporary
 */
export const freshModern = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  primary: '#0D9488',
  secondary: '#334155',
  accent: '#F43F5E',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#059669',
  error: '#E11D48',
};

/**
 * High Contrast / Accessibility – readability first
 */
export const highContrast = {
  background: '#FFFFFF',
  surface: '#FEFCE8',
  primary: '#171717',
  secondary: '#2563EB',
  accent: '#EA580C',
  text: '#171717',
  textSecondary: '#525252',
  border: '#A3A3A3',
  success: '#166534',
  error: '#991B1B',
};

/**
 * All themes in one object for easy access and switching.
 */
export const themes = {
  arena,
  darkNeon,
  cleanEditorial,
  shaqPersonality,
  freshModern,
  highContrast,
};

/**
 * Default theme (change this to set app-wide default).
 */
export const defaultTheme = darkNeon;

export default themes;
