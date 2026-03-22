# Implementing Real Data — Feature Inventory

This document lists all features that currently use **mock data** or will need **real data** for production, separated by **frontend** and **backend**. The **Nexa** tab is excluded as it already uses the live backend (recommendations, game details, IGDB autocomplete).

---

## 1. Tab overview

| Tab          | Data source today               | Production need                                |
| ------------ | ------------------------------- | ---------------------------------------------- |
| **Popular**  | `mockPopularGames.js`           | Backend APIs: trending games, time-series      |
| **Chat**     | Placeholder reply only          | Backend: intent + tools (Steam/Twitch/ratings) |
| **Nexa**     | Real API                        | ✅ Ready (no change)                           |
| **Compare**  | `mockPopularGames.js`           | Same as Popular (games + time-series)          |
| **My Games** | Watchlist IDs + mock resolution | Real game IDs + backend resolution             |

---

## 2. Frontend — features using mock data or needing real data

### 2.1 Popular tab

| Feature                      | Current implementation                                  | File(s)                                                                       | Real-data need                                                                       |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| List of popular games        | `MOCK_GAMES` (10 hardcoded games)                       | `PopularScreen.js`, `mockPopularGames.js`                                     | Backend: trending/popular games (e.g. top N by Steam players and/or Twitch viewers). |
| Pull-to-refresh              | `getMockGamesRefreshed()` (shuffle only)                | `PopularScreen.js`                                                            | Replace with API call to refresh trending list.                                      |
| Game cache seed              | `setMany(MOCK_GAMES)` on mount                          | `PopularScreen.js`                                                            | Seed from API response.                                                              |
| Genre filter bar             | Genres derived from `games` (mock genres)               | `PopularScreen.js`, `GenreFilterBar.js`, `getGenres()` in mock                | Real genres from API (e.g. RAWG/IGDB) or from trending response.                     |
| Sectioned layout             | "Top by players" / "Top by streams" from same mock list | `PopularScreen.js`                                                            | Same list; sort by real `playerCount` / `streamCount`.                               |
| Game cards (hero, row, grid) | `playerCount`, `streamCount`, `getTrend()`, thumbnails  | `GameHeroCard.js`, `GameRowCard.js`, `GameGridCard.js`, `mockPopularGames.js` | Real counts, trend from real history, real thumbnails.                               |
| Game detail modal            | Full game object from cache (mock)                      | `GameDetailModal.js`                                                          | Game object from API (same shape or adapter).                                        |
| Share card                   | Stats + sparkline from game                             | `GameShareCard.js`                                                            | Real stats and history for sparkline.                                                |

### 2.2 Game detail modal (opened from Popular or My Games)

| Feature                                   | Current implementation                                                 | File(s)                                                               | Real-data need                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Stats (players, streams, views, rating)   | From mock game object                                                  | `GameDetailModal.js`, `mockPopularGames.js`                           | Real values from backend.                                                 |
| Sparklines (24h / 7d / 30d)               | `history`, `streamHistory`, `viewHistory`, `history7d`, etc. from mock | `GameDetailModal.js`, `SparklineScrubbable.js`, `mockPopularGames.js` | Backend: time-series for players, streams, views (24h, 7d, 30d).          |
| Metric toggle (players / streams / views) | Same mock series                                                       | `GameDetailModal.js`, `MetricToggle.js`                               | Same series, real.                                                        |
| Time range toggle (24h / 7d / 30d)        | Mock series per range                                                  | `GameDetailModal.js`, `TimeRangeToggle.js`                            | Real series per range.                                                    |
| Event markers on sparkline                | `game.events` (e.g. `hourIndex`, `type`, `label`)                      | `EventMarkers.js`, `mockPopularGames.js`                              | Optional: real events (patches, streams, sales) or omit.                  |
| Peak Time Predictor panel                 | `computePeakInsights(game)` from mock history                          | `PeakTimePanel.js`, `mockPopularGames.js`                             | Real 24h/7d/30d history so peak math is meaningful.                       |
| Compare game picker (in modal)            | `GameComparisonPicker` with `MOCK_GAMES`                               | `GameDetailModal.js`, `GameComparisonPicker.js`                       | List from same trending API; exclude current game.                        |
| Add to watchlist                          | Uses `game.id` from mock                                               | `GameDetailModal.js`, `WatchlistContext.js`                           | Stable game ID from backend (e.g. Steam app id, RAWG id, or internal id). |

### 2.3 Compare tab

| Feature                       | Current implementation                                           | File(s)                                       | Real-data need                                                   |
| ----------------------------- | ---------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Slot game picker              | `GameComparisonPicker` → `MOCK_GAMES`                            | `CompareScreen.js`, `GameComparisonPicker.js` | Same trending/source as Popular; pick 2–3 games.                 |
| Persisted slot IDs            | `getCompareSlotIds` / `setCompareSlotIds` (local)                | `CompareScreen.js`, `layoutStorage`           | Keep; IDs must resolve to real games (backend or unified ID).    |
| Resolving slots on load       | `cacheGet(id)` then `MOCK_GAMES.find(id)`                        | `CompareScreen.js`                            | Resolve IDs via backend or shared game cache populated from API. |
| Comparison chart (sparklines) | `CompareChartPanel` uses `game.history`, `streamHistory7d`, etc. | `CompareChartPanel.js`, `CompareScreen.js`    | Real time-series per game (same as detail modal).                |
| Weighted score (winner)       | Players 40%, streams 30%, views 20%, rating 10%                  | `CompareScreen.js`                            | Real `playerCount`, `streamCount`, `viewCount`, `rating`.        |
| Comparison table              | Players, Streams, Views, Rating, Trend                           | `CompareScreen.js`                            | Real values; trend from real history via `getTrend()`.           |

### 2.4 My Games tab

| Feature                          | Current implementation                                        | File(s)                                   | Real-data need                                                                                                    |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Watchlist list                   | `watchlist` from `WatchlistContext` (game IDs → game objects) | `MyGamesScreen.js`, `WatchlistContext.js` | Keep; IDs must be stable (backend game id).                                                                       |
| Resolving watchlist IDs to games | `cacheGet(id)` then `MOCK_GAMES.find(id)`                     | `WatchlistContext.js`                     | Backend endpoint or cache: resolve list of IDs to full game objects (with time-series if detail modal is opened). |
| Watchlist card stats             | `playerCount`, `streamCount`, etc. from resolved game         | `WatchlistCard.js`                        | Real stats from API.                                                                                              |
| Clear watchlist                  | Local only                                                    | `WatchlistContext.js`                     | Can stay local.                                                                                                   |

### 2.5 Chat tab

| Feature            | Current implementation                                    | File(s)         | Real-data need                                                                                                                  |
| ------------------ | --------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Send message       | Appends user message + single placeholder assistant reply | `ChatScreen.js` | Backend: accept message → intent classification → tool calls (e.g. Steam, Twitch, RAWG) → LLM with tools → stream/return reply. |
| Suggestion chips   | "How many people…", "Who's streaming…", "Steam rating…"   | `ChatScreen.js` | Same backend; answers should use real tools.                                                                                    |
| Prefill from route | e.g. "How many people are playing {gameName}?"            | `ChatScreen.js` | No change; backend handles query.                                                                                               |

### 2.6 Shared / cross-tab

| Feature            | Current implementation                                                                           | File(s)                                                         | Real-data need                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Game cache         | In-memory by `game.id`; TTL 1h; filled with `MOCK_GAMES`                                         | `GameCacheContext.js`                                           | Fill from API responses; keep same interface (`get`, `set`, `setMany`). |
| Format helpers     | `formatPlayerCount`, `formatStreamCount`, `formatViewCount`, `getTrend`                          | `mockPopularGames.js`, many components                          | Keep; move to a shared util (no mock dependency).                       |
| Peak/trend math    | `findPeakWindow`, `computePeakInsights`, `isInPeakWindowNow`, `formatHourIn7d`, `formatDayLabel` | `mockPopularGames.js`, `PeakTimePanel.js`, `GameDetailModal.js` | Keep logic; feed with real history from API.                            |
| Layout persistence | Layout preference, compare slot IDs, watchlist IDs                                               | `layoutStorage.js`, `layoutStorage.native.js`                   | No change; IDs must stay valid (backend identity).                      |

---

## 3. Backend — existing vs required

### 3.1 Already implemented (Nexa / shared)

| Capability    | Used by                              | Notes                                                                                |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| **Twitch**    | Nexa (viewer count in game details)  | `get_twitch_token()`, `get_twitch_viewer_count(game_name)` in `app_fastapi.py`.      |
| **IGDB**      | Nexa (autocomplete, search)          | `igdb_search_games()`, `GET /api/igdb-autocomplete`.                                 |
| **RAWG**      | Nexa (game details, recommendations) | `fetch_game_details()`, `get_game_details()`; RAWG request tracking.                 |
| **OpenAI**    | Nexa (recommendations)               | GPT-4o for game titles; no tools. Add prompt context caching tool from openAI        |
| **Endpoints** | Nexa                                 | `POST /api/recommendations`, `POST /api/game-details`, `GET /api/igdb-autocomplete`. |

### 3.2 Backend APIs and logic to add for real data

| API / logic                              | Purpose                                                        | Data sources (from ROADMAP/docs)                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trending / popular games**             | Feed Popular tab and Compare picker                            | Steam (concurrent players), Twitch (top games by viewers); optionally RAWG/IGDB for metadata and ratings.                                       |
| **Player count (Steam)**                 | Per-game concurrent players                                    | Steam Web API / public stats (e.g. Steamworks or community endpoints).                                                                          |
| **Stream count / viewer count (Twitch)** | Per-game streams and viewers                                   | Twitch Helix: games + streams (already have token + game lookup; extend to stream count and list).                                              |
| **Time-series (24h / 7d / 30d)**         | Sparklines, trend, peak predictor                              | Backend aggregation/caching from Steam + Twitch (or third-party history if available).                                                          |
| **Ratings**                              | Rating in cards and comparison                                 | RAWG/IGDB/OpenCritic (RAWG already in use).                                                                                                     |
| **Chat: intent classification**          | Map user message → tools                                       | Rule-based classifier (no extra LLM); output intents e.g. `player_count`, `live_streams`, `ratings`, `trending`, `compare`, `image`, `general`. |
| **Chat: tools**                          | Execute and return data to LLM                                 | `get_player_count`, `get_live_streams`, `get_ratings`, `get_trending_games`, `compare_popularity`, optional image tool.                         |
| **Chat: LLM with tools**                 | Single cacheable system prompt + user message + selected tools | OpenAI (or other) with tool definitions; backend calls Steam/Twitch/RAWG etc. and returns tool results to model.                                |
| **Stable game identity**                 | Watchlist, Compare slots, cache                                | Decide canonical id (e.g. Steam app id, RAWG id, or internal id) and use consistently in all endpoints.                                         |

### 3.3 External APIs referenced (Twitch, Steam, RAWG, etc.)

- **Twitch**: Already used; extend for stream list and counts per game.
- **Steam**: Not yet integrated; needed for live player counts and trending.
- **RAWG**: In use for Nexa; can be reused for ratings and metadata for Popular/Compare.
- **YouTube** (optional): ROADMAP mentions YouTube Data API for views/live; can be added later.
- **OpenAI**: In use; add Chat flow with tool-calling for production Chat tab.

---

## 4. Math and requirements for tabs (excluding Nexa)

These are required so that all tabs (Popular, Compare, My Games) and the detail modal work with real data.

### 4.1 Game object shape (unified for Popular / Compare / My Games / detail modal)

- **Identity**: `id` (string, stable across sessions).
- **Display**: `name`, `thumbnail`, `genre`.
- **Current stats**: `playerCount`, `streamCount`, `viewCount`, `rating` (number or string).
- **Time-series** (arrays of numbers, backend-provided):
  - 24h: `history` (players), `streamHistory`, `viewHistory`.
  - 7d: `history7d`, `streamHistory7d`, `viewHistory7d`.
  - 30d: `history30d`, `streamHistory30d`, `viewHistory30d`.
- **Optional**: `events` — `[{ hourIndex, type, label }]` for EventMarkers (or omit if not available).

Frontend can keep using the same shape; backend either returns it or an adapter layer maps API responses to this shape.

### 4.2 Format and trend helpers (keep, move off mock file)

- `formatPlayerCount`, `formatStreamCount`, `formatViewCount` — display formatting.
- `getTrend(history)` — `{ direction, percentChange }` from first 6 vs last 6 points (used for trend badge and comparison).
- `findPeakWindow(history, windowSize)` — contiguous window with max average (for peak predictor).
- `computePeakInsights(game)` — daily/weekly/monthly peak labels and confidence from `history` / `history7d` / `history30d`.
- `isInPeakWindowNow(game)` — whether current hour is in 24h peak window.
- `formatHourIn7d`, `formatDayLabel` — axis labels for 7d/30d charts.

### 4.3 Compare tab: weighted score

- Formula (already in code): players 40%, streams 30%, views 20%, rating 10%.
- Normalize each metric by max across the 2–3 compared games; sum weighted components; winner = highest score.
- Requires real `playerCount`, `streamCount`, `viewCount`, `rating` per game.

### 4.4 Persistence and IDs

- **Watchlist**: Store list of game IDs (e.g. in `layoutStorage`). On load, resolve IDs to full game objects via backend or cache.
- **Compare slots**: Store up to 3 game IDs; resolve same way.
- **Game cache**: Key by same `id`; populate from trending API and from any detail/compare resolution endpoint.

---

## 5. File reference (mock data usage)

| File                                     | Mock usage                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `app/data/mockPopularGames.js`           | Source of `MOCK_GAMES`, all history generators, format/trend/peak helpers, `getGenres()`, `getMockGamesRefreshed()`. |
| `app/screens/PopularScreen.js`           | `MOCK_GAMES`, `getMockGamesRefreshed`, `setMany(MOCK_GAMES)`, genre list from mock games.                            |
| `app/screens/CompareScreen.js`           | `MOCK_GAMES` for slot resolution; chart/table data from game objects (mock).                                         |
| `app/screens/ChatScreen.js`              | `PLACEHOLDER_REPLY`; no API call.                                                                                    |
| `app/screens/MyGamesScreen.js`           | No direct mock import; watchlist resolution goes through context (mock fallback in context).                         |
| `app/context/WatchlistContext.js`        | `MOCK_GAMES.find(id)` when game not in cache.                                                                        |
| `app/context/GameCacheContext.js`        | No mock; cache filled by callers (currently Popular with MOCK_GAMES).                                                |
| `app/components/GameDetailModal.js`      | Imports format/trend/peak from mock; uses game from props (mock or future API).                                      |
| `app/components/GameComparisonPicker.js` | `MOCK_GAMES` for list and exclude.                                                                                   |
| `app/components/GameSlotPicker.js`       | `formatPlayerCount`, `getTrend` from mock.                                                                           |
| `app/components/GameShareCard.js`        | Game shape + format from mock.                                                                                       |
| `app/components/GameGridCard.js`         | `formatPlayerCount`, `formatStreamCount`, `getTrend` from mock.                                                      |
| `app/components/GameHeroCard.js`         | Same.                                                                                                                |
| `app/components/GameRowCard.js`          | Same + `isInPeakWindowNow`.                                                                                          |
| `app/components/WatchlistCard.js`        | Game shape + format from mock.                                                                                       |
| `app/components/CompareChartPanel.js`    | Format helpers + game history fields from mock.                                                                      |
| `app/components/PeakTimePanel.js`        | Uses `computePeakInsights(game)` (logic in mock).                                                                    |
| `app/components/SparklineScrubbable.js`  | `formatPlayerCount`, `EVENT_TYPES` from mock.                                                                        |
| `app/components/EventMarkers.js`         | `EVENT_TYPES` from mock.                                                                                             |
| `app/components/ViewsBadge.js`           | `formatViewCount` from mock.                                                                                         |

---

## 6. Suggested implementation order

1. **Backend: stable game ID and trending endpoint**  
   Define canonical game id (e.g. Steam app id or RAWG id); add endpoint(s) for “trending/popular games” (Steam + Twitch + optional RAWG metadata). Return unified game shape including current counts and thumbnails.

2. **Backend: time-series**  
   Add or aggregate 24h/7d/30d data for players and streams (and views if available); expose in game object or separate endpoint.

3. **Frontend: Popular tab**  
   Replace `MOCK_GAMES` and `getMockGamesRefreshed` with API fetch; keep layout, filters, and cache; move format/trend/peak helpers to a non-mock util and feed with API data.

4. **Frontend: Compare tab**  
   Use same trending API for picker; resolve slot IDs via cache/API; use real time-series and stats for charts and table.

5. **Frontend: My Games**  
   Resolve watchlist IDs via backend or cache (same game shape); ensure watchlist stores backend game ids.

6. **Backend: Chat**  
   Implement intent classifier, tool implementations (Steam, Twitch, RAWG), and LLM-with-tools flow; connect Chat screen to new chat endpoint.

7. **Cleanup**  
   Remove or reduce `mockPopularGames.js` to only dev/fallback data if desired; ensure all production paths use API and shared helpers.

---

_Generated from codebase scan for backend and real-data implementation planning._
