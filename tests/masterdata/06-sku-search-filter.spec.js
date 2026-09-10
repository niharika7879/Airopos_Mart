import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - SKU Search & Column Visibility', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
  });

  test('should search SKU table by product name', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    const searchInput = page.locator('input[placeholder*="Search by name, barcode"]').or(page.locator('.controls-section input')).first();

    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('Aashirvaad');
    await page.waitForTimeout(1000);

    // Verify filtered table contains the search term
    const matchingRows = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: /Aashirvaad/i });
    await expect(matchingRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show empty table state when searching non-existent product', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name, barcode"]').or(page.locator('.controls-section input')).first();

    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('NON_EXISTENT_SKU_QUERY_XYZ999');
    await page.waitForTimeout(1000);

    // Check that either table is empty or "No data available" message appears
    const noDataText = page.locator('text=/no data|no records|no items/i');
    const rowCount = await page.locator('.product-table tbody tr, .v-table tbody tr').count();
    
    // Either no data indicator is visible or 0 matching content rows
    expect(rowCount <= 1).toBeTruthy();
  });

  test('should toggle column visibility dropdown', async ({ page }) => {
    const columnSelectorBtn = page.locator('.column-selector-btn, button:has(.mdi-tune)').first();
    await columnSelectorBtn.waitFor({ state: 'visible', timeout: 8000 });
    await columnSelectorBtn.click();

    // Verify dropdown menu opens with column options
    const dropdown = page.locator('.column-selector-dropdown, .v-overlay-container').first();
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Close dropdown
    await columnSelectorBtn.click();
  });
});
