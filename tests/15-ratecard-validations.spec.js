import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';
import { RateCardPage } from '../pages/RateCardPage.js';

test.describe('Rate Card - Field & Hierarchy Validations', () => {
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
    await rateCardPage.openAddRateCardModal();
  });

  test('should show validation error when mandatory pricing fields are missing', async ({ page }) => {
    // Attempt save without filling required fields
    await rateCardPage.clickSaveRateCard();

    // Verify error notification
    await rateCardPage.expectNotification(/required|base price|mrp|retail price/i);
  });

  test('should validate Retail Price cannot exceed MRP', async ({ page }) => {
    await rateCardPage.fillRateCard({
      basicPrice: '100',
      mrp: '120',
      retailPrice: '150', // Violates Retail Price <= MRP
    });

    await rateCardPage.clickSaveRateCard();
    await rateCardPage.expectNotification(/retail price must be less than or equal to mrp/i);
  });

  test('should validate Base Price must be less than MRP', async ({ page }) => {
    await rateCardPage.fillRateCard({
      basicPrice: '150',
      mrp: '100', // Violates Base Price < MRP
      retailPrice: '120',
    });

    await rateCardPage.clickSaveRateCard();
    await rateCardPage.expectNotification(/base price must be less than mrp/i);
  });

  test('should validate Wholesale Price must be less than or equal to Retail Price', async ({ page }) => {
    await rateCardPage.fillRateCard({
      basicPrice: '100',
      retailPrice: '120',
      mrp: '150',
      wPrice: '130', // Violates Wholesale Price <= Retail Price
    });

    await rateCardPage.clickSaveRateCard();
    await rateCardPage.expectNotification(/wholesale price must be less than/i);
  });
});
