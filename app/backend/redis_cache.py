"""
Redis cache for Layer 2 backend caching.
Uses REDIS_URL from environment. If unset, cache get/set are no-ops (cache disabled).
"""
import json
import logging
import os

logger = logging.getLogger("nexa-backend")

_redis = None
REDIS_URL = os.getenv("REDIS_URL")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", str(72 * 3600)))  # default 72h


def _parse_redis_url(url: str):
    """Parse REDIS_URL into host, port, password, ssl."""
    from urllib.parse import urlparse
    u = urlparse(url)
    if not u.hostname:
        return None
    password = u.password or (u.netloc.split("@")[0] if "@" in u.netloc else None)
    if u.username and not password and ":" in (u.netloc or ""):
        # username:password before @
        part = u.netloc.rsplit("@", 1)[0]
        if ":" in part:
            password = part.split(":", 1)[1]
    return {
        "host": u.hostname,
        "port": u.port or 6379,
        "password": password,
        "username": u.username or "default",
        "ssl": u.scheme.lower() == "rediss",
    }


async def connect_redis():
    """Create async Redis connection. Call on app startup."""
    global _redis
    url = (os.getenv("REDIS_URL") or REDIS_URL or "").strip()
    if not url:
        logger.info("REDIS_URL not set; backend cache disabled.")
        return
    try:
        from redis.asyncio import Redis
        parsed = _parse_redis_url(url)
        if not parsed:
            raise ValueError("Invalid REDIS_URL")
        kwargs = dict(
            host=parsed["host"],
            port=parsed["port"],
            password=parsed["password"],
            username=parsed["username"],
            decode_responses=True,
            socket_connect_timeout=10,
        )
        if parsed["ssl"]:
            import ssl
            kwargs["ssl"] = True
            kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        _redis = Redis(**kwargs)
        await _redis.ping()
        logger.info("Redis connected (backend cache enabled).")
    except Exception as e:
        logger.warning("Redis connection failed: %s. Backend cache disabled.", e)
        _redis = None


async def close_redis():
    """Close Redis connection. Call on app shutdown."""
    global _redis
    if _redis:
        try:
            await _redis.aclose()
        except Exception as e:
            logger.warning("Redis close error: %s", e)
        _redis = None


def is_connected():
    """Return True if Redis is configured and connected."""
    return _redis is not None


async def cache_get(key: str) -> str | None:
    """
    Get a value by key. Returns None if not found or Redis not connected.
    Value is returned as string (use json.loads if you stored JSON).
    """
    if not _redis:
        return None
    try:
        return await _redis.get(key)
    except Exception as e:
        logger.warning("Redis get %s failed: %s", key, e)
        return None


async def cache_set(key: str, value: str, ttl_seconds: int | None = None) -> bool:
    """
    Set a value with optional TTL. Value must be a string (use json.dumps for dicts).
    Returns True if set, False if Redis not connected or on error.
    """
    if not _redis:
        return False
    ttl = ttl_seconds if ttl_seconds is not None else CACHE_TTL_SECONDS
    try:
        await _redis.set(key, value, ex=ttl)
        return True
    except Exception as e:
        logger.warning("Redis set %s failed: %s", key, e)
        return False


async def cache_get_json(key: str):
    """Get and JSON-decode a value. Returns None if miss or error."""
    raw = await cache_get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def cache_set_json(key: str, value: object, ttl_seconds: int | None = None) -> bool:
    """JSON-encode and set a value. Returns True if set."""
    try:
        return await cache_set(key, json.dumps(value), ttl_seconds=ttl_seconds)
    except (TypeError, ValueError):
        return False
