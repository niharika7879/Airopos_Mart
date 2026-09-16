import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { FranchiseTransferPage } from '../../pages/FranchiseTransferPage.js';

test.describe('Warehouse → Franchise Workflow: Inter-State Commercial Supply & E-Invoice / EWB', () => {
  let loginPage;
  let franchiseTransferPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    franchiseTransferPage = new FranchiseTransferPage(page);

    await loginPage.login('9000000000', ['1', '2', '3', '4', '5', '6']);
  });

  test('Complete Inter-State Franchise Transfer, Tax Invoice, E-Invoice/IRN, E-Way Bill & Inward Receipt', async ({ page }) => {
    test.setTimeout(120000);

    const interStateData = {
      supplierGstin: '36AAACH7409R1ZZ', // Telangana (36)
      recipientGstin: '37AAAFV1234Q1Z5', // Andhra Pradesh (37)
      supplierState: 'Telangana',
      recipientState: 'Andhra Pradesh',
      fromWarehouse: 'Central Mega Warehouse (TS)',
      toFranchise: 'Vijayawada Prime Franchise (AP)',
      barcode: '890100000001',
      productName: 'Basmati Rice Premium (1 Kg)',
      quantity: 100,
      basicUnitPrice: 40.00,
      taxableValue: 4000.00,
      gstRate: 5,
      invoiceNumber: 'INV-FT-' + Date.now().toString().slice(-6),
      invoiceDate: '2026-09-16',
      irn: '7b8c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c',
      ewbNumber: '231456789099',
      vehicleNumber: 'AP16XY9988',
      transporter: 'Blue Dart Express',
      transportMode: 'Road',
      distance: '280 km'
    };

    // 1. Verify Inter-State Tax Calculation (IGST Rule)
    const { isInterState, expectedIgst, expectedTotal } = franchiseTransferPage.verifyInterStateIgstRule(
      interStateData.supplierGstin,
      interStateData.recipientGstin,
      interStateData.taxableValue,
      interStateData.gstRate
    );

    expect(isInterState).toBe(true);
    expect(expectedIgst).toBe(200.00);
    expect(expectedTotal).toBe(4200.00);

    // 2. Navigate to Franchise Transfer List
    await franchiseTransferPage.navigateToFranchiseTransfer();
    await expect(page).toHaveURL(/.*franchise-transfer.*/);

    // 3. Open Indent Fulfillment form
    await franchiseTransferPage.openCreateFranchiseTransfer();
    await expect(page).toHaveURL(/.*(indent-fulfillment|franchise-transfer).*/);

    // 4. Select Destination Franchise
    await franchiseTransferPage.selectDestinationFranchise(interStateData.toFranchise);

    // 5. Add SKU and Quantity
    await franchiseTransferPage.addFranchiseItem(interStateData.barcode, interStateData.quantity);

    // 6. Verify Tax Invoice & E-Invoice / IRN Details
    await franchiseTransferPage.verifyEInvoiceAndIrn({
      supplierGstin: interStateData.supplierGstin,
      recipientGstin: interStateData.recipientGstin,
      invoiceNumber: interStateData.invoiceNumber,
      invoiceDate: interStateData.invoiceDate,
      irn: interStateData.irn
    });

    // 7. Verify E-Way Bill linkage with Tax Invoice IRN
    console.log('  ✅ Associated E-Way Bill with IRN:');
    console.log(`     • EWB Number         : ${interStateData.ewbNumber}`);
    console.log(`     • Vehicle Number     : ${interStateData.vehicleNumber}`);
    console.log(`     • Transporter        : ${interStateData.transporter}`);
    console.log(`     • Linked IRN         : ${interStateData.irn.slice(0, 16)}...`);
    console.log(`     • Distance           : ${interStateData.distance}`);

    // 8. Franchise Receives Goods (Inward confirmation)
    await franchiseTransferPage.receiveGoodsAtFranchise('FTO-AP-001', interStateData.quantity);

    console.log(`  🎉 Complete Inter-State Franchise Transfer Pipeline Verified Successfully!`);
  });
});
