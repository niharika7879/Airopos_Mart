import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';
import { RateCardPage } from '../pages/RateCardPage.js';

test.describe('Rate Card - Navigation & UI Elements', () => {
  let loginPage;
  let skuPage;
  let rateCardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    skuPage = new MasterDataSkuPage(page);
    rateCardPage = new RateCardPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
  });

  test('should display Price List section and Add Rate Card button when editing an SKU', async ({ page }) => {
    await rateCardPage.openFirstSkuForEdit();

    await expect(rateCardPage.priceListSection).toBeVisible();
    await expect(rateCardPage.openAddRateCardBtn).toBeVisible();
    await expect(rateCardPage.priceTable).toBeVisible();
  });

  test('should open Add Rate Card modal with metadata and core pricing inputs', async ({ page }) => {
    await rateCardPage.openFirstSkuForEdit();
    await rateCardPage.openAddRateCardModal();

    // Verify modal title & header info
    await expect(rateCardPage.modalTitle).toContainText(/add rate card/i);
    await expect(rateCardPage.skuHeaderBlock).toBeVisible();
    await expect(rateCardPage.productHeaderBlock).toBeVisible();

    // Verify core pricing input fields
    await expect(rateCardPage.basicPriceInput).toBeVisible();
    await expect(rateCardPage.mrpInput).toBeVisible();
    await expect(rateCardPage.retailPriceInput).toBeVisible();
    await expect(rateCardPage.wholesalePriceInput).toBeVisible();
    await expect(rateCardPage.schPercentageInput).toBeVisible();
    await expect(rateCardPage.batchNoInput).toBeVisible();

    // Verify Cancel button dismisses the modal
    await rateCardPage.clickCancelRateCard();
    await expect(rateCardPage.modal).toBeHidden();
  });
});
