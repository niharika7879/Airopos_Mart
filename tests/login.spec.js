import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test('should verify authenticated login session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  await expect(page).toHaveURL(/.*(dashboard|erp|masterdata).*/);
});