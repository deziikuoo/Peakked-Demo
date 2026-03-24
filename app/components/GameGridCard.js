import { memo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { themes } from '../theme/colors';
import {
  formatPlayerCount,
  formatStreamCount,
  getTrend,
  trendColor,
} from '../data/shared/gameFormatters';
import { useWatchlist } from '../context/WatchlistContext';
import { useDelayedSingleOrDoubleTap } from '../utils/useDelayedSingleOrDoubleTap';
import Sparkline, { STAGGER_MS, ANIMATION_CAP } from './Sparkline';
import TrendBadge from './TrendBadge';
import ViewsBadge from './ViewsBadge';
import GameWideThumbnailImage from './GameWideThumbnailImage';
const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  cardWrap: {
    flex: 1,
    minWidth: 0,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  card: {
    flex: 1,
    minWidth: 0,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sparklineWrap: {
    marginTop: 6,
    width: '100%',
    height: 28,
  },
  viewsBadgeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
});

function GameGridCard({ game, onPress, index, animateSparkline = true }) {
  const { width: winWidth } = useWindowDimensions();
  const { toggleWatch } = useWatchlist();
  const cardContentWidth = Math.max(0, (winWidth - 72) / 2);
  const history = game.history;
  const trend = history ? getTrend(history) : { direction: 'stable', percentChange: 0 };
  const sparkColor = trendColor(trend.direction);

  const handleCardPress = useDelayedSingleOrDoubleTap(
    () => onPress?.(game),
    () => toggleWatch(game)
  );

  return (
    <View style={localStyles.cardWrap}>
    <Pressable
      style={localStyles.card}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={game.name}
      accessibilityHint="Double tap to add or remove from your liked games"
    >
      <View style={localStyles.imageWrap}>
        <GameWideThumbnailImage game={game} style={localStyles.image} />
        <View style={localStyles.viewsBadgeOverlay}>
          <ViewsBadge viewCount={game.viewCount} />
        </View>
      </View>
      <View style={localStyles.content}>
        <Text style={localStyles.name} numberOfLines={2}>{game.name}</Text>
        <View style={localStyles.stats}>
          <Text style={localStyles.stat}>
            <Text style={localStyles.statAccent}>{formatPlayerCount(game.playerCount)}</Text>
          </Text>
          <Text style={localStyles.stat}>{formatStreamCount(game.streamCount)} streams</Text>
        </View>
        <View style={localStyles.badgeRow}>
          <TrendBadge direction={trend.direction} percentChange={trend.percentChange} />
        </View>
        {history && history.length > 0 && (
          <View style={localStyles.sparklineWrap}>
            <Sparkline
              data={history}
              width={cardContentWidth}
              height={28}
              color={colors.primary}
              animated
              clipBottomRadius={8}
              animationDelayMs={index != null ? index * STAGGER_MS : 0}
              animationEnabled={animateSparkline && (index == null || index < ANIMATION_CAP)}
            />
          </View>
        )}
      </View>
    </Pressable>
    </View>
  );
}

export default memo(GameGridCard);
