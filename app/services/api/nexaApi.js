import axios from 'axios';
import { Platform } from 'react-native';
import { DEMO_MODE } from '../../config/demoMode';
import {
  demoNetworkDelay,
  getDemoRecommendations,
  getDemoGameDetails,
  getDemoIgdbAutocomplete,
} from '../../data/mock/nexaDemoData';

// Live API base (ignored when DEMO_MODE is true). Set EXPO_PUBLIC_API_URL in .env.
let API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://nexa-pro.up.railway.app/api';

if (
  __DEV__ &&
  !DEMO_MODE &&
  (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2'))
) {
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
if (Platform.OS === 'android' && !DEMO_MODE && API_BASE_URL.includes('localhost')) {
  API_BASE_URL = API_BASE_URL.replace(/localhost/g, '10.0.2.2');
}

if (__DEV__) {
  if (DEMO_MODE) {
    console.log('[GameTrend] Demo mode ON — no requests to', API_BASE_URL);
  } else {
    console.log('[NEXA API] Base URL:', API_BASE_URL);
  }
}

export { API_BASE_URL };
const API_TIMEOUT_MS = 25000;

class GameService {
  async getRecommendations(preference, sortBy, filters = {}) {
    if (DEMO_MODE) {
      await demoNetworkDelay(340);
      return getDemoRecommendations(preference, sortBy, filters);
    }
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

  async getGameDetails(title) {
    if (DEMO_MODE) {
      await demoNetworkDelay(260);
      return getDemoGameDetails(title);
    }
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

  async igdbAutocomplete(query) {
    if (DEMO_MODE) {
      await demoNetworkDelay(120);
      return getDemoIgdbAutocomplete(query);
    }
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
