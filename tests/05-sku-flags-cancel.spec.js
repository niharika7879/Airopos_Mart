import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { MasterDataSkuPage } from '../pages/MasterDataSkuPage.js';

test.describe('Master Data - Item Checkboxes & Cancel Action', () => {
  test('should allow toggling checkboxes and cancel dismissing the form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // Login and open Add SKU
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
    await skuPage.openAddSku();

    // Verify and toggle checkboxes
    await skuPage.freeItemCheckbox.check({ force: true });
    await expect(skuPage.freeItemCheckbox).toBeChecked();

    await skuPage.bulkItemCheckbox.check({ force: true });
    await expect(skuPage.bulkItemCheckbox).toBeChecked();

    // Click Cancel to dismiss the form
    await skuPage.clickCancel();

    // Form should close, Add SKU button should be visible again
    await expect(skuPage.addSkuCard).not.toBeVisible({ timeout: 5000 });
    await expect(skuPage.addSkuButton).toBeVisible();
  });
});
