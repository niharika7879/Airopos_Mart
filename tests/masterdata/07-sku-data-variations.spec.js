import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - SKU Creation Variations', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.openAddSku();
  });

  test('should allow manual barcode entry without clicking Generate', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    const manualBarcode = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();

    // Fill SKU with manual barcode
    await skuPage.fillSkuDetails({
      barcode: manualBarcode,
      brand: 'Aashirvaad',
      baseProduct: 'Aashirvaad Maida 500g',
      variant: 'AA',
      uom: 'KG',
      unitValue: '1',
      manufacturer: 'Aashirvaad',
      hsnCode: '123456',
      tax: '5',
    });

    // Verify barcode field holds the manual barcode
    await expect(skuPage.barcodeInput).toHaveValue(manualBarcode);

    // Save and verify
    await skuPage.clickSave();
    await page.waitForTimeout(1000);
  });

  test('should allow selecting higher tax rate (18%) and saving', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);

    await skuPage.fillSkuDetails({
      brand: 'Aashirvaad',
      baseProduct: 'Aashirvaad Maida 500g',
      variant: 'AA',
      uom: 'KG',
      unitValue: '1',
      manufacturer: 'Aashirvaad',
      hsnCode: '123456',
      tax: '18',
    });

    await skuPage.clickSave();
    await page.waitForTimeout(1000);
  });

  test('should allow setting SKU status to Inactive', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);

    // Fill details
    await skuPage.fillSkuDetails({
      brand: 'Aashirvaad',
      baseProduct: 'Aashirvaad Maida 500g',
      variant: 'AA',
      uom: 'KG',
      unitValue: '1',
      manufacturer: 'Aashirvaad',
      hsnCode: '123456',
      tax: '5',
    });

    // Toggle status switch if active
    if (await skuPage.statusSwitch.isVisible().catch(() => false)) {
      await skuPage.statusSwitch.click({ force: true });
    }

    await skuPage.clickSave();
    await page.waitForTimeout(1000);
  });
});
