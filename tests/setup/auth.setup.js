import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import fs from 'fs';
import path from 'path';

const authFile = 'playwright/.auth/user.json';
const sessionAuthFile = 'playwright/.auth/sessionStorage.json';

setup('authenticate and save session', async ({ page }) => {
  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const loginPage = new LoginPage(page);

  // 1. Navigate to login page
  await loginPage.goto();

  // 2. Input phone and trigger OTP
  await loginPage.phoneInput.waitFor({ state: 'visible', timeout: 15000 });
  await loginPage.phoneInput.fill('9000000000');
  await loginPage.sendOtpButton.click();

  // 3. Fill 6-digit OTP
  for (let i = 0; i < 6; i++) {
    const otpField = page.getByRole('textbox', { name: `Please enter OTP character ${i + 1}` });
    await otpField.waitFor({ state: 'visible', timeout: 8000 });
    await otpField.fill(String(i + 1));
  }

  // 4. Click Open ERP
  await loginPage.openErpButton.waitFor({ state: 'visible', timeout: 12000 });
  await loginPage.openErpButton.click();

  // 5. Wait until ERP dashboard is reached
  await page.waitForURL(/.*(dashboard|erp).*/, { timeout: 25000 });
  await page.waitForTimeout(2000);

  // 6. Extract sessionStorage and save to file
  const sessionData = await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage)));
  fs.writeFileSync(sessionAuthFile, JSON.stringify(sessionData, null, 2));

  // 7. Save authenticated storage state (localStorage tokens + cookies)
  await page.context().storageState({ path: authFile });
});
