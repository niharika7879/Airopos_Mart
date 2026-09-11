import { expect } from '@playwright/test';

export class MasterDataSkuPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Navigation & Table view
    this.sidebarMasterData = page.getByRole('complementary').getByText('Master Data').or(page.locator('text=Master Data')).first();
    this.addSkuButton = page.getByRole('button', { name: 'Add SKU' }).or(page.locator('.controls-section button').filter({ hasText: /add sku/i })).first();
    this.skuTable = page.locator('.product-table, .v-table');

    // Form Container & Action Buttons
    this.addSkuCard = page.locator('.add-product-card');
    this.formHeader = page.locator('.add-product-card h2, h2:has-text("Add New SKU")').first();
    this.saveButton = page.getByRole('button', { name: 'Save' }).or(page.locator('.save-btn')).first();
    this.cancelButton = page.getByRole('button', { name: 'Cancel' }).or(page.locator('.cancel-btn')).first();

    // Barcode
    this.barcodeInput = page.locator('.barcode-input input, input[placeholder*="Enter barcode"]').first();
    this.generateButton = page.getByRole('button', { name: 'Generate' }).or(page.locator('.generate-btn')).first();

    // Dropdowns / Combobox inputs
    this.baseProductInput = page.locator('.form-group').filter({ hasText: /Base Product/i }).locator('input').first();
    this.brandInput = page.locator('.form-group').filter({ hasText: /Brand/i }).locator('input').first();
    this.variantInput = page.locator('.form-group').filter({ hasText: /Variant/i }).locator('input').first();
    this.uomInput = page.locator('.form-group').filter({ hasText: /UOM/i }).locator('input').first();
    this.unitValueInput = page.getByRole('textbox', { name: 'Enter Unit Value' }).or(page.locator('input[placeholder*="Unit Value"]')).first();
    this.manufacturerInput = page.locator('.form-group').filter({ hasText: /Manufacturer/i }).locator('input').first();

    // HSN & Tax
    this.hsnCodeInput = page.locator('.hsn-code-input input, .form-group:has-text("HSN Code") input, input[placeholder*="HSN"]').first();
    this.taxSelect = page.locator('.tax-select, .form-group:has-text("Tax") .v-select, input[placeholder*="Tax"]').first();

    // Inventory Quantities
    this.reorderQtyInput = page.locator('input[placeholder*="reorder qty" i]').first();
    this.stopOrderQtyInput = page.locator('input[placeholder*="stop order qty" i]').first();

    // Status Switch
    this.statusSwitch = page.locator('.v-switch input[type="checkbox"], .v-switch').first();

    // Checkboxes
    this.freeItemCheckbox = page.locator('.v-checkbox').filter({ hasText: /free item/i }).locator('input[type="checkbox"]').first();
    this.bulkItemCheckbox = page.locator('.v-checkbox').filter({ hasText: /bulk item/i }).locator('input[type="checkbox"]').first();
    this.isAssembledCheckbox = page.locator('.v-checkbox').filter({ hasText: /is assembled/i }).locator('input[type="checkbox"]').first();
    this.nonReturnableCheckbox = page.locator('.v-checkbox').filter({ hasText: /non-returnable/i }).locator('input[type="checkbox"]').first();
  }

  /**
   * Navigate to Master Data -> SKU
   */
  async navigateToMasterData() {
    await this.sidebarMasterData.waitFor({ state: 'visible', timeout: 15000 });
    await this.sidebarMasterData.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Open the "Add New SKU" form
   */
  async openAddSku() {
    if (!(await this.addSkuCard.isVisible().catch(() => false))) {
      await this.addSkuButton.waitFor({ state: 'visible', timeout: 8000 });
      await this.addSkuButton.click();
      await this.addSkuCard.waitFor({ state: 'visible', timeout: 8000 });
    }
  }

  /**
   * Helper to robustly select from a Vuetify combobox/select menu
   * @param {import('@playwright/test').Locator} inputLocator
   * @param {string} optionText
   */
  async selectOption(inputLocator, optionText) {
    await inputLocator.click();
    await this.page.waitForTimeout(300);

    // Look for dropdown item in overlay or menu
    const dropdownItem = this.page.locator('.v-overlay-container .v-list-item, .v-menu .v-list-item')
      .filter({ hasText: new RegExp(`^\\s*${optionText}\\s*$`, 'i') })
      .first();

    if (await dropdownItem.isVisible({ timeout: 2500 }).catch(() => false)) {
      await dropdownItem.click();
    } else {
      // Type and press Enter if combobox allows direct entry
      await inputLocator.fill(optionText);
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(200);
  }

  /**
   * Click the "Generate" barcode button
   * @returns {Promise<string>}
   */
  async clickGenerateBarcode() {
    await this.generateButton.click();
    await this.page.waitForTimeout(500);
    return (await this.barcodeInput.inputValue()) || '';
  }

  /**
   * Search and select an HSN code from the HSN Master autocomplete dropdown
   * @param {string} query Search text (at least 2 chars to trigger master search)
   * @param {string} [expectedCode] Specific HSN code to pick from results
   */
  async selectHsnFromMaster(query, expectedCode = '') {
    await this.hsnCodeInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce and API response
    const target = expectedCode || query;
    const option = this.page.locator('.v-overlay-container .v-list-item')
      .filter({ hasText: target })
      .first();
    await option.waitFor({ state: 'visible', timeout: 6000 });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill out the Add SKU form with provided parameters
   */
  async fillSkuDetails({
    barcode = '',
    brand = 'Aashirvaad',
    baseProduct = 'Aashirvaad Maida 500g',
    variant = 'AA',
    uom = 'KG',
    unitValue = '1',
    manufacturer = 'Aashirvaad',
    hsnCode = '123456',
    tax = '5',
    reorderQty = '',
    stopOrderQty = '',
    isBulkItem = false,
  } = {}) {
    await this.openAddSku();

    // 1. Barcode
    if (barcode) {
      await this.barcodeInput.fill(barcode);
    } else {
      await this.clickGenerateBarcode();
    }

    // 2. Brand
    if (brand) {
      await this.selectOption(this.brandInput, brand);
    }

    // 3. Base Product
    if (baseProduct) {
      await this.selectOption(this.baseProductInput, baseProduct);
    }

    // 4. Variant
    if (variant) {
      await this.selectOption(this.variantInput, variant);
    }

    // 5. UOM & Unit Value
    if (uom) {
      await this.selectOption(this.uomInput, uom);
    }
    if (unitValue) {
      await this.unitValueInput.fill(unitValue);
    }

    // 6. Manufacturer
    if (manufacturer) {
      await this.selectOption(this.manufacturerInput, manufacturer);
    }

    // 7. HSN Code
    if (hsnCode) {
      await this.hsnCodeInput.fill(hsnCode);
      await this.page.waitForTimeout(400);
      const hsnDropdownItem = this.page.locator('.v-overlay-container .v-list-item').first();
      if (await hsnDropdownItem.isVisible({ timeout: 1500 }).catch(() => false)) {
        await hsnDropdownItem.click().catch(() => {});
      }
    }

    // 8. Tax %
    if (tax) {
      const isTaxDisabled = (await this.taxSelect.getAttribute('class').catch(() => '')).includes('v-input--disabled') ||
                            (await this.taxSelect.locator('input').isDisabled().catch(() => false));
      if (!isTaxDisabled) {
        await this.selectOption(this.taxSelect, tax);
      }
    }

    // 9. Reorder & Stop Order
    if (reorderQty && await this.reorderQtyInput.isVisible().catch(() => false)) {
      await this.reorderQtyInput.fill(reorderQty);
    }
    if (stopOrderQty && await this.stopOrderQtyInput.isVisible().catch(() => false)) {
      await this.stopOrderQtyInput.fill(stopOrderQty);
    }

    // 10. Checkboxes
    if (isBulkItem && await this.bulkItemCheckbox.isVisible().catch(() => false)) {
      await this.bulkItemCheckbox.check({ force: true });
    }
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Switch to a Master Data top tab by name
   * @param {string} tabName
   */
  async switchTab(tabName) {
    // Wait for any active modal or side panel overlay scrim to close before switching tabs
    await this.page.locator('.v-overlay--active .v-overlay__scrim').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    const tab = this.page.locator('.master-data-tabs .tab-item, .tab-navigation .tab-item')
      .filter({ hasText: new RegExp(`^\\s*${tabName}\\s*$`, 'i') })
      .first();
    await tab.waitFor({ state: 'visible', timeout: 8000 });
    await tab.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async expectValidationErrors() {
    const errorLocators = this.page.locator('.v-messages__message, .v-field--error, .v-input--error');
    await expect(errorLocators.first()).toBeVisible({ timeout: 5000 });
  }
}
