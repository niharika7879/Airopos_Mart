import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - Category & Sub Category Module Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
  });

  test('should validate required Category Name on empty save', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    await skuPage.switchTab('Category');

    const addCategoryBtn = page.getByRole('button', { name: /add category/i });
    await addCategoryBtn.click();

    // Click Save on empty side panel
    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();

    // Error indicator
    const errorMsg = page.locator('.side-panel .v-messages__message, .side-panel .v-field--error').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    // Cancel
    const cancelBtn = page.locator('.side-panel .cancel-btn, .side-panel button:has-text("Cancel")').first();
    await cancelBtn.click();
  });

  test('should create a new Category and verify in table', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    await skuPage.switchTab('Category');

    // Category Name in AIroPOS permits only alphabets and spaces (digits are stripped by regex sanitization)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomLetters = '';
    for (let i = 0; i < 6; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const uniqueCat = 'Cat' + randomLetters;

    const addCategoryBtn = page.getByRole('button', { name: /add category/i });
    await addCategoryBtn.click();

    const nameInput = page.locator('.side-panel input[placeholder*="name" i], .side-panel input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uniqueCat);

    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.click();

    // Search and verify
    await page.waitForTimeout(1500);
    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await searchInput.fill(uniqueCat);
    await page.waitForTimeout(1500);

    const tableRow = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: uniqueCat });
    await expect(tableRow.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Sub Category and display controls', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    await skuPage.switchTab('Sub Category');

    const addSubCategoryBtn = page.getByRole('button', { name: /add sub category|add sub-category/i });
    await expect(addSubCategoryBtn).toBeVisible({ timeout: 10000 });
  });
});
