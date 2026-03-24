import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  SectionList,
  Pressable,
  Modal,
} from 'react-native';
import { deferAfterInteractions } from '../utils/deferAfterInteractions';
import { prefetchRemoteImagesCacheFirst } from '../utils/prefetchRemoteImagesCacheFirst';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedView } from '../utils/animatedViews';
import { Ionicons } from '@expo/vector-icons';
import { getLayoutPreference, setLayoutPreference } from '../utils/layoutStorage';
import { useSafeAreaInsets } from '../utils/safeArea';
import { createThemedStyles } from '../theme/styles';
import { themes } from '../theme/colors';
import { MOCK_GAMES, getMockGamesRefreshed } from '../data/mock/popularGames';
import { getGameListThumbnailUri } from '../data/shared/gameFormatters';
import { getTrendingGames } from '../data/real/popularGamesApi';
import { DEMO_MODE } from '../config/demoMode';
import { useGameCache } from '../context/GameCacheContext';
import GameHeroCard from '../components/GameHeroCard';
import GameRowCard from '../components/GameRowCard';
import GameGridCard from '../components/GameGridCard';
import GameDetailModal from '../components/GameDetailModal';
import GenreFilterBar from '../components/GenreFilterBar';

const colors = themes.darkNeon;
const styles = createThemedStyles(colors);

const LAYOUT_KEY = {
  heroList: 'heroList',
  verticalList: 'verticalList',
  cardGrid: 'cardGrid',
  sectioned: 'sectioned',
};
const LAYOUT_OPTIONS = [
  { key: LAYOUT_KEY.heroList, label: 'Hero + list', icon: 'star' },
  { key: LAYOUT_KEY.verticalList, label: 'Vertical list', icon: 'list' },
  { key: LAYOUT_KEY.cardGrid, label: 'Card grid', icon: 'grid' },
  { key: LAYOUT_KEY.sectioned, label: 'Sectioned', icon: 'layers' },
];

let bootListAnimationDone = false;
const INITIAL_ANIMATION_MS = 900;
const INITIAL_NUM_TO_RENDER = 10;
const MAX_TO_RENDER_PER_BATCH = 10;
const WINDOW_SIZE = 6;
// Prevent recycled rows from losing expo-image surfaces during fast scroll on some devices.
const REMOVE_CLIPPED_SUBVIEWS = false;

const localStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  layoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionFirst: {
    marginTop: 8,
  },
  layoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  layoutModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  layoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  layoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  layoutOptionActive: {
    backgroundColor: colors.background,
  },
  layoutOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  columnWrapper: {
    paddingHorizontal: 12,
  },
  gridCell: {
    flex: 1,
  },
});

export default function PopularScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { get, setMany, cacheVersion } = useGameCache();
  const [popularIds, setPopularIds] = useState(() => MOCK_GAMES.map((g) => g.id));
  const [layout, setLayout] = useState(LAYOUT_KEY.heroList);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [allowListAnimation, setAllowListAnimation] = useState(!bootListAnimationDone);
  const listRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const listOpacity = useSharedValue(1);
  const listOpacityStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const games = useMemo(
    () => popularIds.map((id) => get(id)).filter(Boolean),
    [popularIds, cacheVersion, get]
  );

  useEffect(() => {
    setMany(MOCK_GAMES);
  }, [setMany]);

  useEffect(() => {
    let cancelled = false;
    getTrendingGames()
      .then((games) => {
        if (cancelled || !Array.isArray(games) || games.length === 0) return;
        setMany(games);
        setPopularIds(games.map((g) => g.id));
      })
      .catch(() => {
        if (!cancelled) {
          setMany(MOCK_GAMES);
          setPopularIds(MOCK_GAMES.map((g) => g.id));
        }
      })
      .finally(() => {});
    return () => { cancelled = true; };
  }, [setMany]);

  useEffect(() => {
    if (games.length === 0) return;
    const urls = [
      ...new Set(
        games.slice(0, 15).flatMap((g) => {
          const list = getGameListThumbnailUri(g);
          const hero = g.thumbnail;
          return [list, hero].filter(Boolean);
        })
      ),
    ];
    if (urls.length === 0) return;
    const { cancel } = deferAfterInteractions(() => {
      prefetchRemoteImagesCacheFirst(urls);
    }, 'PopularScreen.prefetchThumbnails');
    return () => cancel();
  }, [games]);

  const filteredGames = useMemo(
    () =>
      selectedGenres.length === 0
        ? games
        : games.filter((g) => g.genre && selectedGenres.includes(g.genre)),
    [games, selectedGenres]
  );

  const sectionData = useMemo(() => {
    const byPlayers = [...filteredGames].sort((a, b) => b.playerCount - a.playerCount);
    const byStreams = [...filteredGames].sort((a, b) => b.streamCount - a.streamCount);
    return {
      sections: [
        { title: 'Top by players', data: byPlayers.map((g) => ({ ...g, _sid: 'players' })), key: 'players' },
        { title: 'Top by streams', data: byStreams.map((g) => ({ ...g, _sid: 'streams' })), key: 'streams' },
      ],
    };
  }, [filteredGames]);

  const genres = useMemo(() => {
    const byGenre = {};
    games.forEach((g) => {
      if (g.genre) byGenre[g.genre] = (byGenre[g.genre] || 0) + 1;
    });
    return Object.entries(byGenre)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [games]);

  useEffect(() => {
    const { cancel } = deferAfterInteractions(() => {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      listOpacity.value = withSequence(
        withTiming(0.4, { duration: 75 }),
        withTiming(1, { duration: 75 })
      );
    }, 'PopularScreen.genreChange');
    return () => cancel();
  }, [selectedGenres, listOpacity]);

  useEffect(() => {
    if (bootListAnimationDone) return;
    const t = setTimeout(() => {
      bootListAnimationDone = true;
      setAllowListAnimation(false);
    }, INITIAL_ANIMATION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const { cancel } = deferAfterInteractions(() => {
      getLayoutPreference().then((stored) => {
        if (stored && LAYOUT_OPTIONS.some((o) => o.key === stored)) {
          setLayout(stored);
        }
      });
    }, 'PopularScreen.layoutPreference');
    return () => cancel();
  }, []);

  const onRefresh = useCallback(() => {
    if (refreshTimeoutRef.current != null) clearTimeout(refreshTimeoutRef.current);
    setRefreshing(true);
    getTrendingGames()
      .then((games) => {
        if (Array.isArray(games) && games.length > 0) {
          setMany(games);
          setPopularIds(games.map((g) => g.id));
        } else {
          const fresh = getMockGamesRefreshed();
          setMany(fresh);
          setPopularIds(fresh.map((g) => g.id));
        }
      })
      .catch(() => {
        const fresh = getMockGamesRefreshed();
        setMany(fresh);
        setPopularIds(fresh.map((g) => g.id));
      })
      .finally(() => {
        refreshTimeoutRef.current = setTimeout(() => {
          setRefreshing(false);
          refreshTimeoutRef.current = null;
        }, 300);
      });
  }, [setMany]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current != null) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    };
  }, []);

  const onLayoutSelect = useCallback((key) => {
    setLayout(key);
    setLayoutPreference(key);
    setLayoutModalVisible(false);
  }, []);

  const openDetail = useCallback((game) => {
    setSelectedGame(game);
    setDetailModalVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedGame(null);
  }, []);

  const askInChat = useCallback(
    (game) => {
      setDetailModalVisible(false);
      setSelectedGame(null);
      navigation.navigate('Chat', { gameName: game.name });
    },
    [navigation]
  );

  const onToggleGenre = useCallback((label) => {
    setSelectedGenres((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }, []);

  const onClearFilters = useCallback(() => {
    setSelectedGenres([]);
  }, []);

  const keyExtractor = useCallback((item) => item.id, []);
  const sectionKeyExtractor = useCallback((item) => `${item.id}-${item._sid}`, []);

  const renderSectionHeader = useCallback(
    ({ section }) => (
      <Text
        style={[localStyles.sectionHeader, section.key === 'players' && localStyles.sectionFirst]}
      >
        {section.title}
      </Text>
    ),
    []
  );

  const renderHeroRowItem = useCallback(
    ({ item, index }) => (
      <GameRowCard
        game={item}
        onPress={openDetail}
        index={index + 1}
        animateSparkline={allowListAnimation}
      />
    ),
    [openDetail, allowListAnimation]
  );

  const renderRowItem = useCallback(
    ({ item, index }) => (
      <GameRowCard
        game={item}
        onPress={openDetail}
        index={index}
        animateSparkline={allowListAnimation}
      />
    ),
    [openDetail, allowListAnimation]
  );

  const renderGridItem = useCallback(
    ({ item, index }) => (
      <View style={localStyles.gridCell}>
        <GameGridCard
          game={item}
          onPress={openDetail}
          index={index}
          animateSparkline={allowListAnimation}
        />
      </View>
    ),
    [openDetail, allowListAnimation]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
    ),
    [refreshing, onRefresh]
  );

  const renderHeroList = () => {
    const [hero, ...rest] = filteredGames;
    return (
      <FlatList
        ref={listRef}
        key="heroList"
        data={rest}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          hero ? (
            <GameHeroCard game={hero} onPress={openDetail} animateSparkline={allowListAnimation} />
          ) : null
        }
        contentContainerStyle={localStyles.scrollContent}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
        refreshControl={refreshControl}
        renderItem={renderHeroRowItem}
      />
    );
  };

  const renderVerticalList = () => (
    <FlatList
      ref={listRef}
      key="verticalList"
      data={filteredGames}
      keyExtractor={keyExtractor}
      contentContainerStyle={localStyles.scrollContent}
      initialNumToRender={INITIAL_NUM_TO_RENDER}
      maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
      windowSize={WINDOW_SIZE}
      removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
      refreshControl={refreshControl}
      renderItem={renderRowItem}
    />
  );

  const renderCardGrid = () => (
    <FlatList
      ref={listRef}
      key="cardGrid"
      data={filteredGames}
      keyExtractor={keyExtractor}
      numColumns={2}
      contentContainerStyle={localStyles.scrollContent}
      columnWrapperStyle={localStyles.columnWrapper}
      initialNumToRender={INITIAL_NUM_TO_RENDER}
      maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
      windowSize={WINDOW_SIZE}
      removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
      refreshControl={refreshControl}
      renderItem={renderGridItem}
    />
  );

  const renderSectioned = () => (
    <SectionList
      ref={listRef}
      key="sectioned"
      sections={sectionData.sections}
      keyExtractor={sectionKeyExtractor}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={localStyles.scrollContent}
      initialNumToRender={INITIAL_NUM_TO_RENDER}
      maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
      windowSize={WINDOW_SIZE}
      removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
      refreshControl={refreshControl}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderRowItem}
    />
  );

  const renderContent = () => {
    switch (layout) {
      case LAYOUT_KEY.verticalList:
        return renderVerticalList();
      case LAYOUT_KEY.cardGrid:
        return renderCardGrid();
      case LAYOUT_KEY.sectioned:
        return renderSectioned();
      default:
        return renderHeroList();
    }
  };

  return (
    <View style={[localStyles.screen, { paddingTop: insets.top }]}>
      <View style={localStyles.header}>
        <View style={localStyles.headerLeft}>
          <Text style={localStyles.title}>Popular games</Text>
          <Text style={localStyles.subtitle}>
            {DEMO_MODE
              ? 'Demo data · Steam-style headers & realistic sparklines (offline)'
              : 'Live players, streams, and ratings'}
          </Text>
        </View>
        <Pressable
          style={localStyles.layoutButton}
          onPress={() => setLayoutModalVisible(true)}
          accessibilityLabel="Change layout"
          accessibilityRole="button"
        >
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <GenreFilterBar
        genres={genres}
        selectedGenres={selectedGenres}
        onToggleGenre={onToggleGenre}
        onClear={onClearFilters}
      />

      {filteredGames.length === 0 ? (
        <View style={localStyles.emptyState}>
          <Text style={localStyles.emptyStateText}>
            {selectedGenres.length === 0
              ? 'No games found.'
              : 'No games match the selected genres.'}
          </Text>
        </View>
      ) : (
        <AnimatedView style={[{ flex: 1 }, listOpacityStyle]}>
          {renderContent()}
        </AnimatedView>
      )}

      <Modal visible={layoutModalVisible} transparent animationType="fade">
        <Pressable style={localStyles.layoutModalOverlay} onPress={() => setLayoutModalVisible(false)}>
          <Pressable style={localStyles.layoutModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={localStyles.layoutModalTitle}>Layout</Text>
            {LAYOUT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[localStyles.layoutOption, layout === opt.key && localStyles.layoutOptionActive]}
                onPress={() => onLayoutSelect(opt.key)}
              >
                <Ionicons name={opt.icon} size={22} color={layout === opt.key ? colors.primary : colors.textSecondary} />
                <Text style={localStyles.layoutOptionText}>{opt.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <GameDetailModal
        visible={detailModalVisible}
        game={selectedGame}
        onClose={closeDetail}
        onAskInChat={askInChat}
      />
    </View>
  );
}
