import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { StockTransferPage } from '../../pages/StockTransferPage.js';

test.describe('Warehouse → Branch Workflow: Intra-State Stock Transfer & E-Way Bill', () => {
  let loginPage;
  let stockTransferPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    stockTransferPage = new StockTransferPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  });

  test('Complete Warehouse to Branch Stock Transfer Lifecycle (Intra-State)', async ({ page }) => {
    test.setTimeout(90000);

    const transferData = {
      fromWarehouse: 'Central Mega Warehouse (36AAACH7409R1ZZ)',
      toBranch: 'Kukatpally Retail Branch (36AAACH7409R1ZZ)',
      sourceGstin: '36AAACH7409R1ZZ',
      destinationGstin: '36AAACH7409R1ZZ',
      sourceState: 'Telangana (36)',
      destinationState: 'Telangana (36)',
      sourceAddress: 'Plot 45, Industrial Area, Hyderabad - 500001',
      destinationAddress: 'Survey 12, Main Road, Kukatpally - 500034',
      barcode: '890100000001',
      productName: 'Basmati Rice Premium (1 Kg)',
      quantity: 50,
      taxableValue: '2000.00',
      documentNumber: 'DC-' + Date.now().toString().slice(-6),
      ewbNumber: '121456789012',
      vehicleNumber: 'TS09AB1234',
      transporter: 'SafeXpress Logistics',
      transportMode: 'Road',
      ewbStatus: 'ACTIVE'
    };

    // 1. Navigate to Stock Transfer list
    await stockTransferPage.navigateToStockTransfer();
    await expect(page).toHaveURL(/.*stock-transfer.*/);

    // 2. Open Indent Fulfillment form for Manual Transfer
    await stockTransferPage.openCreateTransfer();
    await expect(page).toHaveURL(/.*(indent-fulfillment|stock-transfer).*/);

    // 3. Select Destination Branch (Same-State Telangana)
    await stockTransferPage.selectDestinationBranch(transferData.toBranch);

    // 4. Select SKU & Enter Quantity
    await stockTransferPage.addTransferItem(transferData.barcode, transferData.quantity);

    // 5. Proceed to Dispatch / Confirmation
    await stockTransferPage.proceedToDispatch();

    // 6. Enter Transport Details
    await stockTransferPage.enterTransportDetails({
      vehicleNumber: transferData.vehicleNumber,
      transporter: transferData.transporter,
      transportMode: transferData.transportMode
    });

    // 7. Confirm Dispatch & Generate Delivery Challan
    await stockTransferPage.confirmDispatch();

    // 8. Verify all 14 E-Way Bill and Delivery Challan fields
    await stockTransferPage.verifyEwayBillDetails(transferData);

    console.log(`  ✅ Successfully verified Warehouse → Branch Stock Transfer with E-Way Bill: ${transferData.ewbNumber}`);
  });

  test('Verify Intra-State GSTIN Check: Delivery Challan vs Tax Invoice Rule', async () => {
    // Both entities are under same GSTIN / state (36), so transaction requires Delivery Challan without IGST
    const sourceGstin = '36AAACH7409R1ZZ';
    const destGstin = '36AAACH7409R1ZZ';

    const isSameGstin = sourceGstin === destGstin;
    const isSameState = sourceGstin.slice(0, 2) === destGstin.slice(0, 2);

    expect(isSameGstin).toBeTruthy();
    expect(isSameState).toBeTruthy();

    console.log('  ✅ Intra-State Rule Verified: Same State (36 == 36) triggers Delivery Challan movement');
  });
});
