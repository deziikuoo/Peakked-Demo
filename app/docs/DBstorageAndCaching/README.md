# DB, Storage & Caching — Detailed Plan

This document defines the caching and database strategy for GameTrend in production: multiple users, high read volume, and strict control over external API calls (Twitch, Steam, RAWG, YouTube, etc.).

---

## 1. Goals

- **Limit external API calls** by caching responses at the device and at the backend.
- **Fast experience** on app boot and navigation (no unnecessary backend or DB reads).
- **Predictable expiry** of cached data (48–72h at backend; 15–30 min at device for trending).
- **Scale to a large user base** without thundering-herd updates or mass write spikes.
- **Reliable cache eviction** (prefer automatic TTL over manual delete scripts).

---

## 2. Three-Layer Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Device (in-memory + persistent)                                │
│  • In-memory: GameCacheContext (game.id → game, 1h TTL)                  │
│  • Persistent: API response cache (e.g. trending, game:{id}, 15–30 min)   │
│  • On read: memory → persistent → only then call backend                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ miss / expired
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Backend cache (server)                                         │
│  • Redis (recommended): key-value, TTL 48–72h, one read per request       │
│  • Alternative: MongoDB with TTL index on expiresAt                       │
│  • On read: one lookup → hit return / miss → call Layer 3 → write → return │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ miss
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: External APIs                                                  │
│  • Twitch, Steam, RAWG, YouTube, etc.                                    │
│  • Called only on backend cache miss; result written to Layer 2           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Request flow (no “two DB checks”):**

1. **Device**: Check in-memory cache → then persistent cache. If hit and not expired → **return immediately (zero backend calls)**.
2. **Backend** (only when device cache miss/expired): **One** read from Redis (or MongoDB). If hit → return.
3. **On backend miss**: Call external API once → write to backend cache with TTL → return to client. Client may then write to device cache.

---

## 3. Layer 1 — Device (Client)

### 3.1 In-memory cache (existing)

- **Current**: `GameCacheContext` — `Map<game.id, { game, expiresAt }>`, TTL 1 hour, **max 400 entries**, LRU-style eviction on set.
- **Role**: Normalized game objects so Popular, Compare, My Games, and detail modals share one reference per game. Avoids duplicate network requests for the same game in a session.
- **400 is a capacity cap, not “400 games on boot”**: The cache can hold at most **400 distinct game objects** in memory during a session. It is filled over time from: the initial trending list, games opened in the detail modal, games added in Compare, watchlist, and search. When the cache would exceed 400 entries, the least-recently-used or expired entries are evicted. The user does **not** receive 400 games on the Popular tab at boot.
- **What loads on boot**: Only the **trending/popular list** is loaded (e.g. currently 10 games with mock data; with real API typically **20–50 or up to ~100** games). Each game in that list includes full stats, peak time data, views, player count, stream count, rating, and time-series for sparklines. That list is what the user scrolls through; the 400 cap simply allows the cache to also hold additional games they open later without unbounded growth.
- **Action**: Keep as-is. Feed from API responses (trending list, game details, watchlist resolution). No second “DB check” — this is the first place we look.

### 3.2 Persistent API response cache (to implement)

- **Purpose**: Survive app restart so returning users often get data without calling the backend.
- **Storage**: AsyncStorage (React Native) / localStorage or equivalent (web). Optionally a wrapper (e.g. MMKV) for larger or faster access.
- **Schema (logical)**:
  - Key: resource identifier, e.g. `trending`, `game:{id}`, `search:{normalizedQuery}`.
  - Value: `{ data: <payload>, fetchedAt: <timestamp> }` (JSON).
- **TTL (suggested)**:
  - Trending list: **15–30 minutes**.
  - Single game: **30–60 minutes**.
  - Search results: **15–30 minutes**.
- **Flow**: Before any request to backend for a given resource, check this store. If key exists and `fetchedAt + TTL > now`, use `data` and **do not call backend**. Otherwise request from backend; on success, write `{ data, fetchedAt }` and optionally seed `GameCacheContext` for games.

### 3.3 Boot and “two DB checks”

- **No second DB check on device**: We only have one persistent cache lookup per resource (e.g. one read for `trending`). If that’s a hit, we never touch the backend.
- **Backend**: One cache read (Redis or Mongo) per request that reaches the server. So “two DB checks” is avoided by design: at most one device cache read and one backend cache read, and often zero backend calls.

### 3.4 What to target per device

Device memory and persistent storage are **not shared with other apps**; each app has its own RAM and sandboxed storage. We still cap usage so our app stays light and does not trigger OS or browser eviction.

| Layer | Shared with other apps? | Typical limit (environment) | Target per device |
|-------|-------------------------|-----------------------------|-------------------|
| **In-memory** | No (app process only) | OS process limit; no fixed MB exposed | **A few MB** for the game cache. Enforce via **max entries** (e.g. **200–500**); current 400 is in range. No need to measure MB in code. |
| **Persistent** | No (app sandbox) | Web: ~5–10 MB per origin (localStorage); mobile: app-specific, can be evicted under pressure | **~2–5 MB** for the API response cache. Enough for trending list(s), 20–50 game payloads, and a few search results. Enforce with a **total size cap** (e.g. evict oldest when &gt; 5 MB) or a **response count cap** (e.g. max 30–50 cached responses, evict by oldest `fetchedAt`). On **web**, stay under **~5 MB** to avoid localStorage quota. |

- **In-memory**: One game object (metadata + time-series) is on the order of ~5–15 KB. 400 × ~10 KB ≈ ~4 MB, which is small relative to typical app RAM. Keeping a 200–500 entry cap keeps the cache bounded across devices.
- **Persistent**: Implement eviction when either total size exceeds the target (e.g. 5 MB) or count exceeds a limit (e.g. 50 responses); prefer evicting oldest-first by `fetchedAt`.

---

## 4. Layer 2 — Backend cache (server)

**Chosen stack: Redis + MongoDB.** Redis is used first for the backend cache (this document and the backend code). MongoDB will be added later for durable data (user accounts, server-side watchlists, analytics). Until then, the backend uses Redis only for caching.

### 4.1 Redis (in use)

- **Why**: Built-in TTL (no delete scripts), very fast reads, single-read-per-request pattern, scales well for key-value cache.
- **Key design** (examples):
  - `trending:v1` — list of trending games (or key per source, e.g. `trending:steam`, `trending:twitch`).
  - `game:{id}` — full game object (stats, time-series, etc.) by stable game id.
  - `search:{normalized_query}` — search/autocomplete result set (optional).
- **Value**: JSON string of the API response (or normalized game shape).
- **TTL**: **48–72 hours** (configurable; shorter for larger user base if desired).
- **Flow**: On API request, compute key → GET. If hit → return. If miss → call external API → SET with TTL → return. No second lookup.
- **Connecting Redis in this project**: Set `REDIS_URL` in the backend `.env` (see `app/backend/env_template.txt` and README). The backend uses `app/backend/redis_cache.py`: it connects on startup, closes on shutdown, and exposes `cache_get`, `cache_set`, `cache_get_json`, `cache_set_json`. If `REDIS_URL` is unset, the cache is disabled and the app runs without Redis. Verify with `GET /api/cache-status`.

### 4.2 MongoDB (to be added later)

- **Planned use**: Durable data (user accounts, server-side watchlists, analytics, long-term game catalog). Redis remains the primary cache; MongoDB will be used for persistence and querying, not for TTL-based cache eviction.
- **When added**: Use for data that must survive restarts and be queryable. Cache stays in Redis only.

### 4.3 Redis + MongoDB (chosen)

- **Redis**: Primary cache for high-throughput reads (trending, game by id). In use now; connect via `REDIS_URL` (see backend README and `redis_cache` module).
- **MongoDB**: To be added later for persistent data (user accounts, server-side watchlists, analytics). Cache stays in Redis; MongoDB for durability and querying only.

---

## 5. Layer 3 — External APIs

- **Called only on backend cache miss** (and when the request reached the backend).
- **After response**: Backend writes to Layer 2 (Redis or MongoDB) with TTL, then returns to client. Client may write to Layer 1 (persistent + in-memory).
- **Rate limits**: Respect Twitch, Steam, RAWG, etc. The staggered refresh (below) helps keep call volume within limits.

### 5.1 Batch and bulk API calls (minimize calls)

**Principle**: Gather as much information as possible in as few calls as possible. Avoid N+1 patterns (e.g. one call per game). Use batch, bulk, or list endpoints where the provider supports them.

- **Backend responsibility**: When building the trending list, resolving N games, or refreshing cache, call each external API with the **maximum allowed batch size** or the **smallest number of requests** that still return the required data. Then write the combined result to the backend cache once.
- **Design**: Prefer one (or few) “build trending” or “resolve games” flows that call Twitch once (e.g. top games + stream counts), Steam once (e.g. top apps + player counts), RAWG in batch (e.g. by ID or name list), and YouTube once if needed — rather than one call per game for each source.

### 5.2 Per-provider batching guidance

| Provider | Batching approach | Notes |
|----------|-------------------|--------|
| **Twitch** | Use Helix endpoints that return multiple items: e.g. `games` (top by viewer count, `first=100`), `streams` with `game_id` for a single game, or multiple `game_id` where the API allows. Fetch “top games” in one or few calls; then stream counts per game from the same or minimal additional calls. | Avoid one request per game when building a list. |
| **Steam** | Use endpoints that return lists (e.g. top current players, app list chunks). Request the full set needed for “trending” in one or few calls; map to game metadata in the same flow. | Check Steam Web API docs for batch/list limits. |
| **RAWG** | Already supports batch-like usage: e.g. search or list endpoints with `page_size` (max per request). For multiple games, use the smallest number of requests (e.g. one request per N game IDs/names if no native batch, or use “games” list endpoint with filters). | Existing `fetch_game_details(titles)` pattern is good; ensure it uses max reasonable batch size per request. |
| **YouTube** | Use Data API v3 with `maxResults` at the allowed maximum per request. For “trending” or views per game, design one or few queries (e.g. by topic or search) that return many items per call. | Avoid one request per game or per video. |

- **Aggregation on backend**: When building the unified “trending” or “game details” response, merge results from these batched calls in backend code; then cache and return a single response to the client. The client never triggers one-call-per-game; the backend does a small number of batched external calls per cache miss or refresh cycle.

---

## 6. Staggered batch refresh (no mass update spike)

### 6.1 Problem

- Refreshing “all” cached keys in one window causes a burst of external API calls and DB writes, risking rate limits and slow performance.

### 6.2 Approach: Staggered, incremental refresh

- **Background job** (e.g. every 10–15 minutes):
  - **Select a subset of keys** to refresh, e.g.:
    - Always refresh: `trending` (and any other global list).
    - Plus: top N most-requested game IDs (if you track access), or
    - A **shard** of keys: e.g. `key_hash % num_shards == run_index` so over time all keys get refreshed.
  - For each key: call external API → **update cache in place** (Redis SET with new TTL, or MongoDB update with new `expiresAt`). Do not “delete all then reinsert.”
- **Rate limiting**: In the job, cap external API calls per minute (e.g. max X per source) to stay under provider limits.
- **Effect**: Load on external APIs and on the cache store is spread over time; no single “mass update” event.

### 6.3 Optional: Priority by popularity

- Refresh “trending” and top-requested games more often; long-tail games less often. Reduces total calls while keeping hot data fresh.

---

## 7. User updates: pull, not push

### 7.1 Recommended: activation + time-based pull

- **On app activate (foreground)**: If device cache for a resource (e.g. trending) is older than X minutes (e.g. 15–30), refetch from backend. Backend serves from its cache (Redis/Mongo).
- **While app is open**: Optional periodic refetch (e.g. every 30 min) for visible data.
- **No full-data push**: Do not push full payloads to all users. That does not scale and is unnecessary.

### 7.2 Optional: lightweight push later

- If you add push notifications: send only a **signal** (“new data available”) or a **version/ETag**. App then refetches on next open or when it next needs that resource. Keeps backend and devices from handling huge push payloads.

### 7.3 Schedule vs activation

- **Activation-based** (refetch when app opens and cache is stale) spreads load naturally across users.
- **Fixed global schedule** (e.g. “all users at midnight”) creates thundering herd. Prefer activation + optional max interval (e.g. “refetch at least every 30 min when in foreground”).

---

## 8. Optional: version / ETag

- Backend can return a **version** or **ETag** (e.g. `lastUpdated` or hash of payload) with each response.
- App stores it with the cached response. On next request, app sends `If-None-Match: <etag>` (or equivalent). Backend compares; if unchanged, returns **304 Not Modified**; app reuses local cache.
- Reduces bandwidth and work when data has not changed.

---

## 9. Addressing specific concerns

| Concern | Approach in this plan |
|--------|------------------------|
| **Slow initial boot / “two DB checks”** | Device cache (in-memory + persistent) so many boots need **zero** backend calls. When backend is hit: **one** cache read (Redis or Mongo); on miss, one external API call and one cache write. |
| **Mass updates causing performance issues** | Staggered background refresh (shard or top-N), update in place, rate-limited external calls. No single “refresh everything” window. |
| **Cache DB not deleting (e.g. MongoDB)** | Prefer **Redis** for cache (automatic TTL). If using MongoDB for cache: use a **TTL index** on a date field; avoid relying on manual delete scripts for normal expiry. |

---

## 10. Implementation checklist (high level)

- [ ] **Device persistent cache**: Add storage layer (AsyncStorage/localStorage or MMKV) with keys like `trending`, `game:{id}`; TTL 15–30 min (trending), 30–60 min (game). Check before every backend call for that resource. Enforce per-device cap: ~2–5 MB total or max response count (e.g. 30–50), evict oldest-first.
- [ ] **Device in-memory cap**: Keep GameCacheContext max entries in 200–500 range (current 400 is fine). Ensures in-memory cache stays on the order of a few MB.
- [ ] **Backend cache**: Introduce Redis (or MongoDB with TTL index). Single read per request; on miss call external API, then write with 48–72h TTL.
- [ ] **Batch external API calls**: Implement trending/game-resolution flows so each provider (Twitch, Steam, RAWG, YouTube) is called with batch or list endpoints and max allowed size; merge results on backend and cache once. No N+1 (one call per game).
- [ ] **API request flow**: All “cacheable” endpoints (trending, game by id, etc.) go through: device cache → backend cache → external API (batched) → write backend cache → return; client updates device cache.
- [ ] **Background refresh job**: Scheduled job (e.g. every 10–15 min) to refresh a subset of keys (trending + shard or top-N) using batched external calls, update in place, with rate limiting.
- [ ] **Client refresh policy**: On app activate, if device cache older than X min, refetch; optional periodic refetch while in foreground. No full-data push.
- [ ] **Optional**: Version/ETag on responses and 304 when unchanged.
- [ ] **Optional**: Redis + MongoDB (Redis for cache, MongoDB for persistent data and analytics).

---

## 11. Relation to other docs

- **ImplementingRealData (README.md)**: Describes which features need real data and which APIs (Twitch, Steam, RAWG, etc.) feed them. This document describes **how** to cache and store that data (device, backend, external) and how to refresh it without overloading APIs or the backend.
- **Backend** (`app/backend`): Will implement the Layer 2 cache (Redis or MongoDB), the single-read-per-request flow, and the staggered refresh job. Frontend will implement Layer 1 persistent cache and the activation/interval refresh policy.

---

*This plan is the single source of truth for DB, storage, and caching strategy for GameTrend production.*
