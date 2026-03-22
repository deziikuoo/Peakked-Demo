/**
 * Layout preference storage for web. Uses localStorage only.
 * Native uses layoutStorage.native.js (AsyncStorage).
 */
const KEY = 'gameTrend_popularLayout';
const COMPARE_KEY = 'gameTrend_compareSlots';
const WATCHLIST_KEY = 'gameTrend_watchlist';

function getItem(key) {
  if (typeof window === 'undefined' || !window.localStorage) return Promise.resolve(null);
  return Promise.resolve(window.localStorage.getItem(key));
}

function setItem(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
  return Promise.resolve();
}

export function getLayoutPreference() {
  return getItem(KEY);
}

export function setLayoutPreference(value) {
  return setItem(KEY, value);
}

/** Compare tab: load saved slot game ids [id1, id2, id3] (max 3). */
export function getCompareSlotIds() {
  return getItem(COMPARE_KEY).then((raw) => {
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 3) : null;
    } catch {
      return null;
    }
  });
}

/** Compare tab: persist slot game ids. */
export function setCompareSlotIds(ids) {
  const value = Array.isArray(ids) ? JSON.stringify(ids.slice(0, 3)) : '[]';
  return setItem(COMPARE_KEY, value);
}

/** Watchlist: load saved game ids. */
export function getWatchlistIds() {
  return getItem(WATCHLIST_KEY).then((raw) => {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
}

/** Watchlist: persist game ids. */
export function setWatchlistIds(ids) {
  const value = Array.isArray(ids) ? JSON.stringify(ids) : '[]';
  return setItem(WATCHLIST_KEY, value);
}
