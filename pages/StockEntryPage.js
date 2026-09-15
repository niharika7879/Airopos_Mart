import { expect } from '@playwright/test';

export class StockEntryPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.sidebarInventory = page.getByRole('complementary').getByText('Inventory').first();
    this.stockEntryTable = page.locator('.product-table, .v-table, table').first();
    this.addNewEntryBtn = page.locator('button:has-text("Add New Entry")').first();
    this.invoiceScanBtn = page.locator('button:has-text("Invoice Scan")').first();

    // StockEntryForm fields
    this.headerTitle = page.locator('h1, h2, .page-title').first();
    this.vendorInput = page.locator('.invoice-field-col').filter({ hasText: /Vendor/i }).locator('input').first();
    this.invoiceNumberInput = page.locator('.invoice-field-col').filter({ hasText: /Invoice Number/i }).locator('input').first();
    this.eWayBillInput = page.locator('.invoice-field-col').filter({ hasText: /E-Way Bill/i }).locator('input').first();
    this.poNumberInput = page.locator('.invoice-field-col').filter({ hasText: /PO Number/i }).locator('input').first();

    // Product row inputs
    this.productSkuInput = page.getByPlaceholder(/Scan or Enter Barcode\/SKU Code/i).first();
    this.saveChangesBtn = page.locator('button:has-text("Save Changes")').first();
    this.saveDraftBtn = page.locator('button:has-text("Save Draft")').first();
    this.cancelBtn = page.locator('button:has-text("Cancel")').first();
  }

  async navigateToStockEntry() {
    if (!this.page.url().includes('inventory/stock-entry')) {
      await this.sidebarInventory.waitFor({ state: 'visible', timeout: 15000 });
      await this.sidebarInventory.click();
      await this.page.waitForTimeout(800);

      const stockEntryTab = this.page.locator('.categories-bar-content, .submenu-tabs, div')
        .filter({ hasText: /^Stock Entry$/i }).first();
      await stockEntryTab.waitFor({ state: 'visible', timeout: 5000 });
      await stockEntryTab.click();
      await this.page.waitForTimeout(800);
    }
    await this.stockEntryTable.waitFor({ state: 'visible', timeout: 15000 });
  }

  async openStockEntryForm() {
    await this.page.goto('/erp/stock-entry-form');
    await this.page.waitForLoadState('domcontentloaded');
    await this.headerTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async selectVendor(vendorName) {
    await this.vendorInput.waitFor({ state: 'visible', timeout: 15000 });
    // Wait for any async dropdown loading to settle
    await this.page.waitForSelector('.v-autocomplete--loading', { state: 'detached', timeout: 10000 }).catch(() => {});

    await this.vendorInput.click();
    await this.vendorInput.fill(vendorName || '');
    await this.page.waitForTimeout(600);

    const option = this.page.locator('.v-overlay:visible .v-list-item').first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await this.page.waitForTimeout(600);
  }

  async fillInvoiceDetails({ invoiceNumber, eWayBill, poNumber }) {
    if (invoiceNumber) await this.invoiceNumberInput.fill(invoiceNumber);
    if (eWayBill) await this.eWayBillInput.fill(eWayBill);
    if (poNumber) await this.poNumberInput.fill(poNumber);
  }

  async addProductByBarcode(barcode, invoiceQty = '10', receivedQty = '10') {
    await this.productSkuInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.productSkuInput.fill(barcode);
    await this.productSkuInput.press('Enter');

    // Wait for the product table row to load and display product name
    const row = this.page.locator('.product-table tbody tr').first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    // Wait until the product row td:nth-child(4) input (Product Name) is populated from backend
    const prodNameInput = row.locator('td:nth-child(4) input');
    await expect(prodNameInput).not.toHaveValue('', { timeout: 15000 });

    // If Rate card dialog appears asking to create rate card, click Skip
    const skipBtn = this.page.locator('button:has-text("Skip for Now")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await this.page.waitForTimeout(500);
    }

    const invQtyInput = row.locator('td:nth-child(6) input');
    if (await invQtyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invQtyInput.fill(invoiceQty);
      await invQtyInput.dispatchEvent('input');
      await invQtyInput.dispatchEvent('change');
    }

    const recQtyInput = row.locator('td:nth-child(7) input');
    if (await recQtyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recQtyInput.fill(receivedQty);
      await recQtyInput.dispatchEvent('input');
      await recQtyInput.dispatchEvent('change');
    }

    await this.page.waitForTimeout(800);
  }

  async clickSaveChanges() {
    await this.saveChangesBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);
    await this.saveChangesBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async confirmAndSubmit() {
    // If validation error snackbar appears, log it
    const toast = this.page.locator('.v-snackbar__content:visible');
    if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
      const txt = await toast.innerText().catch(() => '');
      console.warn('Form validation warning before confirmation dialog:', txt);
    }

    const dialog = this.page.locator('.v-dialog:visible').first();
    const isVisible = await dialog.isVisible({ timeout: 4000 }).catch(() => false);
    if (!isVisible) {
      await this.saveChangesBtn.click().catch(() => {});
    }
    await dialog.waitFor({ state: 'visible', timeout: 25000 });
    const submitBtn = dialog.locator('button:has-text("Submit")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyStockEntryInTable(invoiceNumber) {
    await this.navigateToStockEntry();
    await this.page.waitForTimeout(1000);

    // Search for the invoice number if search input is available to ensure it's found across pages
    const searchInput = this.page.locator('.controls-section input[type="text"]').or(this.page.getByPlaceholder(/search/i)).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(invoiceNumber);
      await this.page.waitForTimeout(1000);
    }

    const row = this.stockEntryTable.locator('tr').filter({ hasText: invoiceNumber }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText(/COMPLETED/i);
  }

  async setFreeQty(freeQty) {
    const row = this.page.locator('.product-table tbody tr').first();
    const freeQtyInput = row.locator('td:nth-child(8) input');
    if (await freeQtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await freeQtyInput.fill(String(freeQty));
    }
  }

  async setReturnDetails(returnQty, reason = 'Damaged') {
    const row = this.page.locator('.product-table tbody tr').first();
    let retQtyInput = row.locator('td:nth-child(9) input');
    if (await retQtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isEnabled = await retQtyInput.isEnabled().catch(() => false);
      if (!isEnabled) {
        retQtyInput = row.locator('td:nth-child(10) input');
      }
      if (await retQtyInput.isVisible({ timeout: 2000 }).catch(() => false) && await retQtyInput.isEnabled().catch(() => false)) {
        await retQtyInput.fill(String(returnQty));
      }
    }
    const reasonSelect = row.locator('td:nth-child(10), td:nth-child(11)').locator('.v-select, input').first();
    if (await reasonSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonSelect.click();
      await this.page.waitForTimeout(400);
      const option = this.page.locator('.v-overlay:visible .v-list-item').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }
  }
}
