# GameTrend Roadmap

Video game popularity app: live data from Steam, Twitch, YouTube, and multi-platform ratings. **Popular games first** as the main UI; chat lives in a separate tab for specific questions. This roadmap defines the product focus, data sources, and backend architecture (cost-optimized, tool-based).

---

## 1. UI model: popular games first, chat in a tab

- **Default / home:** **Popular games** tab — at-a-glance view of what's trending (live player counts, live streams, top games by platform). Primary entry point.
- **Second tab:** **Chat** — for specific questions: "How many people are playing X?", "Who's streaming Y?", "What's the rating for Z?", "Compare A and B." Same tool-based AI as before; chat is for deeper or custom queries.
- Tabs are always visible (e.g. bottom tab bar: **Popular** | **Chat**). Opening the app lands on Popular.

---

## 2. Data sources (live and ratings)

| Need | Source | What you get |
|------|--------|--------------|
| **Live player counts** | Steam (Steamworks Web API / public stats) | Concurrent players per game. |
| **Live streams** | Twitch API | Streams per game, viewer counts, "who's streaming what now." |
| **YouTube gaming** | YouTube Data API v3 | Views, live streams; channel/video metrics for games. |
| **Ratings (multi-platform)** | Steam (reviews), IGDB, RAWG, OpenCritic | Review scores, recommendation %, aggregate scores. |
| **Trending / "what's hot"** | Twitch (top games by viewers), Steam (top by current players), YouTube (trending) | Rankings by current popularity. |

---

## 3. Backend: intent classification (rule-based)

Before each LLM call (in the **Chat** tab), the backend runs a **lightweight rule-based classifier**. No extra LLM call; minimal tokens.

### 3.1 Intents and tool mapping (game popularity)

| Intent | Trigger examples | Tools attached |
|--------|------------------|----------------|
| `player_count` | player count, how many playing, concurrent, steam players | `get_player_count` |
| `live_streams` | streams, streaming, who's streaming, twitch, viewers | `get_live_streams` |
| `ratings` | rating, score, review, metacritic, steam review | `get_ratings` |
| `trending` | trending, popular, top games, what's hot | `get_trending_games` |
| `compare` | compare, vs, versus, difference between | `compare_popularity` |
| `image` | image, picture, generate, draw, fan art | image-generation tool |
| `general` | (fallback) what is, explain, when | None or 1–2 safe defaults |

### 3.2 Implementation notes

- Single pass over the user message (normalized: lowercase, trim). First match wins.
- Fallback: if no match, treat as `general`. Keep logic in one place (e.g. `classifyIntent(message) -> string[]`).

---

## 4. Minimal tool schemas (chat tab)

Attach only the tools selected by the classifier. Short names, one-line descriptions.

- `get_player_count` – "Current concurrent players on Steam for a game." Params: `game_id` or `game_name`.
- `get_live_streams` – "Live streams and viewer count for a game (e.g. Twitch)." Params: `game_id` or `game_name`.
- `get_ratings` – "Aggregate and platform ratings for a game (Steam, Metacritic, etc.)." Params: `game_name`.
- `get_trending_games` – "Top games by players and/or viewers right now." Params: `platform` (optional).
- `compare_popularity` – "Compare player count, streams, and ratings for 2–3 games." Params: `game_names[]`.
- Image tool – "Generate an image from a text description." Params: `prompt`, `style` (optional).

---

## 5. System prompt and caching (OpenAI)

- **Short system prompt:** e.g. "You are a concise game popularity expert. Use only the tools provided when you need live or accurate data. Answer accurately and clearly."
- **Single, static prompt** for all requests so OpenAI can cache it. Only tool definitions and user message change per request.
- No strict length limits; allow full, quality answers.

---

## 6. End-to-end request flow (Chat tab)

1. User sends a message in the Chat tab.
2. Rule-based classifier → one or more intents → minimal set of tool definitions.
3. Call OpenAI with cached system prompt, user message, and selected tools only.
4. If the model calls a tool, backend calls Steam/Twitch/YouTube/ratings API, then returns tool results to the model.
5. Model returns final answer; backend responds to user (and optionally surfaces a card in the thread).

---

## 7. Popular tab: what to show

- **Primary content:** List or grid of **popular games right now** — e.g. top N by Steam concurrent players and/or Twitch viewers. Each item can show: name, thumbnail, player count, stream count, optional rating.
- **Refresh:** Pull-to-refresh or auto-refresh so data feels live.
- **Tap a game:** Optional detail (bigger card with player count, streams, ratings) or "Ask in Chat" to open Chat tab with context.
- Data for this tab can come from the same backend tools (`get_trending_games`, or aggregated from Steam + Twitch APIs) or from a dedicated "trending" endpoint.

---

## 8. User value (game popularity)

- **See what's hot** — One place for live player counts, streams, and ratings without opening Steam, Twitch, and review sites.
- **Specific questions** — Chat tab: "How many people are playing X?", "Who's streaming Y?", "What's the rating for Z?", "Compare A and B."
- **Multi-platform** — Steam + Twitch + YouTube + ratings in one app.
- **Low friction** — Popular tab gives instant value; chat when they want to dig deeper or ask something custom.
- **Image generation** — Optional: "Draw this game," fan art, memes (chat tab).

---

## 9. Planned features

Features to add beyond the current roadmap (prioritization and implementation TBD):

- **Popularity timeline / sparkline charts** — Mini line charts on game cards (player count or viewers over 24h/7d). Tap to expand. Shows whether a game is rising, peaking, or declining at a glance.
- **Hype alerts / push notifications** — Let users watch specific games and get notified when player count spikes, a major streamer goes live, or ratings change significantly.
- **Game comparison mode** — Dedicated side-by-side comparison view for 2–3 games (players, streams, ratings, sparklines, peak times). Third tab or long-press from Popular to compare.
- **"Why is this trending?" AI summaries** — When a game spikes, auto-generate a short AI summary (new DLC, big streamer, sale, controversy) so numbers have context.
- **Live stream previews** — In game detail: top 2–3 Twitch/YouTube streams inline (thumbnail, viewer count, tap to open). Connects stats to live content.
- **Peak time predictor** — Use historical player data to show when a game typically peaks (e.g. "peaks 3 PM EST weekdays, 8 PM weekends"). Helps with matchmaking timing.
- **Personal game watchlist** — On-device favorites/watchlist. "My Games" section or filter; watchlisted games surface at top or in a mini-dashboard with stats and optional alerts.
- **Genre / category filters** — Filter Popular tab by genre (FPS, RPG, Battle Royale, etc.) or by source (Steam only, Twitch only).
- **Share cards** — Generate a shareable image card for a game (stats, sparkline, rating) with GameTrend branding. One tap to share to Discord, Twitter, stories.

**Sidelined (not planned for now):** Community pulse / sentiment (aggregate Reddit/Twitter/Steam community sentiment) — may revisit later.

---

## 10. Out of scope for this roadmap

- Exact API keys and rate limits (Steam, Twitch, YouTube, IGDB/RAWG/OpenCritic) — to be decided in implementation.
- Auth, rate limiting, persistence — separate docs.
- Game recommendation engine — this is a **popularity** app, not "recommend me a game."

---

## 11. Success criteria

- **Popular games first** as default tab; **Chat** in a second tab.
- Backend: intent classification in code only; single cacheable system prompt; minimal tool schemas; tools wired to Steam/Twitch/YouTube/ratings where applicable.
- Popular tab shows live-ish data (player count, streams, optional ratings); Chat tab answers specific questions using the same tools.
