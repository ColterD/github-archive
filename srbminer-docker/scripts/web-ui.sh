#!/bin/bash
set -e

WEB_UI=${WEB_UI:-false}
WEB_UI_PORT=${WEB_UI_PORT:-8080}
API_PORT=${API_PORT:-7000}
ENABLE_CHARTS=${ENABLE_CHARTS:-true}
DARK_MODE=${DARK_MODE:-true}
REFRESH_INTERVAL=${REFRESH_INTERVAL:-30}
LOG_LINES=${LOG_LINES:-100}

if [ "$WEB_UI" != "true" ]; then
    echo "Web UI disabled. Set WEB_UI=true to enable."
    exit 0
fi

echo "Starting enhanced web UI on port $WEB_UI_PORT..."

# Create web directory
mkdir -p /srbminer/www

# Check if port is already in use
if lsof -Pi :$WEB_UI_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "WARNING: Port $WEB_UI_PORT is already in use. Web UI may not start properly."
    # Try to find a free port
    for PORT in {8081..8090}; do
        if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
            echo "Found available port: $PORT. Using this instead."
            WEB_UI_PORT=$PORT
            break
        fi
    done
fi

# Start web UI server
node /srbminer/www/api.js &
echo "Enhanced Web UI started on port $WEB_UI_PORT"