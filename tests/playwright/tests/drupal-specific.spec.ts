import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { takeScreenshot } from './helpers/screenshot';

test.describe('Drupal-Specific Tests', () => {
  test.skip('Administrator can login', async ({ page }) => {
    // Skip this test unless we're testing against a real Drupal site
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || '';
    if (!baseUrl.includes('drupal') && !baseUrl.includes('localhost') && !baseUrl.includes('dev')) {
      test.skip();
    }
    
    const auth = new AuthHelper(page);
    
    // Login as administrator
    await auth.loginAs('administrator');
    
    // Take screenshot of logged-in state
    await takeScreenshot(page, 'admin-logged-in');
    
    // Verify we're on a user page or admin area
    const url = page.url();
    expect(url).toMatch(/\/(user|admin)/);
    
    // Verify logout link is present
    const logoutLink = page.locator('a[href*="/user/logout"]');
    await expect(logoutLink).toBeVisible();
  });

  test.skip('Login page shows error for invalid credentials', async ({ page }) => {
    // Skip this test unless we're testing against a real Drupal site
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || '';
    if (!baseUrl.includes('drupal') && !baseUrl.includes('localhost') && !baseUrl.includes('dev')) {
      test.skip();
    }
    
    // Navigate to login page
    await page.goto('/user/login');
    
    // Try to login with invalid credentials
    await page.fill('input#edit-name', 'invaliduser');
    await page.fill('input#edit-pass', 'wrongpassword');
    await page.click('input#edit-submit');
    
    // Wait for error message
    await page.waitForSelector('.messages--error', { timeout: 5000 });
    
    // Verify error message is shown
    const errorMessage = page.locator('.messages--error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Unrecognized username or password/);
    
    // Take screenshot of error state
    await takeScreenshot(page, 'login-error');
  });

  test.skip('Authenticated user can logout', async ({ page }) => {
    // Skip this test unless we're testing against a real Drupal site
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || '';
    if (!baseUrl.includes('drupal') && !baseUrl.includes('localhost') && !baseUrl.includes('dev')) {
      test.skip();
    }
    
    const auth = new AuthHelper(page);
    
    // Login first
    await auth.loginAs('authenticated');
    
    // Verify logged in
    expect(await auth.isLoggedIn()).toBe(true);
    
    // Logout
    await auth.logout();
    
    // Verify logged out
    expect(await auth.isLoggedIn()).toBe(false);
    
    // Should be redirected to homepage
    await expect(page).toHaveURL('/');
  });

  test.skip('Login form has proper accessibility attributes', async ({ page }) => {
    // Skip this test unless we're testing against a real Drupal site
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || '';
    if (!baseUrl.includes('drupal') && !baseUrl.includes('localhost') && !baseUrl.includes('dev')) {
      test.skip();
    }
    
    await page.goto('/user/login');
    
    // Check form has proper ID
    const form = page.locator('#user-login-form');
    await expect(form).toBeVisible();
    
    // Check username field has label
    const usernameLabel = page.locator('label[for="edit-name"]');
    await expect(usernameLabel).toBeVisible();
    await expect(usernameLabel).toContainText(/Username/);
    
    // Check password field has label
    const passwordLabel = page.locator('label[for="edit-pass"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toContainText(/Password/);
    
    // Check submit button has proper text
    const submitButton = page.locator('input#edit-submit');
    await expect(submitButton).toHaveAttribute('value', 'Log in');
  });
});