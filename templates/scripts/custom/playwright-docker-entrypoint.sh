#!/bin/bash
#
# Playwright Docker container entrypoint script
# This script sets up the Playwright environment and runs tests
#

set -e

echo "=== Playwright Docker Entrypoint ==="

# Change to the playwright directory
cd /app/tests/playwright

# Install dependencies if node_modules doesn't exist or package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install browsers if they're not already installed
if [ ! -d "/ms-playwright/chromium-1148" ] && [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium firefox
    npx playwright install-deps
fi

# Set environment variables for Docker
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://nginx:8080}"
export CI="${CI:-true}"
export PLAYWRIGHT_HEADLESS="${PLAYWRIGHT_HEADLESS:-true}"
export NODE_ENV="${NODE_ENV:-test}"

# Create screenshots directory
mkdir -p /app/.logs/screenshots

# If running tests directly (not just keeping container alive)
if [ "$1" = "test" ]; then
    shift
    echo "Running Playwright tests..."
    echo "Base URL: $PLAYWRIGHT_BASE_URL"
    exec npx playwright test "$@"
else
    # Keep container running for interactive use
    exec "$@"
fi