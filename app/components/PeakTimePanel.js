import { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
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

const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  columnTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  peakNowWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  peakNowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: `${colors.success}22`,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
  },
  peakNowText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
});

function PulsingDot({ color }) {
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.5, { duration: 700 })
      ),
      -1
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <AnimatedView
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

const CONFIDENCE_COLORS = {
  high: colors.success,
  medium: "#EAB308",
  low: colors.textSecondary,
};

export default function PeakTimePanel({ insights }) {
  const isInPeakNow = useMemo(() => {
    if (!insights?.daily?.window) return false;
    const { startHour, endHour } = insights.daily.window;
    const hour = new Date().getHours();
    return hour >= startHour && hour <= endHour;
  }, [insights]);

  if (!insights || (!insights.daily && !insights.weekly && !insights.monthly)) {
    return null;
  }

  const confidenceColor = CONFIDENCE_COLORS[insights.confidence] ?? colors.textSecondary;

  return (
    <View style={localStyles.card}>
      <View style={localStyles.header}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={localStyles.headerTitle}>Best Time to Play</Text>
        <View style={[localStyles.confidenceDot, { backgroundColor: confidenceColor }]} />
      </View>
      <View style={localStyles.row}>
        {insights.daily && (
          <View style={localStyles.column}>
            <Text style={localStyles.columnTitle}>Today</Text>
            <Text style={localStyles.columnLabel} numberOfLines={1}>
              {insights.daily.label}
            </Text>
            <View style={localStyles.barTrack}>
              <View
                style={[
                  localStyles.barFill,
                  { width: `${Math.max(10, insights.daily.intensity)}%` },
                ]}
              />
            </View>
          </View>
        )}
        {insights.weekly && (
          <View style={localStyles.column}>
            <Text style={localStyles.columnTitle}>This Week</Text>
            <Text style={localStyles.columnLabel} numberOfLines={1}>
              {insights.weekly.label}
            </Text>
            <View style={localStyles.barTrack}>
              <View
                style={[
                  localStyles.barFill,
                  { width: `${Math.max(10, insights.weekly.intensity)}%` },
                ]}
              />
            </View>
          </View>
        )}
        {insights.monthly && (
          <View style={localStyles.column}>
            <Text style={localStyles.columnTitle}>This Month</Text>
            <Text style={localStyles.columnLabel} numberOfLines={1}>
              {insights.monthly.label}
            </Text>
            <View style={localStyles.barTrack}>
              <View
                style={[
                  localStyles.barFill,
                  { width: `${Math.max(10, insights.monthly.intensity)}%` },
                ]}
              />
            </View>
          </View>
        )}
      </View>
      {isInPeakNow && (
        <View style={localStyles.peakNowWrap}>
          <View style={localStyles.peakNowPill}>
            <PulsingDot color={colors.success} />
            <Text style={localStyles.peakNowText}>You're in peak hours</Text>
          </View>
        </View>
      )}
    </View>
  );
}
