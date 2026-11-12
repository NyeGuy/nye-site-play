#!/usr/bin/env bash
# Local preview of the Viewport 3D app. Usage: ./serve.sh [port]   (default 8766)
cd "$(dirname "$0")" && PORT="${1:-8766}" && echo "Viewport 3D → http://127.0.0.1:$PORT/" && exec python3 -m http.server "$PORT" --bind 127.0.0.1
