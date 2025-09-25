#!/bin/bash
#
# Add Playwright commands to .ahoy.yml
#

set -e

AHOY_FILE="$1"

if [[ ! -f "$AHOY_FILE" ]]; then
    echo "Error: $AHOY_FILE does not exist"
    exit 1
fi

# Check if playwright commands already exist
if grep -q "test-playwright:\|playwright:" "$AHOY_FILE"; then
    echo "Playwright commands already exist in .ahoy.yml"
    exit 0
fi

# Find the line number where we should insert (after test-bdd or test commands)
INSERT_LINE=$(grep -n "test-bdd:" "$AHOY_FILE" | tail -1 | cut -d: -f1)
if [[ -z "$INSERT_LINE" ]]; then
    INSERT_LINE=$(grep -n "test:" "$AHOY_FILE" | tail -1 | cut -d: -f1)
fi

if [[ -z "$INSERT_LINE" ]]; then
    echo "Warning: Could not find test commands section. Appending to end of file."
    INSERT_LINE=$(wc -l < "$AHOY_FILE")
fi

# Calculate the insertion point (after the test-bdd command block)
INSERT_LINE=$((INSERT_LINE + 3))

# Create temporary file with new commands
TEMP_FILE=$(mktemp)

# Split the file and insert new commands
head -n "$INSERT_LINE" "$AHOY_FILE" > "$TEMP_FILE"

cat >> "$TEMP_FILE" << 'EOF'

  # Playwright testing commands (remote integration)
  up:
    usage: Start the Playwright container.
    cmd: |
      set -e
      echo "Starting Playwright container..."
      if ! docker compose up -d; then
        echo "Error: Failed to start Playwright container"
        exit 1
      fi
      echo "Container started successfully. Target URL: ${PLAYWRIGHT_BASE_URL:-https://example.com}"

  down:
    usage: Stop and remove the Playwright container.
    cmd: |
      set -e
      echo "Stopping Playwright container..."
      if ! docker compose down; then
        echo "Error: Failed to stop Playwright container"
        exit 1
      fi
      echo "Container stopped successfully."

  prepare:
    usage: Install Playwright dependencies and browsers.
    cmd: |
      set -e
      if ! docker compose ps | grep -q "playwright.*running"; then
        echo "Error: Playwright container is not running. Start it with 'ahoy up'"
        exit 1
      fi
      echo "Installing Playwright dependencies..."
      if ! docker compose exec -T playwright bash -c "npm install"; then
        echo "Error: Failed to install npm dependencies"
        exit 1
      fi
      if ! docker compose exec -T playwright bash -c "npx playwright install chromium firefox webkit"; then
        echo "Error: Failed to install Playwright browsers"
        exit 1
      fi
      echo "Creating log directories..."
      if ! docker compose exec -T playwright bash -c "mkdir -p /app/.logs/screenshots /app/.logs/playwright/html-report"; then
        echo "Error: Failed to create log directories"
        exit 1
      fi
      echo "Playwright environment is ready!"

  test:
    usage: Run Playwright tests against remote URL. Set PLAYWRIGHT_BASE_URL environment variable.
    cmd: |
      set -e
      if ! docker compose ps | grep -q "playwright.*running"; then
        echo "Error: Playwright container is not running. Start it with 'ahoy up'"
        exit 1
      fi
      if [ -z "$PLAYWRIGHT_BASE_URL" ]; then
        echo "WARNING: PLAYWRIGHT_BASE_URL not set. Using default: https://example.com"
        echo "Set it with: export PLAYWRIGHT_BASE_URL=https://your-site.com"
      fi
      echo "Running tests against: ${PLAYWRIGHT_BASE_URL:-https://example.com}"
      if ! docker compose exec -T -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL}" playwright bash -c "npm test -- --config=playwright.config.remote.ts $@"; then
        echo "Error: Tests failed or encountered an error"
        exit 1
      fi

  test-headed:
    usage: Run Playwright tests in headed mode (requires X11 forwarding).
    cmd: |
      set -e
      if ! docker compose ps | grep -q "playwright.*running"; then
        echo "Error: Playwright container is not running. Start it with 'ahoy up'"
        exit 1
      fi
      echo "Running tests in headed mode against: ${PLAYWRIGHT_BASE_URL:-https://example.com}"
      if ! docker compose exec -T -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL}" -e PLAYWRIGHT_HEADLESS=false playwright bash -c "npm run test:headed -- --config=playwright.config.remote.ts $@"; then
        echo "Error: Headed tests failed or encountered an error"
        exit 1
      fi

  test-debug:
    usage: Run Playwright tests in debug mode.
    cmd: |
      set -e
      if ! docker compose ps | grep -q "playwright.*running"; then
        echo "Error: Playwright container is not running. Start it with 'ahoy up'"
        exit 1
      fi
      echo "Running tests in debug mode against: ${PLAYWRIGHT_BASE_URL:-https://example.com}"
      if ! docker compose exec -T -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL}" -e PWDEBUG=1 playwright bash -c "npm test -- --config=playwright.config.remote.ts $@"; then
        echo "Error: Debug tests failed or encountered an error"
        exit 1
      fi

  report:
    usage: Open the last test report in browser.
    cmd: |
      if [ -f "./.logs/playwright/html-report/index.html" ]; then
        echo "Opening test report in browser..."
        open ./.logs/playwright/html-report/index.html 2>/dev/null || \
        xdg-open ./.logs/playwright/html-report/index.html 2>/dev/null || \
        echo "Please open ./.logs/playwright/html-report/index.html in your browser"
      else
        echo "No test report found. Run tests first to generate results."
      fi
EOF

# Append the rest of the file
tail -n +"$((INSERT_LINE + 1))" "$AHOY_FILE" >> "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$AHOY_FILE"

echo "Successfully added Playwright commands to .ahoy.yml"
