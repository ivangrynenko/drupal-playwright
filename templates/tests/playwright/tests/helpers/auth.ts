import { Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as a user with specified role.
   * Roles are mapped to test users created by setup-test-users.sh
   */
  async loginAs(role: string) {
    // Map roles to test users
    const roleToUser: Record<string, { username: string; password: string }> = {
      'administrator': { username: 'admin', password: 'admin' },
      'authenticated': { username: 'authenticated', password: 'authenticated' },
      // Add project-specific roles here
      // Example for CivicTheme:
      // 'civictheme_site_administrator': { username: 'site_admin', password: 'site_admin' },
      // 'civictheme_content_author': { username: 'content_author', password: 'content_author' },
      // 'civictheme_content_approver': { username: 'content_approver', password: 'content_approver' },
    };

    const user = roleToUser[role];
    if (!user) {
      throw new Error(`Unknown role: ${role}. Please add it to roleToUser mapping in auth.ts`);
    }

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
    await usernameInput.fill(user.username);
    await passwordInput.clear();
    await passwordInput.fill(user.password);
    
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
    
    console.log(`Successfully logged in as ${user.username}`);
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
}