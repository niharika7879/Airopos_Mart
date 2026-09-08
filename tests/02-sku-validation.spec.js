import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';

test.describe('Master Data - Form Validation Scenarios', () => {
  test('should display validation errors when submitting an empty SKU form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // Login and open Add SKU
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.openAddSku();

    // Click Save without entering anything
    await skuPage.clickSave();

    // Verify validation errors appear on mandatory inputs
    await skuPage.expectValidationErrors();
  });
});
