#!/bin/bash

# Simple test runner script for when ahoy commands have issues
set -e

echo "=== Playwright Test Runner ==="

# Check if container is running
if ! docker compose ps | grep -q "playwright.*running"; then
    echo "Starting Playwright container..."
    docker compose up -d
    echo "Waiting for container to be ready..."
    sleep 3
fi

# Set default base URL if not provided
BASE_URL=${PLAYWRIGHT_BASE_URL:-"https://example.com"}
echo "Target URL: $BASE_URL"

# Run tests
echo "Running Playwright tests..."
docker compose exec -T -e PLAYWRIGHT_BASE_URL="$BASE_URL" playwright bash -c "npm test -- --config=playwright.config.remote.ts"

echo "=== Test run completed ==="