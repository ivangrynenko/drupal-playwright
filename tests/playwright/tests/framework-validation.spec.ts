import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshot';

test.describe('Framework Validation Tests', () => {
  test('Test framework can navigate and capture screenshots', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Verify page loads
    const title = await page.title();
    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Take a screenshot to verify screenshot functionality
    await takeScreenshot(page, 'framework-test');
    
    // Basic assertions
    expect(title.length).toBeGreaterThan(0);
    expect(page.url()).toBeTruthy();
    
    // Verify page has basic HTML structure
    const html = page.locator('html');
    await expect(html).toBeVisible();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Test framework can handle JavaScript', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test JavaScript evaluation
    const userAgent = await page.evaluate(() => navigator.userAgent);
    expect(userAgent).toContain('Chrome');
    
    // Test viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(1280);
    expect(viewport?.height).toBe(720);
  });

  test('Test framework can interact with DOM elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test basic DOM interaction - count elements
    const allElements = await page.locator('*').count();
    expect(allElements).toBeGreaterThan(0);
    
    // Test that we can find common HTML elements
    const hasLinks = await page.locator('a').count();
    console.log(`Found ${hasLinks} links`);
    
    const hasImages = await page.locator('img').count();
    console.log(`Found ${hasImages} images`);
    
    // These are informational - any count is fine
    expect(hasLinks).toBeGreaterThanOrEqual(0);
    expect(hasImages).toBeGreaterThanOrEqual(0);
  });

  test('Test configuration environment variables', async ({ page }) => {
    // Test that the base URL is being used correctly
    await page.goto('/');
    
    const currentUrl = page.url();
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'https://example.com';
    
    console.log(`Expected base URL: ${baseUrl}`);
    console.log(`Actual URL: ${currentUrl}`);
    
    expect(currentUrl).toContain(baseUrl.replace(/\/$/, ''));
  });
});