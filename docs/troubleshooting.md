# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Python Dependencies Not Found
**Error**: `ModuleNotFoundError: No module named 'yaml'`

**Solution**:
```bash
pip3 install pyyaml
# or
pip install pyyaml
```

#### Permission Denied During Installation
**Error**: `Permission denied` when running install.sh

**Solution**:
```bash
chmod +x install.sh
./install.sh
```

### Docker Issues

#### Playwright Container Fails to Start
**Error**: Container exits immediately after starting

**Solution**:
1. Check Docker logs:
   ```bash
   docker compose logs playwright
   ```

2. Verify Dockerfile exists:
   ```bash
   ls -la .docker/playwright.dockerfile
   ```

3. Rebuild the container:
   ```bash
   docker compose build --no-cache playwright
   docker compose up -d playwright
   ```

#### Cannot Connect to nginx
**Error**: `net::ERR_CONNECTION_REFUSED` at http://nginx:8080

**Solution**:
1. Verify nginx is running:
   ```bash
   docker compose ps nginx
   ```

2. Check nginx logs:
   ```bash
   docker compose logs nginx
   ```

3. Test connection from Playwright container:
   ```bash
   docker compose exec playwright curl -I http://nginx:8080
   ```

### Test Execution Issues

#### Browser Not Installed
**Error**: `browserType.launch: Executable doesn't exist at /ms-playwright/chromium-*/chrome-linux/chrome`

**Solution**:
```bash
# Reinstall browsers
docker compose exec playwright bash -c "cd /app/tests/playwright && npx playwright install chromium firefox"
docker compose exec playwright bash -c "cd /app/tests/playwright && npx playwright install-deps"
```

#### Tests Timeout
**Error**: `Test timeout of 30000ms exceeded`

**Solution**:
1. Increase timeout in specific test:
   ```typescript
   test('slow test', async ({ page }) => {
     test.setTimeout(60000); // 60 seconds
   });
   ```

2. Increase global timeout in `playwright.config.ts`:
   ```typescript
   export default defineConfig({
     timeout: 60000, // 60 seconds
   });
   ```

#### Login Fails
**Error**: `Login verification failed. No logout link found`

**Solution**:
1. Verify test users exist:
   ```bash
   ahoy drush user:information admin
   ```

2. Recreate test users:
   ```bash
   ahoy cli ./tests/playwright/setup-test-users.sh
   ```

3. Check if site requires additional authentication (Shield, Basic Auth):
   - Disable in `.env.local`: `BASIC_AUTH=off`
   - Or add credentials to test environment

### Screenshot Issues

#### Screenshots Not Saved
**Error**: Screenshots not appearing in `.logs/screenshots/`

**Solution**:
1. Ensure directory exists:
   ```bash
   mkdir -p .logs/screenshots
   ```

2. Check permissions:
   ```bash
   docker compose exec playwright ls -la /app/.logs/
   ```

3. Verify screenshot helper is used correctly:
   ```typescript
   import { takeScreenshot } from './helpers/screenshot';
   await takeScreenshot(page, 'test-name');
   ```

### CI/CD Issues

#### CircleCI Build Fails
**Error**: Playwright tests fail in CI but pass locally

**Solution**:
1. Ensure `.lagoon.env.ci` exists with:
   ```
   BASIC_AUTH=off
   BASIC_AUTH_USERNAME=
   BASIC_AUTH_PASSWORD=
   ```

2. Check CI environment variables

3. Increase retries in `playwright.config.ts`:
   ```typescript
   retries: process.env.CI ? 2 : 0,
   ```

#### Artifacts Not Collected
**Error**: Screenshots/reports not available in CircleCI artifacts

**Solution**:
Verify artifact collection in `.circleci/config.yml`:
```yaml
docker compose cp playwright:/app/.logs/screenshots/. "${DREVOPS_CI_ARTIFACTS}/screenshots/"
```

### Performance Issues

#### Tests Run Slowly
**Solution**:
1. Run tests in parallel:
   ```typescript
   export default defineConfig({
     workers: process.env.CI ? 2 : 4,
   });
   ```

2. Reduce screenshot size:
   ```typescript
   await page.screenshot({ 
     fullPage: false,
     quality: 80 // For JPEG
   });
   ```

3. Disable video recording for passing tests:
   ```typescript
   use: {
     video: 'retain-on-failure',
   }
   ```

### Debugging Techniques

#### Enable Debug Mode
```bash
ahoy test-playwright-debug
```

#### Pause Test Execution
```typescript
await page.pause(); // Opens Playwright Inspector
```

#### Take Debug Screenshots
```typescript
await takeScreenshot(page, 'debug-step-1');
// Perform action
await takeScreenshot(page, 'debug-step-2');
```

#### View Browser Console
```typescript
page.on('console', msg => console.log(`Browser: ${msg.text()}`));
```

#### Slow Down Execution
```typescript
await page.click('button', { delay: 100 }); // 100ms delay
```

### Platform-Specific Issues

#### Apple M1/M2 (ARM) Issues
**Error**: Chrome crashes or doesn't start

**Solution**:
1. Use Firefox for ARM compatibility:
   ```typescript
   // Run only Firefox tests
   ahoy test-playwright --project=firefox
   ```

2. Or use Chromium ARM image in `docker-compose.override.yml`:
   ```yaml
   services:
     playwright:
       platform: linux/amd64  # Force x86 emulation
   ```

#### Windows Issues
**Error**: Line ending problems

**Solution**:
1. Configure Git:
   ```bash
   git config core.autocrlf input
   ```

2. Convert script line endings:
   ```bash
   dos2unix scripts/custom/playwright-docker-entrypoint.sh
   dos2unix tests/playwright/setup-test-users.sh
   ```

### Getting Help

1. **Check Playwright documentation**: https://playwright.dev/
2. **Enable verbose logging**:
   ```bash
   DEBUG=pw:* ahoy test-playwright
   ```
3. **Inspect test artifacts**: Check `.logs/playwright/test-results/` for error details
4. **Ask for help**: Include:
   - Error message
   - Test code snippet
   - `playwright.config.ts` settings
   - Docker logs