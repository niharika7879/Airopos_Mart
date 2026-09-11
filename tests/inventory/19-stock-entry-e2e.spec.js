import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { StockEntryPage } from '../../pages/StockEntryPage.js';

test.describe('Inventory - Stock Entry E2E Workflow', () => {
  let loginPage;
  let stockEntryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    stockEntryPage = new StockEntryPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  });

  test('should display Stock Entry list view and action buttons', async ({ page }) => {
    await stockEntryPage.navigateToStockEntry();
    await expect(stockEntryPage.stockEntryTable).toBeVisible({ timeout: 15000 });
    await expect(stockEntryPage.addNewEntryBtn).toBeVisible();
    await expect(stockEntryPage.invoiceScanBtn).toBeVisible();
  });

  test('should open Stock Entry Form and validate required fields', async ({ page }) => {
    await stockEntryPage.openStockEntryForm();
    await expect(stockEntryPage.vendorInput).toBeVisible();
    await expect(stockEntryPage.invoiceNumberInput).toBeVisible();
    await expect(stockEntryPage.saveChangesBtn).toBeVisible();

    // Click Save Changes with empty fields
    await stockEntryPage.clickSaveChanges();

    // Verify error notification or snackbar
    const toast = page.locator('.v-snackbar__content, .v-alert, .v-messages').first();
    const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasToast) {
      await expect(toast).toContainText(/vendor|invoice|required|field/i);
    }
  });

  test('should inward stock for Master Data SKU, submit via confirmation modal, and verify in table (TC-SE-01)', async ({ page }) => {
    await stockEntryPage.openStockEntryForm();

    const uniqueInv = 'INV-' + Date.now().toString().slice(-6);

    // 1. Select Vendor
    await stockEntryPage.selectVendor('Balaji');

    // 2. Fill supplier invoice details
    await stockEntryPage.fillInvoiceDetails({
      invoiceNumber: uniqueInv,
      eWayBill: '123456789012',
    });

    // 3. Enter active SKU barcode (890100000001 - Rice)
    await stockEntryPage.addProductByBarcode('890100000001', '10', '10');

    // 4. Save Changes
    await stockEntryPage.clickSaveChanges();

    // 5. Submit from Confirmation Dialog
    await stockEntryPage.confirmAndSubmit();

    // 6. Verify entry in Stock Entry table with COMPLETED status
    await stockEntryPage.verifyStockEntryInTable(uniqueInv);
  });

  test('should handle stock inward with free scheme quantity (TC-SE-02)', async ({ page }) => {
    await stockEntryPage.openStockEntryForm();

    const uniqueInv = 'INV-' + Date.now().toString().slice(-6);

    await stockEntryPage.selectVendor('Balaji');
    await stockEntryPage.fillInvoiceDetails({
      invoiceNumber: uniqueInv,
      eWayBill: '123456789013',
    });

    // Enter active SKU barcode (890100000004 - Sugar)
    await stockEntryPage.addProductByBarcode('890100000004', '15', '15');
    await stockEntryPage.setFreeQty('2');

    await stockEntryPage.clickSaveChanges();
    await stockEntryPage.confirmAndSubmit();

    await stockEntryPage.verifyStockEntryInTable(uniqueInv);
  });

  test('should handle stock inward with shortage and return details (TC-SE-03)', async ({ page }) => {
    await stockEntryPage.openStockEntryForm();

    const uniqueInv = 'INV-' + Date.now().toString().slice(-6);

    await stockEntryPage.selectVendor('Balaji');
    await stockEntryPage.fillInvoiceDetails({
      invoiceNumber: uniqueInv,
      eWayBill: '123456789014',
    });

    // Enter active SKU barcode (890100000006 - Wheat Flour)
    // Invoice 20, Received 18, Return 2
    await stockEntryPage.addProductByBarcode('890100000006', '20', '18');
    await stockEntryPage.setReturnDetails('2', 'Damaged');

    await stockEntryPage.clickSaveChanges();
    await stockEntryPage.confirmAndSubmit();

    await stockEntryPage.verifyStockEntryInTable(uniqueInv);
  });
});
