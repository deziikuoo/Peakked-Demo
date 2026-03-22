#!/usr/bin/env python3
"""One-off script to verify Redis connection. Run from backend dir: python check_redis.py"""
import asyncio
import os
import sys

# Load .env from backend or parent app dir
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
app_dir = backend_dir.parent
for d in (backend_dir, app_dir):
    env_file = d / ".env"
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f"Loaded .env from {env_file}", file=sys.stderr)
        break

async def main():
    from redis_cache import connect_redis, is_connected, close_redis
    url = os.getenv("REDIS_URL")
    if not url:
        print("REDIS_URL not set in environment.")
        return 1
    await connect_redis()
    if is_connected():
        print("Redis: connected")
        await close_redis()
        return 0
    # Try plain redis:// if rediss:// failed (some Redis Cloud ports are non-TLS)
    if url.strip().lower().startswith("rediss://"):
        print("Trying redis:// (no TLS)...", file=sys.stderr)
        os.environ["REDIS_URL"] = url.replace("rediss://", "redis://", 1)
        await close_redis()
        await connect_redis()
    if is_connected():
        print("Redis: connected (use redis:// in REDIS_URL for this endpoint)")
        await close_redis()
        return 0
    print("Redis: not connected (check REDIS_URL and network)")
    return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
