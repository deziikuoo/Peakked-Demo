import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;

const TREND_CONFIG = {
  rising: { icon: 'trending-up', color: colors.success },
  declining: { icon: 'trending-down', color: colors.error },
  stable: { icon: 'remove', color: colors.textSecondary },
};

const localStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pillRising: {
    backgroundColor: `${colors.success}26`,
  },
  pillDeclining: {
    backgroundColor: `${colors.error}26`,
  },
  pillStable: {
    backgroundColor: `${colors.textSecondary}26`,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function TrendBadge({ direction = 'stable', percentChange = 0 }) {
  const config = TREND_CONFIG[direction] || TREND_CONFIG.stable;
  const bgStyle =
    direction === 'rising'
      ? localStyles.pillRising
      : direction === 'declining'
        ? localStyles.pillDeclining
        : localStyles.pillStable;

  const label =
    direction === 'stable'
      ? '0.0%'
      : percentChange >= 0
        ? `+${percentChange.toFixed(1)}%`
        : `${percentChange.toFixed(1)}%`;

  return (
    <View style={[localStyles.pill, bgStyle]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[localStyles.text, { color: config.color }]}>{label}</Text>
    </View>
  );
}
