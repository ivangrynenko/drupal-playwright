# Playwright End-to-End Tests

This directory contains Playwright end-to-end tests for the Drupal project.

## Prerequisites

- Docker and Docker Compose installed
- The project's Docker containers running (`ahoy up`)

## Setup

1. Start the Docker containers:
   ```bash
   ahoy up
   ```

2. Create test users (if not already created):
   ```bash
   ahoy cli ./tests/playwright/setup-test-users.sh
   ```

## Running Tests

### Run all tests in headless mode:
```bash
ahoy test-playwright
```

### Run specific test file:
```bash
ahoy test-playwright tests/homepage.spec.ts
```

### Run tests in headed mode (visible browser):
```bash
ahoy test-playwright-headed
```

### Run tests in debug mode:
```bash
ahoy test-playwright-debug
```

### View test report:
```bash
ahoy test-playwright-report
```

## Test Structure

- `tests/` - Test specification files
  - `example-homepage.spec.ts` - Homepage tests (rename/modify as needed)
  - `example-login.spec.ts` - Login functionality tests (rename/modify as needed)
- `tests/helpers/` - Helper functions and utilities
  - `auth.ts` - Authentication helper for user login
  - `screenshot.ts` - Screenshot utilities with standardized paths
- `fixtures/` - Test data and files
- `playwright.config.ts` - Playwright configuration

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshot';

test.describe('Feature Name', () => {
  test('test description', async ({ page }) => {
    // Navigate to page
    await page.goto('/path');
    
    // Perform actions
    await page.click('button');
    
    // Make assertions
    await expect(page.locator('.message')).toBeVisible();
    
    // Take screenshot
    await takeScreenshot(page, 'test-name');
  });
});
```

### Using Authentication Helper

```typescript
import { AuthHelper } from './helpers/auth';

test('authenticated user test', async ({ page }) => {
  const auth = new AuthHelper(page);
  
  // Login using predefined role
  await auth.loginAs('administrator');
  
  // Or login with specific credentials
  await auth.loginWithCredentials('custom_user', 'custom_password');
  
  // Perform authenticated actions
});
```

## Screenshot Management

All screenshots are saved to `.logs/screenshots/` with the prefix `playwright-`:
- Manual screenshots: `playwright-{test-name}.png`
- Failed test screenshots: Automatically captured

Use the `takeScreenshot` helper for consistent naming:

```typescript
import { takeScreenshot } from './helpers/screenshot';

await takeScreenshot(page, 'my-test-screenshot');
```

## Configuration

The tests are configured to:
- Run in headless mode by default
- Connect to the nginx service at `http://nginx:8080`
- Save screenshots on test failure
- Record videos for failed tests
- Generate HTML and JSON reports

## Environment Variables

### Test Configuration
- `PLAYWRIGHT_BASE_URL` - Base URL for tests (default: `http://nginx:8080`)
- `PLAYWRIGHT_HEADLESS` - Run in headless mode (default: `true`)
- `CI` - Set to `true` in CI environments

### Test User Credentials
Environment variables can be used to override default test user credentials:

- `PLAYWRIGHT_ADMIN_USERNAME` - Administrator username (default: `admin`)
- `PLAYWRIGHT_ADMIN_PASSWORD` - Administrator password (default: `admin`)
- `PLAYWRIGHT_AUTH_USERNAME` - Authenticated user username (default: `authenticated`)
- `PLAYWRIGHT_AUTH_PASSWORD` - Authenticated user password (default: `authenticated`)

For project-specific roles:
- `PLAYWRIGHT_SITE_ADMIN_USERNAME` / `PLAYWRIGHT_SITE_ADMIN_PASSWORD`
- `PLAYWRIGHT_CONTENT_AUTHOR_USERNAME` / `PLAYWRIGHT_CONTENT_AUTHOR_PASSWORD`
- `PLAYWRIGHT_CONTENT_APPROVER_USERNAME` / `PLAYWRIGHT_CONTENT_APPROVER_PASSWORD`

### Using Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your specific values:
   ```bash
   PLAYWRIGHT_BASE_URL=https://mysite.example.com
   PLAYWRIGHT_ADMIN_USERNAME=myAdminUser
   PLAYWRIGHT_ADMIN_PASSWORD=mySecurePassword
   ```

3. The environment variables will be automatically used by:
   - The `setup-test-users.sh` script when creating users
   - The `AuthHelper` class when logging in during tests

## Troubleshooting

### Tests fail with "browser not installed"
Run: `ahoy test-playwright-prepare`

### Cannot connect to nginx
Ensure Docker containers are running: `ahoy up`

### Permission denied errors
The Playwright container runs as root by default. File permissions should not be an issue.

### Tests timeout
Increase timeout in `playwright.config.ts` or specific test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

## Best Practices

1. **Use Page Object Model** for complex pages
2. **Keep tests independent** - each test should be able to run in isolation
3. **Use descriptive test names** that explain what is being tested
4. **Take screenshots** at key points for debugging
5. **Use data-testid attributes** for reliable element selection
6. **Avoid hard-coded waits** - use Playwright's built-in waiting mechanisms

## Customization

### Adding New Roles

1. Update `setup-test-users.sh` to create users with new roles:
   ```bash
   # Add environment variable support
   MY_ROLE_USERNAME="${PLAYWRIGHT_MY_ROLE_USERNAME:-my_role_user}"
   MY_ROLE_PASSWORD="${PLAYWRIGHT_MY_ROLE_PASSWORD:-my_role_pass}"
   create_user_if_not_exists "$MY_ROLE_USERNAME" "$MY_ROLE_PASSWORD" "my_role"
   ```

2. Update `tests/helpers/auth.ts` to add role mappings:
   ```typescript
   'my_role': { 
     username: process.env.PLAYWRIGHT_MY_ROLE_USERNAME || 'my_role_user', 
     password: process.env.PLAYWRIGHT_MY_ROLE_PASSWORD || 'my_role_pass' 
   },
   ```

3. Add to `.env.example`:
   ```bash
   PLAYWRIGHT_MY_ROLE_USERNAME=my_role_user
   PLAYWRIGHT_MY_ROLE_PASSWORD=my_role_pass
   ```

4. Use in tests: `await auth.loginAs('my_role')`

### Custom Helpers

Add new helper files in `tests/helpers/` for reusable functionality.

### Project-Specific Configuration

Modify `playwright.config.ts` for project-specific needs:
- Browser selection
- Viewport sizes
- Timeout values
- Reporter configuration