import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  formatViewCount,
} from "../data/shared/gameFormatters";
import Sparkline from "./Sparkline";
import GameImage from "./GameImage";

const colors = themes.darkNeon;
const CARD_W = 400;
const CARD_H = 560;
const PADDING = 20;
const IMAGE_H = 180;
const CHART_W = CARD_W - PADDING * 2;
const CHART_H = 80;

const PLAYERS_COLOR = colors.success;
const STREAMS_COLOR = colors.secondary;
const VIEWS_COLOR = "#A855F7";

function trendColor(direction) {
  if (direction === "rising") return colors.success;
  if (direction === "declining") return colors.error;
  return colors.textSecondary;
}

function trendIcon(direction) {
  if (direction === "rising") return "trending-up";
  if (direction === "declining") return "trending-down";
  return "remove";
}

const GameShareCard = React.forwardRef(function GameShareCard(
  { game, peakRegion, chartColor },
  ref
) {
  if (!game) return null;

  const trend = (() => {
    const h = game.history;
    if (!h || h.length < 12) return { direction: "stable", percentChange: 0 };
    const first6 = h.slice(0, 6);
    const last6 = h.slice(-6);
    const avgFirst = first6.reduce((a, b) => a + b, 0) / first6.length;
    const avgLast = last6.reduce((a, b) => a + b, 0) / last6.length;
    const pct = avgFirst === 0 ? 0 : ((avgLast - avgFirst) / avgFirst) * 100;
    const threshold = 3;
    let dir = "stable";
    if (pct > threshold) dir = "rising";
    else if (pct < -threshold) dir = "declining";
    return { direction: dir, percentChange: pct };
  })();

  const lineColor = chartColor || trendColor(trend.direction);
  const trendBg = `${lineColor}26`;
  const trendLabel =
    trend.direction === "stable"
      ? "0.0%"
      : trend.percentChange >= 0
        ? `+${trend.percentChange.toFixed(1)}%`
        : `${trend.percentChange.toFixed(1)}%`;

  return (
    <View ref={ref} style={styles.card}>
      <View style={styles.imageWrap}>
        <GameImage
          source={{ uri: game.thumbnail }}
          style={styles.image}
        />
        <View style={styles.gradient} />
      </View>

      <View style={styles.content}>
        <Text style={styles.gameName} numberOfLines={2}>
          {game.name}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={13} color={PLAYERS_COLOR} />
            <Text style={[styles.statValue, { color: PLAYERS_COLOR }]}>
              {formatPlayerCount(game.playerCount)}
            </Text>
            <Text style={styles.statLabel}>players</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="tv" size={13} color={STREAMS_COLOR} />
            <Text style={[styles.statValue, { color: STREAMS_COLOR }]}>
              {formatStreamCount(game.streamCount)}
            </Text>
            <Text style={styles.statLabel}>streams</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={13} color={VIEWS_COLOR} />
            <Text style={[styles.statValue, { color: VIEWS_COLOR }]}>
              {formatViewCount(game.viewCount)}
            </Text>
            <Text style={styles.statLabel}>views</Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <Sparkline
            data={game.history}
            width={CHART_W}
            height={CHART_H}
            color={lineColor}
            animated={false}
            peakRegion={peakRegion}
          />
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.trendPill, { backgroundColor: trendBg }]}>
            <Ionicons
              name={trendIcon(trend.direction)}
              size={14}
              color={lineColor}
            />
            <Text style={[styles.trendText, { color: lineColor }]}>
              {trendLabel}
            </Text>
          </View>
          {game.viewCount != null && (
            <View style={styles.viewsPill}>
              <Ionicons name="eye" size={14} color={VIEWS_COLOR} />
              <Text style={styles.viewsText}>
                {formatViewCount(game.viewCount)}
              </Text>
            </View>
          )}
        </View>

        {game.rating != null && (
          <Text style={styles.ratingText}>Rating: {game.rating}%</Text>
        )}
      </View>

      <View style={styles.brandingFooter}>
        <Text style={styles.brandingText}>GameTrend</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
  imageWrap: {
    width: CARD_W,
    height: IMAGE_H,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundImage: `linear-gradient(to bottom, transparent, ${colors.surface})`,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingTop: 8,
    justifyContent: "space-between",
  },
  gameName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartWrap: {
    marginTop: 12,
    width: CHART_W,
    height: CHART_H,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: `${VIEWS_COLOR}26`,
  },
  viewsText: {
    fontSize: 12,
    fontWeight: "600",
    color: VIEWS_COLOR,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  brandingFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  brandingText: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
});

export default GameShareCard;
