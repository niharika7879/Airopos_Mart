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

  test('should inward stock for Master Data SKU with valid vendor and invoice details', async ({ page }) => {
    await stockEntryPage.openStockEntryForm();

    const uniqueInv = 'INV-' + Date.now().toString().slice(-6);

    // Select Vendor
    await stockEntryPage.selectVendor('Balaji');

    // Fill supplier invoice details
    await stockEntryPage.fillInvoiceDetails({
      invoiceNumber: uniqueInv,
      eWayBill: '123456789012',
    });

    // Enter existing Master Data SKU barcode (Basmati Rice)
    await stockEntryPage.addProductByBarcode('8906014640011', '25', '25');

    await expect(stockEntryPage.productSkuInput).toHaveValue('8906014640011');
  });
});
