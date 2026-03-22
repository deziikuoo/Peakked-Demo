/**
 * Real data: fetch trending/popular games from backend. Same game shape as mock for UI compatibility.
 */
import axios from 'axios';
import { API_BASE_URL } from '../../services/api/nexaApi';

const API_TIMEOUT_MS = 25000;

/**
 * Fetch trending games from backend (Steam + Redis cache). Returns array of game objects
 * in unified shape: id, name, genre, thumbnail, playerCount, streamCount, viewCount, rating, history arrays, events.
 * @returns {Promise<Array>} games
 * @throws {Error} on network or server error
 */
export async function getTrendingGames() {
  const response = await axios.get(`${API_BASE_URL}/trending`, {
    timeout: API_TIMEOUT_MS,
  });
  const data = response.data;
  if (!Array.isArray(data)) {
    return Array.isArray(data?.games) ? data.games : [];
  }
  return data;
}
