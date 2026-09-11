import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - End-to-End Cross-Module Integration Flow', () => {
  test('should create a new Brand and immediately use it to create an SKU', async ({ page }) => {
    test.setTimeout(60000); // Cross-module workflow needs extra time

    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    const timestamp = Date.now().toString().slice(-4);
    // Alphanumeric name without underscore (matches Brand pattern rule)
    const newBrandName = `Brand${timestamp}`;

    // 1. Login
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);

    // 2. Navigate to Brand tab and create new Brand
    await skuPage.navigateToMasterData();
    await skuPage.switchTab('Brand');

    const addBrandBtn = page.getByRole('button', { name: /add brand/i });
    await addBrandBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBrandBtn.click();

    const brandInput = page.locator('.side-panel input[type="text"]').first();
    await brandInput.waitFor({ state: 'visible', timeout: 5000 });
    await brandInput.fill(newBrandName);

    const saveBrandBtn = page.locator('.side-panel .save-btn, .side-panel button:has-text("Save")').first();
    await saveBrandBtn.click();
    await page.locator('.side-panel').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 3. Switch back to SKU tab
    await skuPage.switchTab('SKU');
    await skuPage.openAddSku();

    // 4. Create SKU using the newly created Brand
    await skuPage.fillSkuDetails({
      brand: newBrandName,
      baseProduct: 'Aashirvaad Maida 500g',
      variant: 'AA',
      uom: 'KG',
      unitValue: '1',
      manufacturer: 'Aashirvaad',
      hsnCode: '123456',
      tax: '5',
      isBulkItem: false,
    });

    // 5. Save SKU
    await skuPage.clickSave();
    await page.waitForTimeout(2000);

    // 6. Verification: Search the SKU table for the newly linked item
    const searchInput = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(newBrandName);
    await page.waitForTimeout(1000);

    const matchingRow = page.locator('.product-table tbody tr, .v-table tbody tr').filter({ hasText: newBrandName });
    await expect(matchingRow.first()).toBeVisible({ timeout: 10000 });
  });
});
