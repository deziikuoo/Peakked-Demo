import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatViewCount } from '../data/shared/gameFormatters';
import { themes } from '../theme/colors';

const VIEWS_COLOR = themes.darkNeon.views ?? themes.darkNeon.tertiary ?? '#E040FB';

const localStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: `${VIEWS_COLOR}26`,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: VIEWS_COLOR,
  },
});

export default function ViewsBadge({ viewCount }) {
  if (viewCount == null) return null;
  return (
    <View style={localStyles.pill}>
      <Ionicons name="eye" size={14} color={VIEWS_COLOR} />
      <Text style={localStyles.text}>{formatViewCount(viewCount)}</Text>
    </View>
  );
}
