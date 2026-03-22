import axios from 'axios';
import { Platform } from 'react-native';

// Set EXPO_PUBLIC_API_URL in .env. Local: use http://localhost:8000/api for web/same machine.
// Physical device: we auto-detect your PC IP from Metro; or set http://YOUR_PC_IP:8000/api (e.g. 192.168.1.5).
let API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://nexa-pro.up.railway.app/api';

// In dev, physical device/emulator must reach your machine. Prefer Metro host (PC IP).
if (__DEV__ && (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2'))) {
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) API_BASE_URL = `http://${host}:8000/api`;
    }
  } catch (_) {
    // expo-constants unavailable; keep existing API_BASE_URL
  }
}
// Android emulator only: if still localhost, use 10.0.2.2 so emulator can reach host.
if (Platform.OS === 'android' && API_BASE_URL.includes('localhost')) {
  API_BASE_URL = API_BASE_URL.replace(/localhost/g, '10.0.2.2');
}
if (__DEV__) console.log('[NEXA API] Base URL:', API_BASE_URL);

export { API_BASE_URL };
const API_TIMEOUT_MS = 25000;

class GameService {
  // Future backend cache reminder:
  // Any search bar we add later that can trigger recommendation-like queries
  // should reuse this same recommendation cache path instead of creating a
  // separate uncached request flow.
  async getRecommendations(preference, sortBy, filters = {}) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/recommendations`,
        { preference, sort_by: sortBy, filters },
        { timeout: API_TIMEOUT_MS }
      );
      return response.data;
    } catch (error) {
      const msg =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Is the backend running at ' + API_BASE_URL + '?'
          : error.response?.data?.detail ||
            error.response?.data?.error ||
            error.message ||
            'Failed to fetch recommendations';
      if (__DEV__) console.warn('[NEXA API] getRecommendations error:', error.message || error, msg);
      throw new Error(msg);
    }
  }

  // Future backend cache reminder:
  // Search results, search-bar selections, and detail modals should all flow
  // through the same normalized game-detail cache strategy (preferably by
  // internal game ID or normalized title) so we do not refetch the same game
  // repeatedly through different UI entry points.
  async getGameDetails(title) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/game-details`,
        { title },
        { timeout: API_TIMEOUT_MS }
      );
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch game details';
      if (__DEV__) console.warn('[NEXA API] getGameDetails error:', error.message || error);
      throw new Error(msg);
    }
  }

  // Future search-bar reminder:
  // When search UI is added, autocomplete should use short-lived caching by
  // normalized query prefix. Keep it aligned with the broader
  // recommendation/detail caching plan rather than treating search as a
  // standalone uncached feature.
  async igdbAutocomplete(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/igdb-autocomplete`, {
        params: { q: query },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (__DEV__) console.warn('[NEXA API] igdbAutocomplete error:', error.message);
      return [];
    }
  }
}

export const gameService = new GameService();
export default gameService;
