import { expect } from '@playwright/test';

export class HsnMasterPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Header & Navigation
    this.pageTitle = page.locator('h2').filter({ hasText: /HSN \/ SAC Master/i }).first();
    this.hsnTab = page.locator('.master-data-tabs .tab-item, .tab-navigation .tab-item').filter({ hasText: /HSN\/SAC Master/i }).first();
    this.sidebarHsnLink = page.getByRole('complementary').getByText(/HSN\/SAC Master/i).first();

    // Table & Controls
    this.addHsnBtn = page.getByRole('button', { name: /Add HSN\/SAC Code/i }).first();
    this.searchInput = page.locator('input[placeholder*="Search by HSN code or description"]').first();
    this.refreshBtn = page.getByRole('button', { name: /Refresh/i }).first();
    this.hsnTable = page.locator('.product-table, .v-table').first();
    this.tableRows = page.locator('.product-table tbody tr');

    // Add / Edit Dialog
    this.dialog = page.locator('.v-dialog').first();
    this.dialogTitle = this.dialog.locator('.v-card-title');
    this.hsnCodeInput = this.dialog.locator('.v-text-field').filter({ hasText: /HSN\/SAC Code/i }).locator('input').first();
    this.descriptionInput = this.dialog.locator('.v-text-field').filter({ hasText: /Description/i }).locator('input').first();
    this.gstRateSelect = this.dialog.locator('.v-select').filter({ hasText: /GST Rate/i }).locator('input, .v-field').first();
    this.cessRateInput = this.dialog.locator('.v-text-field').filter({ hasText: /Cess Rate/i }).locator('input').first();
    this.statusSelect = this.dialog.locator('.v-select').filter({ hasText: /Status/i }).locator('input, .v-field').first();
    this.cancelBtn = this.dialog.getByRole('button', { name: /Cancel/i }).first();
    this.saveBtn = this.dialog.locator('button').filter({ hasText: /^(Create|Update)$/i }).first();

    // Delete Confirmation Dialog
    this.deleteDialog = page.locator('.confirm-delete-dialog, .v-dialog:has-text("Delete")').first();
  }

  /**
   * Navigate to HSN/SAC Master via URL
   */
  async goto() {
    await this.page.goto('/dashboard/masterdata/hsn-codes');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to HSN/SAC Master via Master Data tab
   */
  async navigateViaTab() {
    await this.hsnTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.hsnTab.click();
    await this.hsnTable.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Open the Add HSN/SAC Code modal
   */
  async openAddHsnModal() {
    await this.addHsnBtn.waitFor({ state: 'visible', timeout: 8000 });
    await this.addHsnBtn.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Select an option from Vuetify v-select dropdown overlay
   */
  async selectDropdownOption(triggerLocator, optionText) {
    await triggerLocator.click();
    await this.page.waitForTimeout(300);
    const optionItem = this.page.locator('.v-overlay-container .v-list-item, .v-menu .v-list-item')
      .filter({ hasText: new RegExp(`^\\s*${optionText}\\s*(%|$)`, 'i') })
      .first();
    await optionItem.waitFor({ state: 'visible', timeout: 4000 });
    await optionItem.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Fill details in Add / Edit HSN dialog
   */
  async fillHsnDetails({ hsnCode = '', description = '', gstRate = '', cessRate = '', status = '' } = {}) {
    if (hsnCode) {
      await this.hsnCodeInput.fill(hsnCode);
    }
    if (description) {
      await this.descriptionInput.fill(description);
    }
    if (gstRate !== '') {
      await this.selectDropdownOption(this.gstRateSelect, String(gstRate));
    }
    if (cessRate !== '') {
      await this.cessRateInput.fill(String(cessRate));
    }
    if (status) {
      await this.selectDropdownOption(this.statusSelect, status);
    }
  }

  /**
   * Click Create / Update in dialog
   */
  async clickSave() {
    await this.saveBtn.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Click Cancel in dialog
   */
  async clickCancel() {
    await this.cancelBtn.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Search HSN table
   */
  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Edit button for a specific HSN code row
   */
  async clickEditHsn(hsnCode) {
    const row = this.tableRows.filter({ hasText: hsnCode }).first();
    await row.waitFor({ state: 'visible', timeout: 8000 });
    const editBtn = row.locator('button:has(.mdi-pencil), button[title*="Edit" i]');
    await editBtn.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Click Delete button for a specific HSN code row
   */
  async clickDeleteHsn(hsnCode) {
    const row = this.tableRows.filter({ hasText: hsnCode }).first();
    await row.waitFor({ state: 'visible', timeout: 8000 });
    const deleteBtn = row.locator('button:has(.mdi-delete), button[title*="Delete" i]');
    await deleteBtn.click();
  }
}
