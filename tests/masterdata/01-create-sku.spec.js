import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - Create SKU Flow', () => {
  test('should login and successfully create a new SKU with valid details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // 1. Login with OTP
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);

    // 2. Open Master Data -> Add SKU
    await skuPage.navigateToMasterData();
    await skuPage.openAddSku();

    // 3. Fill SKU details (exact scenario from your recording)
    await skuPage.fillSkuDetails({
      brand: 'Aashirvaad',
      baseProduct: 'Aashirvaad Maida 500g',
      variant: 'AA',
      uom: 'KG',
      unitValue: '1',
      manufacturer: 'Aashirvaad',
      hsnCode: '123456',
      tax: '5',
      isBulkItem: false,
    });

    // 4. Save
    await skuPage.clickSave();

    // 5. Verification
    const toast = page.locator('.v-snackbar__content, .v-alert').first();
    const isToastVisible = await toast.isVisible({ timeout: 5000 }).catch(() => false);
    if (isToastVisible) {
      await expect(toast).toContainText(/saved|success|added/i);
    } else {
      await expect(skuPage.skuTable).toBeVisible({ timeout: 5000 });
    }
  });
});
