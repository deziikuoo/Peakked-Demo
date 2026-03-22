import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

/**
 * Shared normalized game cache keyed by game.id. Popular, My Games, and detail
 * modals use this so the same game is a single reference. TTL and max-size
 * eviction prevent unbounded growth; lazy eviction on set/setMany only (no timers).
 */
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 400;

const GameCacheContext = createContext(null);

function evictExpired(cache) {
  const now = Date.now();
  for (const [id, ent] of cache.entries()) {
    if (ent.expiresAt <= now) cache.delete(id);
  }
}

function evictToMaxSize(cache, maxSize) {
  if (cache.size <= maxSize) return;
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  let toDelete = cache.size - maxSize;
  for (const [id] of entries) {
    if (toDelete <= 0) break;
    cache.delete(id);
    toDelete--;
  }
}

export function GameCacheProvider({ children }) {
  const cacheRef = useRef(new Map()); // id -> { game, expiresAt }
  const [cacheVersion, setCacheVersion] = useState(0);

  const get = useCallback((id) => {
    const cache = cacheRef.current;
    const ent = cache.get(id);
    if (!ent) return undefined;
    if (ent.expiresAt <= Date.now()) {
      cache.delete(id);
      return undefined;
    }
    return ent.game;
  }, []);

  const set = useCallback((game) => {
    if (!game?.id) return;
    const cache = cacheRef.current;
    const now = Date.now();
    cache.set(game.id, { game, expiresAt: now + CACHE_TTL_MS });
    evictExpired(cache);
    evictToMaxSize(cache, CACHE_MAX_SIZE);
    setCacheVersion((v) => v + 1);
  }, []);

  const setMany = useCallback((games) => {
    if (!Array.isArray(games)) return;
    const cache = cacheRef.current;
    const now = Date.now();
    for (const game of games) {
      if (game?.id) cache.set(game.id, { game, expiresAt: now + CACHE_TTL_MS });
    }
    evictExpired(cache);
    evictToMaxSize(cache, CACHE_MAX_SIZE);
    setCacheVersion((v) => v + 1);
  }, []);

  const getMany = useCallback((ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => get(id)).filter(Boolean);
  }, [get]);

  const value = useMemo(
    () => ({ get, set, setMany, getMany, cacheVersion }),
    [get, set, setMany, getMany, cacheVersion]
  );

  return (
    <GameCacheContext.Provider value={value}>
      {children}
    </GameCacheContext.Provider>
  );
}

export function useGameCache() {
  const ctx = useContext(GameCacheContext);
  if (ctx == null) throw new Error('useGameCache must be used within GameCacheProvider');
  return ctx;
}
