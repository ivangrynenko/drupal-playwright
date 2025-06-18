# Example: Installing Drupal Playwright on a DrevOps Project

This example shows how to use the Drupal Playwright integration installer.

## Prerequisites

1. A DrevOps-based Drupal project
2. Python 3 with PyYAML installed

## Installation Steps

### 1. Clone or Download This Repository

```bash
cd ~/websites/sites
git clone [repository-url] drupal-playwright
cd drupal-playwright
```

### 2. Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

### 3. Run the Installer

```bash
# Interactive mode (will prompt for project path)
./install.sh

# Or specify the project path directly
./install.sh /path/to/your/drupal/project
```

### 4. Follow Post-Installation Steps

After installation completes:

```bash
cd /path/to/your/drupal/project

# Rebuild containers
ahoy down
ahoy up

# Prepare test environment
ahoy test-playwright-prepare

# Run your first test
ahoy test-playwright
```

## What Gets Installed

The installer will:

1. ✅ Create Playwright Docker container configuration
2. ✅ Add Ahoy commands for running tests
3. ✅ Set up standardized screenshot management
4. ✅ Install example test files
5. ✅ Configure CircleCI integration (if applicable)
6. ✅ Update .gitignore appropriately

## Customizing for Your Project

### 1. Update Test User Creation

Edit `tests/playwright/setup-test-users.sh` to create project-specific roles:

```bash
# Example for a news site
create_user_if_not_exists "editor" "editor" "content_editor"
create_user_if_not_exists "journalist" "journalist" "journalist"
create_user_if_not_exists "moderator" "moderator" "comment_moderator"
```

### 2. Update Authentication Helper

Edit `tests/playwright/tests/helpers/auth.ts` to add role mappings:

```typescript
const roleToUser: Record<string, { username: string; password: string }> = {
  'administrator': { username: 'admin', password: 'admin' },
  'authenticated': { username: 'authenticated', password: 'authenticated' },
  // Add your custom roles
  'content_editor': { username: 'editor', password: 'editor' },
  'journalist': { username: 'journalist', password: 'journalist' },
  'comment_moderator': { username: 'moderator', password: 'moderator' },
};
```

### 3. Write Project-Specific Tests

Create new test files or modify the examples:

```typescript
// tests/article-creation.spec.ts
import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { takeScreenshot } from './helpers/screenshot';

test('Journalist can create article', async ({ page }) => {
  const auth = new AuthHelper(page);
  await auth.loginAs('journalist');
  
  // Navigate to article creation
  await page.goto('/node/add/article');
  
  // Fill in article form
  await page.fill('input[name="title[0][value]"]', 'Breaking News Story');
  await page.fill('textarea[name="body[0][value]"]', 'Article content...');
  
  // Take screenshot before saving
  await takeScreenshot(page, 'article-form-filled');
  
  // Save
  await page.click('input[value="Save"]');
  
  // Verify success
  await expect(page.locator('.messages')).toContainText('Article Breaking News Story has been created');
});
```

## Verification

After installation, verify everything works:

```bash
# Check Docker services
docker compose ps

# Should show playwright container running
# playwright_1    ... Up

# Run example tests
ahoy test-playwright

# View test report
ahoy test-playwright-report
```

## Troubleshooting

If you encounter issues:

1. Check the troubleshooting guide: `docs/troubleshooting.md`
2. Verify Docker logs: `docker compose logs playwright`
3. Ensure all files were copied correctly
4. Check that Python dependencies are installed

## Next Steps

1. Customize test users for your roles
2. Write tests for your critical user journeys
3. Integrate with your CI/CD pipeline
4. Configure screenshot retention policies