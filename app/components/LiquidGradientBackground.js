import { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions, AppState } from "react-native";
import { Canvas, Shader, Fill, Skia } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { themes } from "../theme/colors";

/** Only shade this region (bottom-right) to cut GPU fill vs full-screen Skia — reduces Android OOM / kills. */
const CORNER_WIDTH_FRAC = 0.58;
const CORNER_HEIGHT_FRAC = 0.52;

const themeColors = themes.darkNeon;

/**
 * Convert hex to normalized RGB (0-1).
 */
function hexToVec3(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const COLOR1 = hexToVec3(themeColors.primary); // #1aff1a green
const COLOR2 = hexToVec3("#001a00"); // very dark green
const COLOR3 = hexToVec3(themeColors.secondary); // #00E5FF cyan
const COLOR4 = hexToVec3("#000000"); // black
const COLOR5 = hexToVec3("#0a1a0a"); // dark green-black
const COLOR6 = hexToVec3("#002a2a"); // dark cyan-black

/**
 * SKSL shader ported from the CodePen liquid gradient (Three.js GLSL).
 * Mouse tracking removed; purely time-based animation.
 * uTime is in milliseconds from useClock, converted to seconds in shader.
 */
const sksl = `
uniform float uTimeMs;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;

const float uSpeed = 0.35;
const float uIntensity = 1.4;
const float uGrainIntensity = 0.04;
const float uGradientSize = 0.5;

float grain(vec2 uv, float t) {
  vec2 grainUv = uv * uResolution * 0.5;
  float grainValue = fract(sin(dot(grainUv + t, vec2(12.9898, 78.233))) * 43758.5453);
  return grainValue * 2.0 - 1.0;
}

vec3 getGradientColor(vec2 uv, float time) {
  float gradientRadius = uGradientSize;

  // Blob centers biased toward bottom-right (after Y-flip, bottom = 0.0)
  vec2 anchor = vec2(0.82, 0.18);
  float drift = 0.18;

  vec2 center1 = anchor + vec2(
    sin(time * uSpeed * 0.4) * drift,
    cos(time * uSpeed * 0.5) * drift
  );
  vec2 center2 = anchor + vec2(
    cos(time * uSpeed * 0.6) * drift * 1.1,
    sin(time * uSpeed * 0.45) * drift * 1.1
  );
  vec2 center3 = anchor + vec2(
    sin(time * uSpeed * 0.35) * drift * 0.9,
    cos(time * uSpeed * 0.55) * drift * 0.9
  );
  vec2 center4 = anchor + vec2(
    cos(time * uSpeed * 0.5) * drift,
    sin(time * uSpeed * 0.4) * drift
  );
  vec2 center5 = anchor + vec2(
    sin(time * uSpeed * 0.7) * drift * 0.85,
    cos(time * uSpeed * 0.6) * drift * 0.85
  );
  vec2 center6 = anchor + vec2(
    cos(time * uSpeed * 0.45) * drift * 1.05,
    sin(time * uSpeed * 0.65) * drift * 1.05
  );

  float dist1 = length(uv - center1);
  float dist2 = length(uv - center2);
  float dist3 = length(uv - center3);
  float dist4 = length(uv - center4);
  float dist5 = length(uv - center5);
  float dist6 = length(uv - center6);

  float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
  float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
  float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
  float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
  float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
  float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);

  vec2 rotatedUv1 = uv - 0.5;
  float angle1 = time * uSpeed * 0.15;
  rotatedUv1 = vec2(
    rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
    rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
  );
  rotatedUv1 += 0.5;

  vec2 rotatedUv2 = uv - 0.5;
  float angle2 = -time * uSpeed * 0.12;
  rotatedUv2 = vec2(
    rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
    rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
  );
  rotatedUv2 += 0.5;

  float radialGradient1 = length(rotatedUv1 - 0.5);
  float radialGradient2 = length(rotatedUv2 - 0.5);
  float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
  float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);

  vec3 color = vec3(0.0);
  color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed));
  color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2));
  color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8));
  color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3));
  color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1));
  color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9));

  color += mix(uColor1, uColor3, radialInfluence1) * 0.25;
  color += mix(uColor2, uColor4, radialInfluence2) * 0.2;

  color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luminance), color, 1.2);
  color = pow(color, vec3(0.94));

  float brightness = length(color);
  float mixFactor = max(brightness * 1.1, 0.08);
  color = mix(vec3(0.0), color, mixFactor);

  return color;
}

vec4 main(vec2 fragCoord) {
  float time = uTimeMs / 1000.0;
  vec2 uv = fragCoord / uResolution;
  uv.y = 1.0 - uv.y;

  vec3 color = getGradientColor(uv, time);

  float grainValue = grain(uv, time);
  color += grainValue * uGrainIntensity;

  float timeShift = time * 0.3;
  color.r += sin(timeShift) * 0.012;
  color.g += cos(timeShift * 1.4) * 0.012;
  color.b += sin(timeShift * 1.2) * 0.012;

  color = clamp(color, vec3(0.0), vec3(1.0));

  // Radial fade: fully visible at bottom-right corner (after Y-flip: 1.0, 0.0)
  float cornerDist = length(uv - vec2(1.0, 0.0));
  float alpha = 1.0 - smoothstep(0.0, 0.75, cornerDist);

  return vec4(color, alpha);
}
`;

const shader = Skia.RuntimeEffect.Make(sksl);

/**
 * Animated liquid gradient background (ported from CodePen).
 * No mouse tracking — purely time-driven.
 */
export default function LiquidGradientBackground() {
  const { width, height } = useWindowDimensions();
  const timeMs = useSharedValue(0);

  const cornerW = Math.max(1, Math.round(width * CORNER_WIDTH_FRAC));
  const cornerH = Math.max(1, Math.round(height * CORNER_HEIGHT_FRAC));

  /**
   * Drive shader time from the JS rAF loop — not useFrameCallback.
   * Logcat showed SIGSEGV in libworklets (AnimationFrameCallback) on Expo Go; this avoids that path.
   */
  useEffect(() => {
    let rafId = 0;
    const t0 = Date.now();

    const tick = () => {
      timeMs.value = Date.now() - t0;
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    if (AppState.currentState === "active") start();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else stop();
    });

    return () => {
      sub.remove();
      stop();
    };
  }, [timeMs]);

  const uniforms = useDerivedValue(
    () => ({
      uTimeMs: timeMs.value,
      uResolution: [cornerW, cornerH],
      uColor1: COLOR1,
      uColor2: COLOR2,
      uColor3: COLOR3,
      uColor4: COLOR4,
      uColor5: COLOR5,
      uColor6: COLOR6,
    }),
    [cornerW, cornerH]
  );

  if (!shader || width < 1 || height < 1) return null;

  return (
    <View
      style={[styles.corner, { width: cornerW, height: cornerH }]}
      pointerEvents="none"
      collapsable={false}
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Fill>
          <Shader source={shader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
});
