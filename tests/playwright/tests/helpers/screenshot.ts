import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Take a screenshot with standardized naming and location
 * Screenshots are saved to .logs/screenshots/ with 'playwright-' prefix
 */
export async function takeScreenshot(page: Page, name: string, options?: { fullPage?: boolean }) {
  const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const screenshotPath = path.join(__dirname, '../../../../.logs/screenshots', `playwright-${sanitizedName}.png`);
  
  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: options?.fullPage ?? true 
  });
  
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Take a screenshot of a specific element
 */
export async function takeElementScreenshot(page: Page, selector: string, name: string) {
  const element = await page.locator(selector);
  const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const screenshotPath = path.join(__dirname, '../../../../.logs/screenshots', `playwright-element-${sanitizedName}.png`);
  
  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await element.screenshot({ path: screenshotPath });
  
  console.log(`Element screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, prefix: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${prefix}-${timestamp}`;
  return takeScreenshot(page, name);
}