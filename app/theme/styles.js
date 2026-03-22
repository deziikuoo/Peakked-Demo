import { StyleSheet } from 'react-native';
import { defaultTheme } from './colors';

/**
 * Builds styles that use theme color variables.
 * Pass a theme from theme/colors.js to get styles for that theme.
 *
 * Usage:
 *   import { createThemedStyles } from './theme/styles';
 *   import { themes } from './theme/colors';
 *   const styles = createThemedStyles(themes.shaqPersonality);
 */
export function createThemedStyles(colors = defaultTheme) {
  return StyleSheet.create({
    // Screen / layout
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenTransparent: {
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    surface: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Text
    text: {
      color: colors.text,
      fontSize: 16,
    },
    textSecondary: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    heading: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    subheading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
    },

    // Buttons / CTAs
    buttonPrimary: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonAccent: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonTextPrimary: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextOnPrimary: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },

    // Inputs
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },

    // Chips / tags
    chip: {
      backgroundColor: colors.surface,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 14,
    },

    // Status
    success: {
      color: colors.success,
    },
    error: {
      color: colors.error,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
}

/**
 * Default themed styles using defaultTheme (from colors.js).
 * Use this when you don't need to switch themes at runtime.
 */
export const themedStyles = createThemedStyles(defaultTheme);

export default createThemedStyles;
