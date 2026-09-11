import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { MasterDataSkuPage } from '../../pages/MasterDataSkuPage.js';
import { HsnMasterPage } from '../../pages/HsnMasterPage.js';

test.describe('Master Data - HSN/SAC Master & Governed Tax Mapping', () => {
  let loginPage;
  let skuPage;
  let hsnPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    skuPage = new MasterDataSkuPage(page);
    hsnPage = new HsnMasterPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
    await skuPage.navigateToMasterData();
  });

  test('should display HSN / SAC Master tab, table headers, and controls', async ({ page }) => {
    // Navigate via tab
    await hsnPage.navigateViaTab();

    // Verify header and URL
    await expect(hsnPage.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/.*hsn-codes.*/);

    // Verify Add button and search bar
    await expect(hsnPage.addHsnBtn).toBeVisible();
    await expect(hsnPage.searchInput).toBeVisible();
    await expect(hsnPage.refreshBtn).toBeVisible();

    // Verify table visibility and headers
    await expect(hsnPage.hsnTable).toBeVisible();
    await expect(page.locator('.product-table')).toContainText(/HSN\/SAC Code/i);
    await expect(page.locator('.product-table')).toContainText(/Description/i);
    await expect(page.locator('.product-table')).toContainText(/GST Rate/i);
    await expect(page.locator('.product-table')).toContainText(/Status/i);
  });

  test('should open Add HSN/SAC Code modal and validate required fields', async ({ page }) => {
    await hsnPage.navigateViaTab();
    await hsnPage.openAddHsnModal();

    // Verify modal title & inputs
    await expect(hsnPage.dialogTitle).toContainText(/add hsn\/sac code/i);
    await expect(hsnPage.hsnCodeInput).toBeVisible();
    await expect(hsnPage.descriptionInput).toBeVisible();
    await expect(hsnPage.gstRateSelect).toBeVisible();

    // Attempt save with empty form
    await hsnPage.saveBtn.click();

    // Verify validation notification appears
    const notification = page.locator('.v-snackbar__content, .v-alert').first();
    await expect(notification).toBeVisible({ timeout: 6000 });
    await expect(notification).toContainText(/required/i);

    // Cancel modal
    await hsnPage.clickCancel();
    await expect(hsnPage.dialog).toBeHidden();
  });

  test('should create a new HSN/SAC code and display it in table', async ({ page }) => {
    await hsnPage.navigateViaTab();
    await hsnPage.openAddHsnModal();

    // Unique 6-digit HSN code (within 8 char max)
    const uniqueHsn = `88${Date.now().toString().slice(-4)}`;
    const description = `Test Item ${uniqueHsn}`;

    await hsnPage.fillHsnDetails({
      hsnCode: uniqueHsn,
      description: description,
      gstRate: '18',
      cessRate: '0',
      status: 'ACTIVE',
    });

    await hsnPage.clickSave();

    // Search for newly created HSN code
    await hsnPage.search(uniqueHsn);

    // Verify created HSN row in table
    const createdRow = hsnPage.tableRows.filter({ hasText: uniqueHsn }).first();
    await expect(createdRow).toBeVisible({ timeout: 8000 });
    await expect(createdRow).toContainText(description);
    await expect(createdRow).toContainText('18%');
  });

  test('should search HSN table by code or description', async ({ page }) => {
    await hsnPage.navigateViaTab();

    // Search for an existing standard code
    await hsnPage.search('0401');

    // Verify matching row
    const matchRow = hsnPage.tableRows.first();
    await expect(matchRow).toBeVisible({ timeout: 8000 });
    await expect(matchRow).toContainText(/0401/i);

    // Clear search
    await hsnPage.searchInput.fill('');
    await hsnPage.page.waitForTimeout(500);
    expect(await hsnPage.tableRows.count()).toBeGreaterThanOrEqual(1);
  });

  test('should auto-populate and lock Tax % when selecting HSN code from master in SKU creation', async ({ page }) => {
    await skuPage.openAddSku();

    // Search and select known HSN code '04012000' (GST rate 0%)
    await skuPage.selectHsnFromMaster('0401', '04012000');

    // Verify Tax % field is auto-set to 0
    await expect(skuPage.taxSelect).toContainText(/0/);

    // Verify Tax % is locked / disabled by HSN master
    await expect(skuPage.taxSelect).toHaveClass(/v-input--disabled/);

    // Verify hint indicating governed auto-set rate
    const hint = page.locator('.form-group').filter({ hasText: /Tax/i }).locator('.v-messages');
    await expect(hint).toContainText(/auto-set from hsn master/i);
  });

  test('should keep Tax % editable when free-typing an unmapped HSN code in SKU creation', async ({ page }) => {
    await skuPage.openAddSku();

    // Type custom / unmapped HSN code
    const customHsn = `91${Date.now().toString().slice(-4)}`;
    await skuPage.hsnCodeInput.fill(customHsn);
    await page.waitForTimeout(400);

    // Verify Tax % remains enabled
    await expect(skuPage.taxSelect).toBeEnabled();

    // Manually select a tax rate (e.g. 5%)
    await skuPage.selectOption(skuPage.taxSelect, '5');
    await expect(skuPage.taxSelect).toContainText(/5/);
  });
});
