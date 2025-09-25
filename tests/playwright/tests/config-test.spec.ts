import { test, expect } from '@playwright/test';

test.describe('Configuration Tests', () => {
  test('Base URL is correctly set', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Just verify the page loads and we get a response
    const title = await page.title();
    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Verify we're not on an error page
    const url = page.url();
    expect(url).not.toContain('404');
    expect(url).not.toContain('error');
    
    // Basic check that page has some content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});