import { StyleSheet } from 'react-native';
import { colors } from './nexaTokens';
import { spacing } from './nexaSpacing';
import { typography } from './nexaTypography';

export const sharedStyles = StyleSheet.create({
  glassPanel: {
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
  },
  primaryButton: {
    paddingVertical: spacing.spaceSm,
    paddingHorizontal: spacing.spaceLg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
  },
});

export default sharedStyles;
