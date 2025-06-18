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
if grep -q "test-playwright:" "$AHOY_FILE"; then
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

  test-playwright-prepare:
    usage: Prepare environment for Playwright tests (create users, install deps).
    cmd: |
      echo "Preparing Playwright test environment..."
      ahoy cli ./tests/playwright/setup-test-users.sh
      docker compose exec -T playwright bash -c "mkdir -p /app/.logs/screenshots && cd /app/tests/playwright && npm install && npx playwright install chromium firefox"
      echo "Playwright test environment is ready!"

  test-playwright:
    usage: Run Playwright end-to-end tests.
    cmd: |
      ahoy test-playwright-prepare > /dev/null 2>&1
      docker compose exec -T playwright bash -c "cd /app/tests/playwright && npm test $@"

  test-playwright-headed:
    usage: Run Playwright tests in headed mode (shows browser).
    cmd: |
      docker compose exec -T playwright bash -c "cd /app/tests/playwright && npm install && npm run test:headed"

  test-playwright-debug:
    usage: Run Playwright tests in debug mode.
    cmd: |
      docker compose exec -T playwright bash -c "cd /app/tests/playwright && npm install && PWDEBUG=1 npm test $@"

  test-playwright-report:
    usage: Open Playwright test report in browser.
    cmd: |
      if [ -f "./.logs/playwright/html-report/index.html" ]; then
        echo "Opening test report in browser..."
        open ./.logs/playwright/html-report/index.html 2>/dev/null || \
        xdg-open ./.logs/playwright/html-report/index.html 2>/dev/null || \
        echo "Please open ./.logs/playwright/html-report/index.html in your browser"
      else
        echo "No test report found. Run 'ahoy test-playwright' first to generate test results."
      fi
EOF

# Append the rest of the file
tail -n +"$((INSERT_LINE + 1))" "$AHOY_FILE" >> "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$AHOY_FILE"

echo "Successfully added Playwright commands to .ahoy.yml"