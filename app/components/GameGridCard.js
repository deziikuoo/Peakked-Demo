import { memo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { themes } from '../theme/colors';
import { formatPlayerCount, formatStreamCount, getTrend } from '../data/shared/gameFormatters';
import Sparkline, { STAGGER_MS, ANIMATION_CAP } from './Sparkline';
import TrendBadge from './TrendBadge';
import ViewsBadge from './ViewsBadge';
import GameImage from './GameImage';

const colors = themes.darkNeon;

function trendColor(direction) {
  if (direction === 'rising') return colors.success;
  if (direction === 'declining') return colors.error;
  return colors.textSecondary;
}

const localStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    margin: 4,
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
  const cardContentWidth = Math.max(0, (winWidth - 72) / 2);
  const history = game.history;
  const trend = history ? getTrend(history) : { direction: 'stable', percentChange: 0 };
  const sparkColor = trendColor(trend.direction);

  return (
    <Pressable style={localStyles.card} onPress={() => onPress?.(game)} accessibilityRole="button" accessibilityLabel={game.name}>
      <View style={localStyles.imageWrap}>
        <GameImage source={{ uri: game.thumbnail }} style={localStyles.image} />
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
              color={sparkColor}
              animated
              animationDelayMs={index != null ? index * STAGGER_MS : 0}
              animationEnabled={animateSparkline && (index == null || index < ANIMATION_CAP)}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(GameGridCard);
