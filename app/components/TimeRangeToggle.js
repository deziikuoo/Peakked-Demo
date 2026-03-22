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
  segmentActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFFFFF',
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
        return (
          <Pressable
            key={key}
            style={[localStyles.segment, isActive ? localStyles.segmentActive : localStyles.segmentInactive]}
            onPress={() => handlePress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${label} time range`}
          >
            <Ionicons
              name={icon}
              size={12}
              color={isActive ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[localStyles.text, isActive ? localStyles.textActive : localStyles.textInactive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
