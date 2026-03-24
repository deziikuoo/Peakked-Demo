/**
 * Chart and tooltip animation use Reanimated so tooltip fade runs on the UI thread.
 */
import { useRef, useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../theme/colors";
import { formatPlayerCount, EVENT_TYPES } from "../data/shared/gameFormatters";
import { getPoints } from "./Sparkline";
import Sparkline from "./Sparkline";
import EventMarkers, {
  getMarkerCenters,
  MARKER_SIZE as MARKER_SIZE_PX,
} from "./EventMarkers";

const colors = themes.darkNeon;

const TOOLTIP_WIDTH = 190;
const TOOLTIP_WIDTH_WITH_EVENT = 190;
const TOOLTIP_WIDTH_DUAL = 220;
const TOOLTIP_WIDTH_COMPARISON = 240;
const TOOLTIP_WIDTH_ALL = 280;
const SECONDARY_DOT_R = 3;
const TERTIARY_DOT_R = 3;
const TOOLTIP_FADE_MS = 180;
const MARKER_HIT_RADIUS = MARKER_SIZE_PX / 2 + 4;
const TOOLTIP_MIN_HEIGHT = 45;
const TOOLTIP_MIN_HEIGHT_WITH_EVENT = 56;
const DOT_R = 4;
const SCRUB_EVENT_SNAP = 0.5;
const MARKER_TAP_CLEAR_MS = 5000;
const PEAK_BADGE_VISIBLE_MS = 4000;

/**
 * Format hour index 0..23 as "12 AM", "1 AM", ... "11 PM".
 */
function formatTimeForIndex(i) {
  if (i < 0 || i > 23) return "";
  if (i === 0) return "12 AM";
  if (i < 12) return `${i} AM`;
  if (i === 12) return "12 PM";
  return `${i - 12} PM`;
}

/**
 * Format continuous position (0..23) as "12:00 AM", "5:40 AM", etc. Rounded to nearest 10 minutes.
 */
function formatTimeContinuous(position) {
  if (position == null || position < 0) return "";
  const totalMinutes = Math.min(23.999, Math.max(0, position)) * 60;
  const roundedMinutes = Math.round(totalMinutes / 10) * 10;
  const h = Math.floor(roundedMinutes / 60) % 24;
  const m = roundedMinutes % 60;
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function clamp(num, minVal, maxVal) {
  return Math.min(Math.max(num, minVal), maxVal);
}

/** Interpolate between two points; t in [0, 1]. */
function lerpPoint(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Get Y on the polyline at the given X. Keeps scrub marker exactly on the line
 * even when primary/secondary have different lengths or x distributions.
 */
function getYAtX(points, x) {
  if (!points || points.length < 2) return points[0]?.[1] ?? 0;
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let j = 0; j < points.length - 1; j++) {
    const [x0, y0] = points[j];
    const [x1, y1] = points[j + 1];
    if (x >= x0 && x <= x1) {
      const t = x1 - x0 ? (x - x0) / (x1 - x0) : 0;
      return y0 + (y1 - y0) * t;
    }
  }
  return points[points.length - 1][1];
}

export default function SparklineScrubbable({
  data,
  width = 100,
  height = 32,
  color = "#9CA3AF",
  animated = true,
  formatValue = formatPlayerCount,
  formatTimeLabel = formatTimeContinuous,
  events = [],
  secondaryData,
  secondaryColor = colors.secondary,
  metricLabel = "players",
  dualMode = false,
  formatSecondaryValue,
  tertiaryData,
  tertiaryColor = colors.views ?? colors.tertiary ?? "#E040FB",
  formatTertiaryValue,
  tripleMode = false,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  peakWindow = null,
  peakColor = colors.success,
  peakLabelFormatter,
  animationDelayMs,
  animationEnabled,
  clipBottomRadius = 0,
}) {
  const [scrubPosition, setScrubPosition] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [peakBadgeVisible, setPeakBadgeVisible] = useState(false);
  const tooltipOpacity = useSharedValue(0);
  const lastTooltipRef = useRef({
    pointX: 0,
    pointY: 0,
    pointYSecondary: 0,
    pointYTertiary: 0,
    tooltipLeft: 0,
    tooltipTop: 0,
    scrubPosition: 0,
    interpolatedValue: 0,
    interpolatedValueSecondary: 0,
    interpolatedValueTertiary: 0,
    nearEvent: null,
    tooltipW: TOOLTIP_WIDTH,
    tooltipMinH: TOOLTIP_MIN_HEIGHT,
    eventColor: colors.text,
  });
  const points = useMemo(
    () => getPoints(data, width, height),
    [data, width, height],
  );
  const pointsSecondary = useMemo(
    () =>
      (dualMode || tripleMode) && secondaryData?.length >= 2
        ? getPoints(secondaryData, width, height)
        : [],
    [dualMode, tripleMode, secondaryData, width, height],
  );
  const pointsTertiary = useMemo(
    () =>
      tripleMode && tertiaryData?.length >= 2
        ? getPoints(tertiaryData, width, height)
        : [],
    [tripleMode, tertiaryData, width, height],
  );
  const wrapRef = useRef(null);
  const wrapFrameRef = useRef({ x: 0, y: 0 });
  const widthRef = useRef(width);
  const dataLengthRef = useRef(data?.length ?? 0);
  const markerTapTimeoutRef = useRef(null);
  const peakBadgeTimeoutRef = useRef(null);
  const touchStartedOnMarkerRef = useRef(false);
  const markerCenters = useMemo(
    () => getMarkerCenters(events, points),
    [events, points],
  );
  const markerCentersRef = useRef(markerCenters);
  markerCentersRef.current = markerCenters;
  const peakWindowRef = useRef(peakWindow);
  peakWindowRef.current = peakWindow;
  widthRef.current = width;
  dataLengthRef.current = data?.length ?? 0;

  useEffect(
    () => () => {
      if (markerTapTimeoutRef.current)
        clearTimeout(markerTapTimeoutRef.current);
      if (peakBadgeTimeoutRef.current)
        clearTimeout(peakBadgeTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.measureInWindow((x, y) => {
      wrapFrameRef.current = { x, y };
    });
  }, [width, height, data?.length]);

  const hasScrub = scrubPosition !== null && points.length > 0;
  const i0 = hasScrub ? Math.floor(scrubPosition) : 0;
  const i1 = hasScrub ? Math.min(i0 + 1, data.length - 1) : 0;
  const t = hasScrub ? scrubPosition - i0 : 0;
  const [pointX, pointY] = hasScrub
    ? lerpPoint(points[i0], points[i1], t)
    : [0, 0];
  const interpolatedValue = hasScrub
    ? Math.round(data[i0] * (1 - t) + data[i1] * t)
    : 0;
  const hasSecondary =
    (dualMode || tripleMode) && pointsSecondary.length > 0 && secondaryData?.length >= 2;
  const i0s =
    hasScrub && hasSecondary ? Math.min(i0, secondaryData.length - 1) : 0;
  const i1s =
    hasScrub && hasSecondary ? Math.min(i0 + 1, secondaryData.length - 1) : 0;
  const pointYSecondary =
    hasScrub && hasSecondary ? getYAtX(pointsSecondary, pointX) : pointY;
  const interpolatedValueSecondary =
    hasScrub && hasSecondary
      ? Math.round(secondaryData[i0s] * (1 - t) + secondaryData[i1s] * t)
      : 0;
  const hasTertiary = tripleMode && pointsTertiary.length > 0 && tertiaryData?.length >= 2;
  const pointYTertiary =
    hasScrub && hasTertiary ? getYAtX(pointsTertiary, pointX) : pointY;
  const i0t = hasScrub && hasTertiary ? Math.min(i0, tertiaryData.length - 1) : 0;
  const i1t = hasScrub && hasTertiary ? Math.min(i0 + 1, tertiaryData.length - 1) : 0;
  const interpolatedValueTertiary =
    hasScrub && hasTertiary
      ? Math.round(tertiaryData[i0t] * (1 - t) + tertiaryData[i1t] * t)
      : 0;
  const nearEvent = useMemo(() => {
    if (scrubPosition == null || !events.length) return null;
    return (
      events.find(
        (e) => Math.abs(e.hourIndex - scrubPosition) <= SCRUB_EVENT_SNAP,
      ) ?? null
    );
  }, [scrubPosition, events]);
  const peakRegionSvg = useMemo(() => {
    if (!peakWindow || points.length < 2) return null;
    const startIdx = Math.max(0, Math.min(peakWindow.startHour, points.length - 1));
    const endIdx = Math.max(0, Math.min(peakWindow.endHour, points.length - 1));
    return {
      x1: points[startIdx][0],
      x2: points[endIdx][0],
      color: peakColor,
    };
  }, [peakWindow, points, peakColor]);

  const isInPeak = useMemo(() => {
    if (!peakWindow || scrubPosition == null) return false;
    return scrubPosition >= peakWindow.startHour && scrubPosition <= peakWindow.endHour;
  }, [peakWindow, scrubPosition]);

  const isComparisonDual = dualMode && hasSecondary && primaryLabel && secondaryLabel;
  const tooltipW =
    tripleMode && hasTertiary
      ? TOOLTIP_WIDTH_ALL
      : isComparisonDual
        ? TOOLTIP_WIDTH_COMPARISON
        : dualMode && hasSecondary
          ? TOOLTIP_WIDTH_DUAL
          : nearEvent
            ? TOOLTIP_WIDTH_WITH_EVENT
            : TOOLTIP_WIDTH;
  const tooltipMinH = nearEvent
    ? TOOLTIP_MIN_HEIGHT_WITH_EVENT
    : TOOLTIP_MIN_HEIGHT;
  const eventColor =
    nearEvent && EVENT_TYPES[nearEvent.type]
      ? EVENT_TYPES[nearEvent.type].color
      : colors.text;

  useEffect(() => {
    if (hasScrub) {
      lastTooltipRef.current = {
        pointX,
        pointY,
        pointYSecondary: pointYSecondary,
        pointYTertiary: pointYTertiary,
        tooltipLeft: clamp(pointX - tooltipW / 2, 0, width - tooltipW),
        tooltipTop: pointY - 20 - tooltipMinH,
        scrubPosition,
        interpolatedValue,
        interpolatedValueSecondary,
        interpolatedValueTertiary,
        nearEvent,
        tooltipW,
        tooltipMinH,
        eventColor,
      };
      setTooltipVisible(true);
      tooltipOpacity.value = 0;
      tooltipOpacity.value = withTiming(1, { duration: TOOLTIP_FADE_MS });
    } else {
      if (!tooltipVisible) return;
      tooltipOpacity.value = withTiming(0, { duration: TOOLTIP_FADE_MS }, (finished) => {
        if (finished) runOnJS(setTooltipVisible)(false);
      });
    }
  }, [hasScrub]);

  useEffect(() => {
    return () => {
      if (markerTapTimeoutRef.current) clearTimeout(markerTapTimeoutRef.current);
      markerTapTimeoutRef.current = null;
      if (peakBadgeTimeoutRef.current) clearTimeout(peakBadgeTimeoutRef.current);
      peakBadgeTimeoutRef.current = null;
    };
  }, []);

  const handleMarkerPress = (event) => {
    if (markerTapTimeoutRef.current) clearTimeout(markerTapTimeoutRef.current);
    setScrubPosition(event.hourIndex);
    markerTapTimeoutRef.current = setTimeout(() => {
      setScrubPosition(null);
      markerTapTimeoutRef.current = null;
    }, MARKER_TAP_CLEAR_MS);
  };

  const getLocalTouch = (e) => {
    const pageX = e.nativeEvent.pageX;
    const pageY = e.nativeEvent.pageY;
    return {
      x: pageX - wrapFrameRef.current.x,
      y: pageY - wrapFrameRef.current.y,
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim for scrubbing unless touch is on a marker (so marker tap works and detail view is scrubbable).
      onStartShouldSetPanResponder: (e) => {
        const { x, y } = getLocalTouch(e);
        const centers = markerCentersRef.current;
        const onMarker = centers.some(
          ([mx, my]) => Math.hypot(x - mx, y - my) <= MARKER_HIT_RADIUS,
        );
        touchStartedOnMarkerRef.current = onMarker;
        return !onMarker;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (touchStartedOnMarkerRef.current) return false;
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: (e) => {
        touchStartedOnMarkerRef.current = false;
        if (markerTapTimeoutRef.current) {
          clearTimeout(markerTapTimeoutRef.current);
          markerTapTimeoutRef.current = null;
        }
        const { x: locationX } = getLocalTouch(e);
        const w = widthRef.current;
        const len = dataLengthRef.current;
        const position =
          len < 2 ? 0 : clamp((locationX / w) * (len - 1), 0, len - 1);
        setScrubPosition(position);
        if (peakWindowRef.current) {
          if (peakBadgeTimeoutRef.current) clearTimeout(peakBadgeTimeoutRef.current);
          setPeakBadgeVisible(true);
          peakBadgeTimeoutRef.current = setTimeout(() => {
            setPeakBadgeVisible(false);
            peakBadgeTimeoutRef.current = null;
          }, PEAK_BADGE_VISIBLE_MS);
        }
      },
      onPanResponderMove: (e) => {
        const { x: locationX } = getLocalTouch(e);
        const w = widthRef.current;
        const len = dataLengthRef.current;
        const position =
          len < 2 ? 0 : clamp((locationX / w) * (len - 1), 0, len - 1);
        setScrubPosition(position);
      },
      onPanResponderRelease: () => {
        touchStartedOnMarkerRef.current = false;
        if (markerTapTimeoutRef.current) return;
        setScrubPosition(null);
      },
      onPanResponderTerminate: () => {
        touchStartedOnMarkerRef.current = false;
      },
    }),
  ).current;

  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
  }));

  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width,
          height,
          position: "relative",
          overflow: "visible",
        },
        dot: {
          position: "absolute",
          width: DOT_R * 2,
          height: DOT_R * 2,
          borderRadius: DOT_R,
          backgroundColor: color,
          borderWidth: 1.5,
          borderColor: colors.background,
        },
        dotSecondary: {
          position: "absolute",
          width: SECONDARY_DOT_R * 2,
          height: SECONDARY_DOT_R * 2,
          borderRadius: SECONDARY_DOT_R,
          backgroundColor: secondaryColor,
          borderWidth: 1.5,
          borderColor: colors.background,
        },
        dotTertiary: {
          position: "absolute",
          width: TERTIARY_DOT_R * 2,
          height: TERTIARY_DOT_R * 2,
          borderRadius: TERTIARY_DOT_R,
          backgroundColor: tertiaryColor,
          borderWidth: 1.5,
          borderColor: colors.background,
        },
        tooltip: {
          position: "absolute",
          width: tooltipW,
          minHeight: nearEvent
            ? TOOLTIP_MIN_HEIGHT_WITH_EVENT
            : TOOLTIP_MIN_HEIGHT,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        },
        tooltipTime: {
          fontSize: 12,
          fontWeight: "600",
          color: "#FFF",
          textAlign: "center",
        },
        tooltipText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
        },
        tooltipRow: {
          flexDirection: "row",
          flexWrap: "nowrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginTop: 2,
        },
        tooltipEventText: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
          textAlign: "center",
        },
      }),
    [width, height, color, secondaryColor, tertiaryColor, tooltipW, nearEvent],
  );

  if (!data || data.length < 2)
    return (
      <Sparkline
        data={data}
        width={width}
        height={height}
        color={color}
        animated={animated}
        animationDelayMs={animationDelayMs}
        animationEnabled={animationEnabled}
        clipBottomRadius={clipBottomRadius}
      />
    );

  const tooltipLeft = hasScrub
    ? clamp(pointX - tooltipW / 2, 0, width - tooltipW)
    : lastTooltipRef.current.tooltipLeft;
  const tooltipTop = hasScrub
    ? pointY - 20 - tooltipMinH
    : lastTooltipRef.current.tooltipTop;
  const displayPos = hasScrub
    ? scrubPosition
    : lastTooltipRef.current.scrubPosition;
  const displayValue = hasScrub
    ? interpolatedValue
    : lastTooltipRef.current.interpolatedValue;
  const displayValueSecondary = hasScrub
    ? interpolatedValueSecondary
    : lastTooltipRef.current.interpolatedValueSecondary;
  const displayValueTertiary = hasScrub
    ? interpolatedValueTertiary
    : lastTooltipRef.current.interpolatedValueTertiary;
  const displayNearEvent = hasScrub
    ? nearEvent
    : lastTooltipRef.current.nearEvent;
  const displayEventColor =
    displayNearEvent && EVENT_TYPES[displayNearEvent.type]
      ? EVENT_TYPES[displayNearEvent.type].color
      : colors.text;
  const displayTooltipW = lastTooltipRef.current.tooltipW;

  const chartLayerBase = {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
  };

  return (
    <View
      ref={wrapRef}
      onLayout={() => {
        if (!wrapRef.current) return;
        wrapRef.current.measureInWindow((x, y) => {
          wrapFrameRef.current = { x, y };
        });
      }}
      style={localStyles.wrap}
      {...panResponder.panHandlers}
      accessibilityLabel="Chart: drag to see player count over time"
      accessibilityRole="none"
    >
      {/*
        Stack order: markers under dashed overlays under primary.
        Primary SVG uses pointerEvents="none" so touches reach markers and the parent pan handler.
        Sparkle/burst render on top of event markers (same theme green as the line).
      */}
      <View
        style={[chartLayerBase, { zIndex: 1 }]}
        pointerEvents="box-none"
      >
        <EventMarkers
          events={events}
          points={points}
          width={width}
          height={height}
          scrubPosition={scrubPosition}
          onMarkerPress={handleMarkerPress}
        />
      </View>
      {(dualMode || tripleMode) && hasSecondary && (
        <View
          style={[
            chartLayerBase,
            { zIndex: 2, pointerEvents: "none" },
          ]}
        >
          <Sparkline
            data={secondaryData}
            width={width}
            height={height}
            color={secondaryColor}
            animated={animated}
            strokeDasharray="4 2"
            clipBottomRadius={clipBottomRadius}
          />
        </View>
      )}
      {tripleMode && hasTertiary && (
        <View
          style={[
            chartLayerBase,
            { zIndex: 3, pointerEvents: "none" },
          ]}
        >
          <Sparkline
            data={tertiaryData}
            width={width}
            height={height}
            color={tertiaryColor}
            animated={animated}
            strokeDasharray="2 3"
            clipBottomRadius={clipBottomRadius}
          />
        </View>
      )}
      <View
        style={[
          chartLayerBase,
          { zIndex: 4, pointerEvents: "none" },
        ]}
      >
        <Sparkline
          data={data}
          width={width}
          height={height}
          color={color}
          animated={animated}
          peakRegion={peakRegionSvg}
          animationDelayMs={animationDelayMs}
          animationEnabled={animationEnabled}
          clipBottomRadius={clipBottomRadius}
        />
      </View>
      {peakRegionSvg && peakBadgeVisible && (
        <View
          style={{
            position: "absolute",
            left: peakRegionSvg.x1 + (peakRegionSvg.x2 - peakRegionSvg.x1) / 2 - 70,
            top: -16,
            width: 140,
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: `${peakColor}22`,
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: `${peakColor}40`,
            }}
          >
            <Ionicons name="time-outline" size={9} color={peakColor} />
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: peakColor,
                letterSpacing: 0.3,
              }}
              numberOfLines={1}
            >
              Peak: {(peakLabelFormatter || formatTimeForIndex)(peakWindow.startHour)}–{(peakLabelFormatter || formatTimeForIndex)(peakWindow.endHour)}
            </Text>
          </View>
        </View>
      )}
      {tooltipVisible && (
        <AnimatedView
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              width,
              height,
              pointerEvents: "none",
              zIndex: 6,
            },
            tooltipAnimatedStyle,
          ]}
        >
          {(dualMode || tripleMode) && hasSecondary && (
            <View
              style={[
                localStyles.dotSecondary,
                {
                  left:
                    (hasScrub ? pointX : lastTooltipRef.current.pointX) -
                    SECONDARY_DOT_R,
                  top:
                    (hasScrub
                      ? pointYSecondary
                      : lastTooltipRef.current.pointYSecondary) -
                    SECONDARY_DOT_R,
                },
              ]}
            />
          )}
          {tripleMode && hasTertiary && (
            <View
              style={[
                localStyles.dotTertiary,
                {
                  left:
                    (hasScrub ? pointX : lastTooltipRef.current.pointX) -
                    TERTIARY_DOT_R,
                  top:
                    (hasScrub
                      ? pointYTertiary
                      : lastTooltipRef.current.pointYTertiary) -
                    TERTIARY_DOT_R,
                },
              ]}
            />
          )}
          <View
            style={[
              localStyles.dot,
              {
                left:
                  (hasScrub ? pointX : lastTooltipRef.current.pointX) - DOT_R,
                top:
                  (hasScrub ? pointY : lastTooltipRef.current.pointY) - DOT_R,
                zIndex: (dualMode || tripleMode) && hasSecondary ? 1 : 0,
              },
            ]}
          />
          <View
            style={[
              localStyles.tooltip,
              {
                width: displayTooltipW,
                minHeight:
                  (tripleMode && hasTertiary) || (dualMode && hasSecondary)
                    ? TOOLTIP_MIN_HEIGHT_WITH_EVENT
                    : displayNearEvent
                      ? TOOLTIP_MIN_HEIGHT_WITH_EVENT
                      : TOOLTIP_MIN_HEIGHT,
                left: tooltipLeft,
                top: tooltipTop,
              },
            ]}
          >
            {tripleMode && hasTertiary && primaryLabel && secondaryLabel && tertiaryLabel ? (
              <>
                <Text style={localStyles.tooltipTime} numberOfLines={1}>
                  {formatTimeLabel(displayPos)}
                </Text>
                <View style={{ marginTop: 2 }}>
                  <Text
                    style={[localStyles.tooltipEventText, { color }]}
                    numberOfLines={1}
                  >
                    {primaryLabel}: {formatValue(displayValue)}
                  </Text>
                  <Text
                    style={[localStyles.tooltipEventText, { color: secondaryColor }]}
                    numberOfLines={1}
                  >
                    {secondaryLabel}: {(formatSecondaryValue || formatValue)(displayValueSecondary)}
                  </Text>
                  <Text
                    style={[localStyles.tooltipEventText, { color: tertiaryColor }]}
                    numberOfLines={1}
                  >
                    {tertiaryLabel}: {(formatTertiaryValue || formatValue)(displayValueTertiary)}
                  </Text>
                </View>
              </>
            ) : tripleMode && hasTertiary ? (
              <>
                <Text style={localStyles.tooltipTime} numberOfLines={1}>
                  {formatTimeLabel(displayPos)}
                </Text>
                <View style={localStyles.tooltipRow}>
                  <Text
                    style={[localStyles.tooltipEventText, { color }]}
                    numberOfLines={1}
                  >
                    {formatValue(displayValue)} players
                  </Text>
                  <Text
                    style={[
                      localStyles.tooltipEventText,
                      { color: secondaryColor },
                    ]}
                    numberOfLines={1}
                  >
                    {(formatSecondaryValue || formatValue)(displayValueSecondary)}{" "}
                    streams
                  </Text>
                  <Text
                    style={[
                      localStyles.tooltipEventText,
                      { color: tertiaryColor },
                    ]}
                    numberOfLines={1}
                  >
                    {(formatTertiaryValue || formatValue)(displayValueTertiary)}{" "}
                    views
                  </Text>
                </View>
              </>
            ) : dualMode && hasSecondary ? (
              <>
                <Text style={localStyles.tooltipTime} numberOfLines={1}>
                  {formatTimeLabel(displayPos)}
                </Text>
                {primaryLabel && secondaryLabel ? (
                  <View style={{ marginTop: 2 }}>
                    <Text
                      style={[localStyles.tooltipEventText, { color }]}
                      numberOfLines={1}
                    >
                      {primaryLabel}: {formatValue(displayValue)}
                    </Text>
                    <Text
                      style={[localStyles.tooltipEventText, { color: secondaryColor }]}
                      numberOfLines={1}
                    >
                      {secondaryLabel}: {(formatSecondaryValue || formatValue)(displayValueSecondary)}
                    </Text>
                  </View>
                ) : (
                  <View style={localStyles.tooltipRow}>
                    <Text
                      style={[localStyles.tooltipEventText, { color }]}
                      numberOfLines={1}
                    >
                      {formatValue(displayValue)} players
                    </Text>
                    <Text
                      style={[
                        localStyles.tooltipEventText,
                        { color: secondaryColor },
                      ]}
                      numberOfLines={1}
                    >
                      {(formatSecondaryValue || formatValue)(displayValueSecondary)}{" "}
                      streams
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={localStyles.tooltipTime} numberOfLines={1}>
                  {formatTimeLabel(displayPos)}
                </Text>
                <Text
                  style={[localStyles.tooltipEventText, { color }]}
                  numberOfLines={2}
                >
                  {formatValue(displayValue)} {metricLabel}
                </Text>
              </>
            )}
            {displayNearEvent && (
              <Text
                style={[
                  localStyles.tooltipEventText,
                  { color: displayEventColor },
                ]}
                numberOfLines={2}
              >
                {displayNearEvent.label}
              </Text>
            )}
            {isInPeak && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                <Ionicons name="star" size={9} color={peakColor} />
                <Text style={{ fontSize: 10, fontWeight: "600", color: peakColor }}>
                  Peak
                </Text>
              </View>
            )}
          </View>
        </AnimatedView>
      )}
    </View>
  );
}
