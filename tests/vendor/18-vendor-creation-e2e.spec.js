import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { VendorPage } from '../../pages/VendorPage.js';

test.describe('Vendor Management - E2E Creation & UI Verification', () => {
  let loginPage;
  let vendorPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    vendorPage = new VendorPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  });

  test('should display Vendor List table and controls', async ({ page }) => {
    await vendorPage.navigateToVendorList();
    await expect(vendorPage.vendorTable).toBeVisible();
    await expect(vendorPage.addVendorBtn).toBeVisible();
    await expect(vendorPage.searchInput).toBeVisible();
  });

  test('should validate required fields when saving empty vendor basic info', async ({ page }) => {
    await vendorPage.openAddVendor();
    await vendorPage.clickSaveAndContinue();

    // Verify error notification or inline error message
    const errorMsg = page.locator('.v-snackbar__content, .v-snackbar, .v-messages, .v-alert')
      .or(page.getByText(/Please fill all required fields|required/i)).first();
    await expect(errorMsg).toContainText(/required/i, { timeout: 10000 });
  });

  test('should create a new Vendor and verify in Vendor List table', async ({ page }) => {
    await vendorPage.openAddVendor();

    const letterSuffix = Date.now().toString().slice(-5).split('').map(d => String.fromCharCode(65 + Number(d))).join('').toLowerCase();
    const titleSuffix = letterSuffix.charAt(0).toUpperCase() + letterSuffix.slice(1);
    const companyName = 'Balaji Wholesale ' + titleSuffix;
    const displayName = 'Balaji ' + titleSuffix;
    const email = `vendor.${letterSuffix}@airopos.test`;
    const phone = '98' + Math.floor(10000000 + Math.random() * 90000000);

    await vendorPage.fillBasicInfo({
      companyName,
      displayName,
      phone,
      email,
    });

    await vendorPage.clickSaveAndContinue();

    // Return to Vendor List and verify created record
    await vendorPage.navigateToVendorList();
    await expect(vendorPage.vendorTable).toContainText(email, { timeout: 15000 });
  });
});
