import { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  formatViewCount,
  formatHourIn7d,
  formatDayLabel,
} from "../data/shared/gameFormatters";
import SparklineScrubbable from "./SparklineScrubbable";
import MetricToggle from "./MetricToggle";
import TimeRangeToggle from "./TimeRangeToggle";

const colors = themes.darkNeon;
const SLOT_COLORS = [colors.primary, colors.secondary, colors.success];

const localStyles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  togglesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  sparklineWrap: {
    height: 72,
    width: "100%",
    overflow: "visible",
  },
  xAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  xAxisLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: "500",
    opacity: 0.7,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});

export default function CompareChartPanel({
  games,
  activeMetric,
  activeRange,
  onMetricChange,
  onRangeChange,
}) {
  const { width: winWidth } = useWindowDimensions();
  const chartWidth = Math.min(winWidth - 32, 400) - 8;

  const rangeTimeFormatter = useMemo(() => {
    if (activeRange === "7d") return formatHourIn7d;
    if (activeRange === "30d") return formatDayLabel;
    return undefined;
  }, [activeRange]);

  const dataByGame = useMemo(() => {
    if (!games?.length) return [];
    return games.map((g) => {
      if (activeRange === "7d") {
        return {
          players: g.history7d ?? null,
          streams: g.streamHistory7d ?? null,
          views: g.viewHistory7d ?? null,
        };
      }
      if (activeRange === "30d") {
        return {
          players: g.history30d ?? null,
          streams: g.streamHistory30d ?? null,
          views: g.viewHistory30d ?? null,
        };
      }
      return {
        players: g.history ?? null,
        streams: g.streamHistory ?? null,
        views: g.viewHistory ?? null,
      };
    });
  }, [games, activeRange]);

  const metricKey = activeMetric === "all" ? "players" : activeMetric;
  const formatValue =
    metricKey === "players"
      ? formatPlayerCount
      : metricKey === "streams"
        ? formatStreamCount
        : formatViewCount;

  const d1 = dataByGame[0]?.[metricKey];
  const d2 = dataByGame[1]?.[metricKey];
  const d3 = dataByGame[2]?.[metricKey];
  const hasData = d1 && d1.length >= 2;

  const xAxisLabels = useMemo(() => {
    if (activeRange === "7d") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (activeRange === "30d") return ["Mar 15", "Mar 22", "Mar 29", "Apr 5", "Apr 12"];
    return ["12 AM", "6 AM", "12 PM", "6 PM", "11 PM"];
  }, [activeRange]);

  const color1 = SLOT_COLORS[0];
  const color2 = SLOT_COLORS[1];
  const color3 = SLOT_COLORS[2];

  if (!games?.length || !hasData) {
    return (
      <View style={localStyles.wrap}>
        <View style={localStyles.togglesRow}>
          <MetricToggle
            activeMetric={activeMetric}
            onToggle={onMetricChange}
            forceActiveColor={colors.primary}
          />
          <TimeRangeToggle activeRange={activeRange} onToggle={onRangeChange} />
        </View>
        <View style={[localStyles.sparklineWrap, { justifyContent: "center" }]}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>
            Add 2+ games to compare trends
          </Text>
        </View>
      </View>
    );
  }

  const dualMode = games.length >= 2 && d2?.length >= 2;
  const tripleMode = games.length >= 3 && d2?.length >= 2 && d3?.length >= 2;

  return (
    <View style={localStyles.wrap}>
      <View style={localStyles.togglesRow}>
        <MetricToggle
          activeMetric={activeMetric}
          onToggle={onMetricChange}
          forceActiveColor={colors.primary}
        />
        <TimeRangeToggle activeRange={activeRange} onToggle={onRangeChange} />
      </View>
      <View style={localStyles.sparklineWrap}>
        <SparklineScrubbable
          data={d1}
          width={chartWidth}
          height={72}
          color={color1}
          animated
          formatValue={formatValue}
          formatTimeLabel={rangeTimeFormatter}
          events={[]}
          metricLabel={metricKey}
          animationEnabled={false}
          {...(dualMode && {
            dualMode: true,
            secondaryData: d2,
            secondaryColor: color2,
            formatSecondaryValue: formatValue,
            primaryLabel: games[0].name,
            secondaryLabel: games[1].name,
          })}
          {...(tripleMode && {
            tripleMode: true,
            tertiaryData: d3,
            tertiaryColor: color3,
            formatTertiaryValue: formatValue,
            tertiaryLabel: games[2].name,
          })}
        />
      </View>
      <View style={localStyles.xAxisRow}>
        {xAxisLabels.map((label, i) => (
          <Text key={i} style={localStyles.xAxisLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={localStyles.legend}>
        {games.map((g, i) => (
          <View key={g.id} style={localStyles.legendItem}>
            <View
              style={[localStyles.legendDot, { backgroundColor: SLOT_COLORS[i] }]}
            />
            <Text style={localStyles.legendText} numberOfLines={1}>
              {g.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
