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
    this.dialog = page.locator('dialog:visible, .v-dialog:visible, .add-store-dialog');
    this.dialogTitle = page.locator('.modal-header .modal-title, .v-card-title, dialog h3');
    this.storeNameInput = page.locator('input[placeholder*="name" i]').first();
    this.contactPersonInput = page.locator('input[placeholder*="Contact person" i]').first();
    this.phoneInput = page.locator('input[placeholder*="Enter phone number" i], input[placeholder*="phone" i]').first();
    this.emailInput = page.locator('input[placeholder*="example.com" i]').first();
    this.gstinInput = page.locator('input[placeholder*="22AAAAA" i], input[placeholder*="GSTIN" i]').first();
    this.pinCodeInput = page.locator('input[placeholder*="Enter PIN code" i]').first();

    // Franchise Specific Fields
    this.fromDateInput = page.locator('input[type="date"]').first();
    this.commissionModelSelect = page.locator('.form-field:has-text("Commission Model") .v-select').first();

    // Dialog Action Buttons
    this.saveBtn = page.locator('button:has-text("Save"), button:has-text("Create Store"), button:has-text("Create Warehouse"), button:has-text("Create Franchise")').first();
    this.cancelBtn = page.locator('dialog:visible button:has-text("Cancel"), .v-dialog:visible button:has-text("Cancel"), button:has-text("Cancel")').first();
  }

  /**
   * Navigate to Warehouse, Branch, or Franchise settings via UI tabs
   * @param {'warehouse' | 'branch' | 'franchise'} type
   */
  async navigateTo(type = 'warehouse') {
    if (!this.page.url().includes('dashboard') && !this.page.url().includes('settings')) {
      await this.page.goto('/erp/dashboard');
      await this.page.waitForLoadState('domcontentloaded');
    }

    // 1. Click 'Settings' in top navbar
    const settingsNav = this.page.getByText('Settings', { exact: true }).first();
    if (await settingsNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsNav.click();
      await this.page.waitForTimeout(600);
    }

    // 2. Click specific tab: Warehouse, Branch, or Franchise
    const tabName = type === 'warehouse' ? 'Warehouse' : (type === 'franchise' ? 'Franchise' : 'Branch');
    const tab = this.page.locator('.categories-bar-content, .submenu-tabs, div, button')
      .filter({ hasText: new RegExp(`^${tabName}$`, 'i') }).first();
    
    if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tab.click();
      await this.page.waitForTimeout(800);
    }

    await this.locationsTable.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
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
    if (data.village) {
      const villageInput = this.page.locator('.form-field:has-text("Village") input, input[placeholder*="village" i], [role="combobox"]').first();
      if (await villageInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await villageInput.click({ timeout: 1500 }).catch(() => {});
        const option = this.page.locator('.v-overlay:visible .v-list-item').first();
        if (await option.isVisible({ timeout: 1500 }).catch(() => false)) {
          await option.click({ timeout: 1500 }).catch(() => {});
        }
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
   * Validate GSTIN syntax and ensure State Code matches the State name
   * @param {string} gstin
   * @param {string} expectedState
   */
  validateGstinStateCode(gstin, expectedState) {
    if (!gstin || gstin.length !== 15) return false;
    // Standard Indian GSTIN Regex: 2 digits state code + 10 char PAN + 1 char entity + Z + 1 char check
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinPattern.test(gstin.toUpperCase())) return false;

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
   * Attempt to save store details with deliberate mismatch and capture validation result
   * Rule:
   *   Should system allow?
   *   NO  -> Correct validation
   *   YES -> 🐛 Bug
   * @param {Object} data
   */
  async attemptSaveWithMismatch(data) {
    await this.fillStoreDetails(data);
    await this.page.waitForTimeout(600);

    let apiCalled = false;
    let apiResponseStatus = null;
    const responseHandler = (res) => {
      if (res.url().includes('/stores/create') || res.url().includes('/stores')) {
        if (res.request().method() === 'POST') {
          apiCalled = true;
          apiResponseStatus = res.status();
        }
      }
    };
    this.page.on('response', responseHandler);

    await this.saveBtn.click({ timeout: 3000, force: true }).catch(() => {});
    await this.page.waitForTimeout(1500);
    this.page.off('response', responseHandler);

    const errorMessages = await this.page
      .locator('.v-messages__message, .v-alert, .v-snackbar, [role="alert"]')
      .allInnerTexts()
      .catch(() => []);
    const cleanErrors = errorMessages.map(t => t.trim()).filter(Boolean);

    const isDialogOpen = await this.dialog.isVisible().catch(() => false);
    const isBlocked = isDialogOpen && (cleanErrors.length > 0 || (apiCalled && apiResponseStatus >= 400));
    const isAllowed = !isDialogOpen || (apiCalled && apiResponseStatus < 400 && cleanErrors.length === 0);
    const isStateConsistent = this.validateGstinStateCode(data.gstin, data.state);
    const isBug = isAllowed && !isStateConsistent;

    return {
      isBlocked,
      allowed: isAllowed,
      hasValidationError: cleanErrors.length > 0,
      errorMessages: cleanErrors,
      isBug
    };
  }

  /**
   * Close dialog via Cancel button and handle discard confirmation if prompted
   */
  async cancelDialog() {
    // 1. If an "Unsaved Changes" discard confirmation is already open, click "Discard"
    const discardBtn = this.page.locator('dialog:visible button:has-text("Discard"), .v-dialog:visible button:has-text("Discard"), button:has-text("Discard")').first();
    if (await discardBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await discardBtn.click({ timeout: 1500, force: true }).catch(() => {});
      await this.page.waitForTimeout(400);
      return;
    }

    // 2. Click "Cancel" in the active store dialog
    const cancelBtn = this.page.locator('dialog:visible button:has-text("Cancel"), .v-dialog:visible button:has-text("Cancel"), button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cancelBtn.click({ timeout: 1500, force: true }).catch(() => {});
      await this.page.waitForTimeout(500);

      // 3. If "Unsaved Changes" prompt appeared, confirm "Discard"
      if (await discardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await discardBtn.click({ timeout: 1500, force: true }).catch(() => {});
        await this.page.waitForTimeout(400);
      }
    }
  }
}
