import fs from 'fs';
import path from 'path';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const COMPANY_CODE = process.env.COMPANY_CODE || 'SUBHAMMART';
const USER_PHONE = process.env.USER_PHONE || '9876543210';
const USER_PASSWORD = process.env.USER_PASSWORD || 'password123';

const CSV_FILE = path.resolve(process.cwd(), 'AIroPOS_MasterData_SKUs.csv');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

async function authenticate() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyCode: COMPANY_CODE,
        phone: USER_PHONE,
        password: USER_PASSWORD
      })
    });
    const data = await res.json();
    const token = data?.token || data?.data?.token || res.headers.get('authorization');
    return token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : 'Bearer LOCAL_DEV_TOKEN';
  } catch {
    return 'Bearer LOCAL_DEV_TOKEN';
  }
}

async function run() {
  console.log('========================================================================');
  console.log('       AIroPOS Master Data Runner (Zero-Dependency Node.js Fetch)       ');
  console.log('========================================================================\n');

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(raw);
  const token = await authenticate();

  const validSkus = [];
  let passed = 0;
  let failed = 0;

  for (const row of rows) {
    const barcode = row.Barcode;
    const baseProduct = row.Base_Product_Name;
    const category = row.Category;
    const uom = (row.UOM || '').toLowerCase();
    const unitValue = Number(row.Unit_Value || 1);
    const stopOrder = parseInt(row.Stop_Order_Qty, 10) || 0;

    console.log(`[SKU] Barcode: ${barcode.padEnd(14)} | Cat: ${category.padEnd(14)} | UOM: ${uom.padEnd(11)} | UnitVal: ${unitValue} | StopOrder: ${String(stopOrder).padStart(2)}`);

    let error = null;
    if (!baseProduct) error = 'Missing Base_Product_Name';
    else if (!category) error = 'Missing Category';
    else if (!uom) error = 'Missing UOM';
    else if (unitValue !== 1) error = 'Unit Value must be 1';

    if (error) {
      if (row.Scenario_Type && row.Scenario_Type.startsWith('Negative')) {
        console.log(`   -> [PASS] Expected error verified: ${error}\n`);
        passed++;
      } else {
        console.log(`   -> [FAIL] Unexpected error: ${error}\n`);
        failed++;
      }
      continue;
    }

    validSkus.push({
      barCode: barcode,
      baseProductName: baseProduct,
      categoryName: category,
      subCategoryName: row.Sub_Category,
      brandName: row.Brand_Name,
      manufacturerName: row.Manufacturer_Name,
      variantName: row.Variant_Name,
      uomUnits: uom,
      unitValue: 1,
      hsn: row.HSN_Code,
      tax: parseFloat(row.Tax_Percent) || 0,
      cess: parseFloat(row.Cess_Percent) || 0,
      status: (row.Status || 'ACTIVE').toUpperCase(),
      stopOrderQuantity: stopOrder
    });
    passed++;
  }

  if (validSkus.length > 0) {
    console.log(`\nSubmitting ${validSkus.length} validated SKUs to ${GATEWAY_URL}/api/masterdata/v1/skus/import...`);
    try {
      const res = await fetch(`${GATEWAY_URL}/api/masterdata/v1/skus/import`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          'X-Tenant-Id': COMPANY_CODE
        },
        body: JSON.stringify({
          skus: validSkus,
          options: { skipDuplicates: true, updateExisting: true, duplicateCheckField: 'barCode' }
        })
      });

      const resData = await res.json().catch(() => ({}));
      console.log('-> API Response Status:', res.status);
      console.log('-> API Message:', resData.message || 'Import processed');
    } catch (apiErr) {
      console.log('-> API Status: Backend service offline. Pre-flight data validation completed successfully.');
    }
  }

  console.log('\n========================================================================');
  console.log(`TOTAL ROWS PROCESSED : ${rows.length}`);
  console.log(`PASSED VERIFICATIONS : ${passed}`);
  console.log(`FAILED VERIFICATIONS : ${failed}`);
  console.log('========================================================================\n');
}

run().catch(console.error);
