import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;

const RANGES = [
  { key: '24h', label: '24h', icon: 'time-outline' },
  { key: '7d', label: '7d', icon: 'calendar-outline' },
  { key: '30d', label: '30d', icon: 'calendar' },
];

const SEGMENT_WIDTH = 58;
const PILL_HEIGHT = 36;
const PADDING_H = 10;
const PADDING_V = 6;
const GAP = 4;

const localStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: PILL_HEIGHT + PADDING_V * 2,
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    gap: GAP,
  },
  segment: {
    width: SEGMENT_WIDTH,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  segmentActive24h: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.success,
  },
  segmentActiveOther: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textActive24h: {
    color: colors.success,
  },
  textActiveOther: {
    color: colors.primary,
  },
  textInactive: {
    color: colors.textSecondary,
  },
});

export default function TimeRangeToggle({ activeRange = '24h', onToggle }) {
  const handlePress = (key) => {
    if (key === activeRange) return;
    onToggle?.(key);
  };

  return (
    <View style={localStyles.wrap}>
      {RANGES.map(({ key, label, icon }) => {
        const isActive = activeRange === key;
        const is24h = key === '24h';
        const activeBorderStyle = isActive
          ? is24h
            ? localStyles.segmentActive24h
            : localStyles.segmentActiveOther
          : localStyles.segmentInactive;
        const activeTextStyle = isActive
          ? is24h
            ? localStyles.textActive24h
            : localStyles.textActiveOther
          : localStyles.textInactive;
        const activeIconColor = isActive
          ? is24h
            ? colors.success
            : colors.primary
          : colors.textSecondary;
        return (
          <Pressable
            key={key}
            style={[localStyles.segment, activeBorderStyle]}
            onPress={() => handlePress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${label} time range`}
          >
            <Ionicons
              name={icon}
              size={12}
              color={activeIconColor}
            />
            <Text style={[localStyles.text, activeTextStyle]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
