import { useEffect, useRef, memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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
import { formatPlayerCount, formatStreamCount, getTrend, isInPeakWindowNow } from "../data/shared/gameFormatters";
import Sparkline, { STAGGER_MS, ANIMATION_CAP } from "./Sparkline";
import TrendBadge from "./TrendBadge";
import ViewsBadge from "./ViewsBadge";
import { useWatchlist } from "../context/WatchlistContext";
import GameImage from "./GameImage";

const colors = themes.darkNeon;

function trendColor(direction) {
  if (direction === "rising") return colors.success;
  if (direction === "declining") return colors.error;
  return colors.textSecondary;
}

const localStyles = StyleSheet.create({
  rowOuter: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  thumbCol: {
    alignItems: "center",
    marginRight: 12,
    gap: 6,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.border,
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
    gap: 12,
  },
  stat: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statAccent: {
    color: colors.primary,
    fontWeight: "600",
  },
  sparklineBox: {
    width: 96,
    height: 32,
    marginTop: 35,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  peakNowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: `${colors.success}22`,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
  },
  peakNowText: {
    fontSize: 10,
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
        <Ionicons name="time" size={10} color={colors.success} />
      </AnimatedView>
      <Text style={localStyles.peakNowText}>Peak now</Text>
    </View>
  );
}

function GameRowCard({ game, onPress, index, animateSparkline = true }) {
  const { getDisplayWatched, toggleWatch } = useWatchlist();
  const history = game.history;
  const trend = history
    ? getTrend(history)
    : { direction: "stable", percentChange: 0 };
  const sparkColor = trendColor(trend.direction);
  const showPeakNow = isInPeakWindowNow(game);

  const onHeartPress = (e) => {
    e?.stopPropagation?.();
    toggleWatch(game);
  };

  return (
    <View style={localStyles.rowOuter}>
      <Pressable
        onPress={() => onPress?.(game)}
        accessibilityRole="button"
        accessibilityLabel={game.name}
      >
        <View style={localStyles.row}>
          <View style={localStyles.thumbCol}>
            <View style={localStyles.thumb}>
              <GameImage source={{ uri: game.thumbnail }} style={localStyles.image} />
            </View>
          </View>
          <View style={localStyles.body}>
            <Text style={localStyles.name} numberOfLines={1}>
              {game.name}
            </Text>
            <View style={localStyles.stats}>
              <Text style={localStyles.stat}>
                <Text style={localStyles.statAccent}>
                  {formatPlayerCount(game.playerCount)}
                </Text>{" "}
                players
              </Text>
              <Text style={localStyles.stat}>
                <Text style={localStyles.statAccent}>{formatStreamCount(game.streamCount)}</Text>{" "}
                streams
              </Text>
            </View>
          </View>
          {history && history.length > 0 && (
            <View style={localStyles.sparklineBox}>
              <Sparkline
                data={history}
                width={96}
                height={32}
                color={sparkColor}
                animated
                animationDelayMs={index != null ? index * STAGGER_MS : 0}
                animationEnabled={animateSparkline && (index == null || index < ANIMATION_CAP)}
              />
            </View>
          )}
        </View>
        <View style={localStyles.badgesRow}>
          <ViewsBadge viewCount={game.viewCount} />
          {showPeakNow && <PeakNowPill />}
          <TrendBadge
            direction={trend.direction}
            percentChange={trend.percentChange}
          />
        </View>
      </Pressable>
      <Pressable
        style={localStyles.heartBtn}
        onPress={onHeartPress}
        accessibilityRole="button"
        accessibilityLabel={getDisplayWatched(game.id) ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Ionicons
          name={getDisplayWatched(game.id) ? "heart" : "heart-outline"}
          size={18}
          color={getDisplayWatched(game.id) ? colors.error : "#FFF"}
        />
      </Pressable>
    </View>
  );
}

export default memo(GameRowCard);
