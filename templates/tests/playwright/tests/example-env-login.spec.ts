import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Environment Variable Login Tests', () => {
  test('Login with environment variable credentials', async ({ page }) => {
    const auth = new AuthHelper(page);
    
    // This will use PLAYWRIGHT_ADMIN_USERNAME and PLAYWRIGHT_ADMIN_PASSWORD if set
    await auth.loginAs('administrator');
    
    // Verify we're logged in
    expect(await auth.isLoggedIn()).toBe(true);
    
    // Verify logout link is present
    const logoutLink = page.locator('a[href*="/user/logout"]');
    await expect(logoutLink).toBeVisible();
  });

  test('Login with custom credentials', async ({ page }) => {
    const auth = new AuthHelper(page);
    
    // Reuse the admin credentials so this reflects the documented configuration
    const username = process.env.PLAYWRIGHT_ADMIN_USERNAME ?? 'admin';
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? 'admin';
    
    // Login with specific credentials
    await auth.loginWithCredentials(username, password);
    
    // Verify we're logged in
    expect(await auth.isLoggedIn()).toBe(true);
  });
});