import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';

test.describe('Master Data - UOM (Unit of Measurement) Module', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.switchTab('UOM');
  });

  test('should display UOM table and Add button', async ({ page }) => {
    const addUomBtn = page.getByRole('button', { name: /add uom/i });
    await expect(addUomBtn).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields on empty UOM submission', async ({ page }) => {
    const addUomBtn = page.getByRole('button', { name: /add uom/i });
    await addUomBtn.click();

    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();

    // Verify validation error
    const errorMsg = page.locator('.side-panel .v-messages__message, .side-panel .v-field--error').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('.side-panel .cancel-btn, .side-panel button:has-text("Cancel")').first();
    await cancelBtn.click();
  });

  test('should create a new UOM and verify in table', async ({ page }) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const uniqueUom = 'UOM' + randomSuffix;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let randLetters = '';
    for (let i = 0; i < 3; i++) {
      randLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const uniqueSymbol = 'u' + randLetters;

    const addUomBtn = page.getByRole('button', { name: /add uom/i });
    await addUomBtn.click();

    // Fill Name
    const nameInput = page.locator('.side-panel input[placeholder*="Kilogram" i], .side-panel input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uniqueUom);

    // Fill Symbol (alphabetic letters only as required by UOM symbol sanitization)
    const symbolInput = page.locator('.side-panel input[placeholder*="kg" i]').or(page.locator('.side-panel input[type="text"]').nth(1));
    await symbolInput.fill(uniqueSymbol);

    // Check "This is a base unit" to avoid requiring conversion rate
    const baseUnitCheckbox = page.locator('.side-panel label:has-text("This is a base unit"), .side-panel .checkbox-group').first();
    await baseUnitCheckbox.click();
    await page.waitForTimeout(300);

    // Save
    const saveBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBtn.click();

    // Wait for side panel to close
    await page.locator('.side-panel').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

    // Search and verify
    await page.waitForTimeout(1500);
    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await searchInput.fill(uniqueUom);
    await page.waitForTimeout(1500);

    const tableRow = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: uniqueUom });
    await expect(tableRow.first()).toBeVisible({ timeout: 10000 });
  });
});
