import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - Barcode Auto-Generation Scenario', () => {
  test('should auto-generate barcode when clicking Generate button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // Login and open Add SKU form
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.openAddSku();

    // Verify barcode can be cleared and generated
    await skuPage.barcodeInput.clear();
    const generatedBarcode = await skuPage.clickGenerateBarcode();

    // Assert that barcode is non-empty and matches the input value
    expect(generatedBarcode).toBeTruthy();
    expect(generatedBarcode.length).toBeGreaterThan(0);
    await expect(skuPage.barcodeInput).toHaveValue(generatedBarcode);
  });
});
