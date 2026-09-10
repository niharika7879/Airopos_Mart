import { expect } from '@playwright/test';

export class RateCardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // SKU Table & Edit trigger
    this.skuTable = page.locator('.product-table, .v-table');
    this.firstSkuEditBtn = page.locator('.product-table tbody tr').first().locator('.mdi-pencil').locator('xpath=ancestor::button[1]');

    // Price List section under SKU edit form
    this.priceListSection = page.locator('.price-list-section');
    this.openAddRateCardBtn = page.locator('.price-list-section button:has-text("Add Rate Card")').or(page.getByRole('button', { name: 'Add Rate Card' }));
    this.priceTable = page.locator('.price-table');
    this.priceTableRows = page.locator('.price-table tbody tr');

    // Rate Card Dialog / Container
    this.modal = page.locator('.add-rate-page-container').first();
    this.modalTitle = this.modal.locator('.dialog-title');
    this.cancelBtn = this.modal.locator('.dialog-title button').filter({ hasText: /cancel|close/i });
    this.saveBtn = this.modal.locator('.dialog-title button').filter({ hasText: /add rate card|update rate card/i }).first();

    // Header metadata blocks inside modal
    this.skuHeaderBlock = this.modal.locator('.header-block').filter({ hasText: /sku/i });
    this.productHeaderBlock = this.modal.locator('.header-block').filter({ hasText: /product/i });
    this.brandHeaderBlock = this.modal.locator('.header-block').filter({ hasText: /brand/i });

    // Pricing Fields inside modal
    this.pricingSection = this.modal.locator('.rate-card-section').filter({ hasText: /pricing/i });
    this.basicPriceInput = this.modal.locator('input[placeholder*="0"]').first();
    this.schPercentageInput = this.modal.getByLabel('Sch %');
    this.schDiscountInput = this.modal.getByLabel('Sch Discount(₹)');
    this.inputTaxInput = this.modal.getByLabel('Input Tax %');
    this.cessInput = this.modal.getByLabel('Cess %');
    this.cessAmountInput = this.modal.getByLabel('Cess Amt(₹)');
    this.taxAmountInput = this.modal.getByLabel('Tax Amt(₹)');
    this.costPriceInput = this.modal.getByLabel('Cost Price (₹)').first();
    this.markupPercentageInput = this.modal.getByLabel('Markup %').first();
    this.mrpInput = this.modal.getByLabel('MRP (₹)');
    this.discountPercentageInput = this.modal.getByLabel('Disc %');
    this.retailPriceInput = this.modal.getByLabel('Retail Price (₹)');
    this.wholesalePriceInput = this.modal.getByLabel('W Price (₹)');
    this.batchNoInput = this.modal.getByLabel('Batch No');

    // Radios
    this.freeItemYes = this.modal.locator('.inline-radio-group').filter({ hasText: /free item/i }).locator('.v-radio').filter({ hasText: /yes/i });
    this.freeItemNo = this.modal.locator('.inline-radio-group').filter({ hasText: /free item/i }).locator('.v-radio').filter({ hasText: /no/i });
    this.statusActive = this.modal.locator('.inline-radio-group').filter({ hasText: /active status/i }).locator('.v-radio').filter({ hasText: /^active$/i });
    this.statusInactive = this.modal.locator('.inline-radio-group').filter({ hasText: /active status/i }).locator('.v-radio').filter({ hasText: /inactive/i });
  }

  /**
   * Navigate to Master Data and open the first SKU for editing
   */
  async openFirstSkuForEdit() {
    await this.skuTable.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.firstSkuEditBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstSkuEditBtn.click();
    await this.priceListSection.waitFor({ state: 'visible', timeout: 15000 });
    await this.priceListSection.scrollIntoViewIfNeeded();
  }

  /**
   * Open the "Add Rate Card" modal from the Price List section
   */
  async openAddRateCardModal() {
    await this.openAddRateCardBtn.waitFor({ state: 'visible', timeout: 8000 });
    await this.openAddRateCardBtn.click();
    await this.modal.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Fill Rate Card details
   */
  async fillRateCard({
    basicPrice = '',
    wPrice = '',
    retailPrice = '',
    mrp = '',
    costPrice = '',
    schPercentage = '',
    cess = '',
    batchNo = '',
    status = '',
    freeItem = '',
  } = {}) {
    if (basicPrice) {
      await this.basicPriceInput.click();
      await this.basicPriceInput.fill(String(basicPrice));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (schPercentage) {
      await this.schPercentageInput.click();
      await this.schPercentageInput.fill(String(schPercentage));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (cess) {
      await this.cessInput.click();
      await this.cessInput.fill(String(cess));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (costPrice) {
      await this.costPriceInput.click();
      await this.costPriceInput.fill(String(costPrice));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (mrp) {
      await this.mrpInput.click();
      await this.mrpInput.fill(String(mrp));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (retailPrice) {
      await this.retailPriceInput.click();
      await this.retailPriceInput.fill(String(retailPrice));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (wPrice) {
      await this.wholesalePriceInput.click();
      await this.wholesalePriceInput.fill(String(wPrice));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    if (batchNo) {
      await this.batchNoInput.click();
      await this.batchNoInput.fill(String(batchNo));
    }

    if (freeItem) {
      if (freeItem === 'Yes') {
        await this.freeItemYes.click();
      } else {
        await this.freeItemNo.click();
      }
    }

    if (status) {
      if (status === 'Inactive') {
        await this.statusInactive.click();
      } else {
        await this.statusActive.click();
      }
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Click Save / Add Rate Card button in modal
   */
  async clickSaveRateCard() {
    await this.saveBtn.click();
  }

  /**
   * Click Cancel / Close button in modal
   */
  async clickCancelRateCard() {
    await this.cancelBtn.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Click View button on the first rate card in the Price Table
   */
  async clickViewFirstRateCard() {
    await this.priceTableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    const viewBtn = this.priceTableRows.first().locator('button[title="View"], button:has(.mdi-eye)');
    await viewBtn.click();
    await this.modal.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Click Edit button on the first rate card in the Price Table
   */
  async clickEditFirstRateCard() {
    await this.priceTableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    const editBtn = this.priceTableRows.first().locator('button[title="Edit"], button:has(.mdi-pencil)');
    await editBtn.click();
    await this.modal.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Assert toast notification contains pattern
   */
  async expectNotification(pattern, timeout = 6000) {
    const toast = this.page.locator('.v-snackbar__content, .v-snackbar').first();
    await expect(toast).toBeVisible({ timeout });
    await expect(toast).toContainText(pattern);
  }
}
