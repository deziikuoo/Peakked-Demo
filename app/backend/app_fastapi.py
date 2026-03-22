import asyncio
import json
import logging
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List

import aiohttp
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Configure logging to stdout so it shows in terminal when run via npm
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("nexa-backend")
logger.setLevel(logging.INFO)

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Game Recommender API")


@app.on_event("startup")
async def startup_event():
    """Log startup info and environment checks."""
    missing = check_environment()
    if missing:
        logger.warning("Missing required environment variables: %s", ", ".join(missing))
    else:
        logger.info("All required environment variables found.")
    from redis_cache import connect_redis
    await connect_redis()
    logger.info("Backend startup complete. CORS enabled. Ready to accept requests.")


@app.on_event("shutdown")
async def shutdown_event():
    """Close Redis on shutdown."""
    from redis_cache import close_redis
    await close_redis()

# Request logging middleware (so you see hits in the terminal)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request: %s %s from %s", request.method, request.url.path, request.client.host if request.client else "?")
    try:
        response = await call_next(request)
        logger.info("Response: %s %s -> %s", request.method, request.url.path, response.status_code)
        return response
    except Exception as e:
        logger.exception("Error handling %s %s: %s", request.method, request.url.path, e)
        raise

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
        "https://nexa-pro.up.railway.app",
        "https://*.railway.app",
        "https://nexa-v1-plum.vercel.app",  # Vercel domain
        "https://*.vercel.app",  # All Vercel subdomains
        "*",  # Allow all origins for now - you can restrict this later
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from the React build
if os.path.exists("build"):
    app.mount("/static", StaticFiles(directory="build/static"), name="static")


# Pydantic models for request/response validation
class RecommendationRequest(BaseModel):
    preference: str
    sort_by: str = "release_date"
    filters: dict = {}


class GameDetailsRequest(BaseModel):
    title: str


# Function to get the Claude API key
def get_claude_api_key():
    return os.getenv("CLAUDE_API_KEY")


# Function to get the OpenAI API key
def get_openai_api_key():
    return os.getenv("OPENAI_API_KEY")


# Function to get the Rawg API key
def get_rawg_api_key():
    return os.getenv("RAWG_API_KEY")


# Function to check if required environment variables are set
def check_environment():
    """Check if required environment variables are available"""
    missing_vars = []

    if not get_openai_api_key():
        missing_vars.append("OPENAI_API_KEY")
    if not get_rawg_api_key():
        missing_vars.append("RAWG_API_KEY")
    if not TWITCH_CLIENT_ID:
        missing_vars.append("TWITCH_CLIENT_ID")
    if not TWITCH_CLIENT_SECRET:
        missing_vars.append("TWITCH_CLIENT_SECRET")

    return missing_vars


# --- TWITCH API INTEGRATION ---
TWITCH_CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
TWITCH_CLIENT_SECRET = os.getenv("TWITCH_CLIENT_SECRET")
TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
TWITCH_API_BASE = "https://api.twitch.tv/helix"

_twitch_token = None
_twitch_token_expiry = 0


async def get_twitch_token():
    global _twitch_token, _twitch_token_expiry
    if _twitch_token and time.time() < _twitch_token_expiry:
        return _twitch_token
    data = {
        "client_id": TWITCH_CLIENT_ID,
        "client_secret": TWITCH_CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(TWITCH_TOKEN_URL, data=data) as resp:
            resp.raise_for_status()
            result = await resp.json()
            _twitch_token = result["access_token"]
            _twitch_token_expiry = time.time() + result["expires_in"] - 60
            return _twitch_token


async def get_twitch_viewer_count(game_name):
    token = await get_twitch_token()
    headers = {"Client-ID": TWITCH_CLIENT_ID, "Authorization": f"Bearer {token}"}
    # Get the game ID from Twitch
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{TWITCH_API_BASE}/games", headers=headers, params={"name": game_name}
        ) as resp:
            data = await resp.json()
            if not data.get("data"):
                return 0
            game_id = data["data"][0]["id"]
        # Get streams for this game ID
        async with session.get(
            f"{TWITCH_API_BASE}/streams",
            headers=headers,
            params={"game_id": game_id, "first": 100},
        ) as resp:
            data = await resp.json()
            if not data.get("data"):
                return 0
            return sum(stream["viewer_count"] for stream in data["data"])


# --- END TWITCH API INTEGRATION ---

# --- IGDB API INTEGRATION ---
IGDB_CLIENT_ID = os.getenv("IGDB_CLIENT_ID", TWITCH_CLIENT_ID)
IGDB_CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET", TWITCH_CLIENT_SECRET)
IGDB_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_API_BASE = "https://api.igdb.com/v4"

_igdb_token = None
_igdb_token_expiry = 0


async def get_igdb_token():
    global _igdb_token, _igdb_token_expiry
    if _igdb_token and time.time() < _igdb_token_expiry:
        return _igdb_token
    data = {
        "client_id": IGDB_CLIENT_ID,
        "client_secret": IGDB_CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(IGDB_TOKEN_URL, data=data) as resp:
            resp.raise_for_status()
            result = await resp.json()
            _igdb_token = result["access_token"]
            _igdb_token_expiry = time.time() + result["expires_in"] - 60
            return _igdb_token


async def igdb_search_games(query, limit=5):
    try:
        token = await get_igdb_token()
        headers = {
            "Client-ID": IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
        }
        data = f'search "{query}"; fields name,slug,first_release_date,cover.url; limit {limit};'
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{IGDB_API_BASE}/games", headers=headers, data=data
            ) as resp:
                resp.raise_for_status()
                return await resp.json()
    except Exception as e:
        logger.exception("IGDB search error: %s", e)
        return []


# --- END IGDB API INTEGRATION ---


# --- IGDB AUTOCOMPLETE ENDPOINT ---
@app.get("/api/igdb-autocomplete")
async def igdb_autocomplete(q: str = Query(..., min_length=1)):
    results = await igdb_search_games(q, limit=7)
    return [
        {
            "name": g["name"],
            "slug": g.get("slug"),
            "cover": g.get("cover", {}).get("url"),
        }
        for g in results
    ]


# --- END IGDB AUTOCOMPLETE ENDPOINT ---


# Enhanced filter mapping for Claude
def filters_to_natural_language(filters: dict) -> str:
    mapping = {
        "genre": "genre",
        "platform": "platform",
        "year": "released in",
        "mode": "mode",
        "art_style": "art style",
        "perspective": "perspective",
        "difficulty": "difficulty",
        "popularity": "popularity",
        "price": "price",
        "score": "score above",
    }
    return ", ".join(f"{mapping.get(k, k)}: {v}" for k, v in filters.items() if v)


# Enhanced GPT-4o-powered game recommendation system
async def fetch_game_titles_gpt4o(preference: str, filters=None):  # noqa: C901
    """
    Enhanced gaming AI using GPT-4o with specialized gaming knowledge and reasoning
    """
    if filters is None:
        filters = {}
    openai_api_key = get_openai_api_key()
    if not openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="AI recommendation service is currently unavailable. Please check your OpenAI API key configuration.",
        )

    filter_str = filters_to_natural_language(filters)

    # Optimized gaming expert prompt - concise and focused
    system_prompt = """You are GameMaster AI, an elite gaming expert specializing in perfect preference matching.

CORE EXPERTISE:
- Current gaming trends (2020-2025): Steam charts, console hits, viral games, streaming favorites
- Deep understanding of game mechanics, player psychology, and what makes games engaging
- Knowledge of both trending games and timeless classics across all platforms

RECOMMENDATION STRATEGY:
- PERFECT MATCH FIRST: Games must authentically match the user's specific request
- 80% TRENDING/POPULAR: Among matching games, prioritize currently viral and active ones
- 20% GEMS/CLASSICS: Include perfect-fit older games that match the request
- Focus on games that actually have the requested features/qualities
- Only recommend games that truly fit the user's preference, regardless of popularity"""

    # Check if user input looks like a specific game name
    def is_likely_game_name(text):
        """Check if input looks like a specific game name rather than a general preference"""
        text_lower = text.lower().strip()

        # Common preference words that indicate general requests
        preference_words = [
            "like",
            "similar",
            "games",
            "genre",
            "type",
            "style",
            "feel",
            "vibe",
            "atmosphere",
            "mood",
            "theme",
            "setting",
            "story",
            "narrative",
            "action",
            "adventure",
            "rpg",
            "strategy",
            "puzzle",
            "simulation",
            "multiplayer",
            "single",
            "coop",
            "competitive",
            "relaxing",
            "challenging",
            "casual",
            "hardcore",
            "indie",
            "triple",
            "retro",
            "modern",
            "classic",
        ]

        # If it contains preference words, it's likely a general request
        if any(word in text_lower for word in preference_words):
            return False

        # If it's short and doesn't contain preference words, it might be a game name
        if len(text.split()) <= 3 and not any(
            word in text_lower for word in preference_words
        ):
            return True

        return False

    # Determine the appropriate prompt based on input type
    if is_likely_game_name(preference):
        # For specific game names, focus on finding that game and similar ones
        user_content = f"""Find the game "{preference}" and recommend similar games.

REQUIREMENTS:
- If "{preference}" is a real game, include it first
- Then recommend 17 similar games (80% trending/popular, 20% classics)
- Return ONLY comma-separated game titles
- No explanations or extra text"""
    else:
        # For general preferences, use the standard recommendation strategy
        user_content = f"""Recommend exactly 18 games for: "{preference}"
{f"Filters: {filter_str}" if filter_str else ""}

CRITICAL REQUIREMENTS:
- ONLY recommend games that actually match the user's specific request
- Focus on the core meaning and intent of what the user is asking for
- 80% trending/popular games (14-15 games) AMONG THOSE THAT MATCH
- 20% perfect-fit classics/gems (3-4 games) AMONG THOSE THAT MATCH
- Return ONLY comma-separated game titles
- No explanations or extra text"""

    try:
        # Use direct API call instead of SDK
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "max_tokens": 1000,
            "temperature": 0.3,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions", headers=headers, json=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"OpenAI API error: {response.status} - {error_text}")
                    raise Exception(f"OpenAI API error: {response.status}")

                result = await response.json()
                content = result["choices"][0]["message"]["content"].strip()

        # Parse the comma-separated list
        titles = [title.strip() for title in content.split(",") if title.strip()]

        # Clean up any potential formatting issues
        cleaned_titles = []
        for title in titles[:18]:  # Ensure max 18 titles
            # Remove any numbering, bullets, or extra formatting
            cleaned_title = title.strip()
            if cleaned_title.startswith(
                (
                    "1.",
                    "2.",
                    "3.",
                    "4.",
                    "5.",
                    "6.",
                    "7.",
                    "8.",
                    "9.",
                    "10.",
                    "11.",
                    "12.",
                    "13.",
                    "14.",
                    "15.",
                    "16.",
                    "17.",
                    "18.",
                )
            ):
                cleaned_title = cleaned_title.split(".", 1)[1].strip()
            if cleaned_title.startswith(("-", "*", "•")):
                cleaned_title = cleaned_title[1:].strip()
            if cleaned_title:
                cleaned_titles.append(cleaned_title)

        return cleaned_titles[:18]

    except Exception as e:
        logger.exception("GPT-4o API error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=(
                "Sorry, we're having trouble connecting to our AI "
                "recommendation service right now. Please try again in a few moments."
            ),
        )


# Legacy function for backward compatibility (now uses GPT-4o)
async def fetch_game_titles(preference: str, filters: dict = {}):
    """
    Main game recommendation function - now powered by GPT-4o AI
    """
    return await fetch_game_titles_gpt4o(preference, filters)


# Add color constants for terminal output
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


# RAWG API request tracking
RAWG_REQUESTS_FILE = "rawg_requests.json"
RAWG_REQUEST_LIMIT = 20000  # Monthly limit
RAWG_WARNING_THRESHOLD = 1000  # Warning when below this number


def get_monthly_stats(data):
    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    monthly_requests = sum(
        count
        for date, count in data["daily_stats"].items()
        if date.startswith(current_month)
    )
    return monthly_requests


def get_monthly_average(data):
    now = datetime.now()
    days_in_month = now.day
    monthly_requests = get_monthly_stats(data)
    return monthly_requests / days_in_month if days_in_month > 0 else 0


def log_rawg_requests():
    data = load_rawg_requests()
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    daily_usage = data["daily_stats"].get(today, 0)
    daily_limit = RAWG_REQUEST_LIMIT // 28
    usage_color = get_color_for_usage(daily_usage, daily_limit)

    # Calculate daily average
    daily_avg = (
        sum(data["daily_stats"].values()) / len(data["daily_stats"])
        if data["daily_stats"]
        else 0
    )

    # Get monthly stats
    monthly_requests = get_monthly_stats(data)
    monthly_avg = get_monthly_average(data)

    # Format reset time
    reset_time = datetime.fromisoformat(data["reset_time"]).strftime("%m/%d/%Y")

    print(f"\n[1] {Colors.BOLD}=== RAWG API Usage ==={Colors.ENDC}")
    print("[1]")
    print("[1] Daily Usage:")
    print(
        f"[1] Today's requests: {usage_color}{daily_usage}/{daily_limit} ({daily_usage/daily_limit*100:.1f}%){Colors.ENDC}"
    )
    print(f"[1] Daily average requests: {daily_avg:.1f}")
    print("[1]")
    print(f"[1] Month's requests: {monthly_requests}")
    print(f"[1] Monthly average: {monthly_avg:.1f}")
    print("[1]")
    print(f"[1] Remaining requests: {data['remaining']}")
    print(f"[1] All time requests: {data['total_requests']}")
    print("[1]")
    print(f"[1] Reset time: {reset_time}")
    print("[1]")
    print(f"[1] {Colors.BOLD}====================={Colors.ENDC}\n")


def load_rawg_requests():
    if os.path.exists(RAWG_REQUESTS_FILE):
        with open(RAWG_REQUESTS_FILE, "r") as f:
            data = json.load(f)
            # Check if reset time has passed
            reset_time = datetime.fromisoformat(data["reset_time"])
            now = datetime.now()
            if now >= reset_time:
                # Reset all stats for new cycle
                data = {
                    "remaining": RAWG_REQUEST_LIMIT,
                    "total_requests": 0,
                    "reset_time": "2025-07-16T00:00:00",  # Next reset date
                    "daily_stats": {},
                    "request_history": [],
                }
                save_rawg_requests(data)
            return data
    # Initialize with current values if file doesn't exist
    initial_data = {
        "remaining": 19494,  # Current remaining requests as of March 18, 2024
        "total_requests": 506,  # Total requests made so far (20000 - 19494)
        "reset_time": "2025-07-16T00:00:00",  # Next reset date
        "daily_stats": {},
        "request_history": [],
    }
    save_rawg_requests(initial_data)
    return initial_data


def save_rawg_requests(data):
    with open(RAWG_REQUESTS_FILE, "w") as f:
        json.dump(data, f)


def update_daily_stats(data):
    today = datetime.now().strftime("%Y-%m-%d")
    if today not in data["daily_stats"]:
        data["daily_stats"][today] = 0
    data["daily_stats"][today] += 1


def format_datetime(dt_str):
    dt = datetime.fromisoformat(dt_str)
    return dt.strftime("%m/%d/%Y %I:%M%p").lower()


def get_color_for_usage(daily_usage, daily_limit):
    percentage = (daily_usage / daily_limit) * 100
    if percentage < 70:
        return Colors.GREEN
    elif percentage < 90:
        return Colors.YELLOW
    else:
        return Colors.RED


async def fetch_game_details(titles: List[str]):
    rawg_api_key = get_rawg_api_key()
    if not rawg_api_key:
        raise HTTPException(status_code=500, detail="Rawg API key not found")

    base_url = "https://api.rawg.io/api/games"
    # Deduplicate and validate titles to avoid unnecessary API calls
    unique_titles = list(dict.fromkeys(titles))
    games = []

    # Load current RAWG request data
    rawg_data = load_rawg_requests()
    reset_time = datetime.fromisoformat(rawg_data["reset_time"])
    now = datetime.now()

    # If reset time has passed, reset the counter
    if now >= reset_time:
        rawg_data = {
            "remaining": RAWG_REQUEST_LIMIT,
            "reset_time": (now + timedelta(days=30)).isoformat(),
            "total_requests": 0,
            "daily_stats": {},
            "request_history": [],
        }
        save_rawg_requests(rawg_data)

    # Track requests for this batch
    batch_requests = 0

    async def fetch_game(title):
        nonlocal batch_requests
        params = {"search": title, "key": rawg_api_key}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, params=params) as response:
                    response.raise_for_status()
                    # Update request counts
                    batch_requests += 1
                    rawg_data["total_requests"] += 1

                    # Update daily stats
                    update_daily_stats(rawg_data)

                    # Add to request history
                    rawg_data["request_history"].append(
                        {"timestamp": datetime.now().isoformat(), "title": title}
                    )

                    result = await response.json()

                    if result["results"]:
                        game = result["results"][0]
                        # Format release date
                        release_date = game.get("released", "N/A")
                        if release_date != "N/A":
                            try:
                                release_date = datetime.strptime(
                                    release_date, "%Y-%m-%d"
                                ).strftime("%m/%d/%Y")
                            except ValueError:
                                pass

                        # Fetch Twitch viewer count for the game title
                        viewer_count = await get_twitch_viewer_count(game["name"])
                        return {
                            "title": game["name"],
                            "release_date": release_date,
                            "platforms": ", ".join(
                                p["platform"]["name"] for p in game.get("platforms", [])
                            ),
                            "rating": game.get("rating", "N/A"),
                            "genres": ", ".join(
                                g["name"] for g in game.get("genres", [])
                            ),
                            "developers": ", ".join(
                                d["name"] for d in game.get("developers", [])
                            ),
                            "metacritic": game.get("metacritic", "N/A"),
                            "background_image": game.get("background_image", ""),
                            "twitch_viewers": viewer_count,
                        }
        except Exception:
            return None

    tasks = [fetch_game(title) for title in unique_titles]
    results = await asyncio.gather(*tasks)
    games = [game for game in results if game]

    # Update remaining requests after all requests are complete
    rawg_data["remaining"] -= batch_requests

    # Save the final state and log once after all requests are complete
    save_rawg_requests(rawg_data)
    log_rawg_requests()

    return games


# --- Enhanced hybrid recommendation logic ---
async def get_recommendations(  # noqa: C901
    preference: str, sort_by: str = "release_date", filters=None
):
    """
    Enhanced recommendation system with intelligent exact matching and AI recommendations
    """
    if filters is None:
        filters = {}
    preference_lower = preference.lower().strip()

    # Enhanced exact matching using multiple sources
    exact_match_found = False
    exact_match_title = None
    try:
        # Try IGDB first for exact matching
        try:
            igdb_results = await igdb_search_games(preference, limit=5)
            for game in igdb_results:
                if game["name"].lower() == preference_lower:
                    exact_match_found = True
                    exact_match_title = game["name"]
                    break
        except Exception as e:
            print(f"IGDB search error: {e}")
        # If no exact match in IGDB, try RAWG for partial matches
        if not exact_match_found:
            try:
                rawg_api_key = get_rawg_api_key()
                if rawg_api_key:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(
                            "https://api.rawg.io/api/games",
                            params={"search": preference, "key": rawg_api_key},
                        ) as response:
                            if response.status == 200:
                                result = await response.json()
                                if result.get("results"):
                                    # Check for exact or very close matches
                                    for game in result["results"][:3]:
                                        game_name_lower = game["name"].lower()
                                        if (
                                            game_name_lower == preference_lower
                                            or preference_lower in game_name_lower
                                            or game_name_lower in preference_lower
                                        ):
                                            exact_match_found = True
                                            exact_match_title = game["name"]
                                            break
            except Exception as e:
                print(f"RAWG search error: {e}")
        # Generate recommendations based on match type
        if exact_match_found:
            # Found exact match - get similar games
            ai_titles = await fetch_game_titles_gpt4o(
                f"Games similar to {exact_match_title}", filters
            )
            titles = [exact_match_title] + [
                t for t in ai_titles if t.lower() != exact_match_title.lower()
            ][:17]
            explain = f"Found exact match for '{exact_match_title}' with similar trending games and curated gems."
        else:
            # No exact match - use AI for general recommendations
            titles = await fetch_game_titles_gpt4o(preference, filters)
            explain = "AI-powered game recommendations tailored to your preferences."
        # Fetch detailed game information
        games = await fetch_game_details(titles)
        if games:
            # Enhanced sorting options
            if sort_by == "rating":
                games.sort(
                    key=lambda x: float(x["rating"]) if x["rating"] != "N/A" else 0,
                    reverse=True,
                )
            elif sort_by == "metacritic":
                games.sort(
                    key=lambda x: (
                        int(x["metacritic"])
                        if x["metacritic"] not in ["N/A", None]
                        else 0
                    ),
                    reverse=True,
                )
            else:  # release_date
                games.sort(
                    key=lambda x: (
                        x["release_date"]
                        if x["release_date"] != "N/A"
                        else "1970-01-01"
                    ),
                    reverse=True,
                )
        return {"games": games, "explain": explain}
    except Exception as e:
        print(f"Recommendation fallback triggered: {e}")
        # AI API failed, return static example
        static_games = [
            {
                "title": "The Witcher 3: Wild Hunt",
                "description": "An epic open-world RPG with a rich story and deep gameplay.",
                "rating": 9.5,
                "release_date": "2015-05-18",
                "platforms": "PC, PS4, Xbox One, Switch",
                "genres": "RPG, Adventure",
                "developers": "CD Projekt Red",
                "publishers": "CD Projekt",
                "metacritic": 93,
                "esrb_rating": "Mature",
                "website": "https://thewitcher.com/en/witcher3",
                "background_image": "https://media.rawg.io/media/games/0b7/0b78e1e8e6c6b1b2c2e2e2e2e2e2e2e2.jpg",
            },
            {
                "title": "Celeste",
                "description": "A beautiful indie platformer about climbing a mountain and overcoming challenges.",
                "rating": 9.0,
                "release_date": "2018-01-25",
                "platforms": "PC, PS4, Xbox One, Switch",
                "genres": "Platformer, Indie",
                "developers": "Matt Makes Games",
                "publishers": "Matt Makes Games",
                "metacritic": 92,
                "esrb_rating": "Everyone 10+",
                "website": "https://www.celestegame.com/",
                "background_image": "https://media.rawg.io/media/games/6b5/6b5a5e5e5e5e5e5e5e5e5e5e5e5e5e5e.jpg",
            },
        ]
        return {
            "ai_down": True,
            "message": (
                "Our AI-powered recommendations are temporarily unavailable. "
                "Here's an example of what you would see if the service was live."
            ),
            "games": static_games,
        }


async def get_game_details(title: str):
    """
    Enhanced game details with additional gaming context
    """
    rawg_api_key = get_rawg_api_key()
    if not rawg_api_key:
        raise HTTPException(status_code=500, detail="Rawg API key not found")

    base_url = "https://api.rawg.io/api/games"
    params = {"search": title, "key": rawg_api_key}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params) as response:
                response.raise_for_status()
                result = await response.json()

                if result["results"]:
                    game = result["results"][0]
                    # Get the game ID for detailed info
                    game_id = game["id"]

                    # Fetch detailed game information
                    detail_url = f"{base_url}/{game_id}"
                    async with session.get(
                        detail_url, params={"key": rawg_api_key}
                    ) as detail_response:
                        detail_response.raise_for_status()
                        detail_result = await detail_response.json()

                        # Get screenshots
                        screenshot_url = f"{base_url}/{game_id}/screenshots"
                        async with session.get(
                            screenshot_url, params={"key": rawg_api_key}
                        ) as screenshot_response:
                            screenshot_response.raise_for_status()
                            screenshot_result = await screenshot_response.json()
                            screenshots = [
                                s["image"]
                                for s in screenshot_result.get("results", [])[:6]
                            ]

                        # Get store links (Steam, Epic, GOG, etc.)
                        stores = []
                        stores_url = f"{base_url}/{game_id}/stores"
                        try:
                            async with session.get(
                                stores_url, params={"key": rawg_api_key}
                            ) as stores_response:
                                if stores_response.status == 200:
                                    stores_result = await stores_response.json()
                                    # RAWG returns {"results": [{"id", "store": {"id","name","slug","domain"}, "url"}, ...]}
                                    raw_list = stores_result.get("results") or stores_result.get("data") or []
                                    for s in raw_list[:15]:
                                        store_obj = s.get("store") if isinstance(s.get("store"), dict) else {}
                                        url = (s.get("url") or "").strip()
                                        name = (store_obj.get("name") or s.get("store_name") or "").strip()
                                        slug = (store_obj.get("slug") or "").strip()
                                        if url and name:
                                            stores.append({
                                                "name": name,
                                                "slug": slug or name.lower().replace(" ", "-"),
                                                "url": url,
                                            })
                        except Exception as store_err:
                            logger.warning("Stores fetch failed for game %s: %s", game_id, store_err)

                        return {
                            "title": detail_result["name"],
                            "description": detail_result.get(
                                "description_raw", "No description available."
                            ),
                            "screenshots": screenshots,
                            "rating": detail_result.get("rating", "N/A"),
                            "release_date": detail_result.get("released", "N/A"),
                            "platforms": ", ".join(
                                p["platform"]["name"]
                                for p in detail_result.get("platforms", [])
                            ),
                            "genres": ", ".join(
                                g["name"] for g in detail_result.get("genres", [])
                            ),
                            "developers": ", ".join(
                                d["name"] for d in detail_result.get("developers", [])
                            ),
                            "publishers": ", ".join(
                                p["name"] for p in detail_result.get("publishers", [])
                            ),
                            "metacritic": detail_result.get("metacritic", "N/A"),
                            "esrb_rating": (
                                detail_result.get("esrb_rating", {}).get("name", "N/A")
                                if detail_result.get("esrb_rating")
                                else "N/A"
                            ),
                            "website": detail_result.get("website", ""),
                            "stores": stores,
                            "background_image": detail_result.get(
                                "background_image", ""
                            ),
                        }
                else:
                    raise HTTPException(status_code=404, detail="Game not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint - serves the React app or API status"""
    if os.path.exists("build/index.html"):
        return FileResponse("build/index.html")
    return {"status": "ok", "message": "API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment"""
    try:
        # Check if basic environment is working
        import os

        port = os.getenv("PORT", "not_set")

        return {
            "status": "ok",
            "port": port,
            "environment": (
                "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development"
            ),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/cache-status")
async def cache_status():
    """Return Redis cache status (for debugging / ops)."""
    from redis_cache import is_connected
    return {"redis": "connected" if is_connected() else "not_configured"}


@app.get("/api/trending")
async def get_trending():
    """
    Trending/popular games from Steam (current player counts).
    Cached in Redis for 48h. Returns list of games in unified shape for the frontend.
    """
    from redis_cache import cache_get_json, cache_set_json
    from steam_api import get_trending_steam

    payload = await cache_get_json("trending")
    if payload is not None:
        return payload
    games = await get_trending_steam()
    await cache_set_json("trending", games, ttl_seconds=48 * 3600)
    return games


@app.get("/api/test-gpt4o")
async def test_gpt4o():
    """Test endpoint to verify GPT-4o integration"""
    try:
        openai_api_key = get_openai_api_key()
        if not openai_api_key:
            return {"status": "error", "message": "OpenAI API key not found"}

        # Use direct API call instead of SDK
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'GPT-4o is working!' and nothing else.",
                }
            ],
            "max_tokens": 50,
            "temperature": 0.1,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions", headers=headers, json=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"OpenAI API error: {response.status} - {error_text}")
                    raise Exception(f"OpenAI API error: {response.status}")

                result = await response.json()
                content = result["choices"][0]["message"]["content"].strip()

        return {"status": "success", "message": content, "model": "gpt-4o"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Custom rate limiter implementation
rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    now = time.time()
    # Clean old requests outside the window
    rate_limit_store[client_ip] = [
        req_time
        for req_time in rate_limit_store[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]

    # Check if limit exceeded
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False

    # Add current request
    rate_limit_store[client_ip].append(now)
    return True


@app.post("/api/recommendations")
async def recommendations(request: RecommendationRequest, req: Request):
    # Check rate limit
    client_ip = req.client.host
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
            },
        )

    try:
        # Check if required environment variables are set
        missing_vars = check_environment()
        if missing_vars:
            logger.error(
                "Missing required environment variables: %s", ", ".join(missing_vars)
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Missing required environment variables",
                    "missing_vars": missing_vars,
                    "message": "Please configure the required API keys in Railway environment variables",
                },
            )

        result = await get_recommendations(
            request.preference, request.sort_by, request.filters
        )
        return result
    except Exception as e:
        logger.exception("Error in /api/recommendations: %s", e)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": str(e),
                "ai_down": True,
            },
        )


@app.post("/api/game-details")
async def game_details(request: GameDetailsRequest, req: Request):
    # Check rate limit
    client_ip = req.client.host
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
            },
        )

    try:
        result = await get_game_details(request.title)
        return result
    except Exception as e:
        logger.exception("Error in /api/game-details: %s", e)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "message": str(e)},
        )


# Catch-all route for React Router
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Catch-all route to serve React app for client-side routing"""
    if os.path.exists("build/index.html"):
        return FileResponse("build/index.html")
    return {"status": "error", "message": "Not found"}
