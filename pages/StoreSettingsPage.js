import { expect } from '@playwright/test';

/**
 * State Code mapping for Indian GSTIN validation
 */
export const GSTIN_STATE_CODES = {
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '29': 'Karnataka',
  '33': 'Tamil Nadu',
  '27': 'Maharashtra',
  '07': 'Delhi'
};

export class StoreSettingsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Header & Navigation
    this.tableTitle = page.locator('.table-title');
    this.addBtn = page.locator('.add-store-btn, button:has-text("Add")').first();
    this.locationsTable = page.locator('.locations-table');

    // Dialog & Form Fields
    this.dialog = page.locator('.add-store-dialog, .v-dialog:visible');
    this.dialogTitle = page.locator('.modal-header .modal-title, .v-card-title');
    this.storeNameInput = page.locator('input[placeholder*="name" i]').first();
    this.contactPersonInput = page.locator('input[placeholder*="Contact person" i]').first();
    this.phoneInput = page.locator('.phone-number-input input, input[placeholder*="Enter phone number" i]').first();
    this.emailInput = page.locator('input[placeholder*="example.com" i]').first();
    this.gstinInput = page.locator('input[placeholder*="22AAAAA" i]').or(page.locator('.form-field:has-text("GSTIN") input')).first();
    this.pinCodeInput = page.locator('input[placeholder*="Enter PIN code" i]').first();
    this.villageSelect = page.locator('.v-select:has-text("Village"), .form-field:has-text("Village") input').first();

    // Franchise Specific Fields
    this.fromDateInput = page.locator('input[type="date"]').first();
    this.commissionModelSelect = page.locator('.form-field:has-text("Commission Model") .v-select').first();

    // Dialog Action Buttons
    this.saveBtn = page.locator('button:has-text("Save"), button:has-text("Create Store"), button:has-text("Create Warehouse"), button:has-text("Create Franchise")').first();
    this.cancelBtn = page.locator('.modal-footer button:has-text("Cancel"), button:has-text("Cancel")').first();
  }

  /**
   * Navigate directly to Warehouse, Branch, or Franchise settings
   * @param {'warehouse' | 'branch' | 'franchise'} type
   */
  async navigateTo(type = 'warehouse') {
    const targetUrl = `/erp/settings/${type}`;
    if (!this.page.url().includes(targetUrl)) {
      await this.page.goto(targetUrl);
      await this.page.waitForLoadState('domcontentloaded');
    }
    await this.locationsTable.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  /**
   * Open the Add Store / Warehouse / Branch / Franchise dialog
   */
  async openAddStoreDialog() {
    await this.addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addBtn.click();
    await this.storeNameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill store details with consistency between GSTIN, State, and PIN Code
   * @param {Object} data
   */
  async fillStoreDetails(data) {
    if (data.storeName) {
      await this.storeNameInput.fill(data.storeName);
      await this.storeNameInput.dispatchEvent('input');
    }
    if (data.contactPerson) {
      await this.contactPersonInput.fill(data.contactPerson);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone.slice(0, 10));
    }
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.gstin) {
      await this.gstinInput.fill(data.gstin.toUpperCase());
      await this.gstinInput.dispatchEvent('input');
    }
    if (data.pinCode) {
      await this.pinCodeInput.fill(data.pinCode);
      await this.pinCodeInput.dispatchEvent('input');
      // Wait for auto-fill postal service
      await this.page.waitForTimeout(800);
    }
    if (data.village && await this.villageSelect.isVisible().catch(() => false)) {
      await this.villageSelect.click().catch(() => {});
      const option = this.page.locator('.v-overlay:visible .v-list-item').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click().catch(() => {});
      }
    }
    await this.page.waitForTimeout(400);
  }

  /**
   * Click Save and wait for creation
   */
  async saveStore() {
    await this.saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Validate GSTIN State Code matches the State name
   * @param {string} gstin
   * @param {string} expectedState
   */
  validateGstinStateCode(gstin, expectedState) {
    if (!gstin || gstin.length < 2) return false;
    const stateCode = gstin.substring(0, 2);
    const mappedState = GSTIN_STATE_CODES[stateCode];
    if (!mappedState) return false;
    return mappedState.toLowerCase() === expectedState.toLowerCase();
  }

  /**
   * Verify store is displayed in the table with GST info
   * @param {string} storeName
   * @param {string} [expectedGstin]
   */
  async verifyStoreInTable(storeName, expectedGstin) {
    await this.locationsTable.waitFor({ state: 'visible', timeout: 10000 });
    const row = this.page.locator('.locations-table tbody tr').filter({ hasText: storeName }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    if (expectedGstin) {
      await expect(row).toContainText(expectedGstin);
    }
  }

  /**
   * Close dialog via Cancel button
   */
  async cancelDialog() {
    if (await this.cancelBtn.isVisible().catch(() => false)) {
      await this.cancelBtn.click().catch(() => {});
      await this.page.waitForTimeout(400);
    }
  }
}
