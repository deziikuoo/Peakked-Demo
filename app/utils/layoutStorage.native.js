/**
 * Layout preference storage for iOS/Android. Uses expo-secure-store
 * so it works in Expo Go (no AsyncStorage native module needed).
 * Web uses layoutStorage.js (localStorage).
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'gameTrend_popularLayout';
const COMPARE_KEY = 'gameTrend_compareSlots';
const WATCHLIST_KEY = 'gameTrend_watchlist';

export function getLayoutPreference() {
  return SecureStore.getItemAsync(KEY);
}

export function setLayoutPreference(value) {
  return SecureStore.setItemAsync(KEY, value);
}

/** Compare tab: load saved slot game ids [id1, id2, id3] (max 3). */
export async function getCompareSlotIds() {
  const raw = await SecureStore.getItemAsync(COMPARE_KEY);
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, 3) : null;
  } catch {
    return null;
  }
}

/** Compare tab: persist slot game ids. */
export function setCompareSlotIds(ids) {
  const value = Array.isArray(ids) ? JSON.stringify(ids.slice(0, 3)) : '[]';
  return SecureStore.setItemAsync(COMPARE_KEY, value);
}

/** Watchlist: load saved game ids. */
export async function getWatchlistIds() {
  const raw = await SecureStore.getItemAsync(WATCHLIST_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Watchlist: persist game ids. */
export function setWatchlistIds(ids) {
  const value = Array.isArray(ids) ? JSON.stringify(ids) : '[]';
  return SecureStore.setItemAsync(WATCHLIST_KEY, value);
}
