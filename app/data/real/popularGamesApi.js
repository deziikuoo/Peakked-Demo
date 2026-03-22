/**
 * Trending / popular games: live backend or demo mock (see `config/demoMode.js`).
 */
import axios from 'axios';
import { DEMO_MODE } from '../../config/demoMode';
import { API_BASE_URL } from '../../services/api/nexaApi';
import { getTrendingGamesMock } from '../mock/popularGames';
import { demoNetworkDelay } from '../mock/nexaDemoData';

const API_TIMEOUT_MS = 25000;

/**
 * Fetch trending games from backend (Steam + Redis cache). Returns array of game objects
 * in unified shape: id, name, genre, thumbnail, playerCount, streamCount, viewCount, rating, history arrays, events.
 * @returns {Promise<Array>} games
 * @throws {Error} on network or server error (live mode only)
 */
export async function getTrendingGames() {
  if (DEMO_MODE) {
    await demoNetworkDelay(220);
    return getTrendingGamesMock();
  }

  const response = await axios.get(`${API_BASE_URL}/trending`, {
    timeout: API_TIMEOUT_MS,
  });
  const data = response.data;
  if (!Array.isArray(data)) {
    return Array.isArray(data?.games) ? data.games : [];
  }
  return data;
}
