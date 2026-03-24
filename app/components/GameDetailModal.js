import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  formatViewCount,
  getTrend,
  findPeakWindow,
  formatHourIn7d,
  formatDayLabel,
  computePeakInsights,
} from "../data/shared/gameFormatters";
import { getPoints } from "./Sparkline";
import SparklineScrubbable from "./SparklineScrubbable";
import TrendBadge from "./TrendBadge";
import MetricToggle from "./MetricToggle";
import TimeRangeToggle from "./TimeRangeToggle";
import GameComparisonPicker from "./GameComparisonPicker";
import GameShareCard from "./GameShareCard";
import PeakTimePanel from "./PeakTimePanel";
import { useWatchlist } from "../context/WatchlistContext";
import { useDoubleTapOnly } from "../utils/useDoubleTapOnly";
import GameWideThumbnailImage from "./GameWideThumbnailImage";

const colors = themes.darkNeon;

const localStyles = StyleSheet.create({
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "visible",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 460 / 215,
    backgroundColor: colors.border,
    position: "relative",
  },
  /** Catch double-tap to like (below close / heart / compare controls) */
  heroTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    marginBottom: 8,
    flex: 1,
    minWidth: 0,
  },
  statItem: {
    flexShrink: 1,
    minWidth: 0,
  },
  stat: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statAccent: {
    color: colors.primary,
    fontWeight: "600",
  },
  rating: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingAndBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 10,
  },
  statsAndBadge: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sparklineWrap: {
    marginTop: 20,
    height: 64,
    width: "100%",
    overflow: "visible",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  askButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  askButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Shown only when liked — top-left, matches list / hero cards */
  heartOnImage: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  compareBtnOnImage: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  compareChipOnImage: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
    backgroundColor: `${colors.primary}22`,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  metricToggleWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  rangeToggleWrap: {
    marginBottom: 8,
  },
  xAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 1,
  },
  xAxisLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: "500",
    opacity: 0.7,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    marginBottom: 4,
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
    fontWeight: "500",
  },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 4,
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  compareChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
    backgroundColor: `${colors.primary}22`,
    marginBottom: 4,
  },
  compareChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  compareChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    maxWidth: 160,
  },
  compareChipClose: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.primary}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  comparisonLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  },
});

export default function GameDetailModal({
  visible,
  game,
  onClose,
  onAskInChat,
}) {
  const [activeMetric, setActiveMetric] = useState("players");
  const [activeRange, setActiveRange] = useState("24h");
  const [comparisonGame, setComparisonGame] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef(null);
  const mountedRef = useRef(true);
  const { width: winWidth } = useWindowDimensions();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const { getDisplayWatched, toggleWatch } = useWatchlist();
  const handleHeroDoubleTap = useDoubleTapOnly(() => {
    if (game) toggleWatch(game);
  });
  const modalContentWidth = Math.min(winWidth - 48, 400) - 40;

  const handleMetricChange = (metric) => {
    setActiveMetric(metric);
    if (metric === "all") setComparisonGame(null);
  };

  const handleRangeChange = (range) => {
    setActiveRange(range);
    setComparisonGame(null);
  };

  const COMPARISON_COLOR = colors.primary;
  const VIEWS_COLOR = colors.views ?? colors.tertiary ?? "#E040FB";
  const hasRating = game?.rating != null;
  const history = game?.history ?? null;
  const streamHistory = game?.streamHistory ?? null;
  const viewHistory = game?.viewHistory ?? null;
  const hasStreamHistory =
    Array.isArray(streamHistory) && streamHistory.length >= 2;
  const hasViewHistory = Array.isArray(viewHistory) && viewHistory.length >= 2;
  const trend = history
    ? getTrend(history)
    : { direction: "stable", percentChange: 0 };
  /** Player sparkline + sparkle use brand neon green (not trend-based). */
  const playerLineColor = colors.primary;

  const rangeData = useMemo(() => {
    if (!game) return { players: null, streams: null, views: null };
    if (activeRange === "7d") {
      return {
        players: game.history7d ?? null,
        streams: game.streamHistory7d ?? null,
        views: game.viewHistory7d ?? null,
      };
    }
    if (activeRange === "30d") {
      return {
        players: game.history30d ?? null,
        streams: game.streamHistory30d ?? null,
        views: game.viewHistory30d ?? null,
      };
    }
    return {
      players: history,
      streams: streamHistory,
      views: viewHistory,
    };
  }, [activeRange, game, history, streamHistory, viewHistory]);

  const compRangeData = useMemo(() => {
    if (!comparisonGame) return { players: null, streams: null, views: null };
    if (activeRange === "7d") {
      return {
        players: comparisonGame.history7d ?? null,
        streams: comparisonGame.streamHistory7d ?? null,
        views: comparisonGame.viewHistory7d ?? null,
      };
    }
    if (activeRange === "30d") {
      return {
        players: comparisonGame.history30d ?? null,
        streams: comparisonGame.streamHistory30d ?? null,
        views: comparisonGame.viewHistory30d ?? null,
      };
    }
    return {
      players: comparisonGame.history ?? null,
      streams: comparisonGame.streamHistory ?? null,
      views: comparisonGame.viewHistory ?? null,
    };
  }, [activeRange, comparisonGame]);

  const currentPlayerData = rangeData.players;
  const currentStreamData = rangeData.streams;
  const currentViewData = rangeData.views;
  const hasCurrentStream = Array.isArray(currentStreamData) && currentStreamData.length >= 2;
  const hasCurrentView = Array.isArray(currentViewData) && currentViewData.length >= 2;

  const rangeTimeFormatter = useMemo(() => {
    if (activeRange === "7d") return formatHourIn7d;
    if (activeRange === "30d") return formatDayLabel;
    return undefined;
  }, [activeRange]);

  const peakWindow = useMemo(() => {
    if (activeMetric === "streams")
      return findPeakWindow(hasCurrentStream ? currentStreamData : currentPlayerData);
    if (activeMetric === "views")
      return findPeakWindow(hasCurrentView ? currentViewData : currentPlayerData);
    return findPeakWindow(currentPlayerData);
  }, [
    activeMetric,
    currentPlayerData,
    currentStreamData,
    currentViewData,
    hasCurrentStream,
    hasCurrentView,
  ]);

  const SHARE_CHART_W = 360;
  const sharePeakRegion = useMemo(() => {
    const pw = findPeakWindow(history);
    if (!pw || !history || history.length < 2) return null;
    const pts = getPoints(history, SHARE_CHART_W, 80);
    if (pts.length < 2) return null;
    const x1 = pts[Math.min(pw.startHour, pts.length - 1)][0];
    const x2 = pts[Math.min(pw.endHour, pts.length - 1)][0];
    return { x1, x2, color: colors.success };
  }, [history]);

  const peakInsights = useMemo(() => computePeakInsights(game), [game]);

  const handleShare = async () => {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    try {
      await new Promise((r) => setTimeout(r, 150));
      if (!mountedRef.current) return;

      if (Platform.OS === "web") {
        const html2canvas = (await import("html2canvas")).default;
        const el = shareCardRef.current;
        if (!mountedRef.current) return;
        const saved = el.style.cssText;
        el.style.cssText =
          "position:fixed;left:0;top:0;opacity:1;z-index:-9999;pointer-events:none;";
        const canvas = await html2canvas(el, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        if (!mountedRef.current) return;
        el.style.cssText = saved;
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${game.name.replace(/\s+/g, "_")}_Peakked.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const uri = await captureRef(shareCardRef, {
          format: "png",
          quality: 1,
        });
        if (!mountedRef.current) return;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: `${game.name} - Peakked`,
          });
        }
      }
    } catch (_) {
      /* sharing cancelled or unavailable */
    } finally {
      if (mountedRef.current) setSharing(false);
    }
  };

  const xAxisLabels = useMemo(() => {
    if (activeRange === "7d") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (activeRange === "30d") return ["Mar 15", "Mar 22", "Mar 29", "Apr 5", "Apr 12"];
    return ["12 AM", "6 AM", "12 PM", "6 PM", "11 PM"];
  }, [activeRange]);

  const peakLabelFormatter = useMemo(() => {
    if (activeRange === "30d") return formatDayLabel;
    if (activeRange === "7d") return (idx) => {
      const dayIdx = Math.floor(idx / 24) % 7;
      const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const h = idx % 24;
      const hour12 = h % 12 || 12;
      const ampm = h < 12 ? "AM" : "PM";
      return `${DAY_NAMES_SHORT[dayIdx]} ${hour12}${ampm}`;
    };
    return undefined;
  }, [activeRange]);

  const overlayOpacity = useSharedValue(0);
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = 0;
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      overlayOpacity.value = 0;
    }
  }, [visible, overlayOpacity]);

  /** Swipe any direction on the detail card to dismiss */
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible, translateX, translateY]);

  const dismissFromSwipe = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY;
        })
        .onEnd((e) => {
          const dist = Math.hypot(e.translationX, e.translationY);
          const speed = Math.hypot(e.velocityX, e.velocityY);
          const DISMISS_DISTANCE = 64;
          const DISMISS_VELOCITY = 850;
          if (dist > DISMISS_DISTANCE || speed > DISMISS_VELOCITY) {
            translateX.value = 0;
            translateY.value = 0;
            runOnJS(dismissFromSwipe)();
            return;
          }
          translateX.value = withSpring(0, { damping: 18, stiffness: 260 });
          translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
        }),
    [dismissFromSwipe, translateX, translateY]
  );

  const cardDragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (!game) return null;

  const isLiked = getDisplayWatched(game.id);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AnimatedView style={[localStyles.overlay, overlayAnimatedStyle]}>
          <Pressable
            style={localStyles.backdropPressable}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss dialog"
          />
          <GestureDetector gesture={panGesture}>
            <AnimatedView
              style={[localStyles.card, cardDragStyle]}
              accessibilityViewIsModal
            >
          <View style={localStyles.imageWrap}>
            <GameWideThumbnailImage game={game} style={localStyles.image} />
            <Pressable
              style={localStyles.heroTapLayer}
              onPress={handleHeroDoubleTap}
              accessibilityRole="button"
              accessibilityLabel="Game artwork"
              accessibilityHint="Double tap to add or remove from your liked games"
            />
            <Pressable
              style={localStyles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </Pressable>
            {isLiked && (
              <Pressable
                style={localStyles.heartOnImage}
                onPress={() => toggleWatch(game)}
                accessibilityRole="button"
                accessibilityLabel="Remove from watchlist"
              >
                <Ionicons name="heart" size={22} color={colors.primary} />
              </Pressable>
            )}
            {history && history.length > 0 && activeMetric !== "all" && !comparisonGame && (
              <Pressable
                style={localStyles.compareBtnOnImage}
                onPress={() => setPickerVisible(true)}
                accessibilityLabel="Compare with another game"
              >
                <Ionicons
                  name="git-compare-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={localStyles.compareBtnText}>Compare</Text>
              </Pressable>
            )}
            {history && history.length > 0 && activeMetric !== "all" && comparisonGame && (
              <View style={localStyles.compareChipOnImage}>
                <View style={localStyles.compareChipDot} />
                <Text style={localStyles.compareChipText} numberOfLines={1}>
                  vs {comparisonGame.name}
                </Text>
                <Pressable
                  style={localStyles.compareChipClose}
                  onPress={() => setComparisonGame(null)}
                  accessibilityLabel="Clear comparison"
                >
                  <Ionicons name="close" size={12} color={colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
          <View style={localStyles.content}>
            <Text style={localStyles.name}>{game.name}</Text>
            <View style={localStyles.statsAndBadge}>
              <View style={localStyles.statsRow}>
                <View style={localStyles.statItem}>
                  <Text style={localStyles.stat} numberOfLines={1}>
                    <Text style={localStyles.statAccent}>
                      {formatPlayerCount(game.playerCount)}
                    </Text>{" "}
                    players
                  </Text>
                </View>
                <View style={localStyles.statItem}>
                  <Text style={localStyles.stat} numberOfLines={1}>
                    <Text style={localStyles.statAccent}>
                      {formatStreamCount(game.streamCount)}
                    </Text>{" "}
                    streams
                  </Text>
                </View>
                <View style={localStyles.statItem}>
                  <Text style={localStyles.stat} numberOfLines={1}>
                    <Text style={localStyles.statAccent}>
                      {formatViewCount(game.viewCount)}
                    </Text>{" "}
                    views
                  </Text>
                </View>
              </View>
            </View>
            {history && history.length > 0 && (
              <>
                <View style={localStyles.metricToggleWrap}>
                  <MetricToggle
                    activeMetric={activeMetric}
                    onToggle={handleMetricChange}
                    playersActiveColor={playerLineColor}
                  />
                </View>
                <View style={localStyles.rangeToggleWrap}>
                  <TimeRangeToggle
                    activeRange={activeRange}
                    onToggle={handleRangeChange}
                  />
                </View>
                <View style={localStyles.sparklineWrap}>
                  {activeMetric === "players" && (
                    <SparklineScrubbable
                      data={currentPlayerData}
                      width={modalContentWidth}
                      height={64}
                      color={playerLineColor}
                      animated
                      formatValue={formatPlayerCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      metricLabel="players"
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                      {...(comparisonGame
                        ? {
                            dualMode: true,
                            secondaryData: compRangeData.players,
                            secondaryColor: COMPARISON_COLOR,
                            formatSecondaryValue: formatPlayerCount,
                            primaryLabel: game.name,
                            secondaryLabel: comparisonGame.name,
                          }
                        : {})}
                    />
                  )}
                  {activeMetric === "streams" && hasCurrentStream && (
                    <SparklineScrubbable
                      data={currentStreamData}
                      width={modalContentWidth}
                      height={64}
                      color={colors.secondary}
                      animated
                      formatValue={formatStreamCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      metricLabel="streams"
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                      {...(comparisonGame
                        ? {
                            dualMode: true,
                            secondaryData: compRangeData.streams,
                            secondaryColor: COMPARISON_COLOR,
                            formatSecondaryValue: formatStreamCount,
                            primaryLabel: game.name,
                            secondaryLabel: comparisonGame.name,
                          }
                        : {})}
                    />
                  )}
                  {activeMetric === "streams" && !hasCurrentStream && (
                    <SparklineScrubbable
                      data={currentPlayerData}
                      width={modalContentWidth}
                      height={64}
                      color={playerLineColor}
                      animated
                      formatValue={formatPlayerCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      metricLabel="players"
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                      {...(comparisonGame
                        ? {
                            dualMode: true,
                            secondaryData: compRangeData.players,
                            secondaryColor: COMPARISON_COLOR,
                            formatSecondaryValue: formatPlayerCount,
                            primaryLabel: game.name,
                            secondaryLabel: comparisonGame.name,
                          }
                        : {})}
                    />
                  )}
                  {activeMetric === "views" && hasCurrentView && (
                    <SparklineScrubbable
                      data={currentViewData}
                      width={modalContentWidth}
                      height={64}
                      color={VIEWS_COLOR}
                      animated
                      formatValue={formatViewCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      metricLabel="views"
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                      {...(comparisonGame
                        ? {
                            dualMode: true,
                            secondaryData: compRangeData.views,
                            secondaryColor: COMPARISON_COLOR,
                            formatSecondaryValue: formatViewCount,
                            primaryLabel: game.name,
                            secondaryLabel: comparisonGame.name,
                          }
                        : {})}
                    />
                  )}
                  {activeMetric === "views" && !hasCurrentView && (
                    <SparklineScrubbable
                      data={currentPlayerData}
                      width={modalContentWidth}
                      height={64}
                      color={playerLineColor}
                      animated
                      formatValue={formatPlayerCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      metricLabel="players"
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                      {...(comparisonGame
                        ? {
                            dualMode: true,
                            secondaryData: compRangeData.players,
                            secondaryColor: COMPARISON_COLOR,
                            formatSecondaryValue: formatPlayerCount,
                            primaryLabel: game.name,
                            secondaryLabel: comparisonGame.name,
                          }
                        : {})}
                    />
                  )}
                  {activeMetric === "all" && (
                    <SparklineScrubbable
                      data={currentPlayerData}
                      width={modalContentWidth}
                      height={64}
                      color={playerLineColor}
                      animated
                      formatValue={formatPlayerCount}
                      formatTimeLabel={rangeTimeFormatter}
                      events={activeRange === "24h" ? (game.events ?? []) : []}
                      secondaryData={currentStreamData}
                      secondaryColor={colors.secondary}
                      formatSecondaryValue={formatStreamCount}
                      tertiaryData={currentViewData}
                      tertiaryColor={VIEWS_COLOR}
                      formatTertiaryValue={formatViewCount}
                      tripleMode
                      peakWindow={peakWindow}
                      peakLabelFormatter={peakLabelFormatter}
                    />
                  )}
                </View>
                <View style={localStyles.xAxisRow}>
                  {xAxisLabels.map((label) => (
                    <Text key={label} style={localStyles.xAxisLabel}>{label}</Text>
                  ))}
                </View>
                {activeMetric === "all" && (
                  <View style={localStyles.legend}>
                    <View style={localStyles.legendItem}>
                      <View
                        style={[
                          localStyles.legendDot,
                          { backgroundColor: playerLineColor },
                        ]}
                      />
                      <Text style={localStyles.legendText}>Players</Text>
                    </View>
                    <View style={localStyles.legendItem}>
                      <View
                        style={[
                          localStyles.legendDot,
                          { backgroundColor: colors.secondary },
                        ]}
                      />
                      <Text style={localStyles.legendText}>Streams</Text>
                    </View>
                    <View style={localStyles.legendItem}>
                      <View
                        style={[
                          localStyles.legendDot,
                          { backgroundColor: VIEWS_COLOR },
                        ]}
                      />
                      <Text style={localStyles.legendText}>Views</Text>
                    </View>
                  </View>
                )}
                {activeMetric !== "all" && comparisonGame && (
                  <View style={localStyles.comparisonLegend}>
                    <View style={localStyles.legendItem}>
                      <View
                        style={[
                          localStyles.legendDot,
                          {
                            backgroundColor:
                              activeMetric === "players"
                                ? playerLineColor
                                : activeMetric === "streams"
                                  ? colors.secondary
                                  : VIEWS_COLOR,
                          },
                        ]}
                      />
                      <Text style={localStyles.legendText} numberOfLines={1}>
                        {game.name}
                      </Text>
                    </View>
                    <View style={localStyles.legendItem}>
                      <View
                        style={[
                          localStyles.legendDot,
                          { backgroundColor: COMPARISON_COLOR },
                        ]}
                      />
                      <Text style={localStyles.legendText} numberOfLines={1}>
                        {comparisonGame.name}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
            <View style={localStyles.ratingAndBadgeRow}>
              {hasRating ? (
                <Text style={localStyles.rating}>Rating: {game.rating}%</Text>
              ) : (
                <View />
              )}
              <TrendBadge
                direction={trend.direction}
                percentChange={trend.percentChange}
              />
            </View>
            <PeakTimePanel insights={peakInsights} />
            <View style={localStyles.actionRow}>
              <Pressable
                style={localStyles.askButton}
                onPress={() => onAskInChat?.(game)}
                accessibilityRole="button"
                accessibilityLabel="Ask in Chat"
              >
                <Ionicons name="chatbubbles" size={20} color={colors.background} />
                <Text style={localStyles.askButtonText}>Ask in Chat</Text>
              </Pressable>
              <Pressable
                style={localStyles.shareButton}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share"
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            </View>
          </View>
            </AnimatedView>
          </GestureDetector>
      <View
        ref={shareCardRef}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          opacity: 0,
        }}
      >
        <GameShareCard
          game={game}
          peakRegion={sharePeakRegion}
          chartColor={playerLineColor}
        />
      </View>
      <GameComparisonPicker
        visible={pickerVisible}
        currentGameId={game.id}
        onSelect={(g) => {
          setComparisonGame(g);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
        </AnimatedView>
      </GestureHandlerRootView>
    </Modal>
  );
}
