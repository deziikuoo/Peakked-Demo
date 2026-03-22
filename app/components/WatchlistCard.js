import { useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  getTrend,
  computePeakInsights,
  isInPeakWindowNow,
} from "../data/shared/gameFormatters";
import Sparkline from "./Sparkline";
import TrendBadge from "./TrendBadge";
import { useWatchlist } from "../context/WatchlistContext";
import GameImage from "./GameImage";

const colors = themes.darkNeon;

function trendColor(direction) {
  if (direction === "rising") return colors.success;
  if (direction === "declining") return colors.error;
  return colors.textSecondary;
}

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 12,
  },
  rowWithHeart: {
    paddingRight: 44,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statAccent: {
    color: colors.primary,
    fontWeight: "600",
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sparklineWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    height: 48,
    width: "100%",
  },
  peakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  bestTime: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  peakNowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: `${colors.success}22`,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
  },
  peakNowText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
});

function PeakNowPill() {
  const opacity = useSharedValue(0.7);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.5, { duration: 600 })
      ),
      -1
    );
  }, [opacity]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={localStyles.peakNowPill}>
      <AnimatedView style={pulseStyle}>
        <Ionicons name="time" size={12} color={colors.success} />
      </AnimatedView>
      <Text style={localStyles.peakNowText}>Peak now</Text>
    </View>
  );
}

function WatchlistCard({ game, onPress, index, showHeart = false }) {
  const { width: winWidth } = useWindowDimensions();
  const contentWidth = winWidth - 32 - 24;
  const { toggleWatch } = useWatchlist();

  const history = game.history;
  const trend = history ? getTrend(history) : { direction: "stable", percentChange: 0 };
  const sparkColor = trendColor(trend.direction);
  const peakInsights = computePeakInsights(game);
  const bestTimeLabel = peakInsights?.daily?.label ?? null;
  const showPeakNow = isInPeakWindowNow(game);

  const handleHeartPress = (e) => {
    e?.stopPropagation?.();
    toggleWatch(game);
  };

  return (
    <View style={localStyles.card}>
      <Pressable
        onPress={() => onPress?.(game)}
        accessibilityRole="button"
        accessibilityLabel={game.name}
      >
        <View style={[localStyles.row, showHeart && localStyles.rowWithHeart]}>
          <View style={localStyles.thumb}>
            <GameImage source={{ uri: game.thumbnail }} style={localStyles.image} />
          </View>
          <View style={localStyles.body}>
            <Text style={localStyles.name} numberOfLines={1}>
              {game.name}
            </Text>
            <View style={localStyles.stats}>
              <Text style={localStyles.stat}>
                <Text style={localStyles.statAccent}>{formatPlayerCount(game.playerCount)}</Text> players
              </Text>
              <Text style={localStyles.stat}>
                <Text style={localStyles.statAccent}>{formatStreamCount(game.streamCount)}</Text> streams
              </Text>
            </View>
          </View>
          <TrendBadge direction={trend.direction} percentChange={trend.percentChange} />
        </View>

        {history && history.length > 0 && (
          <View style={localStyles.sparklineWrap}>
            <Sparkline
              data={history}
              width={contentWidth}
              height={48}
              color={sparkColor}
              animated
              animationDelayMs={0}
              animationEnabled={false}
            />
          </View>
        )}

        <View style={localStyles.peakRow}>
          <Text style={localStyles.bestTime} numberOfLines={1}>
            {bestTimeLabel ? `Best time: ${bestTimeLabel}` : ""}
            {bestTimeLabel && showPeakNow ? "  " : ""}
          </Text>
          {showPeakNow && <PeakNowPill />}
        </View>
      </Pressable>

      {showHeart && (
        <Pressable
          style={localStyles.heartBtn}
          onPress={handleHeartPress}
          accessibilityRole="button"
          accessibilityLabel="Remove from watchlist"
        >
          <Ionicons name="heart" size={22} color={colors.error} />
        </Pressable>
      )}
    </View>
  );
}

export default memo(WatchlistCard);
