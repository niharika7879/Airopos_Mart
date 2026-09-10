import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';
import { RateCardPage } from '../pages/RateCardPage.js';

test.describe('Rate Card - End-to-End Creation Flow', () => {
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

  test('should successfully create a new rate card with valid pricing hierarchy and verify in price table', async ({ page }) => {
    await rateCardPage.openAddRateCardModal();

    // Generate unique pricing and batch to avoid backend duplicate constraint
    const randomOffset = Math.floor(Math.random() * 800) + 20;
    const basePrice = String(100 + randomOffset);
    const wholesalePrice = String(110 + randomOffset);
    const retailPrice = String(120 + randomOffset);
    const mrp = String(130 + randomOffset);
    const uniqueBatch = `B${Date.now().toString().slice(-6)}`;

    // Fill valid prices following hierarchy: Base Price < Wholesale Price < Retail Price < MRP
    await rateCardPage.fillRateCard({
      basicPrice: basePrice,
      wPrice: wholesalePrice,
      retailPrice: retailPrice,
      mrp: mrp,
      batchNo: uniqueBatch,
    });

    await rateCardPage.clickSaveRateCard();

    // Verify modal closes after successful creation
    await rateCardPage.modal.waitFor({ state: 'hidden', timeout: 15000 });

    // Verify the newly created rate card appears in the price table
    await expect(rateCardPage.priceTable).toBeVisible();
    await expect(rateCardPage.priceTable).toContainText(uniqueBatch);
  });
});
