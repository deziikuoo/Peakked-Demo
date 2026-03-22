import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "../utils/safeArea";
import { getCompareSlotIds, setCompareSlotIds } from "../utils/layoutStorage";
import { themes } from "../theme/colors";
import {
  formatPlayerCount,
  formatStreamCount,
  formatViewCount,
  getTrend,
  findPeakWindow,
} from "../data/shared/gameFormatters";
import { MOCK_GAMES } from "../data/mock/popularGames";
import { useGameCache } from "../context/GameCacheContext";
import GameSlotPicker from "../components/GameSlotPicker";
import GameComparisonPicker from "../components/GameComparisonPicker";
import CompareChartPanel from "../components/CompareChartPanel";
import GameImage from "../components/GameImage";

const colors = themes.darkNeon;
const SLOT_COLORS = [colors.primary, colors.secondary, colors.success];

const localStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  slotRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  slotWrapper: {
    flex: 1,
    minWidth: 0,
  },
  chartSection: {
    marginBottom: 20,
  },
  tableSection: {
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  table: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
  },
  tableCellWinner: {
    fontWeight: "700",
  },
  tableCellDim: {
    opacity: 0.6,
  },
  winnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  winnerBannerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.15,
  },
  winnerThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  winnerThumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  winnerBody: {
    flex: 1,
  },
  winnerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  winnerLead: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  winnerTrophy: {
    marginLeft: 8,
  },
});

function getRangeData(game, activeRange) {
  if (!game) return null;
  if (activeRange === "7d")
    return game.history7d ?? game.history;
  if (activeRange === "30d")
    return game.history30d ?? game.history;
  return game.history;
}

/** Weighted score: players 40%, streams 30%, views 20%, rating 10%. Normalize by max across games. */
function computeWeightedScores(games) {
  if (!games?.length) return [];
  const maxPlayers = Math.max(...games.map((g) => g.playerCount), 1);
  const maxStreams = Math.max(...games.map((g) => g.streamCount), 1);
  const maxViews = Math.max(...games.map((g) => g.viewCount), 1);
  const maxRating = Math.max(...games.map((g) => g.rating ?? 0), 1);
  return games.map((g) => {
    const p = (g.playerCount / maxPlayers) * 40;
    const s = (g.streamCount / maxStreams) * 30;
    const v = (g.viewCount / maxViews) * 20;
    const r = ((g.rating ?? 0) / maxRating) * 10;
    return p + s + v + r;
  });
}

function getWinnerIndex(games) {
  const scores = computeWeightedScores(games);
  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[best]) best = i;
  }
  const total = scores.reduce((a, b) => a + b, 0);
  const lead = total > 0 ? ((scores[best] - Math.max(...scores.filter((_, i) => i !== best)) || 0) / total) * 100 : 0;
  return { index: best, leadPercent: Math.round(lead) };
}

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const [slots, setSlots] = useState([null, null, null]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState(0);
  const [activeMetric, setActiveMetric] = useState("players");
  const [activeRange, setActiveRange] = useState("24h");
  const { get: cacheGet, set: cacheSet } = useGameCache();

  const games = slots.filter(Boolean);
  const excludeIds = games.map((g) => g.id);

  useEffect(() => {
    getCompareSlotIds().then((ids) => {
      if (!ids?.length) return;
      const resolved = ids.map((id) => {
        let game = cacheGet(id);
        if (!game) {
          game = MOCK_GAMES.find((g) => g.id === id) ?? null;
          if (game) cacheSet(game);
        }
        return game;
      });
      setSlots([resolved[0] ?? null, resolved[1] ?? null, resolved[2] ?? null]);
    });
  }, [cacheGet, cacheSet]);

  const persistSlots = useCallback((newSlots) => {
    const ids = newSlots.filter(Boolean).map((g) => g.id);
    setCompareSlotIds(ids);
  }, []);

  const handleAddSlot = (slotIndex) => {
    setTargetSlotIndex(slotIndex);
    setPickerVisible(true);
  };

  const handleRemoveSlot = (slotIndex) => {
    const next = [...slots];
    next[slotIndex] = null;
    setSlots(next);
    persistSlots(next);
  };

  const handlePickerSelect = (game) => {
    const next = [...slots];
    next[targetSlotIndex] = game;
    setSlots(next);
    setPickerVisible(false);
    persistSlots(next);
  };

  const winnerInfo = games.length >= 2 ? getWinnerIndex(games) : null;
  const winnerGame = winnerInfo ? games[winnerInfo.index] : null;
  const winnerColor = winnerInfo != null ? SLOT_COLORS[winnerInfo.index] : colors.primary;

  const row0 = useSharedValue(0);
  const row1 = useSharedValue(0);
  const row2 = useSharedValue(0);
  const row3 = useSharedValue(0);
  const row4 = useSharedValue(0);
  const rowOpacities = [row0, row1, row2, row3, row4];
  useEffect(() => {
    if (games.length < 2) return;
    rowOpacities.forEach((r) => (r.value = 0));
    row0.value = withDelay(0, withTiming(1, { duration: 220 }));
    row1.value = withDelay(60, withTiming(1, { duration: 220 }));
    row2.value = withDelay(120, withTiming(1, { duration: 220 }));
    row3.value = withDelay(180, withTiming(1, { duration: 220 }));
    row4.value = withDelay(240, withTiming(1, { duration: 220 }));
  }, [games.length, row0, row1, row2, row3, row4]);
  const row0Style = useAnimatedStyle(() => ({ opacity: row0.value }));
  const row1Style = useAnimatedStyle(() => ({ opacity: row1.value }));
  const row2Style = useAnimatedStyle(() => ({ opacity: row2.value }));
  const row3Style = useAnimatedStyle(() => ({ opacity: row3.value }));
  const row4Style = useAnimatedStyle(() => ({ opacity: row4.value }));
  const rowStyles = [row0Style, row1Style, row2Style, row3Style, row4Style];

  const addButtonLabel = games.length >= 3 ? "Full" : "+ Add";

  return (
    <View style={[localStyles.screen, { paddingTop: insets.top }]}>
      <View style={localStyles.header}>
        <Text style={localStyles.title}>Compare</Text>
        <Pressable
          style={localStyles.addButton}
          onPress={() => {
            const firstEmpty = slots.findIndex((s) => s == null);
            handleAddSlot(firstEmpty >= 0 ? firstEmpty : 0);
          }}
          disabled={games.length >= 3}
          accessibilityLabel="Add game to compare"
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={localStyles.addButtonText}>{addButtonLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={localStyles.slotRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={localStyles.slotWrapper}>
              <GameSlotPicker
                slotIndex={i}
                game={slots[i]}
                onAdd={handleAddSlot}
                onRemove={handleRemoveSlot}
              />
            </View>
          ))}
        </View>

        <View style={localStyles.chartSection}>
          <CompareChartPanel
            games={games}
            activeMetric={activeMetric}
            activeRange={activeRange}
            onMetricChange={setActiveMetric}
            onRangeChange={setActiveRange}
          />
        </View>

        {games.length >= 2 && (
          <View style={localStyles.tableSection}>
            <Text style={localStyles.tableTitle}>Stats</Text>
            <View style={localStyles.table}>
              {[
                {
                  label: "Players",
                  getVal: (g) => formatPlayerCount(g.playerCount),
                  getWinner: (g) => games.every((x) => x.playerCount <= g.playerCount),
                },
                {
                  label: "Streams",
                  getVal: (g) => formatStreamCount(g.streamCount),
                  getWinner: (g) => games.every((x) => x.streamCount <= g.streamCount),
                },
                {
                  label: "Views",
                  getVal: (g) => formatViewCount(g.viewCount),
                  getWinner: (g) => games.every((x) => x.viewCount <= g.viewCount),
                },
                {
                  label: "Rating",
                  getVal: (g) => (g.rating != null ? `${g.rating}%` : "—"),
                  getWinner: (g) => games.every((x) => (x.rating ?? 0) <= (g.rating ?? 0)),
                },
                {
                  label: "Peak",
                  getVal: (g) => {
                    const hist = getRangeData(g, activeRange);
                    const pw = hist ? findPeakWindow(hist) : null;
                    if (!pw) return "—";
                    return `${formatPlayerCount(pw.avgCount)} avg`;
                  },
                  getWinner: (g) => {
                    const hist = getRangeData(g, activeRange);
                    const pw = hist ? findPeakWindow(hist) : null;
                    if (!pw) return false;
                    return games.every((x) => {
                      const xh = getRangeData(x, activeRange);
                      const xp = xh ? findPeakWindow(xh) : null;
                      return !xp || pw.avgCount >= xp.avgCount;
                    });
                  },
                },
              ].map((row, rowIndex) => (
                <AnimatedView
                  key={row.label}
                  style={[
                    localStyles.tableRow,
                    rowIndex === 4 && localStyles.tableRowLast,
                    rowStyles[rowIndex],
                  ]}
                >
                  <Text style={localStyles.tableLabel}>{row.label}</Text>
                  {games.map((g, gi) => {
                    const isWinner = row.getWinner(g);
                    return (
                      <View key={g.id} style={{ flex: 1 }}>
                        <Text
                          style={[
                            localStyles.tableCell,
                            isWinner && [
                              localStyles.tableCellWinner,
                              { color: SLOT_COLORS[gi] },
                            ],
                            !isWinner && localStyles.tableCellDim,
                          ]}
                          numberOfLines={1}
                        >
                          {row.getVal(g)}
                        </Text>
                      </View>
                    );
                  })}
                </AnimatedView>
              ))}
            </View>
          </View>
        )}

        {winnerGame && games.length >= 2 && (
          <View
            style={[
              localStyles.winnerBanner,
              {
                borderColor: winnerColor,
                backgroundColor: `${winnerColor}18`,
              },
            ]}
          >
            <View
              style={[localStyles.winnerBannerGradient, { backgroundColor: winnerColor }]}
            />
            <View style={localStyles.winnerThumb}>
              <GameImage
                source={{ uri: winnerGame.thumbnail }}
                style={localStyles.winnerThumbImage}
              />
            </View>
            <View style={localStyles.winnerBody}>
              <Text style={localStyles.winnerLabel}>Who's winning?</Text>
              <Text style={localStyles.winnerName} numberOfLines={1}>
                {winnerGame.name}
              </Text>
              <Text style={[localStyles.winnerLead, { color: winnerColor }]}>
                Leading by {winnerInfo.leadPercent}%
              </Text>
            </View>
            <View style={localStyles.winnerTrophy}>
              <Ionicons name="trophy" size={28} color={winnerColor} />
            </View>
          </View>
        )}
      </ScrollView>

      <GameComparisonPicker
        visible={pickerVisible}
        excludeIds={excludeIds}
        onSelect={handlePickerSelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
