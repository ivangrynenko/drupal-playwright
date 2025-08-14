import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshot';

test.describe('Homepage Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title exists
    await expect(page).toHaveTitle(/Drupal/);
    
    // Take a screenshot
    await takeScreenshot(page, 'homepage-loaded');
    
    // Verify key elements are present
    const mainContent = page.locator('main, #main, .main-content').first();
    await expect(mainContent).toBeVisible();
  });

  test('Homepage has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for description meta tag
    const description = await page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
  });

  test('Homepage navigation is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation landmarks
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Check for skip links
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip to main content")').first();
    await expect(skipLink).toHaveCount(1);
  });
});