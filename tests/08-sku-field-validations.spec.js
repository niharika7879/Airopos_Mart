import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';

test.describe('Master Data - Specific Field Validations (Negative)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    if (await skuPage.addSkuCard.isVisible().catch(() => false)) {
      await skuPage.clickCancel();
      await page.waitForTimeout(500);
    }
    await skuPage.openAddSku();
  });

  test.afterEach(async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    if (await skuPage.addSkuCard.isVisible().catch(() => false)) {
      await skuPage.clickCancel();
    }
  });

  test('should show validation error when Base Product is missing', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);

    await skuPage.clickGenerateBarcode();
    await skuPage.selectOption(skuPage.brandInput, 'Aashirvaad');
    await skuPage.selectOption(skuPage.uomInput, 'KG');
    await skuPage.hsnCodeInput.fill('123456');
    await skuPage.selectOption(skuPage.taxSelect, '5');

    await skuPage.clickSave();

    const errorIndicator = page.locator('.form-group').filter({ hasText: /Base Product/i }).locator('.v-field--error, .v-messages__message, .v-input--error').first();
    const toast = page.locator('.v-snackbar__content, .v-alert').first();
    const hasError = (await errorIndicator.isVisible({ timeout: 4000 }).catch(() => false)) ||
                     (await toast.isVisible({ timeout: 4000 }).catch(() => false));
    expect(hasError).toBeTruthy();
  });


  test('should show validation error when mandatory fields are missing', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);

    await skuPage.clickGenerateBarcode();
    await skuPage.selectOption(skuPage.brandInput, 'Aashirvaad');
    await skuPage.hsnCodeInput.fill('123456');
    // Base Product and UOM are not selected

    await skuPage.clickSave();

    const errorIndicator = page.locator('.form-group').filter({ hasText: /Base Product/i }).locator('.v-field--error, .v-messages__message, .v-input--error').first();
    const toast = page.locator('.v-snackbar__content, .v-alert').first();
    const hasError = (await errorIndicator.isVisible({ timeout: 4000 }).catch(() => false)) ||
                     (await toast.isVisible({ timeout: 4000 }).catch(() => false));
    expect(hasError).toBeTruthy();
  });
});
