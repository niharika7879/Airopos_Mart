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
   * Performs the full login flow:
   * 1. Check if already logged in
   * 2. Fill phone number
   * 3. Click Send OTP
   * 4. Enter 6-digit OTP
   * 5. Click Open ERP
   * @param {string} [phone='9000000000']
   * @param {string[]} [otp=['1', '2', '3', '4', '5', '6']]
   */
  async login(phone = '9000000000', otp = ['1', '2', '3', '4', '5', '6']) {
    await this.goto();

    // Check if session is already active
    if (this.page.url().includes('dashboard') || this.page.url().includes('masterdata')) {
      return;
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
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}
