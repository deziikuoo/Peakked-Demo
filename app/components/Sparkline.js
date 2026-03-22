/**
 * Chart animation uses Reanimated (worklets, shared values) so draw and sparkle
 * run on the UI thread. On web, path draw animation is disabled due to
 * react-native-svg setNativeProps limitations.
 */
import { useEffect, useRef, useMemo } from "react";
import { Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Line,
  Circle,
  Ellipse,
  G,
  Polygon,
} from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SPARKLE_DRAW_MS = 800;
const BURST_MS = 320;
const SPARKLE_ROTATION_MS = 2000;
const PRIMARY_RAY_LEN = 13;
const SECONDARY_RAY_LEN = 8;
const PRIMARY_RAY_BASE = 0.9;
const SECONDARY_RAY_BASE = 0.6;
const RAY_ANGLES_PRIMARY = [0, 90, 180, 270];
const RAY_ANGLES_SECONDARY = [45, 135, 225, 315];
const PULSE_PERIOD_MS = 600;
export const STAGGER_MS = 70;
export const ANIMATION_CAP = 6;

/**
 * Returns [[x,y], ...] for the sparkline, scaled to width x height.
 * Same scaling as buildPaths. Exported for scrubbable overlay (dot + tooltip).
 */
export function getPoints(data, width, height) {
  if (!data || data.length < 2) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;
  const w = width - 2 * padding;
  const h = height - 2 * padding;
  const stepX = w / (data.length - 1);
  return data.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + h - ((v - min) / range) * h;
    return [x, y];
  });
}

function getSparklePos(points, progress) {
  if (!points || points.length < 2) return null;
  const revealed = 1 - progress;
  const idx = revealed * (points.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, points.length - 1);
  const frac = idx - i0;
  const cx = points[i0][0] + (points[i1][0] - points[i0][0]) * frac;
  const cy = points[i0][1] + (points[i1][1] - points[i0][1]) * frac;
  return { cx, cy };
}

export default function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "#9CA3AF",
  animated = true,
  strokeDasharray,
  peakRegion,
  animationDelayMs = 0,
  animationEnabled = true,
}) {
  const pathMemo = useMemo(() => {
    const points = getPoints(data, width, height);
    if (points.length < 2)
      return { linePath: "", areaPath: "", pathLength: 0, points: [] };
    const padding = 1;
    const linePath = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x},${y}`)
      .join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1][0]},${height} L ${padding},${height} Z`;
    let pathLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      pathLength += Math.sqrt(dx * dx + dy * dy);
    }
    return { linePath, areaPath, pathLength, points };
  }, [data, width, height]);

  const { linePath, areaPath, pathLength: totalLength, points } = pathMemo;
  const isWeb = Platform.OS === "web";
  const useDrawAnimation =
    !strokeDasharray &&
    animated &&
    animationEnabled &&
    !isWeb;

  const drawProgress = useSharedValue(1);
  const sparkleCx = useSharedValue(0);
  const sparkleCy = useSharedValue(0);
  const sparkleTrailX = useSharedValue(0);
  const sparkleTrailY = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const sparkleRot = useSharedValue(0);
  const sparklePulse = useSharedValue(1);
  const burstCx = useSharedValue(0);
  const burstCy = useSharedValue(0);
  const burstT = useSharedValue(1);
  const trailRef = useRef({ x: 0, y: 0 });
  const startTsRef = useRef(0);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const updateSparkleFromProgress = (progress) => {
    const pts = pointsRef.current;
    if (!pts || pts.length < 2) return;
    const elapsed = Date.now() - startTsRef.current;
    sparkleRot.value =
      ((elapsed % SPARKLE_ROTATION_MS) / SPARKLE_ROTATION_MS) * 360;
    sparklePulse.value =
      0.85 + 0.15 * Math.sin((elapsed / PULSE_PERIOD_MS) * Math.PI * 2);
    const pos = getSparklePos(pts, progress);
    if (pos) {
      sparkleCx.value = pos.cx;
      sparkleCy.value = pos.cy;
      const prev = trailRef.current;
      const trailX = prev.x + (pos.cx - prev.x) * 0.4;
      const trailY = prev.y + (pos.cy - prev.y) * 0.4;
      sparkleTrailX.value = trailX;
      sparkleTrailY.value = trailY;
      trailRef.current = { x: trailX, y: trailY };
    }
  };

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDasharray: `${totalLength}`,
    strokeDashoffset: drawProgress.value * (totalLength || 1),
  }));

  useEffect(() => {
    if (!useDrawAnimation || !linePath || points.length < 2 || !totalLength)
      return;

    startTsRef.current = Date.now();
    drawProgress.value = 1;
    sparkleOpacity.value = 1;
    sparkleTrailX.value = points[0][0];
    sparkleTrailY.value = points[0][1];
    trailRef.current = { x: points[0][0], y: points[0][1] };

    const endPos = getSparklePos(points, 0);
    if (endPos) {
      burstCx.value = endPos.cx;
      burstCy.value = endPos.cy;
    }
    burstT.value = 1;

    const runDraw = () => {
      drawProgress.value = withDelay(
        animationDelayMs,
        withTiming(
          0,
          { duration: SPARKLE_DRAW_MS },
          (finished) => {
            if (finished) {
              sparkleOpacity.value = 0;
              burstT.value = withTiming(0, { duration: BURST_MS });
            }
          }
        )
      );
    };
    runDraw();
  }, [
    useDrawAnimation,
    totalLength,
    points.length,
    animationDelayMs,
    animationEnabled,
  ]);

  useAnimatedReaction(
    () => drawProgress.value,
    (progress) => {
      if (progress <= 0) return;
      runOnJS(updateSparkleFromProgress)(progress);
    }
  );

  if (!linePath) return null;

  const pathProps = {
    d: linePath,
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const colorClean = color.replace("#", "");

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient
          id={`sparkline-fill-${colorClean}`}
          x1="0"
          y1="1"
          x2="0"
          y2="0"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.15" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
        {useDrawAnimation && (
          <>
            <RadialGradient
              id={`sparkle-halo-${colorClean}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0" stopColor={color} stopOpacity="0.22" />
              <Stop offset="0.4" stopColor={color} stopOpacity="0.07" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id={`sparkle-core-${colorClean}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="0.6" stopColor={color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id={`sparkle-trail-${colorClean}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0" stopColor={color} stopOpacity="0.18" />
              <Stop offset="0.5" stopColor={color} stopOpacity="0.04" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id={`burst-flash-${colorClean}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </>
        )}
      </Defs>
      <Path d={areaPath} fill={`url(#sparkline-fill-${colorClean})`} />
      {peakRegion && (
        <>
          <Defs>
            <LinearGradient
              id={`peak-glow-${peakRegion.color.replace("#", "")}`}
              x1="0"
              y1="1"
              x2="0"
              y2="0"
            >
              <Stop
                offset="0"
                stopColor={peakRegion.color}
                stopOpacity="0.18"
              />
              <Stop
                offset="1"
                stopColor={peakRegion.color}
                stopOpacity="0.06"
              />
            </LinearGradient>
          </Defs>
          <Rect
            x={peakRegion.x1}
            y={0}
            width={peakRegion.x2 - peakRegion.x1}
            height={height}
            fill={`url(#peak-glow-${peakRegion.color.replace("#", "")})`}
            rx={3}
          />
          <Line
            x1={peakRegion.x1}
            y1={0}
            x2={peakRegion.x1}
            y2={height}
            stroke={peakRegion.color}
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          <Line
            x1={peakRegion.x2}
            y1={0}
            x2={peakRegion.x2}
            y2={height}
            stroke={peakRegion.color}
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        </>
      )}
      {strokeDasharray || !useDrawAnimation ? (
        <Path {...pathProps} />
      ) : (
        <AnimatedPath {...pathProps} animatedProps={animatedPathProps} />
      )}
      {useDrawAnimation && (
        <SparkleGroup
          colorClean={colorClean}
          sparkleCx={sparkleCx}
          sparkleCy={sparkleCy}
          sparkleTrailX={sparkleTrailX}
          sparkleTrailY={sparkleTrailY}
          sparkleOpacity={sparkleOpacity}
          sparkleRot={sparkleRot}
          sparklePulse={sparklePulse}
          color={color}
        />
      )}
      {useDrawAnimation && (
        <BurstGroup
          colorClean={colorClean}
          burstCx={burstCx}
          burstCy={burstCy}
          burstT={burstT}
        />
      )}
    </Svg>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

function SparkleGroup({
  colorClean,
  sparkleCx,
  sparkleCy,
  sparkleTrailX,
  sparkleTrailY,
  sparkleOpacity,
  sparkleRot,
  sparklePulse,
  color,
}) {
  const trailProps = useAnimatedProps(() => ({
    cx: sparkleTrailX.value,
    cy: sparkleTrailY.value,
    r: 10 * sparklePulse.value,
  }));
  const haloProps = useAnimatedProps(() => ({
    cx: sparkleCx.value,
    cy: sparkleCy.value,
    r: 14 * sparklePulse.value,
  }));
  const coreProps = useAnimatedProps(() => ({
    cx: sparkleCx.value,
    cy: sparkleCy.value,
    r: 4 * sparklePulse.value,
  }));
  const centerProps = useAnimatedProps(() => ({
    cx: sparkleCx.value,
    cy: sparkleCy.value,
  }));
  const gProps = useAnimatedProps(() => ({
    opacity: sparkleOpacity.value,
  }));

  return (
    <AnimatedG animatedProps={gProps}>
      <AnimatedCircle
        fill={`url(#sparkle-trail-${colorClean})`}
        animatedProps={trailProps}
      />
      <AnimatedCircle
        fill={`url(#sparkle-halo-${colorClean})`}
        animatedProps={haloProps}
      />
      {RAY_ANGLES_PRIMARY.map((baseAngle) => (
        <SparkleRay
          key={`p-${baseAngle}`}
          baseAngle={baseAngle}
          sparkleCx={sparkleCx}
          sparkleCy={sparkleCy}
          sparkleRot={sparkleRot}
          sparklePulse={sparklePulse}
          lenMult={1}
          baseMult={1}
          fill="#FFFFFF"
          fillOpacity={0.88}
        />
      ))}
      {RAY_ANGLES_SECONDARY.map((baseAngle) => (
        <SparkleRay
          key={`s-${baseAngle}`}
          baseAngle={baseAngle}
          sparkleCx={sparkleCx}
          sparkleCy={sparkleCy}
          sparkleRot={sparkleRot}
          sparklePulse={sparklePulse}
          lenMult={SECONDARY_RAY_LEN / PRIMARY_RAY_LEN}
          baseMult={SECONDARY_RAY_BASE / PRIMARY_RAY_BASE}
          fill={color}
          fillOpacity={0.55}
        />
      ))}
      <AnimatedCircle
        fill={`url(#sparkle-core-${colorClean})`}
        animatedProps={coreProps}
      />
      <AnimatedCircle
        animatedProps={centerProps}
        r={1.5}
        fill="#FFFFFF"
        fillOpacity={1}
      />
    </AnimatedG>
  );
}

function SparkleRay({
  baseAngle,
  sparkleCx,
  sparkleCy,
  sparkleRot,
  sparklePulse,
  lenMult,
  baseMult,
  fill,
  fillOpacity,
}) {
  const animatedProps = useAnimatedProps(() => {
    const angle = baseAngle + sparkleRot.value;
    const len = PRIMARY_RAY_LEN * sparklePulse.value * lenMult;
    const base = PRIMARY_RAY_BASE * sparklePulse.value * baseMult;
    const rad = (angle * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const cx = sparkleCx.value;
    const cy = sparkleCy.value;
    const tipX = cx + Math.cos(rad) * len;
    const tipY = cy + Math.sin(rad) * len;
    const b1x = cx + Math.cos(perp) * base;
    const b1y = cy + Math.sin(perp) * base;
    const b2x = cx - Math.cos(perp) * base;
    const b2y = cy - Math.sin(perp) * base;
    return {
      points: `${b1x},${b1y} ${tipX},${tipY} ${b2x},${b2y}`,
    };
  });
  return (
    <AnimatedPolygon
      fill={fill}
      fillOpacity={fillOpacity}
      animatedProps={animatedProps}
    />
  );
}

function BurstGroup({ colorClean, burstCx, burstCy, burstT }) {
  const ellipseProps = useAnimatedProps(() => {
    const t = burstT.value;
    const cx = burstCx.value;
    const cy = burstCy.value;
    const eased = 1 - Math.pow(1 - t, 3);
    const ovalW = 2 + eased * 16;
    const ovalH = 1 + eased * 4;
    const flashOpacity = Math.max(0, 1 - t * 1.6);
    return {
      cx,
      cy,
      // Keep the "vertical flash" look without SVG transform strings
      // that Reanimated treats as invalid style transforms.
      rx: ovalH,
      ry: ovalW,
      opacity: flashOpacity,
    };
  });
  const coreProps = useAnimatedProps(() => {
    const t = burstT.value;
    const coreOpacity = Math.max(0, 1 - t * 2.5);
    return {
      cx: burstCx.value,
      cy: burstCy.value,
      fillOpacity: coreOpacity,
    };
  });
  const streak1Props = useAnimatedProps(() => {
    const t = burstT.value;
    const eased = 1 - Math.pow(1 - t, 3);
    const len = eased * 28;
    const base = 0.6 * Math.max(0, 1 - t * 2);
    const opacity = Math.max(0, 1 - t * 2);
    const cx = burstCx.value;
    const cy = burstCy.value;
    const rad = (180 * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const tx = cx + Math.cos(rad) * len;
    const ty = cy + Math.sin(rad) * len;
    const b1x = cx + Math.cos(perp) * base;
    const b1y = cy + Math.sin(perp) * base;
    const b2x = cx - Math.cos(perp) * base;
    const b2y = cy - Math.sin(perp) * base;
    return {
      points: `${b1x},${b1y} ${tx},${ty} ${b2x},${b2y}`,
      fillOpacity: opacity,
    };
  });
  const streak2Props = useAnimatedProps(() => {
    const t = burstT.value;
    const eased = 1 - Math.pow(1 - t, 3);
    const len = eased * 18 * 0.65;
    const base = 0.6 * Math.max(0, 1 - t * 2) * 0.7;
    const opacity = Math.max(0, 1 - t * 2) * 0.6;
    const cx = burstCx.value;
    const cy = burstCy.value;
    const rad = (180 * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const tx = cx + Math.cos(rad) * len;
    const ty = cy + Math.sin(rad) * len;
    const b1x = cx + Math.cos(perp) * base;
    const b1y = cy + Math.sin(perp) * base;
    const b2x = cx - Math.cos(perp) * base;
    const b2y = cy - Math.sin(perp) * base;
    return {
      points: `${b1x},${b1y} ${tx},${ty} ${b2x},${b2y}`,
      fillOpacity: opacity,
    };
  });
  const splashUpProps = useAnimatedProps(() => {
    const t = burstT.value;
    const eased = 1 - Math.pow(1 - t, 3);
    const len = eased * 9;
    const base = 0.4 * Math.max(0, 1 - t * 2);
    const opacity = Math.max(0, 0.8 - t * 2.2);
    const cx = burstCx.value;
    const cy = burstCy.value;
    const rad = (270 * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const tx = cx + Math.cos(rad) * len;
    const ty = cy + Math.sin(rad) * len;
    const b1x = cx + Math.cos(perp) * base;
    const b1y = cy + Math.sin(perp) * base;
    const b2x = cx - Math.cos(perp) * base;
    const b2y = cy - Math.sin(perp) * base;
    return {
      points: `${b1x},${b1y} ${tx},${ty} ${b2x},${b2y}`,
      fillOpacity: opacity,
    };
  });
  const splashDownProps = useAnimatedProps(() => {
    const t = burstT.value;
    const eased = 1 - Math.pow(1 - t, 3);
    const len = eased * 9;
    const base = 0.4 * Math.max(0, 1 - t * 2);
    const opacity = Math.max(0, 0.8 - t * 2.2);
    const cx = burstCx.value;
    const cy = burstCy.value;
    const rad = (90 * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const tx = cx + Math.cos(rad) * len;
    const ty = cy + Math.sin(rad) * len;
    const b1x = cx + Math.cos(perp) * base;
    const b1y = cy + Math.sin(perp) * base;
    const b2x = cx - Math.cos(perp) * base;
    const b2y = cy - Math.sin(perp) * base;
    return {
      points: `${b1x},${b1y} ${tx},${ty} ${b2x},${b2y}`,
      fillOpacity: opacity,
    };
  });

  return (
    <G>
      <AnimatedEllipse
        fill={`url(#burst-flash-${colorClean})`}
        animatedProps={ellipseProps}
      />
      <AnimatedPolygon fill="#FFFFFF" animatedProps={streak1Props} />
      <AnimatedPolygon fill="#FFFFFF" animatedProps={streak2Props} />
      <AnimatedPolygon fill="#FFFFFF" animatedProps={splashUpProps} />
      <AnimatedPolygon fill="#FFFFFF" animatedProps={splashDownProps} />
      <AnimatedCircle
        r={1.8}
        fill="#FFFFFF"
        animatedProps={coreProps}
      />
    </G>
  );
}
