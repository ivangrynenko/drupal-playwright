# Manual Installation Guide

If you prefer to manually install the Playwright integration or need to customize the installation, follow these steps.

## Prerequisites

- DrevOps-based Drupal project
- Docker and Docker Compose
- Python 3.6+ with PyYAML

## Step 1: Create Directory Structure

```bash
cd /path/to/your/drupal/project

# Create directories
mkdir -p .docker
mkdir -p tests/playwright/tests/helpers
mkdir -p tests/playwright/fixtures
mkdir -p scripts/custom
mkdir -p .logs/screenshots
```

## Step 2: Copy Docker Files

1. Copy `playwright.dockerfile` to `.docker/playwright.dockerfile`
2. Copy `playwright-docker-entrypoint.sh` to `scripts/custom/playwright-docker-entrypoint.sh`
3. Make entrypoint executable:
   ```bash
   chmod +x scripts/custom/playwright-docker-entrypoint.sh
   ```

## Step 3: Update docker-compose.yml

Add the Playwright service after the `chrome` service (or at the end of services):

```yaml
  playwright:
    build:
      context: .
      dockerfile: .docker/playwright.dockerfile
    volumes:
      - .:/app:${VOLUME_FLAGS:-delegated}
      - ./web/sites/default/files:/app/web/sites/default/files:${VOLUME_FLAGS:-delegated}
    user: root
    environment:
      TZ: ${DREVOPS_TZ:-Australia/Melbourne}
      DREVOPS_LOCALDEV_URL: ${DREVOPS_LOCALDEV_URL:-${COMPOSE_PROJECT_NAME:-drupal}.docker.amazee.io}
      PLAYWRIGHT_HEADLESS: 'true'
      PLAYWRIGHT_CHROMIUM_ARGS: '${PLAYWRIGHT_CHROMIUM_ARGS:---no-sandbox --disable-setuid-sandbox}'
      CI: '${CI:-}'
      PLAYWRIGHT_BASE_URL: 'http://nginx:8080'
    depends_on:
      - nginx
      - php
    working_dir: /app
    # Keep container running for exec commands
    command: sleep infinity
    networks:
      - default
    labels:
      lagoon.type: none
```

## Step 4: Update .ahoy.yml

Add these commands after the `test-bdd` command:

```yaml
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
```

## Step 5: Copy Playwright Files

1. Copy all files from `templates/tests/playwright/` to `tests/playwright/`
2. Ensure `setup-test-users.sh` is executable:
   ```bash
   chmod +x tests/playwright/setup-test-users.sh
   ```

## Step 6: Update CircleCI (Optional)

If using CircleCI, add this step to your build job after the Behat test:

```yaml
      - run:
          name: Test with Playwright
          command: |
            set -e
            echo "Preparing Playwright test environment..."

            # Create test users
            echo "Creating test users..."
            docker compose exec -T cli ./tests/playwright/setup-test-users.sh

            # Install Playwright dependencies and browsers
            echo "Installing Playwright dependencies..."
            docker compose exec -T playwright bash -c \
              "mkdir -p /app/.logs/screenshots && cd /app/tests/playwright && npm ci"
            docker compose exec -T playwright bash -c \
              "cd /app/tests/playwright && npx playwright install --with-deps chromium firefox"

            echo "Playwright test environment is ready!"

            # Run Playwright tests with proper environment variable
            echo "Running Playwright tests..."
            docker compose exec -T -e PLAYWRIGHT_BASE_URL=http://nginx:8080 playwright bash -c \
              "cd /app/tests/playwright && npm test"
          no_output_timeout: 30m
```

And update the artifact collection step:

```yaml
# Collect Playwright artifacts
if docker compose ps --services --filter "status=running" | grep -q playwright; then
  echo "Collecting Playwright test artifacts..."
  mkdir -p "${DREVOPS_CI_ARTIFACTS}/screenshots"
  docker compose cp playwright:/app/.logs/screenshots/. "${DREVOPS_CI_ARTIFACTS}/screenshots/" 2>/dev/null || true
  docker compose cp playwright:/app/.logs/playwright/. "${DREVOPS_CI_ARTIFACTS}/playwright/" 2>/dev/null || true
fi
```

## Step 7: Update .gitignore

Add these lines to your project's `.gitignore`:

```
# Playwright logs
.logs/playwright/
.logs/screenshots/
```

## Step 8: Customize for Your Project

1. **Update roles in `auth.ts`**: Add your project-specific roles
2. **Update `setup-test-users.sh`**: Add commands to create project-specific test users
3. **Rename example tests**: Rename `example-*.spec.ts` files and modify for your needs

## Step 9: Test the Installation

```bash
# Rebuild containers
ahoy down
ahoy up

# Start container
ahoy up

# Prepare test environment
ahoy prepare

# Run tests
ahoy test
```

## Troubleshooting

### Issue: Python script fails
Ensure PyYAML is installed:
```bash
pip3 install pyyaml
```

### Issue: Playwright container won't start
Check Docker logs:
```bash
docker compose logs playwright
```

### Issue: Tests can't connect to site
Verify nginx is accessible:
```bash
docker compose exec playwright curl -I http://nginx:8080
```