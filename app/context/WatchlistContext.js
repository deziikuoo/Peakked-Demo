import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getWatchlistIds, setWatchlistIds } from '../utils/layoutStorage';
import { deferAfterInteractions } from '../utils/deferAfterInteractions';
import { MOCK_GAMES } from '../data/mock/popularGames';
import { useGameCache } from './GameCacheContext';

/**
 * Watchlist is split into two contexts so consumers can subscribe narrowly:
 * - WatchlistStateContext: watchlist, watchedIds, isWatched, getDisplayWatched (changes when list/toggles change)
 * - WatchlistActionsContext: toggleWatch, clearWatchlist (stable)
 * useWatchlist() returns the combined API for backward compatibility.
 */
const DEBOUNCE_MS = 400;

const WatchlistStateContext = createContext({
  watchlist: [],
  watchedIds: [],
  isWatched: () => false,
  getDisplayWatched: () => false,
});

const WatchlistActionsContext = createContext({
  toggleWatch: () => {},
  clearWatchlist: () => {},
});

export function WatchlistProvider({ children }) {
  const [watchedIds, setWatchedIds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingToggles, setPendingToggles] = useState(() => new Map());
  const { get: cacheGet, set: cacheSet, cacheVersion } = useGameCache();
  const persistTimeoutRef = useRef(null);
  const persistDeferCancelRef = useRef(null);

  useEffect(() => {
    const { cancel } = deferAfterInteractions(() => {
      getWatchlistIds().then((ids) => {
        if (Array.isArray(ids)) setWatchedIds(ids);
        setLoaded(true);
      });
    }, 'WatchlistContext.initialLoad');
    return () => cancel();
  }, []);

  // Reconcile pending toggles when watchedIds catches up (after batch commit)
  useEffect(() => {
    const { cancel } = deferAfterInteractions(() => {
      setPendingToggles((prev) => {
        if (prev.size === 0) return prev;
        const next = new Map(prev);
        let changed = false;
        for (const [id, displayVal] of next.entries()) {
          if (watchedIds.includes(id) === displayVal) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 'WatchlistContext.reconcile');
    return () => cancel();
  }, [watchedIds]);

  // Debounced persistence: one write after user stops toggling
  useEffect(() => {
    if (!loaded) return;
    if (persistTimeoutRef.current != null) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      const { cancel } = deferAfterInteractions(() => {
        setWatchlistIds(watchedIds);
      }, 'WatchlistContext.persist');
      persistDeferCancelRef.current = cancel;
      persistTimeoutRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      persistDeferCancelRef.current?.();
      persistDeferCancelRef.current = null;
      if (persistTimeoutRef.current != null) clearTimeout(persistTimeoutRef.current);
    };
  }, [loaded, watchedIds]);

  const toggleWatch = useCallback((game) => {
    if (!game?.id) return;
    setWatchedIds((prev) => {
      const has = prev.includes(game.id);
      const newDisplayVal = !has; // true = will be in list, false = will be removed
      setPendingToggles((prevPending) => {
        const next = new Map(prevPending);
        next.set(game.id, newDisplayVal);
        return next;
      });
      if (has) return prev.filter((id) => id !== game.id);
      return [...prev, game.id];
    });
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchedIds([]);
    setPendingToggles(new Map());
  }, []);

  const isWatched = useCallback(
    (id) => (id != null ? watchedIds.includes(id) : false),
    [watchedIds]
  );

  const getDisplayWatched = useCallback(
    (id) => (id != null && pendingToggles.has(id) ? pendingToggles.get(id) : isWatched(id)),
    [pendingToggles, isWatched]
  );

  const watchlist = useMemo(() => {
    const result = [];
    for (const id of watchedIds) {
      let game = cacheGet(id);
      if (!game) {
        game = MOCK_GAMES.find((g) => g.id === id) ?? null;
        if (game) cacheSet(game);
      }
      if (game) result.push(game);
    }
    return result;
  }, [watchedIds, cacheVersion, cacheGet, cacheSet]);

  const stateValue = useMemo(
    () => ({
      watchlist,
      watchedIds,
      isWatched,
      getDisplayWatched,
    }),
    [watchlist, watchedIds, isWatched, getDisplayWatched]
  );

  const actionsValue = useMemo(
    () => ({ toggleWatch, clearWatchlist }),
    [toggleWatch, clearWatchlist]
  );

  return (
    <WatchlistActionsContext.Provider value={actionsValue}>
      <WatchlistStateContext.Provider value={stateValue}>
        {children}
      </WatchlistStateContext.Provider>
    </WatchlistActionsContext.Provider>
  );
}

/** Combined API for backward compatibility; use useWatchlistState() or useWatchlistActions() for narrower subscriptions. */
export const useWatchlist = () => ({
  ...useContext(WatchlistStateContext),
  ...useContext(WatchlistActionsContext),
});

export const useWatchlistState = () => useContext(WatchlistStateContext);
export const useWatchlistActions = () => useContext(WatchlistActionsContext);
