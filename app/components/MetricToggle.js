import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;

const METRICS = [
  { key: 'players', label: 'Players', icon: 'people' },
  { key: 'streams', label: 'Streams', icon: 'videocam' },
  { key: 'views', label: 'Views', icon: 'eye' },
  { key: 'all', label: 'All', icon: 'layers' },
];

const PILL_HEIGHT = 40;
const PADDING_H = 12;
const PADDING_V = 8;
const GAP = 6;

const METRIC_ACTIVE_COLORS = {
  players: null,
  streams: colors.secondary,
  views: colors.views ?? colors.tertiary ?? '#E040FB',
  all: colors.primary,
};

const localStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: PILL_HEIGHT + PADDING_V * 2,
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: GAP,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInactive: {
    color: colors.textSecondary,
  },
});

export default function MetricToggle({
  activeMetric = 'players',
  onToggle,
  playersActiveColor,
  forceActiveColor,
}) {
  const handlePress = (key) => {
    if (key === activeMetric) return;
    onToggle?.(key);
  };

  const getActiveColor = (key) => {
    if (forceActiveColor) return forceActiveColor;
    if (key === 'players' && playersActiveColor) return playersActiveColor;
    return METRIC_ACTIVE_COLORS[key] ?? colors.primary;
  };

  return (
    <View style={localStyles.wrap}>
      {METRICS.map(({ key, label, icon }) => {
        const isActive = activeMetric === key;
        const activeColor = getActiveColor(key);
        const segmentActiveStyle = isActive
          ? {
              backgroundColor: `${activeColor}22`,
              borderWidth: 1,
              borderColor: `${activeColor}66`,
            }
          : null;
        return (
          <Pressable
            key={key}
            style={[localStyles.segment, localStyles.segmentInactive, segmentActiveStyle]}
            onPress={() => handlePress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${label} metric`}
          >
            <Ionicons
              name={icon}
              size={14}
              color={isActive ? activeColor : colors.textSecondary}
            />
            <Text
              style={[
                localStyles.text,
                isActive ? { color: activeColor } : localStyles.textInactive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
