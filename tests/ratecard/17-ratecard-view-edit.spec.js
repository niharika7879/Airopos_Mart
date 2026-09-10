import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';
import { RateCardPage } from '../../pages/RateCardPage.js';

test.describe('Rate Card - View and Edit Existing Scenarios', () => {
  let loginPage;
  let skuPage;
  let rateCardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    skuPage = new MasterDataSkuPage(page);
    rateCardPage = new RateCardPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await rateCardPage.openFirstSkuForEdit();
  });

  async function ensureRateCardExists(page, rateCardPage) {
    let hasRows = false;
    try {
      await rateCardPage.priceTableRows.first().waitFor({ state: 'visible', timeout: 3000 });
      hasRows = true;
    } catch {
      hasRows = false;
    }

    if (!hasRows) {
      await rateCardPage.openAddRateCardModal();
      const randomOffset = Math.floor(Math.random() * 800) + 30;
      await rateCardPage.fillRateCard({
        basicPrice: String(100 + randomOffset),
        wPrice: String(110 + randomOffset),
        retailPrice: String(120 + randomOffset),
        mrp: String(130 + randomOffset),
        batchNo: `B${Date.now().toString().slice(-6)}`,
      });
      await rateCardPage.clickSaveRateCard();
      await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 15000 });
      await rateCardPage.priceTableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  test('should open existing rate card in view-only mode and allow closing', async ({ page }) => {
    await ensureRateCardExists(page, rateCardPage);

    // View the rate card
    await rateCardPage.clickViewFirstRateCard();

    // Verify view-only mode
    await expect(rateCardPage.modalTitle).toContainText(/view rate card/i);
    await expect(rateCardPage.cancelBtn).toContainText(/close/i);

    // Close view modal
    await rateCardPage.clickCancelRateCard();
    await expect(rateCardPage.modal).toBeHidden();
  });

  test('should open existing rate card in edit mode and allow updating details', async ({ page }) => {
    await ensureRateCardExists(page, rateCardPage);

    // Edit the rate card
    await rateCardPage.clickEditFirstRateCard();

    // Verify edit mode
    await expect(rateCardPage.modalTitle).toContainText(/edit rate card/i);
    await expect(rateCardPage.saveBtn).toContainText(/update rate card/i);

    // Allow backend calculation debounce to settle
    await page.waitForTimeout(500);

    // Update batch number with a unique tag
    const updatedBatch = `U${Date.now().toString().slice(-6)}`;
    await rateCardPage.batchNoInput.fill(updatedBatch);
    await page.waitForTimeout(300);

    // Save update
    await rateCardPage.clickSaveRateCard();
    await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 15000 });

    // Verify updated batch appears in price table
    await expect(rateCardPage.priceTable).toContainText(updatedBatch);
  });
});
