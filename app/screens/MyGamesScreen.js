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
  Modal,
} from "react-native";
import { deferAfterInteractions } from "../utils/deferAfterInteractions";
import { prefetchRemoteImagesCacheFirst } from "../utils/prefetchRemoteImagesCacheFirst";
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
  emptyTextHeart: {
    color: colors.primary,
    fontWeight: "600",
  },
  /** Remove-all confirmation */
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  confirmBody: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 22,
  },
  confirmActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
  },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnCancel: {
    backgroundColor: colors.border + "55",
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmBtnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  confirmBtnDanger: {
    backgroundColor: colors.error + "22",
    borderWidth: 1,
    borderColor: colors.error + "88",
  },
  confirmBtnDangerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
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
          <Ionicons name="heart-outline" size={64} color={colors.primary} />
        </AnimatedView>
      </View>
      <Text style={localStyles.emptyText}>
        No games watched yet.{"\n"}Tap{" "}
        <Text style={localStyles.emptyTextHeart}>♡</Text>
        {" "}
        on any game to add it here.
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
      prefetchRemoteImagesCacheFirst(urls);
    }, "MyGamesScreen.prefetchThumbnails");
    return () => cancel();
  }, [watchlist]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [removeAllModalVisible, setRemoveAllModalVisible] = useState(false);

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

  const closeRemoveAllModal = useCallback(() => {
    setRemoveAllModalVisible(false);
  }, []);

  const openRemoveAllModal = useCallback(() => {
    setRemoveAllModalVisible(true);
  }, []);

  const confirmRemoveAllFavorites = useCallback(() => {
    clearWatchlist();
    setIsEditMode(false);
    setRemoveAllModalVisible(false);
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
              onPress={openRemoveAllModal}
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
        scrollEnabled={watchlist.length > 0}
        bounces={watchlist.length > 0}
        alwaysBounceVertical={false}
        contentContainerStyle={
          watchlist.length === 0 ? { flexGrow: 1 } : localStyles.listContent
        }
      />
      <GameDetailModal
        visible={detailVisible}
        game={selectedGame}
        onClose={closeDetail}
        onAskInChat={askInChat}
      />

      <Modal
        visible={removeAllModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRemoveAllModal}
        statusBarTranslucent
      >
        <Pressable
          style={localStyles.confirmOverlay}
          onPress={closeRemoveAllModal}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        >
          <Pressable
            style={localStyles.confirmCard}
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal
            accessibilityRole="none"
          >
            <Text style={localStyles.confirmTitle}>Remove all favorites?</Text>
            <Text style={localStyles.confirmBody}>
              Are you sure you want to remove all{" "}
              {watchlist.length === 1
                ? "favorited game"
                : `${watchlist.length} favorited games`}{" "}
              from My Games? This can’t be undone.
            </Text>
            <View style={localStyles.confirmActions}>
              <Pressable
                style={[localStyles.confirmBtn, localStyles.confirmBtnCancel]}
                onPress={closeRemoveAllModal}
                accessibilityRole="button"
                accessibilityLabel="Cancel, keep all games"
              >
                <Text style={localStyles.confirmBtnCancelText}>No, keep them</Text>
              </Pressable>
              <Pressable
                style={[localStyles.confirmBtn, localStyles.confirmBtnDanger]}
                onPress={confirmRemoveAllFavorites}
                accessibilityRole="button"
                accessibilityLabel="Yes, remove all favorited games"
              >
                <Text style={localStyles.confirmBtnDangerText}>Remove all</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
