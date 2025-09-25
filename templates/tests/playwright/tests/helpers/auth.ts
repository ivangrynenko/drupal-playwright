import { Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as a user with specified role.
   * Roles are mapped to test users created by setup-test-users.sh
   * Credentials can be overridden via environment variables
   */
  async loginAs(role: string) {
    // Map roles to test users with environment variable support
    const roleToUser: Record<string, { username: string; password: string }> = {
      'administrator': { 
        username: process.env.PLAYWRIGHT_ADMIN_USERNAME || 'admin', 
        password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'admin' 
      },
      'authenticated': { 
        username: process.env.PLAYWRIGHT_AUTH_USERNAME || 'authenticated', 
        password: process.env.PLAYWRIGHT_AUTH_PASSWORD || 'authenticated' 
      },
      // Add project-specific roles here
      // Example for custom roles:
      // 'site_administrator': { 
      //   username: process.env.PLAYWRIGHT_SITE_ADMIN_USERNAME || 'site_admin', 
      //   password: process.env.PLAYWRIGHT_SITE_ADMIN_PASSWORD || 'site_admin' 
      // },
      // 'content_author': { 
      //   username: process.env.PLAYWRIGHT_CONTENT_AUTHOR_USERNAME || 'content_author', 
      //   password: process.env.PLAYWRIGHT_CONTENT_AUTHOR_PASSWORD || 'content_author' 
      // },
      // 'content_approver': { 
      //   username: process.env.PLAYWRIGHT_CONTENT_APPROVER_USERNAME || 'content_approver', 
      //   password: process.env.PLAYWRIGHT_CONTENT_APPROVER_PASSWORD || 'content_approver' 
      // },
    };

    const user = roleToUser[role];
    if (!user) {
      throw new Error(`Unknown role: ${role}. Please add it to roleToUser mapping in auth.ts`);
    }

    await this.loginWithCredentials(user.username, user.password);
  }

  /**
   * Logout current user.
   */
  async logout() {
    await this.page.goto('/user/logout');
    await this.page.waitForLoadState('networkidle');
  }
  
  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const logoutLink = await this.page.locator('a[href*="/user/logout"]').count();
    return logoutLink > 0;
  }
  
  /**
   * Get current username if logged in
   */
  async getCurrentUsername(): Promise<string | null> {
    // Try common selectors for username display
    const selectors = [
      '.user-name',
      '.username',
      '.account-name',
      'a[href*="/user/"]:has-text("My account")'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.count() > 0) {
          return await element.textContent();
        }
      } catch (e) {
        // Continue with next selector
      }
    }
    
    return null;
  }

  /**
   * Login with specific username and password.
   * This is useful for custom users or when credentials are provided directly.
   */
  async loginWithCredentials(username: string, password: string) {
    // Get the base URL
    const baseUrl = this.page.context()._options.baseURL || 'http://nginx:8080';
    
    // Navigate to login page
    const loginUrl = `${baseUrl}/user/login`;
    console.log(`Navigating to login URL: ${loginUrl}`);
    
    await this.page.goto(loginUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for the login form to be visible
    await this.page.waitForSelector('#user-login-form', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Fill in the form fields
    const usernameInput = this.page.locator('input#edit-name');
    const passwordInput = this.page.locator('input#edit-pass');
    
    await usernameInput.waitFor({ state: 'visible' });
    await passwordInput.waitFor({ state: 'visible' });
    
    await usernameInput.clear();
    await usernameInput.fill(username);
    await passwordInput.clear();
    await passwordInput.fill(password);
    
    // Submit form
    const submitButton = this.page.locator('input#edit-submit');
    await submitButton.click();
    
    // Wait for navigation away from login page
    await this.page.waitForURL((url) => {
      return !url.toString().includes('/user/login');
    }, { 
      timeout: 30000,
      waitUntil: 'domcontentloaded' 
    });
    
    // Verify login succeeded
    const currentUrl = this.page.url();
    console.log(`After login, current URL: ${currentUrl}`);
    
    // Check if we're logged in by looking for logout link
    const logoutSelectors = [
      'a[href*="/user/logout"]',
      '.user-menu a[href*="/logout"]',
      'a:has-text("Log out")'
    ];
    
    let logoutFound = false;
    for (const selector of logoutSelectors) {
      try {
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          logoutFound = true;
          break;
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }
    
    if (!logoutFound && !currentUrl.includes('/user/')) {
      throw new Error(`Login verification failed. No logout link found. Current URL: ${currentUrl}`);
    }
    
    console.log(`Successfully logged in as ${username}`);
  }
}