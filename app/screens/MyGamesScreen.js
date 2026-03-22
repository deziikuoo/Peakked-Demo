/**
 * List entrance and empty-state animations use Reanimated for UI-thread performance.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { deferAfterInteractions } from "../utils/deferAfterInteractions";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "../utils/safeArea";
import { themes } from "../theme/colors";
import { useWatchlist } from "../context/WatchlistContext";
import WatchlistCard from "../components/WatchlistCard";
import GameDetailModal from "../components/GameDetailModal";

const colors = themes.darkNeon;

const STAGGER_MS = 60;

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  count: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.border + '40',
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  headerBtnDanger: {
    backgroundColor: colors.error + '30',
  },
  headerBtnDangerText: {
    color: colors.error,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyHeartWrap: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});

function EmptyState() {
  const pulse = useSharedValue(0.6);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.5, { duration: 700 })
      ),
      -1
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View style={localStyles.emptyWrap}>
      <View style={localStyles.emptyHeartWrap}>
        <AnimatedView style={pulseStyle}>
          <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
        </AnimatedView>
      </View>
      <Text style={localStyles.emptyText}>
        No games watched yet.{"\n"}Tap ♡ on any game to add it here.
      </Text>
    </View>
  );
}

const CardWithEntrance = React.memo(function CardWithEntrance({ game, index, onPress, showHeart }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const mountIndexRef = useRef(index);
  useEffect(() => {
    const delay = mountIndexRef.current * STAGGER_MS;
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 280 }));
  }, [opacity, translateY]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <AnimatedView style={entranceStyle}>
      <WatchlistCard game={game} onPress={onPress} index={index} showHeart={showHeart} />
    </AnimatedView>
  );
});

export default function MyGamesScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, clearWatchlist } = useWatchlist();
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (watchlist.length === 0) return;
    const urls = watchlist.slice(0, 15).map((g) => g.thumbnail).filter(Boolean);
    if (urls.length === 0) return;
    const { cancel } = deferAfterInteractions(() => {
      Image.prefetch(urls);
    }, "MyGamesScreen.prefetchThumbnails");
    return () => cancel();
  }, [watchlist]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const openDetail = useCallback((game) => {
    setSelectedGame(game);
    setDetailVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedGame(null);
  }, []);

  const askInChat = useCallback(
    (game) => {
      setDetailVisible(false);
      setSelectedGame(null);
      // In a real app would navigate to Chat with game context
    },
    []
  );

  const handleRemoveAll = useCallback(() => {
    clearWatchlist();
    setIsEditMode(false);
  }, [clearWatchlist]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <CardWithEntrance
        game={item}
        index={index}
        onPress={openDetail}
        showHeart={isEditMode}
      />
    ),
    [openDetail, isEditMode]
  );

  const listEmpty = useCallback(() => <EmptyState />, []);

  return (
    <View style={[localStyles.screen, { paddingTop: insets.top }]}>
      <View style={localStyles.header}>
        <View style={localStyles.headerLeft}>
          <Text style={localStyles.title}>MY GAMES</Text>
          <Text style={localStyles.count}>
            {`favorited: ${watchlist.length}`}
          </Text>
        </View>
        <View style={localStyles.headerLeft}>
          {watchlist.length > 0 && (
            <Pressable
              style={localStyles.headerBtn}
              onPress={() => setIsEditMode((e) => !e)}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Done editing" : "Edit"}
            >
              <Text style={localStyles.headerBtnText}>
                {isEditMode ? "Done" : "Edit"}
              </Text>
            </Pressable>
          )}
          {watchlist.length > 0 && isEditMode && (
            <Pressable
              style={[localStyles.headerBtn, localStyles.headerBtnDanger]}
              onPress={handleRemoveAll}
              accessibilityRole="button"
              accessibilityLabel="Remove all games"
            >
              <Text style={[localStyles.headerBtnText, localStyles.headerBtnDangerText]}>
                Remove all
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        extraData={watchlist.length}
        contentContainerStyle={
          watchlist.length === 0 ? { flex: 1 } : localStyles.listContent
        }
      />
      <GameDetailModal
        visible={detailVisible}
        game={selectedGame}
        onClose={closeDetail}
        onAskInChat={askInChat}
      />
    </View>
  );
}
