#!/usr/bin/env python3
"""
Startup script for Railway deployment
"""
import logging
import os
import sys

import uvicorn

from app_fastapi import app

# Force unbuffered stdout so logs appear immediately when run from Node/npm
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
sys.stdout.flush()

# Log to stdout so output shows in the same terminal as npm/concurrently
_log_cfg = {
    "level": logging.INFO,
    "format": "%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    "stream": sys.stdout,
}
if sys.version_info >= (3, 8):
    _log_cfg["force"] = True
logging.basicConfig(**_log_cfg)
logger = logging.getLogger("nexa-backend")
logger.setLevel(logging.INFO)

if __name__ == "__main__":
    print("[nexa-backend] Python starting...", flush=True)
    # Get port from environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))

    logger.info("Starting server on port %s", port)
    # Start the server
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
