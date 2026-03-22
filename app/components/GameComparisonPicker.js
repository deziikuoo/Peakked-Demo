import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';
import { formatPlayerCount, getTrend } from '../data/shared/gameFormatters';
import { MOCK_GAMES } from '../data/mock/popularGames';
import { getTrendingGames } from '../data/real/popularGamesApi';
import TrendBadge from './TrendBadge';
import GameImage from './GameImage';

const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: `${colors.primary}18`,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  rowStat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowStatAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  rowRight: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
});

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {string} [props.currentGameId] - single id to exclude (detail modal)
 * @param {string[]} [props.excludeIds] - multiple ids to exclude (compare screen)
 * @param {function(object)} props.onSelect
 * @param {function()} props.onClose
 */
export default function GameComparisonPicker({ visible, currentGameId, excludeIds, onSelect, onClose }) {
  const [pickerGames, setPickerGames] = useState([]);

  useEffect(() => {
    if (!visible) return;
    getTrendingGames()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setPickerGames(list);
        else setPickerGames(MOCK_GAMES);
      })
      .catch(() => setPickerGames(MOCK_GAMES));
  }, [visible]);

  const sourceList = pickerGames.length > 0 ? pickerGames : MOCK_GAMES;
  const games = excludeIds?.length
    ? sourceList.filter((g) => !excludeIds.includes(g.id))
    : sourceList.filter((g) => g.id !== currentGameId);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={localStyles.overlay} onPress={onClose}>
        <Pressable style={localStyles.card} onPress={(e) => e.stopPropagation()}>
          <View style={localStyles.header}>
            <Text style={localStyles.title}>Compare with...</Text>
            <Pressable style={localStyles.closeBtn} onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={localStyles.list} bounces={false}>
            {games.map((g, idx) => {
              const trend = g.history ? getTrend(g.history) : { direction: 'stable', percentChange: 0 };
              return (
                <View key={g.id}>
                  <Pressable
                    style={({ pressed }) => [localStyles.row, pressed && localStyles.rowPressed]}
                    onPress={() => onSelect(g)}
                    accessibilityRole="button"
                    accessibilityLabel={`Compare with ${g.name}`}
                  >
                    <View style={localStyles.thumb}>
                      <GameImage source={{ uri: g.thumbnail }} style={localStyles.thumbImage} />
                    </View>
                    <View style={localStyles.rowBody}>
                      <Text style={localStyles.rowName} numberOfLines={1}>{g.name}</Text>
                      <Text style={localStyles.rowStat}>
                        <Text style={localStyles.rowStatAccent}>{formatPlayerCount(g.playerCount)}</Text> players
                      </Text>
                    </View>
                    <View style={localStyles.rowRight}>
                      <TrendBadge direction={trend.direction} percentChange={trend.percentChange} />
                    </View>
                  </Pressable>
                  {idx < games.length - 1 && <View style={localStyles.separator} />}
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
