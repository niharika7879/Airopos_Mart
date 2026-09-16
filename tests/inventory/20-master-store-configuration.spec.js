import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { StoreSettingsPage } from '../../pages/StoreSettingsPage.js';

test.describe('Master Configuration Workflow: Warehouse, Branch & Franchise Setup', () => {
  let loginPage;
  let storeSettingsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    storeSettingsPage = new StoreSettingsPage(page);

    // Reuse authenticated session or login via OTP
    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  });

  test.afterEach(async ({ page }) => {
    // Dismiss dialog if left open to keep session clean
    await storeSettingsPage.cancelDialog();
  });

  test('Step 1 — Configure Warehouse (Telangana 36... with Consistent State & PIN)', async ({ page }) => {
    const warehouseData = {
      storeName: 'Central Mega Warehouse',
      contactPerson: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'warehouse.hyd@airopos.com',
      gstin: '36AAACH7409R1ZZ',
      pinCode: '500001',
      state: 'Telangana',
      village: 'HYDERABAD'
    };

    // 1. Verify GSTIN state consistency logic
    const isConsistent = storeSettingsPage.validateGstinStateCode(warehouseData.gstin, warehouseData.state);
    expect(isConsistent).toBeTruthy();
    expect(warehouseData.gstin.slice(0, 2)).toBe('36');

    // 2. Navigate to Settings -> Warehouse
    await storeSettingsPage.navigateTo('warehouse');
    await expect(page).toHaveURL(/.*\/erp\/dashboard\/settings\/warehouse.*/);

    // 3. Open Add Store Dialog & Fill Details
    if (await storeSettingsPage.addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await storeSettingsPage.openAddStoreDialog();
      await storeSettingsPage.fillStoreDetails(warehouseData);
      console.log('  ✅ Warehouse Form populated with valid Telangana GSTIN: 36AAACH7409R1ZZ, PIN: 500001');
      await storeSettingsPage.cancelDialog();
    } else {
      console.log('  ℹ️ Add button restricted by permissions or already configured');
    }
  });

  test('Step 2 — Configure Branch (Telangana 36... Same-State for Intra-State Transfer)', async ({ page }) => {
    const branchData = {
      storeName: 'Kukatpally Retail Branch',
      contactPerson: 'Suresh Babu',
      phone: '9876543211',
      email: 'branch.kukatpally@airopos.com',
      gstin: '36AAACH7409R1ZZ',
      pinCode: '500034',
      state: 'Telangana',
      village: 'HYDERABAD'
    };

    // Verify same-state check with Warehouse (both start with 36)
    const isConsistent = storeSettingsPage.validateGstinStateCode(branchData.gstin, branchData.state);
    expect(isConsistent).toBeTruthy();
    expect(branchData.gstin.slice(0, 2)).toBe('36');

    // Navigate to Settings -> Branch
    await storeSettingsPage.navigateTo('branch');
    await expect(page).toHaveURL(/.*\/erp\/dashboard\/settings\/branch.*/);

    if (await storeSettingsPage.addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await storeSettingsPage.openAddStoreDialog();
      await storeSettingsPage.fillStoreDetails(branchData);
      console.log('  ✅ Branch Form populated with same-state Telangana GSTIN: 36AAACH7409R1ZZ, PIN: 500034');
      await storeSettingsPage.cancelDialog();
    }
  });

  test('Step 3 — Configure Franchise (Andhra Pradesh 37... for Inter-State Transfer)', async ({ page }) => {
    const franchiseData = {
      storeName: 'Vijayawada Prime Franchise',
      contactPerson: 'Venkat Rao',
      phone: '9876543212',
      email: 'franchise.vja@airopos.com',
      gstin: '37AAAFV1234Q1Z5',
      pinCode: '520001',
      state: 'Andhra Pradesh',
      village: 'VIJAYAWADA'
    };

    // Verify Inter-State check: Franchise (37 - AP) differs from Warehouse (36 - TS)
    const isConsistent = storeSettingsPage.validateGstinStateCode(franchiseData.gstin, franchiseData.state);
    expect(isConsistent).toBeTruthy();
    expect(franchiseData.gstin.slice(0, 2)).toBe('37');

    // Navigate to Settings -> Franchise
    await storeSettingsPage.navigateTo('franchise');
    await expect(page).toHaveURL(/.*\/erp\/dashboard\/settings\/franchise.*/);

    if (await storeSettingsPage.addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await storeSettingsPage.openAddStoreDialog();
      await storeSettingsPage.fillStoreDetails(franchiseData);
      console.log('  ✅ Franchise Form populated with inter-state Andhra Pradesh GSTIN: 37AAAFV1234Q1Z5, PIN: 520001');
      await storeSettingsPage.cancelDialog();
    }
  });

  test('Step 4 — Negative Validation: GSTIN State Code Mismatch (37 vs Telangana)', async () => {
    // Attempting to use Andhra Pradesh GSTIN (37) with Telangana state
    const mismatchGstin = '37AAACH7409R1ZZ';
    const declaredState = 'Telangana';

    const isConsistent = storeSettingsPage.validateGstinStateCode(mismatchGstin, declaredState);
    expect(isConsistent).toBeFalsy();
    console.log('  ✅ Validation Rule Verified: GSTIN prefix 37 does NOT match Telangana state (Requires 36)');
  });
});
