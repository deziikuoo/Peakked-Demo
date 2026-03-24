import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  scrollView: {
    flex: 1,
    minWidth: 0,
  },
  scroll: {
    flexGrow: 0,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingRight: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 40,
  },
  pillActive: {
    backgroundColor: `${colors.primary}22`,
    borderColor: `${colors.primary}66`,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 0,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
  },
  count: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  countActive: {
    color: `${colors.primary}CC`,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 40,
    backgroundColor: 'transparent',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default function GenreFilterBar({
  genres = [],
  selectedGenres = [],
  onToggleGenre,
  onClear,
}) {
  const hasSelection = selectedGenres.length > 0;

  return (
    <View style={localStyles.wrap}>
      <ScrollView
        style={localStyles.scrollView}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.scroll}
      >
        {genres.map(({ label, count }) => {
          const isSelected = selectedGenres.includes(label);
          return (
            <Pressable
              key={label}
              style={[
                localStyles.pill,
                isSelected ? localStyles.pillActive : localStyles.pillInactive,
              ]}
              onPress={() => onToggleGenre?.(label)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label}, ${count} games. ${isSelected ? 'Selected. Tap to deselect.' : 'Tap to select.'}`}
            >
              <Text
                style={[
                  localStyles.label,
                  isSelected ? localStyles.labelActive : localStyles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              <Text
                style={[
                  localStyles.count,
                  isSelected ? localStyles.countActive : null,
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {hasSelection && (
        <Pressable
          style={localStyles.clearBtn}
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear all genre filters"
        >
          <Ionicons name="close-circle-outline" size={18} color={colors.primary} />
          <Text style={localStyles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}
