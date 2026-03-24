import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";

/** Top / bottom gleam strip thickness */
const EDGE = 1;
/** One full L→R pass */
const SWEEP_MS = 2200;
/** Next gleam scheduled after random delay in [MIN_DELAY_MS, FOUR_MIN_MS] */
const FOUR_MIN_MS = 4 * 60 * 1000;
const MIN_DELAY_MS = 5000;
/** Bottom edge follows top by this fraction of the 0–1 sweep (stream effect) */
const BOTTOM_LAG = 0.13;

/** Horizontal moving band — vivid neon core on metal */
const EDGE_NEON_COLORS = [
  "transparent",
  "rgba(26,255,26,0.45)",
  "rgba(60,255,90,0.92)",
  "rgba(230,255,230,1)",
  "rgba(40,255,55,0.95)",
  "rgba(26,255,26,0.5)",
  "transparent",
];
const EDGE_NEON_LOCATIONS = [0, 0.1, 0.28, 0.5, 0.62, 0.82, 1];

function lagProgress(p, lag) {
  "worklet";
  if (p <= lag) return 0;
  return (p - lag) / (1 - lag);
}

/**
 * 1px top + bottom border gleam only (no wash over tab icons/labels).
 * Each sweep is followed by a random idle (5s–4min), then the next sweep.
 */
export default function TabBarBrushedMetalSweep({ width, height }) {
  const progress = useSharedValue(0);
  const layoutW = useSharedValue(0);
  const timeoutRef = useRef(null);
  const cancelledRef = useRef(false);
  const scheduleNextRef = useRef(() => {});

  useEffect(() => {
    cancelledRef.current = false;
    layoutW.value = width;

    const clearScheduledTimeout = () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleNextRandom = () => {
      clearScheduledTimeout();
      if (cancelledRef.current || width <= 1 || height <= 1) return;
      const delay =
        MIN_DELAY_MS + Math.random() * (FOUR_MIN_MS - MIN_DELAY_MS);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (cancelledRef.current || width <= 1 || height <= 1) return;
        cancelAnimation(progress);
        progress.value = 0;
        progress.value = withTiming(
          1,
          { duration: SWEEP_MS, easing: Easing.linear },
          (finished) => {
            "worklet";
            if (finished) {
              progress.value = 0;
              runOnJS(() => {
                scheduleNextRef.current();
              })();
            }
          }
        );
      }, delay);
    };

    scheduleNextRef.current = scheduleNextRandom;

    if (width <= 1 || height <= 1) {
      cancelAnimation(progress);
      return () => {
        cancelledRef.current = true;
        clearScheduledTimeout();
        cancelAnimation(progress);
      };
    }

    scheduleNextRandom();

    return () => {
      cancelledRef.current = true;
      clearScheduledTimeout();
      cancelAnimation(progress);
    };
  }, [width, height, progress]);

  const topSheenStyle = useAnimatedStyle(() => {
    const w = layoutW.value;
    const sw = Math.max(100, w * 0.62);
    const x = interpolate(progress.value, [0, 1], [-sw, w + sw * 0.38]);
    return {
      width: sw,
      height: EDGE,
      transform: [{ translateX: x }],
    };
  });

  const bottomSheenStyle = useAnimatedStyle(() => {
    const w = layoutW.value;
    const sw = Math.max(100, w * 0.62);
    const pBot = lagProgress(progress.value, BOTTOM_LAG);
    const x = interpolate(pBot, [0, 1], [-sw, w + sw * 0.38]);
    return {
      width: sw,
      height: EDGE,
      transform: [{ translateX: x }],
    };
  });

  if (width <= 1 || height <= 1) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.overlay]}
      pointerEvents="none"
    >
      <View style={styles.topTrack}>
        <Animated.View style={topSheenStyle}>
          <LinearGradient
            colors={EDGE_NEON_COLORS}
            locations={EDGE_NEON_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <View style={styles.bottomTrack}>
        <Animated.View style={bottomSheenStyle}>
          <LinearGradient
            colors={EDGE_NEON_COLORS}
            locations={EDGE_NEON_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 20,
    elevation: 20,
  },
  topTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: EDGE,
    overflow: "hidden",
  },
  bottomTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: EDGE,
    overflow: "hidden",
  },
});
