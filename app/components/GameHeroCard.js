import { memo } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../theme/colors';
import { formatPlayerCount, formatStreamCount, getTrend } from '../data/shared/gameFormatters';
import SparklineScrubbable from './SparklineScrubbable';
import TrendBadge from './TrendBadge';
import ViewsBadge from './ViewsBadge';
import { useWatchlist } from "../context/WatchlistContext";
import { useDelayedSingleOrDoubleTap } from "../utils/useDelayedSingleOrDoubleTap";
import GameWideThumbnailImage from "./GameWideThumbnailImage";
const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'visible',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 460 / 215,
    backgroundColor: colors.border,
    position: 'relative',
  },
  /** Shown only when liked — top-left, matches row cards */
  heartOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  rating: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sparklineWrap: {
    marginTop: 10,
    width: '100%',
    height: 48,
    overflow: 'visible',
  },
  ratingAndBadgeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
});

function GameHeroCard({ game, onPress, animateSparkline = true }) {
  const { width: winWidth } = useWindowDimensions();
  const { getDisplayWatched, toggleWatch } = useWatchlist();
  const contentWidth = winWidth - 32 - 32;
  const hasRating = game.rating != null;
  const history = game.history;
  const trend = history ? getTrend(history) : { direction: 'stable', percentChange: 0 };
  const isLiked = getDisplayWatched(game.id);

  const onHeartPress = (e) => {
    e?.stopPropagation?.();
    toggleWatch(game);
  };

  const handleCardPress = useDelayedSingleOrDoubleTap(
    () => onPress?.(game),
    () => toggleWatch(game)
  );

  return (
    <View style={localStyles.card}>
      <Pressable
        onPress={handleCardPress}
        accessibilityRole="button"
        accessibilityLabel={`${game.name}, ${formatPlayerCount(game.playerCount)} players`}
        accessibilityHint="Double tap to add or remove from your liked games"
      >
        <View style={localStyles.imageWrap}>
          <GameWideThumbnailImage game={game} style={localStyles.image} />
        </View>
        <View style={localStyles.badgesRow}>
          <ViewsBadge viewCount={game.viewCount} />
        </View>
        <View style={localStyles.content}>
          <Text style={localStyles.name} numberOfLines={1}>{game.name}</Text>
          <View style={localStyles.statsRow}>
            <Text style={localStyles.stat}>
              <Text style={localStyles.statAccent}>{formatPlayerCount(game.playerCount)}</Text> players
            </Text>
            <Text style={localStyles.stat}>
              <Text style={localStyles.statAccent}>{formatStreamCount(game.streamCount)}</Text> streams
            </Text>
          </View>
          {history && history.length > 0 && (
            <View style={localStyles.sparklineWrap}>
              <SparklineScrubbable
                data={history}
                width={contentWidth}
                height={48}
                color={colors.primary}
                animated
                formatValue={formatPlayerCount}
                events={game.events ?? []}
                animationEnabled={animateSparkline}
                clipBottomRadius={10}
              />
            </View>
          )}
          <View style={localStyles.ratingAndBadgeRow}>
            {hasRating ? (
              <Text style={localStyles.rating}>Rating: {game.rating}%</Text>
            ) : (
              <View />
            )}
            <TrendBadge direction={trend.direction} percentChange={trend.percentChange} />
          </View>
        </View>
      </Pressable>
      {isLiked && (
        <Pressable
          style={localStyles.heartOverlay}
          onPress={onHeartPress}
          accessibilityRole="button"
          accessibilityLabel="Remove from watchlist"
        >
          <Ionicons name="heart" size={20} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export default memo(GameHeroCard);
