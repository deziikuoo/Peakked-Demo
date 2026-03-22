/**
 * Static NEXA tab data for frontend-only demos (no OpenAI / RAWG / Twitch).
 * Shapes match what `NexaGameCard` and `NexaGameDetailsModal` expect from the backend.
 */

const steamHeader = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

/** Short list for recommendation cards */
export const DEMO_NEXA_CARD_GAMES = [
  {
    title: 'Counter-Strike 2',
    release_date: '09/27/2023',
    platforms: 'PC',
    rating: 4.35,
    genres: 'FPS, Action',
    developers: 'Valve',
    metacritic: 85,
    background_image: steamHeader(730),
    twitch_viewers: 512400,
  },
  {
    title: "Baldur's Gate 3",
    release_date: '08/03/2023',
    platforms: 'PC, PlayStation 5, Xbox Series X|S, macOS',
    rating: 4.72,
    genres: 'RPG, Strategy',
    developers: 'Larian Studios',
    metacritic: 96,
    background_image: steamHeader(1086940),
    twitch_viewers: 28400,
  },
  {
    title: 'Elden Ring',
    release_date: '02/25/2022',
    platforms: 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S',
    rating: 4.68,
    genres: 'Action, RPG',
    developers: 'FromSoftware',
    metacritic: 96,
    background_image: steamHeader(1245620),
    twitch_viewers: 42100,
  },
  {
    title: 'Helldivers 2',
    release_date: '02/08/2024',
    platforms: 'PC, PlayStation 5',
    rating: 4.41,
    genres: 'Action, Shooter',
    developers: 'Arrowhead Game Studios',
    metacritic: 83,
    background_image: steamHeader(553850),
    twitch_viewers: 67800,
  },
  {
    title: 'Cyberpunk 2077',
    release_date: '12/10/2020',
    platforms: 'PC, PlayStation 5, Xbox Series X|S',
    rating: 4.55,
    genres: 'RPG, Action',
    developers: 'CD PROJEKT RED',
    metacritic: 86,
    background_image: steamHeader(1091500),
    twitch_viewers: 35600,
  },
  {
    title: 'Apex Legends',
    release_date: '02/04/2019',
    platforms: 'PC, PlayStation 4, Xbox One, Nintendo Switch',
    rating: 4.12,
    genres: 'Shooter, Battle Royale',
    developers: 'Respawn Entertainment',
    metacritic: 88,
    background_image: steamHeader(1172470),
    twitch_viewers: 198000,
  },
  {
    title: 'Dota 2',
    release_date: '07/09/2013',
    platforms: 'PC, Linux',
    rating: 4.28,
    genres: 'MOBA, Strategy',
    developers: 'Valve',
    metacritic: 90,
    background_image: steamHeader(570),
    twitch_viewers: 124800,
  },
  {
    title: 'Palworld',
    release_date: '01/19/2024',
    platforms: 'PC, Xbox One, Xbox Series X|S',
    rating: 4.05,
    genres: 'Survival, Open World',
    developers: 'Pocketpair',
    metacritic: 72,
    background_image: steamHeader(1623730),
    twitch_viewers: 28900,
  },
];

const DETAIL_EXTRA = {
  "counter-strike 2": {
    description:
      'The next era of competitive Counter-Strike. Updated maps, smoke dynamics, and tick-rate improvements keep the tactical FPS at the top of Steam charts.',
    screenshots: [steamHeader(730), steamHeader(730)],
    publishers: 'Valve',
    esrb_rating: 'Mature',
    website: 'https://store.steampowered.com/app/730/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/730/' },
    ],
  },
  "baldur's gate 3": {
    description:
      'Gather your party and return to the Forgotten Realms in a story-rich CRPG with deep turn-based combat, co-op, and staggering player choice.',
    screenshots: [steamHeader(1086940)],
    publishers: 'Larian Studios',
    esrb_rating: 'Mature',
    website: 'https://baldursgate3.game/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/1086940/' },
      { name: 'GOG', slug: 'gog', url: 'https://www.gog.com/game/baldurs_gate_iii' },
    ],
  },
  'elden ring': {
    description:
      'A vast open-world action RPG directed by Hidetaka Miyazaki with worldbuilding by George R. R. Martin. Explore the Lands Between and define your own path.',
    screenshots: [steamHeader(1245620)],
    publishers: 'Bandai Namco Entertainment',
    esrb_rating: 'Mature',
    website: 'https://en.bandainamcoent.eu/elden-ring/elden-ring',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/1245620/' },
    ],
  },
  'helldivers 2': {
    description:
      'Co-op third-person shooter for up to four players. Fight for Super Earth across hostile planets with explosive stratagems and friendly fire always on.',
    screenshots: [steamHeader(553850)],
    publishers: 'Sony Interactive Entertainment',
    esrb_rating: 'Mature',
    website: 'https://www.playstation.com/games/helldivers-2/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/553850/' },
    ],
  },
  'cyberpunk 2077': {
    description:
      'Open-world action-adventure RPG set in Night City. Phantom Liberty and ongoing updates have rebuilt momentum with strong player counts on PC.',
    screenshots: [steamHeader(1091500)],
    publishers: 'CD PROJEKT RED',
    esrb_rating: 'Mature',
    website: 'https://www.cyberpunk.net/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/1091500/' },
      { name: 'GOG', slug: 'gog', url: 'https://www.gog.com/game/cyberpunk_2077' },
    ],
  },
  'apex legends': {
    description:
      'Free-to-play hero battle royale with seasonal legends, ranked modes, and constant balance updates. Strong esports and streaming presence.',
    screenshots: [steamHeader(1172470)],
    publishers: 'Electronic Arts',
    esrb_rating: 'Teen',
    website: 'https://www.ea.com/games/apex-legends',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/1172470/' },
    ],
  },
  'dota 2': {
    description:
      'The world’s deepest competitive MOBA. Free-to-play with a thriving pro scene, regular patches, and The International each year.',
    screenshots: [steamHeader(570)],
    publishers: 'Valve',
    esrb_rating: 'Teen',
    website: 'https://www.dota2.com/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/570/' },
    ],
  },
  palworld: {
    description:
      'Open-world survival crafting with creature collecting, base building, and co-op. Famously spiked concurrent players at launch.',
    screenshots: [steamHeader(1623730)],
    publishers: 'Pocketpair',
    esrb_rating: 'Teen',
    website: 'https://www.palworldgame.com/',
    stores: [
      { name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/app/1623730/' },
    ],
  },
};

function normTitle(t) {
  return (t || '').trim().toLowerCase();
}

function scoreMatch(preference, game) {
  const p = normTitle(preference);
  if (!p) return 0;
  let s = 0;
  const title = normTitle(game.title);
  if (title.includes(p) || p.includes(title)) s += 12;
  if (title.split(/\s+/).some((w) => w.length > 2 && p.includes(w))) s += 4;
  game.genres.split(',').forEach((g) => {
    const x = g.trim().toLowerCase();
    if (p.includes(x) || x.includes(p)) s += 3;
  });
  if (normTitle(game.developers).includes(p)) s += 2;
  return s;
}

function parseUsRelease(s) {
  if (!s || s === 'N/A') return 0;
  const parts = String(s).split('/');
  if (parts.length !== 3) return 0;
  const [mm, dd, yy] = parts.map((x) => parseInt(x, 10));
  if (!yy) return 0;
  return new Date(yy, mm - 1, dd).getTime();
}

function sortDemoGames(games, sortBy) {
  const out = [...games];
  if (sortBy === 'rating') {
    out.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  } else if (sortBy === 'metacritic') {
    out.sort((a, b) => {
      const ma = Number(a.metacritic) || 0;
      const mb = Number(b.metacritic) || 0;
      return mb - ma;
    });
  } else {
    out.sort((a, b) => parseUsRelease(b.release_date) - parseUsRelease(a.release_date));
  }
  return out;
}

/**
 * @returns {Promise<{ games: object[], explain: string }>}
 */
export async function getDemoRecommendations(preference, sortBy, filters) {
  const pool = [...DEMO_NEXA_CARD_GAMES];
  const pref = (preference || '').trim();
  if (pref.length >= 2) {
    pool.sort((a, b) => scoreMatch(pref, b) - scoreMatch(pref, a));
  }
  const games = sortDemoGames(pool.slice(0, 8), sortBy || 'release_date');
  const filterBits = Object.entries(filters || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  const explain =
    filterBits.length > 0
      ? `Demo recommendations (offline) — weighted for: ${filterBits.join(', ')}.`
      : 'Demo recommendations (offline) — sample catalog with realistic stats and artwork.';
  return { games, explain };
}

/**
 * @returns {Promise<object>}
 */
export async function getDemoGameDetails(title) {
  const key = normTitle(title);
  const base = DEMO_NEXA_CARD_GAMES.find((g) => normTitle(g.title) === key) || {
    title: title || 'Unknown game',
    release_date: 'N/A',
    platforms: 'PC',
    rating: 'N/A',
    genres: 'Action',
    developers: 'Demo Studio',
    metacritic: 'N/A',
    background_image: steamHeader(220),
    twitch_viewers: 1200,
  };
  const extra = DETAIL_EXTRA[key] || {
    description:
      'This is placeholder demo copy. Hook up the backend to load RAWG descriptions, screenshots, and store links.',
    screenshots: base.background_image ? [base.background_image] : [],
    publishers: 'Various',
    esrb_rating: 'Rating Pending',
    website: '',
    stores: base.background_image
      ? [{ name: 'Steam', slug: 'steam', url: 'https://store.steampowered.com/' }]
      : [],
  };
  return {
    title: base.title,
    description: extra.description,
    screenshots: extra.screenshots,
    rating: base.rating,
    release_date: base.release_date,
    platforms: base.platforms,
    genres: base.genres,
    developers: base.developers,
    publishers: extra.publishers,
    metacritic: base.metacritic,
    esrb_rating: extra.esrb_rating,
    website: extra.website,
    stores: extra.stores,
    background_image: base.background_image,
  };
}

const AUTOCOMPLETE_SEED = [
  { name: 'Counter-Strike 2', slug: 'counter-strike-2', cover: steamHeader(730) },
  { name: "Baldur's Gate 3", slug: 'baldurs-gate-3', cover: steamHeader(1086940) },
  { name: 'Elden Ring', slug: 'elden-ring', cover: steamHeader(1245620) },
  { name: 'Helldivers 2', slug: 'helldivers-2', cover: steamHeader(553850) },
  { name: 'Cyberpunk 2077', slug: 'cyberpunk-2077', cover: steamHeader(1091500) },
  { name: 'Apex Legends', slug: 'apex-legends', cover: steamHeader(1172470) },
  { name: 'Dota 2', slug: 'dota-2', cover: steamHeader(570) },
  { name: 'Palworld', slug: 'palworld', cover: steamHeader(1623730) },
  { name: 'Grand Theft Auto V', slug: 'grand-theft-auto-v', cover: steamHeader(271590) },
  { name: 'Rust', slug: 'rust', cover: steamHeader(252490) },
];

/**
 * @returns {Promise<{ name: string, slug?: string, cover?: string }[]>}
 */
export async function getDemoIgdbAutocomplete(query) {
  const q = normTitle(query);
  if (!q) return [];
  return AUTOCOMPLETE_SEED.filter((g) => normTitle(g.name).includes(q)).slice(0, 7);
}

export function demoNetworkDelay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}
