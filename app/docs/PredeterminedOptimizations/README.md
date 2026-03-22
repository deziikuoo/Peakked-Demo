# Predetermined Optimizations for Backend Integration

This document tracks the performance optimizations that matter most as GameTrend moves from mock data to a real backend, larger datasets, and a larger user base.

The list is intentionally split between **frontend** and **backend**. If an optimization could help both, it is placed under the side where it will likely provide the biggest performance win.

## Status Key

- `Completed` = already implemented in the current app
- `Planned` = should be added next as traffic/data grows
- `Future` = useful later, but not a near-term priority yet
- `Partial` = started in some places, but not consistently applied across the app

---

## Frontend Optimizations

These optimizations focus on keeping the mobile app responsive, reducing JS-thread work, and preventing unnecessary re-renders.

| Status | Optimization | Where it helps most | Notes |
|---|---|---|---|
| `Completed` | Debounced watchlist persistence | `WatchlistContext` | We already debounce local persistence with a single code path; no duplicate persistence logic. Once the backend exists, the same pattern should debounce watchlist sync API calls instead of sending one request per toggle. |
| `Completed` | Memoized watchlist derivation | `WatchlistContext` | `watchlist` is memoized with minimal deps; derivation is centralized and redundant list builds removed. Keeps list references stable and reduces avoidable re-renders as My Games grows. |
| `Completed` | Stable context value | `WatchlistContext` | Context value is memoized with correct dependency arrays; consumers only re-render when relevant watchlist data changes. Value construction is consolidated (state vs. actions split) with no dead or duplicate context shapes. |
| `Completed` | Local TTL cache for watchlist game lookups | `WatchlistContext` | A 1-hour cache exists with explicit expiry and cleanup of stale entries; no duplicate cache paths. Good foundation for a future normalized client cache. |
| `Completed` | Memoized list items | `WatchlistCard`, `CardWithEntrance` | `React.memo` in use for My Games list items with stable callback props from parents; no redundant wrapper components. Becomes more valuable as favorites and list updates increase. |
| `Completed` | FlatList virtualization tuning | `PopularScreen` | `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` configured on Popular layouts; tuning lives in one place per list type with no duplicated config. |
| `Completed` | Native-driver animations where supported | several screens/components | Opacity/translate animations use `useNativeDriver: true` where supported; legacy non-driver paths removed or isolated so JS-thread animation work is minimized. |
| `Completed` | Reanimated for advanced motion | Sparkline, SparklineScrubbable, My Games, Popular, Compare, modals, splash, NEXA | Heavy and gesture-driven motion use Reanimated (worklets, shared values, withTiming/withSpring). RN Animated retained only where Reanimated is not viable (e.g. documented web/SVG limitation); no duplicate motion implementations. |
| `Completed` | Defer non-urgent JS work | Popular, My Games, Chat, future sync flows | Implemented via single `deferAfterInteractions()` helper (see `app/utils/deferAfterInteractions.js`). Used in PopularScreen, WatchlistContext, and ChatScreen with consistent cancel/cleanup; no ad-hoc defer logic. New sync/cache work should use the same helper. |
| `Completed` | Keep JS-thread work minimal | Popular, My Games, Chat, NEXA | Memoized derived data and sections in Popular; stable callbacks and list props across Popular, Chat, NEXA; WatchlistContext split into state/actions; list cards and MessageBubble memoized; professional cleanup of redundant logic, dependency arrays, and inline styles. |
| `Completed` | Replace long-history `ScrollView` screens with virtualized lists where needed | Chat and any future activity/history views | ChatScreen message list replaced with inverted FlatList; stable keyExtractor/renderItem; ListEmptyComponent for empty state; virtualization tuning. Future activity/history views should follow the same pattern. |
| `Completed` | Client-side normalized cache by game ID | Popular, My Games, detail modals | Shared GameCacheContext keyed by game id; Popular and Watchlist derive lists from cache; TTL and max-size eviction; no timers, lazy eviction only. CompareScreen resolves slot ids via cache. |
| `Completed` | Image caching / thumbnail strategy | all game cards and detail views | expo-image used for all game thumbnails and detail views; disk and memory caching; consistent contentFit and sizing; optional prefetch with defer and cleanup. Larger assets on demand can be added later via a detail-only URL. |
| `Future` | Native modules or true off-main-thread processing for CPU-heavy work | charts, media processing, offline ranking | This is only worth doing for real hotspots such as large history processing, heavy image transforms, or future on-device recommendation logic. |
| `Check` | Check that all implemented features and their optimization upgrades are with large data and user bases in mind. |

### Frontend Notes

- The app is already following several strong baseline patterns: debounce, memoization, stable references, and list virtualization.
- **Cleanup on unmount:** Completed optimizations that use timers or deferred work (WatchlistContext, PopularScreen, ChatScreen, SparklineScrubbable, GameDetailModal, SplashScreen) include cleanup on unmount to prevent leaks and setState-after-unmount.
- **Defer non-urgent work:** Use `deferAfterInteractions()` from `app/utils/deferAfterInteractions.js` (wraps `InteractionManager.runAfterInteractions`) for work that does not need to run during taps, scrolls, or transitions. Good targets: filter recalculation side effects, cache cleanup, sync reconciliation, and post-navigation work. Future sync flows should follow this pattern by default.
- **Reanimated usage:** Heavy and gesture-driven motion (chart draw/sparkle, tooltip fade, list entrances, pulse loops, modal/splash fade) use Reanimated (worklets, shared values, withTiming/withSpring) so animation runs on the UI thread. RN Animated is only used where Reanimated is not viable (e.g. documented web/SVG limitation).
- **Platform (web):** Reanimated-driven SVG path animation is disabled on web in `Sparkline` because `react-native-svg` does not implement `setNativeProps` on web; the path is shown static. Other Reanimated animations (opacity, transform) work on web.
- The next biggest frontend gains are not "use more cores directly," but rather:
  - reduce work on the JS thread
  - keep animation on the UI thread via Reanimated where already applied
  - avoid rendering more rows, charts, and images than the user can actually see

---

## Backend Optimizations

These optimizations focus on reducing network cost, avoiding repeated external API work, improving search/recommendation speed, and preparing for a large game catalog and user base.

| Status | Optimization | Where it helps most | Notes |
|---|---|---|---|
| `Planned` | Response caching for recommendation requests | NEXA recommendations and future search-entry flows | Cache the **result**, not just the raw prompt text. Cache keys should be based on normalized meaning where possible, such as preference + selected filters, rather than exact wording alone. **Important:** any future search bar that can lead into recommendation-style queries should reuse this same caching layer instead of creating a separate uncached request path. |
| `Planned` | Response caching for game-detail requests | game details, modal opens, game pages, future search result taps | Cache by normalized game title or internal game ID. This is one of the easiest and highest-value backend wins because many users will request the same game details repeatedly. **Reminder:** when search bars are added later, opening a game from search should still resolve through this detail-cache path. |
| `Planned` | Response caching for autocomplete / search suggestions | future search bars and recommendation inputs | Cache short-lived results by normalized query prefix so repeated typing patterns do not re-hit upstream APIs every time. This should be treated as part of the same overall search/recommendation caching strategy, not as a separate one-off feature. |
| `Planned` | Server-side search | search bars and query-based lookups | The app should query our backend first. Our backend should search its own catalog/index and only call upstream sources when needed. |
| `Planned` | Server-side aggregation | Popular, trends, counts, filter totals | Counts, rankings, genre totals, popularity summaries, and "top games" should be computed server-side so the client receives already-prepared data instead of large raw datasets. |
| `Planned` | Internal normalized game catalog | all game-related features | Maintain our own canonical game records with internal IDs, aliases, platforms, genres, artwork references, and mappings to Steam/Twitch/upstream identifiers. |
| `Planned` | Historical metric storage | popularity graphs, trend detection, compare views | Store periodic snapshots of player counts, stream counts, and related metrics so the app can show trends without rebuilding history from fresh live API calls every time. |
| `Planned` | Background ingestion jobs | Steam/Twitch syncing and freshness | Use scheduled jobs/workers to fetch and refresh upstream data in the background instead of waiting for user requests to trigger every external API call live. |
| `Planned` | Lightweight endpoints by use case | Popular, My Games, detail, compare, chat | Return only the fields each screen needs. For example, My Games should not need the same payload size as a full detail response. |
| `Planned` | Pagination and cursor-based loading | browse/search/popular catalog endpoints | Never send the full catalog to the client. Return pages or cursors so the app only loads what is visible or requested. |
| `Planned` | Batched or delta watchlist sync endpoint | favorites/watchlist syncing | Instead of one API call per like/unlike, support a single sync or delta endpoint so rapid changes can be batched efficiently. |
| `Planned` | Retry, queueing, and backoff around upstream APIs | all third-party integrations | Protect the app from Twitch/Steam latency, outages, and rate limits. Failed upstream calls should not always become direct user-facing failures. |
| `Planned` | Precomputed rankings and summaries | Popular and NEXA | Frequently-requested results such as top games, trending lists, or featured summaries should be precomputed and cached, not rebuilt from scratch per request. |
| `Future` | Semantic intent normalization for natural-language caching | Chat/NEXA text prompts | This is how prompts like `How popular is The Finals` and `Is The Finals played by lots of people` can share the same cached meaning if the backend maps both to the same intent/entity. |
| `Future` | Search index / ranking engine | large-scale catalog search | Once the game catalog grows substantially, use a proper search/indexing layer rather than relying only on simple database `LIKE` queries. |

### What the Backend / DB Should Hold

As the app grows, our database should become the app's source of truth for:

- users, favorites/watchlists, and settings
- a normalized internal game catalog
- mappings between our game IDs and Steam/Twitch/upstream IDs
- cached external API responses that are safe to reuse
- historical snapshots for player counts, stream counts, and trend data
- search/ranking metadata used to power Popular, Compare, Chat, and NEXA

This means the app should gradually depend less on raw client-side transformations of large datasets and more on fast, focused responses from our own backend.

### Backend Notes

- "Server-side aggregation/search" does **not** mean removing APIs entirely.
- It means the mobile app should usually call **our backend first**.
- Our backend can then:
  - search our own DB/index
  - use cached upstream data when possible
  - call Steam/Twitch or other APIs only when needed

This keeps the mobile app lighter and prevents repeated expensive work across users.

### Reminder for Future Search Bars

When we eventually add one or more search bars to the app, they should **not** bypass the caching work planned above.

- Search bars that lead to recommendations should reuse the same recommendation-cache path.
- Search bars that open game pages or modals should reuse the same detail-cache path.
- Search suggestions/autocomplete should use short-lived query-prefix caching.
- If natural-language search is added later, it should plug into the same normalized intent/entity caching strategy described above.

This note is here specifically so future search UI work does not accidentally introduce a brand-new uncached request flow.

---

## Priority Order

If performance work needs to be phased in, prioritize in this order:

1. Frontend JS-thread reduction and render control
2. Backend response caching for details, recommendations, and autocomplete
3. Backend server-side search/aggregation and lightweight endpoints
4. Frontend Reanimated/worklet expansion for high-frequency UI
5. Native-module/off-main-thread processing only for proven hotspots

---

## Summary

- Several important frontend optimizations are **already completed**: debounced persistence, memoized watchlist/context, local TTL caching, memoized My Games cards, and FlatList tuning in Popular. Each completed item includes proper cleanup (no redundant logic, minimal dependency arrays, and consistent patterns) as noted in the table.
- The next frontend gains come from reducing JS-thread work, expanding virtualization, and moving more complex motion off the JS thread.
- The next backend gains come from caching responses, building a normalized internal catalog, and doing search/ranking/aggregation on the server instead of in the client.
- As live traffic grows, the app should increasingly rely on **our backend as the performance layer** between the mobile UI and third-party services like Steam and Twitch.
