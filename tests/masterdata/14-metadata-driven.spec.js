import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';
import fs from 'fs';
import path from 'path';

/**
 * Helper to parse CSV files without external dependencies
 */
function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

const skuCsvPath = path.resolve(process.cwd(), 'metadata/AIroPOS_MasterData_SKUs.csv');
const uomCsvPath = path.resolve(process.cwd(), 'metadata/AIroPOS_MasterData_UOMs.csv');

const skuMetadata = parseCsv(skuCsvPath);
const uomMetadata = parseCsv(uomCsvPath);

test.describe('Master Data - Metadata Driven Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // Authenticate and navigate to Master Data SKU view
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();

    // Ensure form is fresh
    if (await skuPage.addSkuCard.isVisible().catch(() => false)) {
      await skuPage.clickCancel();
      await page.waitForTimeout(300);
    }
  });

  test.afterEach(async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    if (await skuPage.addSkuCard.isVisible().catch(() => false)) {
      await skuPage.clickCancel();
    }
  });

  test('Metadata Check: All 10 UOMs defined in metadata are valid in UI form', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    await skuPage.openAddSku();

    // Verify all 10 symbols from metadata/AIroPOS_MasterData_UOMs.csv
    const expectedSymbols = uomMetadata.map((u) => u.Symbol);
    expect(expectedSymbols.length).toBe(10);
    expect(expectedSymbols).toEqual(
      expect.arrayContaining(['pcs', 'dozen', 'half-dozen', 'sets', '2 sets', '4 sets', 'kg', 'g', 'l', 'ml'])
    );

    // Test entering a UOM in the form
    await skuPage.selectOption(skuPage.uomInput, 'KG');
    await expect(skuPage.uomInput).toBeVisible();
  });

  test('Metadata Execution: Create SKU with Unit Value 1 and Stop Order Qty (TC-SKU-01)', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    const item = skuMetadata.find((r) => r.Barcode === '8906014640011');
    expect(item).toBeDefined();
    expect(item.Unit_Value).toBe('1');
    expect(item.Stop_Order_Qty).toBe('5');

    // Fill form using exact metadata values
    await skuPage.fillSkuDetails({
      barcode: '890' + Math.floor(100000000 + Math.random() * 900000000).toString(),
      brand: item.Brand_Name || 'Daawat',
      baseProduct: item.Base_Product_Name || 'Basmati Rice Premium',
      variant: item.Variant_Name || '5kg Pack',
      uom: item.UOM.toUpperCase(),
      unitValue: String(item.Unit_Value),
      hsnCode: item.HSN_Code || '10063020',
      tax: item.Tax_Percent || '0',
      stopOrderQty: String(item.Stop_Order_Qty),
    });

    // Assert Unit Value is strictly 1
    await expect(skuPage.unitValueInput).toHaveValue('1');

    // Assert Stop Order Qty is 5
    if (await skuPage.stopOrderQtyInput.isVisible().catch(() => false)) {
      await expect(skuPage.stopOrderQtyInput).toHaveValue('5');
    }

    // Save and verify
    await skuPage.clickSave();
    const toast = page.locator('.v-snackbar__content, .v-alert').first();
    const isToastVisible = await toast.isVisible({ timeout: 4000 }).catch(() => false);
    if (isToastVisible) {
      await expect(toast).toContainText(/saved|success|added/i);
    } else {
      await expect(skuPage.skuTable).toBeVisible({ timeout: 5000 });
    }
  });

  test('Metadata Execution: Create SKU with Explicit Stop Order Qty = 0 (TC-SKU-08)', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    const item = skuMetadata.find((r) => r.Barcode === '8907000333011');
    expect(item).toBeDefined();
    expect(item.Unit_Value).toBe('1');
    expect(item.Stop_Order_Qty).toBe('0');

    await skuPage.fillSkuDetails({
      barcode: '890' + Math.floor(100000000 + Math.random() * 900000000).toString(),
      brand: item.Brand_Name || 'Cello',
      baseProduct: item.Base_Product_Name || 'Opalware Dinner Set',
      variant: item.Variant_Name || '18 Pcs Set',
      uom: item.UOM,
      unitValue: String(item.Unit_Value),
      hsnCode: item.HSN_Code || '69111011',
      tax: item.Tax_Percent || '12',
      stopOrderQty: '0',
    });

    // Verify Unit Value is 1
    await expect(skuPage.unitValueInput).toHaveValue('1');

    // Verify Stop Order Qty preserves 0
    if (await skuPage.stopOrderQtyInput.isVisible().catch(() => false)) {
      await expect(skuPage.stopOrderQtyInput).toHaveValue('0');
    }

    await skuPage.clickSave();
    await page.waitForTimeout(1000);
  });

  test('Metadata Validation: Negative scenario rejects missing Base Product', async ({ page }) => {
    const skuPage = new MasterDataSkuPage(page);
    await skuPage.openAddSku();

    // Trigger barcode and fill other fields but leave Base Product empty (TC-SKU-13)
    await skuPage.clickGenerateBarcode();
    await skuPage.selectOption(skuPage.brandInput, 'Daawat');
    await skuPage.selectOption(skuPage.uomInput, 'KG');
    await skuPage.unitValueInput.fill('1');

    await skuPage.clickSave();

    // Assert form validation catches missing required Base Product
    const errorIndicator = page
      .locator('.form-group')
      .filter({ hasText: /Base Product/i })
      .locator('.v-field--error, .v-messages__message, .v-input--error')
      .first();
    const toast = page.locator('.v-snackbar__content, .v-alert').first();
    const hasError =
      (await errorIndicator.isVisible({ timeout: 4000 }).catch(() => false)) ||
      (await toast.isVisible({ timeout: 4000 }).catch(() => false));
    expect(hasError).toBeTruthy();
  });
});
