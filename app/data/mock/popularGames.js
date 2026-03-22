/**
 * Mock popular games for the Popular tab. Used for layout, UX, and demo/offline mode.
 * Steam header art reads like production data (same CDN the live backend uses for headers).
 */

const steamHeader = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

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
  { id: '730', name: 'Counter-Strike 2', genre: 'FPS', thumbnail: steamHeader(730), playerCount: 1182400, streamCount: 3120, viewCount: 186400, rating: 88, trend: 'rising', events: [{ hourIndex: 6, type: 'update', label: 'Balance patch live' }, { hourIndex: 19, type: 'streamer', label: 'Major tournament qualifiers' }] },
  { id: '570', name: 'Dota 2', genre: 'MOBA', thumbnail: steamHeader(570), playerCount: 691200, streamCount: 1380, viewCount: 92100, rating: 90, trend: 'stable', events: [] },
  { id: '271590', name: 'Grand Theft Auto V', genre: 'Open World', thumbnail: steamHeader(271590), playerCount: 208500, streamCount: 2650, viewCount: 132800, rating: 92, trend: 'rising', events: [{ hourIndex: 16, type: 'streamer', label: 'Roleplay server spike' }, { hourIndex: 22, type: 'sale', label: 'Rockstar storefront promo' }] },
  { id: '1172470', name: 'Apex Legends', genre: 'Battle Royale', thumbnail: steamHeader(1172470), playerCount: 276800, streamCount: 2040, viewCount: 101200, rating: 84, trend: 'declining', events: [] },
  { id: '578080', name: 'PUBG: Battlegrounds', genre: 'Battle Royale', thumbnail: steamHeader(578080), playerCount: 398000, streamCount: 790, viewCount: 49800, rating: 82, trend: 'stable', events: [] },
  { id: '1245620', name: 'Elden Ring', genre: 'RPG', thumbnail: steamHeader(1245620), playerCount: 128400, streamCount: 1040, viewCount: 54800, rating: 96, trend: 'stable', events: [{ hourIndex: 12, type: 'sale', label: 'DLC bundle on sale' }] },
  { id: '1086940', name: "Baldur's Gate 3", genre: 'RPG', thumbnail: steamHeader(1086940), playerCount: 145200, streamCount: 485, viewCount: 26800, rating: 96, trend: 'declining', events: [{ hourIndex: 10, type: 'rating', label: 'Community awards buzz' }, { hourIndex: 14, type: 'sale', label: 'Steam feature spot' }] },
  { id: '553850', name: 'Helldivers 2', genre: 'Action', thumbnail: steamHeader(553850), playerCount: 162800, streamCount: 705, viewCount: 36200, rating: 87, trend: 'rising', events: [{ hourIndex: 8, type: 'update', label: 'Hotfix deployed' }, { hourIndex: 20, type: 'streamer', label: 'Co-op trend on Twitch' }] },
  { id: '1091500', name: 'Cyberpunk 2077', genre: 'RPG', thumbnail: steamHeader(1091500), playerCount: 101200, streamCount: 655, viewCount: 45200, rating: 91, trend: 'rising', events: [{ hourIndex: 15, type: 'update', label: 'Patch notes traction' }] },
  { id: '252490', name: 'Rust', genre: 'Survival', thumbnail: steamHeader(252490), playerCount: 158600, streamCount: 565, viewCount: 30400, rating: 85, trend: 'stable', events: [] },
  { id: '1623730', name: 'Palworld', genre: 'Survival', thumbnail: steamHeader(1623730), playerCount: 73800, streamCount: 395, viewCount: 19800, rating: 78, trend: 'declining', events: [] },
  { id: '730240', name: 'Lost Ark', genre: 'MMO', thumbnail: steamHeader(730240), playerCount: 46800, streamCount: 102, viewCount: 7800, rating: 79, trend: 'rising', events: [{ hourIndex: 4, type: 'update', label: 'Weekly reset' }] },
  { id: '1938090', name: 'Call of Duty: Black Ops 6', genre: 'FPS', thumbnail: steamHeader(1938090), playerCount: 91200, streamCount: 1180, viewCount: 68900, rating: 83, trend: 'rising', events: [{ hourIndex: 21, type: 'streamer', label: 'Season launch streams' }] },
  { id: '440', name: 'Team Fortress 2', genre: 'FPS', thumbnail: steamHeader(440), playerCount: 58400, streamCount: 225, viewCount: 11800, rating: 92, trend: 'stable', events: [] },
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

/** Same shape as live `/api/trending`; sorted by concurrent players (demo). */
export function getTrendingGamesMock() {
  return [...MOCK_GAMES].sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0));
}

export default MOCK_GAMES;
