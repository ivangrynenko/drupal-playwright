import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshot';

test.describe('Generic Website Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check page title exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    console.log(`Page title: ${title}`);
    
    // Take a screenshot
    await takeScreenshot(page, 'homepage-loaded');
    
    // Verify basic HTML structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for any content area (very flexible)
    const contentSelectors = ['main', '#main', '.main-content', '#content', '.content', 'article', 'section', 'div'];
    let contentFound = false;
    for (const selector of contentSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        contentFound = true;
        console.log(`Found content with selector: ${selector} (${count} elements)`);
        break;
      }
    }
    expect(contentFound).toBe(true);
  });

  test('Homepage has basic HTML structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check for basic HTML elements
    const html = page.locator('html');
    await expect(html).toBeVisible();
    
    const head = page.locator('head');
    await expect(head).toHaveCount(1);
    
    const body = page.locator('body');
    await expect(body).toHaveCount(1);
    
    // Check for title element
    const titleElement = page.locator('head title');
    await expect(titleElement).toHaveCount(1);
    
    console.log('Basic HTML structure validated');
  });

  test('Page accessibility basics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check for basic accessibility features (optional)
    const navSelectors = ['nav', '[role="navigation"]', 'header', '.nav', '.navigation', 'ul', 'a'];
    let navFound = false;
    for (const selector of navSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        navFound = true;
        console.log(`Found navigation-like element with selector: ${selector} (${count} elements)`);
        break;
      }
    }
    
    // For basic sites, having any interactive elements is fine
    const interactiveElements = await page.locator('a, button, input, select, textarea').count();
    console.log(`Found ${interactiveElements} interactive elements`);
    
    // Very basic check - just verify the page has some structure
    expect(navFound || interactiveElements > 0).toBe(true);
  });
});