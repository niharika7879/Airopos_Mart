import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';

test.describe('Master Data - Base Product Module Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.switchTab('Base Product');
  });

  test('should display Base Product table and Add button', async ({ page }) => {
    const addProductBtn = page.getByRole('button', { name: /add base product|add product/i });
    await expect(addProductBtn).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should search existing Base Product in table', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await searchInput.fill('Aashirvaad');
    await page.waitForTimeout(1000);

    const matchingRows = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: /Aashirvaad/i });
    await expect(matchingRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields when adding Base Product without data', async ({ page }) => {
    const addProductBtn = page.getByRole('button', { name: /add base product|add product/i });
    await addProductBtn.click();

    // Look for Save button on the form/panel
    const saveBtn = page.locator('.side-panel .save-btn, button:has-text("Save")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();

    // Verify error messages
    const errorIndicator = page.locator('.v-messages__message, .v-field--error, .v-input--error').first();
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });

    // Click Cancel
    const cancelBtn = page.locator('.side-panel .cancel-btn, button:has-text("Cancel")').first();
    await cancelBtn.click();
  });
});
