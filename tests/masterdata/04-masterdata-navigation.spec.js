import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';

test.describe('Master Data - Tab Navigation Scenarios', () => {
  test('should display all 10 tabs and allow navigation between them', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const skuPage = new MasterDataSkuPage(page);

    // Login and open Master Data
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();

    const expectedTabs = [
      'SKU',
      'Base Product',
      'Sub Category',
      'Category',
      'Brand',
      'Variant',
      'UOM',
      'Manufacturer',
      'BOM Config',
      'Code Config',
    ];

    // Verify all tabs are visible
    for (const tab of expectedTabs) {
      const tabElement = page.locator('.master-data-tabs .tab-item, .tab-navigation .tab-item')
        .filter({ hasText: new RegExp(`^\\s*${tab}\\s*$`, 'i') });
      await expect(tabElement.first()).toBeVisible();
    }

    // Switch to Base Product tab
    await skuPage.switchTab('Base Product');
    const baseProductTab = page.locator('.master-data-tabs .tab-item.active, .tab-navigation .tab-item.active');
    await expect(baseProductTab.first()).toContainText('Base Product');

    // Switch back to SKU tab
    await skuPage.switchTab('SKU');
    const skuTab = page.locator('.master-data-tabs .tab-item.active, .tab-navigation .tab-item.active');
    await expect(skuTab.first()).toContainText('SKU');
  });
});
