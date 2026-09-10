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

  test('should open existing rate card in view-only mode and allow closing', async ({ page }) => {
    // Check if at least one rate card exists in table
    const hasRows = (await rateCardPage.priceTableRows.count()) > 0;
    if (!hasRows) {
      // Create one rate card first if empty
      await rateCardPage.openAddRateCardModal();
      await rateCardPage.fillRateCard({
        basicPrice: '100',
        wPrice: '110',
        retailPrice: '120',
        mrp: '130',
        batchNo: `B${Date.now().toString().slice(-4)}`,
      });
      await rateCardPage.clickSaveRateCard();
      await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 10000 });
    }

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
    // Check if at least one rate card exists in table
    const hasRows = (await rateCardPage.priceTableRows.count()) > 0;
    if (!hasRows) {
      await rateCardPage.openAddRateCardModal();
      await rateCardPage.fillRateCard({
        basicPrice: '100',
        wPrice: '110',
        retailPrice: '120',
        mrp: '130',
        batchNo: `B${Date.now().toString().slice(-4)}`,
      });
      await rateCardPage.clickSaveRateCard();
      await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // Edit the rate card
    await rateCardPage.clickEditFirstRateCard();

    // Verify edit mode
    await expect(rateCardPage.modalTitle).toContainText(/edit rate card/i);
    await expect(rateCardPage.saveBtn).toContainText(/update rate card/i);

    // Update batch number with a unique tag
    const updatedBatch = `U${Date.now().toString().slice(-5)}`;
    await rateCardPage.batchNoInput.click();
    await rateCardPage.batchNoInput.fill(updatedBatch);

    // Save update
    await rateCardPage.clickSaveRateCard();
    await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 15000 });

    // Verify updated batch appears in price table
    await expect(rateCardPage.priceTable).toContainText(updatedBatch);
  });
});
