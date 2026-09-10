import fs from 'fs';

const sessionAuthFile = 'playwright/.auth/sessionStorage.json';

export class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.phoneInput = page.getByRole('textbox', { name: /phone number or username/i });
    this.sendOtpButton = page.getByRole('button', { name: /send otp/i });
    this.openErpButton = page.getByRole('button', { name: /open erp/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Performs the full login flow or reuses existing authenticated session:
   * 1. Rehydrate sessionStorage if auth session exists
   * 2. Check if already logged in at /erp/dashboard
   * 3. Fallback to full OTP login if session expired or missing
   * @param {string} [phone='9000000000']
   * @param {string[]} [otp=['1', '2', '3', '4', '5', '6']]
   */
  async login(phone = '9000000000', otp = ['1', '2', '3', '4', '5', '6']) {
    // If already on dashboard or masterdata, session is active
    if (this.page.url().includes('erp') || this.page.url().includes('masterdata')) {
      return;
    }

    // Try rehydrating session from stored state
    if (fs.existsSync(sessionAuthFile)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionAuthFile, 'utf8'));
        await this.page.addInitScript((data) => {
          for (const [k, v] of Object.entries(data)) {
            sessionStorage.setItem(k, v);
          }
        }, sessionData);

        // Navigate directly to ERP dashboard
        await this.page.goto('/erp/dashboard');

        // Confirm ERP dashboard loaded
        const isDashboard = await this.page.waitForURL(/.*(dashboard|erp|masterdata).*/, { timeout: 8000 })
          .then(() => true)
          .catch(() => false);

        if (isDashboard && !this.page.url().includes('login')) {
          await this.page.locator('text=Master Data').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn('Session reuse fallback triggered:', err.message);
      }
    }

    // Fallback: If redirected to login or not authenticated, perform full OTP login
    if (!this.page.url().includes('login')) {
      await this.goto();
    }

    await this.phoneInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.phoneInput.fill(phone);
    await this.sendOtpButton.click();

    for (let i = 0; i < otp.length; i++) {
      const otpField = this.page.getByRole('textbox', { name: `Please enter OTP character ${i + 1}` });
      await otpField.waitFor({ state: 'visible', timeout: 8000 });
      await otpField.fill(otp[i]);
    }

    await this.openErpButton.waitFor({ state: 'visible', timeout: 12000 });
    await this.openErpButton.click();

    // Wait for redirect to dashboard/ERP
    await this.page.waitForURL(/.*(dashboard|erp|masterdata).*/, { timeout: 20000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}
