import axios from 'axios';
import { Platform } from 'react-native';
import { DEMO_MODE } from '../../config/demoMode';
import {
  demoNetworkDelay,
  getDemoRecommendations,
  getDemoGameDetails,
  getDemoIgdbAutocomplete,
} from '../../data/mock/nexaDemoData';

/** True for 10.x, 192.168.x, 172.16–31.x, 127.x — not tunnel/ngrok hostnames. */
function isPrivateLanIpHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const h = hostname.trim().toLowerCase();
  if (h.endsWith('.exp.direct') || h.includes('ngrok') || h.includes('ngrok-free')) {
    return false;
  }
  const parts = h.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

// Live API base (ignored when DEMO_MODE is true). Set EXPO_PUBLIC_API_URL in .env.
let API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://nexa-pro.up.railway.app/api';

/** Optional: your PC LAN IP when using Expo tunnel (tunnel host is NOT where FastAPI runs). */
const LAN_API_HOST = process.env.EXPO_PUBLIC_LAN_API_HOST?.trim();

if (__DEV__ && !DEMO_MODE && LAN_API_HOST) {
  API_BASE_URL = `http://${LAN_API_HOST}:8000/api`;
} else if (
  __DEV__ &&
  !DEMO_MODE &&
  (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2'))
) {
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      // Tunnel URLs like *.exp.direct are not your machine — do not point API there.
      if (host && isPrivateLanIpHost(host)) {
        API_BASE_URL = `http://${host}:8000/api`;
      }
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
    console.log('[Peakked] Demo mode ON — no requests to', API_BASE_URL);
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
