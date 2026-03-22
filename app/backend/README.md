# GameTrend / NEXA Backend

FastAPI backend for the GameTrend app (NEXA tab: recommendations, game details, IGDB autocomplete). Runs on port 8000 by default.

## Setup

1. **Create and activate a virtual environment** (from this `backend/` directory):

   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate   # macOS/Linux
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**

   Copy `env_template.txt` to `.env` (or copy `.env.example` to `.env`) and set:

   - `OPENAI_API_KEY` – [OpenAI API keys](https://platform.openai.com/api-keys)
   - `RAWG_API_KEY` – [RAWG API](https://rawg.io/apidocs)
   - `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` – [Twitch Developer Console](https://dev.twitch.tv/console)
   - `STEAM_API_KEY` – [Steam Web API Key](https://steamcommunity.com/dev/apikey) for `/api/trending` (current player counts).
   - `REDIS_URL` – (optional) Redis connection URL for backend cache (e.g. from [Redis Cloud](https://redis.com/try-free/)). If unset, the backend runs without Redis; cache is skipped.

   For local development you can use the same keys as in the app’s `.env` in the parent directory.

## Run

```bash
python start.py
```

Server listens at **http://localhost:8000** (and on all interfaces so your phone can reach it at `http://YOUR_PC_IP:8000` when testing with Expo).

- API base URL for the app: `http://localhost:8000/api` (or `http://YOUR_PC_IP:8000/api` for device).
- Health check: `GET /health`
- Cache status: `GET /api/cache-status` — returns `{"redis": "connected"}` or `{"redis": "not_configured"}`.
- Trending games (Steam): `GET /api/trending` — returns list of popular games (current Steam player counts). Cached in Redis for 48h when `REDIS_URL` is set.
