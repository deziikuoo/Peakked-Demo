/**
 * Mock popular games for the Popular tab. Used for layout, UX, and fallback when API is unavailable.
 */

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/460x215/1A1A1D/9CA3AF?text=Game';

/**
 * Generate 24 hourly player-count points for sparklines.
 */
export function generateHistory(currentCount, trend) {
  const points = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let factor;
    if (trend === 'rising') {
      factor = 0.72 + 0.28 * t + (Math.sin(i * 0.5) * 0.03);
    } else if (trend === 'declining') {
      factor = 1.0 - 0.28 * t + (Math.sin(i * 0.4) * 0.02);
    } else {
      factor = 0.94 + Math.sin(i * 0.3) * 0.06;
    }
    points.push(Math.round(Math.max(1000, currentCount * factor)));
  }
  return points;
}

export function generateStreamHistory(streamCount, trend) {
  const points = [];
  const n = 24;
  const offset = 2;
  for (let i = 0; i < n; i++) {
    const shifted = (i + offset) % n;
    const t = shifted / (n - 1);
    let factor;
    if (trend === 'rising') {
      factor = 0.7 + 0.3 * t + (Math.sin(shifted * 0.6) * 0.08);
    } else if (trend === 'declining') {
      factor = 1.0 - 0.3 * t + (Math.sin(shifted * 0.5) * 0.06);
    } else {
      factor = 0.9 + Math.sin(shifted * 0.4) * 0.12;
    }
    points.push(Math.round(Math.max(10, streamCount * factor)));
  }
  return points;
}

export function generateViewHistory(viewCount, trend) {
  const points = [];
  const n = 24;
  const offset = 4;
  for (let i = 0; i < n; i++) {
    const shifted = (i + offset) % n;
    const t = shifted / (n - 1);
    let factor;
    if (trend === 'rising') {
      factor = 0.75 + 0.25 * t + (Math.sin(shifted * 0.35) * 0.04);
    } else if (trend === 'declining') {
      factor = 1.0 - 0.22 * t + (Math.sin(shifted * 0.3) * 0.03);
    } else {
      factor = 0.92 + Math.sin(shifted * 0.25) * 0.08;
    }
    points.push(Math.round(Math.max(100, viewCount * factor)));
  }
  return points;
}

export function generateHistory7d(currentCount, trend) {
  const n = 168;
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const hourOfDay = i % 24;
    const dailyCycle = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2) * 0.08;
    let factor;
    if (trend === 'rising') {
      factor = 0.65 + 0.35 * t + dailyCycle + (Math.sin(i * 0.15) * 0.02);
    } else if (trend === 'declining') {
      factor = 1.05 - 0.35 * t + dailyCycle + (Math.sin(i * 0.12) * 0.02);
    } else {
      factor = 0.92 + dailyCycle + Math.sin(i * 0.08) * 0.04;
    }
    points.push(Math.round(Math.max(1000, currentCount * factor)));
  }
  return points;
}

export function generateStreamHistory7d(streamCount, trend) {
  const n = 168;
  const offset = 2;
  const points = [];
  for (let i = 0; i < n; i++) {
    const shifted = (i + offset) % n;
    const t = shifted / (n - 1);
    const hourOfDay = shifted % 24;
    const dailyCycle = Math.sin(((hourOfDay - 4) / 24) * Math.PI * 2) * 0.12;
    let factor;
    if (trend === 'rising') {
      factor = 0.6 + 0.4 * t + dailyCycle + (Math.sin(shifted * 0.18) * 0.04);
    } else if (trend === 'declining') {
      factor = 1.05 - 0.38 * t + dailyCycle + (Math.sin(shifted * 0.14) * 0.03);
    } else {
      factor = 0.88 + dailyCycle + Math.sin(shifted * 0.1) * 0.06;
    }
    points.push(Math.round(Math.max(10, streamCount * factor)));
  }
  return points;
}

export function generateViewHistory7d(viewCount, trend) {
  const n = 168;
  const offset = 4;
  const points = [];
  for (let i = 0; i < n; i++) {
    const shifted = (i + offset) % n;
    const t = shifted / (n - 1);
    const hourOfDay = shifted % 24;
    const dailyCycle = Math.sin(((hourOfDay - 5) / 24) * Math.PI * 2) * 0.06;
    let factor;
    if (trend === 'rising') {
      factor = 0.68 + 0.32 * t + dailyCycle + (Math.sin(shifted * 0.12) * 0.03);
    } else if (trend === 'declining') {
      factor = 1.02 - 0.28 * t + dailyCycle + (Math.sin(shifted * 0.1) * 0.02);
    } else {
      factor = 0.9 + dailyCycle + Math.sin(shifted * 0.07) * 0.05;
    }
    points.push(Math.round(Math.max(100, viewCount * factor)));
  }
  return points;
}

export function generateHistory30d(currentCount, trend) {
  const n = 30;
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const dayOfWeek = i % 7;
    const weekendBoost = (dayOfWeek >= 5) ? 0.06 : 0;
    const eventBump = (trend === 'rising' && i >= 10 && i <= 12) ? 0.15 : 0;
    let factor;
    if (trend === 'rising') {
      factor = 0.6 + 0.4 * t + weekendBoost + eventBump + (Math.sin(i * 0.4) * 0.03);
    } else if (trend === 'declining') {
      factor = 1.1 - 0.4 * t + weekendBoost + (Math.sin(i * 0.35) * 0.03);
    } else {
      factor = 0.9 + weekendBoost + Math.sin(i * 0.3) * 0.05;
    }
    points.push(Math.round(Math.max(1000, currentCount * factor)));
  }
  return points;
}

export function generateStreamHistory30d(streamCount, trend) {
  const n = 30;
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const dayOfWeek = i % 7;
    const weekendBoost = (dayOfWeek >= 5) ? 0.1 : 0;
    const eventBump = (trend === 'rising' && i >= 9 && i <= 11) ? 0.2 : 0;
    let factor;
    if (trend === 'rising') {
      factor = 0.55 + 0.45 * t + weekendBoost + eventBump + (Math.sin(i * 0.5) * 0.05);
    } else if (trend === 'declining') {
      factor = 1.1 - 0.42 * t + weekendBoost + (Math.sin(i * 0.4) * 0.04);
    } else {
      factor = 0.85 + weekendBoost + Math.sin(i * 0.35) * 0.08;
    }
    points.push(Math.round(Math.max(10, streamCount * factor)));
  }
  return points;
}

export function generateViewHistory30d(viewCount, trend) {
  const n = 30;
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const dayOfWeek = i % 7;
    const weekendBoost = (dayOfWeek >= 5) ? 0.07 : 0;
    const eventBump = (trend === 'rising' && i >= 11 && i <= 13) ? 0.12 : 0;
    let factor;
    if (trend === 'rising') {
      factor = 0.62 + 0.38 * t + weekendBoost + eventBump + (Math.sin(i * 0.35) * 0.03);
    } else if (trend === 'declining') {
      factor = 1.08 - 0.35 * t + weekendBoost + (Math.sin(i * 0.3) * 0.03);
    } else {
      factor = 0.88 + weekendBoost + Math.sin(i * 0.25) * 0.06;
    }
    points.push(Math.round(Math.max(100, viewCount * factor)));
  }
  return points;
}

const GAMES_RAW = [
  { id: '1', name: 'Counter-Strike 2', genre: 'FPS', thumbnail: PLACEHOLDER_IMAGE, playerCount: 1245000, streamCount: 2840, viewCount: 142000, rating: 88, trend: 'rising', events: [{ hourIndex: 6, type: 'update', label: 'Patch notes released' }, { hourIndex: 18, type: 'streamer', label: 'Major streamer went live' }] },
  { id: '2', name: 'Dota 2', genre: 'MOBA', thumbnail: PLACEHOLDER_IMAGE, playerCount: 892000, streamCount: 1520, viewCount: 76000, rating: 90, trend: 'stable', events: [] },
  { id: '3', name: 'Baldur\'s Gate 3', genre: 'RPG', thumbnail: PLACEHOLDER_IMAGE, playerCount: 156000, streamCount: 420, viewCount: 21000, rating: 96, trend: 'declining', events: [{ hourIndex: 10, type: 'rating', label: 'Rating crossed 95%' }, { hourIndex: 14, type: 'sale', label: 'Steam weekend sale' }] },
  { id: '4', name: 'Helldivers 2', genre: 'Action', thumbnail: PLACEHOLDER_IMAGE, playerCount: 142000, streamCount: 680, viewCount: 34000, rating: 87, trend: 'rising', events: [{ hourIndex: 8, type: 'update', label: 'Server patch deployed' }, { hourIndex: 20, type: 'streamer', label: 'xQc started streaming' }] },
  { id: '5', name: 'Elden Ring', genre: 'RPG', thumbnail: PLACEHOLDER_IMAGE, playerCount: 98000, streamCount: 1120, viewCount: 56000, rating: 96, trend: 'stable', events: [{ hourIndex: 12, type: 'sale', label: 'DLC discount' }] },
  { id: '6', name: 'Apex Legends', genre: 'Battle Royale', thumbnail: PLACEHOLDER_IMAGE, playerCount: 245000, streamCount: 1890, viewCount: 95000, rating: 84, trend: 'declining', events: [] },
  { id: '7', name: 'GTA V', genre: 'Open World', thumbnail: PLACEHOLDER_IMAGE, playerCount: 185000, streamCount: 2340, viewCount: 117000, rating: 92, trend: 'rising', events: [{ hourIndex: 16, type: 'streamer', label: 'Big stream event' }, { hourIndex: 22, type: 'sale', label: 'Rockstar sale' }] },
  { id: '8', name: 'PUBG: Battlegrounds', genre: 'Battle Royale', thumbnail: PLACEHOLDER_IMAGE, playerCount: 420000, streamCount: 760, viewCount: 38000, rating: 82, trend: 'stable', events: [] },
  { id: '9', name: 'Rust', genre: 'Survival', thumbnail: PLACEHOLDER_IMAGE, playerCount: 78000, streamCount: 540, viewCount: 27000, rating: 85, trend: 'declining', events: [] },
  { id: '10', name: 'Lost Ark', genre: 'MMO', thumbnail: PLACEHOLDER_IMAGE, playerCount: 52000, streamCount: 120, viewCount: 6000, rating: 79, trend: 'rising', events: [{ hourIndex: 4, type: 'update', label: 'Maintenance completed' }] },
];

export const MOCK_GAMES = GAMES_RAW.map((g) => {
  const history = generateHistory(g.playerCount, g.trend);
  const streamHistory = generateStreamHistory(g.streamCount, g.trend);
  const viewHistory = generateViewHistory(g.viewCount, g.trend);
  const history7d = generateHistory7d(g.playerCount, g.trend);
  const streamHistory7d = generateStreamHistory7d(g.streamCount, g.trend);
  const viewHistory7d = generateViewHistory7d(g.viewCount, g.trend);
  const history30d = generateHistory30d(g.playerCount, g.trend);
  const streamHistory30d = generateStreamHistory30d(g.streamCount, g.trend);
  const viewHistory30d = generateViewHistory30d(g.viewCount, g.trend);
  const { trend: _t, ...rest } = g;
  return {
    ...rest, history, streamHistory, viewHistory,
    history7d, streamHistory7d, viewHistory7d,
    history30d, streamHistory30d, viewHistory30d,
    events: g.events || [],
  };
});

/**
 * Returns ['All', ...unique genres from GAMES_RAW].
 */
export function getGenres() {
  return ['All', ...new Set(GAMES_RAW.map((g) => g.genre))];
}

/**
 * Mock refresh: returns a shallow copy with optional reorder (for demo fallback).
 */
export function getMockGamesRefreshed() {
  const copy = [...MOCK_GAMES];
  for (let i = 1; i < 5; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i - 1)) + 1;
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default MOCK_GAMES;
