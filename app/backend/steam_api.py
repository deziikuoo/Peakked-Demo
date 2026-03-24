"""
Steam API integration for trending/popular games.
Uses ISteamUserStats GetNumberOfCurrentPlayers (one request per app ID).
Curated app list provides name, genre, thumbnail; Steam provides player count only.
"""
import asyncio
import logging
import os

import aiohttp

logger = logging.getLogger("nexa-backend")

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
STEAM_PLAYERS_URL = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/"
STEAM_HEADER_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg"
CONCURRENCY_LIMIT = 8
TRENDING_CACHE_KEY = "trending"
TRENDING_TTL_SECONDS = 48 * 3600  # 48 hours

# Curated list: Steam app ID, name, genre, thumbnail (optional; default CDN used).
STEAM_APP_LIST = [
    {"appId": 730, "name": "Counter-Strike 2", "genre": "FPS"},
    {"appId": 570, "name": "Dota 2", "genre": "MOBA"},
    {"appId": 271590, "name": "Grand Theft Auto V", "genre": "Open World"},
    {"appId": 1172470, "name": "Apex Legends", "genre": "Battle Royale"},
    {"appId": 578080, "name": "PUBG: Battlegrounds", "genre": "Battle Royale"},
    {"appId": 252490, "name": "Rust", "genre": "Survival"},
    {"appId": 1245620, "name": "Elden Ring", "genre": "RPG"},
    {"appId": 1085660, "name": "Destiny 2", "genre": "FPS"},
    {"appId": 1938090, "name": "Call of Duty: Black Ops 6", "genre": "FPS"},
    {"appId": 236390, "name": "War Thunder", "genre": "Simulation"},
    {"appId": 1966720, "name": "Lethal Company", "genre": "Horror"},
    {"appId": 1811260, "name": "EA Sports FC 25", "genre": "Sports"},
    {"appId": 1222670, "name": "The Sims 4", "genre": "Simulation"},
    {"appId": 292030, "name": "The Witcher 3: Wild Hunt", "genre": "RPG"},
    {"appId": 1091500, "name": "Cyberpunk 2077", "genre": "RPG"},
    {"appId": 1240440, "name": "Hades II", "genre": "Roguelike"},
    {"appId": 1817230, "name": "Palworld", "genre": "Survival"},
    {"appId": 553850, "name": "Helldivers 2", "genre": "Action"},
    {"appId": 1430190, "name": "Killing Floor 3", "genre": "FPS"},
    {"appId": 218620, "name": "PAYDAY 2", "genre": "Action"},
    {"appId": 393380, "name": "Hearts of Iron IV", "genre": "Strategy"},
    {"appId": 236850, "name": "Euro Truck Simulator 2", "genre": "Simulation"},
    {"appId": 227300, "name": "Euro Truck Simulator", "genre": "Simulation"},
    {"appId": 359550, "name": "Tom Clancy's Rainbow Six Siege", "genre": "FPS"},
    {"appId": 489830, "name": "The Elder Scrolls V: Skyrim Special Edition", "genre": "RPG"},
    {"appId": 306130, "name": "The Elder Scrolls Online", "genre": "MMO"},
    {"appId": 440, "name": "Team Fortress 2", "genre": "FPS"},
    {"appId": 105600, "name": "Terraria", "genre": "Adventure"},
    {"appId": 262060, "name": "Rise of the Tomb Raider", "genre": "Action"},
    {"appId": 275850, "name": "No Man's Sky", "genre": "Adventure"},
    {"appId": 281990, "name": "Stellaris", "genre": "Strategy"},
    {"appId": 322330, "name": "Don't Starve Together", "genre": "Survival"},
    {"appId": 346110, "name": "ARK: Survival Evolved", "genre": "Survival"},
    {"appId": 381210, "name": "Dead by Daylight", "genre": "Horror"},
    {"appId": 582660, "name": "Black Desert Online", "genre": "MMO"},
    {"appId": 1599340, "name": "Lost Ark", "genre": "MMO"},
    {"appId": 1174180, "name": "Red Dead Redemption 2", "genre": "Open World"},
    {"appId": 1248130, "name": "Baldur's Gate 3", "genre": "RPG"},
    {"appId": 1671340, "name": "Last Epoch", "genre": "RPG"},
    {"appId": 1142710, "name": "Persona 3 Reload", "genre": "RPG"},
    {"appId": 2050650, "name": "Concord", "genre": "FPS"},
    {"appId": 1888160, "name": "EAS FC 24", "genre": "Sports"},
]


def _thumbnail_url(app_id: int) -> str:
    return STEAM_HEADER_CDN.format(app_id=app_id)


def _empty_game_shape(app_id: int, name: str, genre: str, player_count: int) -> dict:
    """Return one game in the unified shape expected by the frontend."""
    return {
        "id": str(app_id),
        "name": name,
        "genre": genre,
        "thumbnail": _thumbnail_url(app_id),
        "playerCount": player_count,
        "streamCount": 0,
        "viewCount": 0,
        "rating": None,
        "history": [],
        "streamHistory": [],
        "viewHistory": [],
        "history7d": [],
        "streamHistory7d": [],
        "viewHistory7d": [],
        "history30d": [],
        "streamHistory30d": [],
        "viewHistory30d": [],
        "events": [],
    }


async def get_current_players(app_id: int) -> int:
    """
    Call Steam GetNumberOfCurrentPlayers for one app ID.
    Returns player count or 0 on error.
    """
    if not STEAM_API_KEY:
        return 0
    url = f"{STEAM_PLAYERS_URL}?appid={app_id}&key={STEAM_API_KEY}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    logger.warning("Steam API %s returned %s for app %s", url, resp.status, app_id)
                    return 0
                data = await resp.json()
                body = data.get("response") or {}
                count = body.get("player_count")
                return int(count) if count is not None else 0
    except asyncio.TimeoutError:
        logger.warning("Steam API timeout for app %s", app_id)
        return 0
    except Exception as e:
        logger.warning("Steam API error for app %s: %s", app_id, e)
        return 0


async def get_trending_steam(app_list: list[dict] | None = None) -> list[dict]:
    """
    For each app in the curated list, fetch current players from Steam (with limited concurrency),
    merge with static name/genre/thumbnail, sort by player count descending.
    Returns list of games in unified shape (empty history/events).
    """
    apps = app_list or STEAM_APP_LIST
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async def fetch_one(entry: dict) -> dict:
        app_id = entry["appId"]
        async with sem:
            count = await get_current_players(app_id)
        return _empty_game_shape(
            app_id,
            entry.get("name", "Unknown"),
            entry.get("genre", "Other"),
            count,
        )

    results = await asyncio.gather(*[fetch_one(e) for e in apps])
    # Sort by player count descending
    results = sorted(results, key=lambda g: g["playerCount"], reverse=True)
    return results
