/**
 * NEXA typography (font families + sizes). Font names must match host App useFonts.
 */
export const fonts = {
  fontDisplay: 'Orbitron_700Bold',
  fontDisplayBlack: 'Orbitron_900Black',
  fontDisplayRegular: 'Orbitron_400Regular',
  fontBody: 'Inter_400Regular',
  fontBodyBold: 'Inter_700Bold',
};

export const sizes = {
  textMega: 48,
  textLarge: 24,
  textMedium: 18,
  textBase: 16,
  textSmall: 14,
};

export const typography = {
  ...fonts,
  sizes,
};

export default typography;
