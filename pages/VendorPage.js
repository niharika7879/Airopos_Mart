import { expect } from '@playwright/test';

export class VendorPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.sidebarVendor = page.getByRole('complementary').getByText('Vendor').first();
    this.vendorTable = page.locator('.v-table, table').first();
    this.addVendorBtn = page.locator('button:has-text("Add Vendor")').or(page.getByRole('button', { name: /add vendor/i })).first();
    this.searchInput = page.locator('.controls-section input[type="text"]').or(page.getByPlaceholder(/search/i)).first();

    // Basic Info inputs
    this.companyNameInput = page.locator('.field-group').filter({ hasText: /company name/i }).locator('input').first();
    this.displayNameInput = page.locator('.field-group').filter({ hasText: /vendor name/i }).locator('input').first();
    this.phoneInput = page.locator('.phone-number-input input').first();
    this.emailInput = page.locator('.field-group').filter({ hasText: /email/i }).locator('input').first();

    // Action buttons
    this.saveAndContinueBtn = page.locator('.header-actions button').filter({ hasText: /save/i }).first()
      .or(page.locator('.save-btn').first());
    this.cancelBtn = page.locator('.vendor-form-header button:has-text("Cancel"), button:has-text("Cancel")').first();
  }

  async navigateToVendorList() {
    // If add-vendor form is open, click Cancel
    if (await this.cancelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await this.cancelBtn.click();
      await this.page.waitForTimeout(800);
    }

    const vendorsTab = this.page.locator('.categories-bar-content, .submenu-tabs, div').filter({ hasText: /^Vendors$/i }).first()
      .or(this.page.getByRole('complementary').getByText('Vendors').first());
    
    if (await vendorsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vendorsTab.click();
    } else {
      await this.sidebarVendor.waitFor({ state: 'visible', timeout: 15000 });
      await this.sidebarVendor.click();
      await this.page.waitForTimeout(800);
      await vendorsTab.first().click();
    }

    await this.vendorTable.waitFor({ state: 'visible', timeout: 15000 });
  }

  async openAddVendor() {
    await this.navigateToVendorList();
    await this.addVendorBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addVendorBtn.click();
    await this.companyNameInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async fillBasicInfo({ companyName, displayName, phone, email, businessType = 'Wholesaler', vendorType = 'Registered' }) {
    if (companyName) await this.companyNameInput.fill(companyName);
    if (displayName) await this.displayNameInput.fill(displayName);
    if (phone) await this.phoneInput.fill(phone);
    if (email) await this.emailInput.fill(email);

    // Select Business Type if available
    if (businessType) {
      const bTypeGroup = this.page.locator('.field-group').filter({ hasText: /business type/i });
      if (await bTypeGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bTypeGroup.scrollIntoViewIfNeeded();
        await bTypeGroup.locator('.v-select, input, .v-field').first().click();
        await this.page.waitForTimeout(400);
        const option = this.page.locator('.v-overlay:visible .v-list-item').filter({ hasText: new RegExp(businessType, 'i') }).first()
          .or(this.page.locator('.v-overlay:visible .v-list-item').first());
        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option.click({ force: true });
        }
        await this.page.waitForTimeout(300);
      }
    }

    // Select Vendor Type if available
    if (vendorType) {
      const vTypeGroup = this.page.locator('.field-group').filter({ hasText: /vendor type/i });
      if (await vTypeGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
        await vTypeGroup.scrollIntoViewIfNeeded();
        await vTypeGroup.locator('.v-select, input, .v-field').first().click();
        await this.page.waitForTimeout(400);
        const option = this.page.locator('.v-overlay:visible .v-list-item').filter({ hasText: new RegExp(vendorType, 'i') }).first()
          .or(this.page.locator('.v-overlay:visible .v-list-item').first());
        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option.click({ force: true });
        }
        await this.page.waitForTimeout(300);
      }
    }
  }

  async clickSaveAndContinue() {
    await this.saveAndContinueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveAndContinueBtn.click();
    await this.page.waitForTimeout(600);

    // If confirmation / preview dialog appears, click Confirm & Save
    const confirmBtn = this.page.locator('.v-dialog button').filter({ hasText: /confirm & save|confirm/i }).first()
      .or(this.page.locator('button:has-text("Confirm & Save")').first());
    if (await confirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await confirmBtn.click();
      // Wait for backend save to complete (URL updates with vendor id or toast appears)
      await this.page.waitForURL(/.*(\?id=|gst-details|address).*/, { timeout: 15000 }).catch(() => {});
      await this.page.waitForTimeout(1200);
    }
  }
}
