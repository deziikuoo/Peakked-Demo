import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { themes } from "../theme/colors";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const defaultColors = themes.darkNeon;
const isWeb = Platform.OS === "web";

/** Approximate perimeter of a rounded-rect stroke path (rx = ry = r). */
function roundedRectPerimeter(w, h, r) {
  const rad = Math.min(Math.max(0, r), w / 2, h / 2);
  const straight = 2 * Math.max(0, w - 2 * rad) + 2 * Math.max(0, h - 2 * rad);
  const arcs = 2 * Math.PI * rad;
  return Math.max(1, straight + arcs);
}

/**
 * Theme-green “scan light” traveling along the card border only (SVG stroke).
 * Parent must be `position: 'relative'`; pass measured inner size from onLayout.
 *
 * Web: Reanimated + SVG dash props are unreliable (same as Sparkline), so we
 * drive strokeDashoffset with requestAnimationFrame + plain Rect.
 */
export default function GameCardBorderScan({
  width,
  height,
  borderRadius = 10,
  strokeWidth = 3,
  /** Full lap duration */
  durationMs = 3200,
  /** Stagger across list items */
  delayMs = 0,
  color = defaultColors.primary,
}) {
  const dashOffset = useSharedValue(0);
  const [webDashOffset, setWebDashOffset] = useState(0);
  const webGenRef = useRef(0);

  const perimeter = roundedRectPerimeter(width, height, borderRadius);
  const beam = Math.max(28, Math.min(width, height) * 0.22);
  const gap = perimeter;
  const cycle = beam + gap;

  /** Native: Reanimated loop */
  useEffect(() => {
    if (isWeb || width <= 1 || height <= 1) return undefined;

    dashOffset.value = 0;
    const t = setTimeout(() => {
      dashOffset.value = withRepeat(
        withTiming(cycle, {
          duration: durationMs,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, delayMs);

    return () => {
      clearTimeout(t);
      cancelAnimation(dashOffset);
    };
  }, [width, height, borderRadius, durationMs, delayMs, cycle, dashOffset]);

  /** Web: rAF loop (Reanimated SVG dash is unreliable on web — see Sparkline.js) */
  useEffect(() => {
    if (!isWeb || width <= 1 || height <= 1) return undefined;

    const gen = ++webGenRef.current;
    let rafId = 0;
    let startTs = null;

    const step = (ts) => {
      if (gen !== webGenRef.current) return;
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      if (elapsed < delayMs) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const u = ((elapsed - delayMs) % durationMs) / durationMs;
      setWebDashOffset(-u * cycle);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      webGenRef.current += 1;
      cancelAnimationFrame(rafId);
    };
  }, [width, height, borderRadius, durationMs, delayMs, cycle]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -dashOffset.value,
  }));

  if (width <= 1 || height <= 1) return null;

  const half = strokeWidth / 2;
  const innerW = Math.max(0, width - strokeWidth);
  const innerH = Math.max(0, height - strokeWidth);
  const rx = Math.max(0, Math.min(borderRadius - half, innerW / 2, innerH / 2));

  const dashArray = `${beam} ${gap}`;

  const rectProps = {
    x: half,
    y: half,
    width: innerW,
    height: innerH,
    rx,
    ry: rx,
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeDasharray: dashArray,
    strokeLinecap: "round",
    strokeOpacity: 1,
  };

  return (
    <Svg
      width={width}
      height={height}
      style={styles.svg}
      pointerEvents="none"
    >
      {isWeb ? (
        <Rect {...rectProps} strokeDashoffset={webDashOffset} />
      ) : (
        <AnimatedRect {...rectProps} animatedProps={animatedProps} />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
  },
});
