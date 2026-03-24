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
import { LinearGradient } from "expo-linear-gradient";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  getTrend,
  isInPeakWindowNow,
} from "../data/shared/gameFormatters";
import Sparkline, { STAGGER_MS, ANIMATION_CAP } from "./Sparkline";
import TrendBadge from "./TrendBadge";
import ViewsBadge from "./ViewsBadge";
import { useWatchlist } from "../context/WatchlistContext";
import { useDelayedSingleOrDoubleTap } from "../utils/useDelayedSingleOrDoubleTap";
import GameListThumbnailImage from "./GameListThumbnailImage";

const colors = themes.darkNeon;

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
  /** Shown only when liked — tap to remove from watchlist */
  heartBtn: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  /** Full-height row: image strip (20%) + content; no horizontal padding on outer row */
  mainRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 88,
  },
  /** Left edge: 20% of card width, full height of row */
  imageStrip: {
    width: "20%",
    alignSelf: "stretch",
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: colors.border,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Each band is 10% of the image strip (width for L/R, height for top/bottom) */
  imageVignetteLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "12%",
    zIndex: 1,
  },
  imageVignetteRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "28%",
    zIndex: 1,
  },
  imageVignetteTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "12%",
    zIndex: 1,
  },
  imageVignetteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "12%",
    zIndex: 1,
  },
  contentCol: {
    flex: 1,
    paddingTop: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 5,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  body: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
        withTiming(0.5, { duration: 600 }),
      ),
      -1,
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
  const showPeakNow = isInPeakWindowNow(game);
  const isLiked = getDisplayWatched(game.id);

  const onHeartPress = (e) => {
    e?.stopPropagation?.();
    toggleWatch(game);
  };

  const handleCardPress = useDelayedSingleOrDoubleTap(
    () => onPress?.(game),
    () => toggleWatch(game),
  );

  return (
    <View style={localStyles.rowOuter}>
      <Pressable
        onPress={handleCardPress}
        accessibilityRole="button"
        accessibilityLabel={game.name}
        accessibilityHint="Double tap to add or remove from your liked games"
      >
        <View style={localStyles.mainRow}>
          <View style={localStyles.imageStrip}>
            <GameListThumbnailImage game={game} style={localStyles.imageFill} />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={localStyles.imageVignetteLeft}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.12)", colors.surface]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={localStyles.imageVignetteRight}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0.16)", "rgba(0,0,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={localStyles.imageVignetteTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.16)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={localStyles.imageVignetteBottom}
            />
          </View>
          <View style={localStyles.contentCol}>
            <View style={localStyles.topRow}>
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
                    <Text style={localStyles.statAccent}>
                      {formatStreamCount(game.streamCount)}
                    </Text>{" "}
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
                    color={colors.primary}
                    animated
                    clipBottomRadius={6}
                    animationDelayMs={index != null ? index * STAGGER_MS : 0}
                    animationEnabled={
                      animateSparkline &&
                      (index == null || index < ANIMATION_CAP)
                    }
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
          </View>
        </View>
      </Pressable>
      {isLiked && (
        <Pressable
          style={localStyles.heartBtn}
          onPress={onHeartPress}
          accessibilityRole="button"
          accessibilityLabel="Remove from watchlist"
        >
          <Ionicons name="heart" size={18} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export default memo(GameRowCard);
