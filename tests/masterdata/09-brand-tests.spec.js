import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - Brand Module Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.switchTab('Brand');
  });

  test('should display Brand table and search controls', async ({ page }) => {
    const addBrandBtn = page.getByRole('button', { name: /add brand/i });
    await expect(addBrandBtn).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should validate required Brand Name on empty save', async ({ page }) => {
    const addBrandBtn = page.getByRole('button', { name: /add brand/i });
    await addBrandBtn.click();

    // Click Save on empty side panel
    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();

    // Verify error indicator
    const errorMsg = page.locator('.side-panel .v-messages__message, .side-panel .v-field--error').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    // Cancel side panel
    const cancelBtn = page.locator('.side-panel .cancel-btn, .side-panel button:has-text("Cancel")').first();
    await cancelBtn.click();
  });

  test('should create a new Brand and verify in table', async ({ page }) => {
    // Alphanumeric name without underscores (matches Brand pattern rule)
    const uniqueBrand = 'Brand' + Math.floor(1000 + Math.random() * 9000);

    const addBrandBtn = page.getByRole('button', { name: /add brand/i });
    await addBrandBtn.click();

    // Fill Name
    const nameInput = page.locator('.side-panel input[placeholder*="name" i], .side-panel input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uniqueBrand);

    // Save
    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.click();

    // Search and verify
    await page.waitForTimeout(1500);
    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await searchInput.fill(uniqueBrand);
    await page.waitForTimeout(1000);

    const tableRow = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: uniqueBrand });
    await expect(tableRow.first()).toBeVisible({ timeout: 10000 });
  });
});
