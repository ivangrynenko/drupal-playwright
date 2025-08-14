import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use more workers for faster execution */
  workers: process.env.CI ? 2 : 4,
  /* Reasonable timeout for each test */
  timeout: 30000,
  /* Global timeout for each action */
  expect: {
    timeout: 10000,
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: '../../.logs/playwright/html-report', open: 'never' }],
    ['json', { outputFile: '../../.logs/playwright/results.json' }],
    ['list']
  ],
  
  /* Configure test artifacts - videos, traces, etc go here */
  outputDir: '../../.logs/playwright/test-results',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://nginx:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot configuration - standardized to .logs/screenshots/ */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Video recording */
    video: 'retain-on-failure',
    
    /* Navigation timeout */
    navigationTimeout: 15000,
    
    /* Action timeout */
    actionTimeout: 10000,
    
    /* Extra HTTP headers to be sent with every request */
    extraHTTPHeaders: {},
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: process.env.PLAYWRIGHT_HEADLESS === 'true' ? true : false,
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: process.env.PLAYWRIGHT_HEADLESS === 'true' ? true : false,
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  /* Configure screenshot path for failed tests */
  use: {
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
  },
  
  /* Custom screenshot path handler */
  onTestFailure: async (test, result) => {
    const testName = test.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    if (result.attachments) {
      for (const attachment of result.attachments) {
        if (attachment.name === 'screenshot' && attachment.path) {
          // Move screenshot to standardized location
          const fs = require('fs');
          const path = require('path');
          const standardPath = path.join(__dirname, '../../.logs/screenshots', `playwright-${testName}.png`);
          if (fs.existsSync(attachment.path)) {
            fs.copyFileSync(attachment.path, standardPath);
          }
        }
      }
    }
  },

  /* Run your local nginx server before starting the tests */
  webServer: undefined, // Using existing Docker services
});