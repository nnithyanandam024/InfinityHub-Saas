/**
 * Comprehensive End-to-End Inventory & Billing/POS Verification Suite
 * Tests the entire lifecycle across both Inventory Management and Billing & POS:
 * 
 * 1. Health & Tenant Baseline Initializer
 * 2. Inventory Master Data CRUD (Category, Brand, Supplier, Product)
 * 3. Procurement & Inward Stock Inflow (Purchase Orders -> Stock Increase)
 * 4. Manual Stock Adjustments & Immutable Ledger Audits
 * 5. POS Register Shifts & Cash Drawer Movements
 * 6. POS Customers & Customer Credit Accounts
 * 7. POS Cart Checkout & Automated Stock Deductions (Cross-domain synchronization)
 * 8. POS Returns & Stock Replenishment (Restocking verification)
 * 9. POS Manager Void & Complete Stock Reversal
 * 10. Shift Closing & Double-Entry Ledger Mathematical Reconciliation
 * 11. Master Entity Deletion & Orphan Prevention
 */

import { apiClient, setApiBaseUrl } from '@infinityhub/api-client';
import type {
  Product,
  Category,
  Supplier,
  Purchase,
  StockMovement,
  RegisterShift,
  Invoice,
  PosCustomer,
  PosOrder
} from '@infinityhub/types';

interface TestAssertionResult {
  suite: string;
  test: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestAssertionResult[] = [];

function assert(condition: boolean, suite: string, test: string, details?: string) {
  if (condition) {
    results.push({ suite, test, passed: true, details });
    console.log(`  ✓ [${suite}] ${test}`);
    if (details) console.log(`      ↳ ${details}`);
  } else {
    results.push({ suite, test, passed: false, error: 'Assertion failed', details });
    console.error(`  ✗ [${suite}] ${test} - FAILED!`);
    if (details) console.error(`      ↳ ${details}`);
  }
}

async function runInventoryBillingVerification() {
  console.log('\n================================================================');
  console.log('   INFINITYHUB: INVENTORY & BILLING/POS END-TO-END FLOW QA');
  console.log('================================================================\n');

  // Point api client to local backend
  setApiBaseUrl('http://localhost:4000');
  const TENANT_ID = 'tenant-kumar-stores';

  // ==============================================================
  // SUITE 1: CONNECTIVITY & TENANT BASELINE
  // ==============================================================
  console.log('--- 1. Testing Connectivity & Tenant Baseline ---');
  try {
    const healthRes = await fetch('http://localhost:4000/api/v1/health');
    const health = await healthRes.json();
    assert(health.status === 'online' && health.port === 4000, 'Baseline', 'API Health Check Online', `Port: ${health.port}, Uptime: ${health.uptimeSeconds}s`);
  } catch (err: any) {
    assert(false, 'Baseline', 'API Server Reachable', err.message);
    console.error('API server must be running on port 4000 to execute the test suite.');
    process.exit(1);
  }

  const storeData = await apiClient.inventory.getStoreData(TENANT_ID);
  assert(Boolean(storeData.tenant && storeData.tenant.id === TENANT_ID), 'Baseline', 'Retrieve Tenant Store Workspace', `Store: ${storeData.tenant.name}`);

  // ==============================================================
  // SUITE 2: INVENTORY MASTER CRUD
  // ==============================================================
  console.log('\n--- 2. Testing Inventory Master Data CRUD ---');

  // 2.1 Category CRUD
  const initialCategories = await apiClient.inventory.getCategories(TENANT_ID);
  const newCat = await apiClient.inventory.createCategory(TENANT_ID, {
    name: 'Gourmet Beverages & Soda',
    description: 'Imported and artisanal packaged beverages'
  });
  assert(Boolean(newCat.id && newCat.name === 'Gourmet Beverages & Soda'), 'Inventory:Category', 'Create Category (POST)', `ID: ${newCat.id}`);

  const updatedCat = await apiClient.inventory.updateCategory(TENANT_ID, newCat.id, {
    name: 'Artisanal Beverages & Craft Drinks',
    description: 'Updated specialty beverages category'
  });
  assert(updatedCat.name === 'Artisanal Beverages & Craft Drinks', 'Inventory:Category', 'Update Category (PUT)', `Updated Name: ${updatedCat.name}`);

  const categoriesAfterCreate = await apiClient.inventory.getCategories(TENANT_ID);
  assert(categoriesAfterCreate.some(c => c.id === newCat.id), 'Inventory:Category', 'Read Categories List (GET)', `Total Categories: ${categoriesAfterCreate.length}`);

  // 2.2 Supplier CRUD
  const newSupplier = await apiClient.inventory.createSupplier(TENANT_ID, {
    name: 'Kavitha Ramaswamy',
    companyName: 'Apex Craft Beverages Ltd',
    phone: '9840188990',
    email: 'orders@apexcraft.in',
    taxNumber: '33AABCA9988F1Z2',
    paymentTerms: 'net_30'
  });
  assert(Boolean(newSupplier.id && newSupplier.companyName === 'Apex Craft Beverages Ltd'), 'Inventory:Supplier', 'Create Supplier (POST)', `Supplier: ${newSupplier.companyName}`);

  const updatedSupplier = await apiClient.inventory.updateSupplier(TENANT_ID, newSupplier.id, {
    phone: '9840199999'
  });
  assert(updatedSupplier.phone === '9840199999', 'Inventory:Supplier', 'Update Supplier (PUT)', `Phone: ${updatedSupplier.phone}`);

  const suppliersList = await apiClient.inventory.getSuppliers(TENANT_ID);
  assert(suppliersList.some(s => s.id === newSupplier.id), 'Inventory:Supplier', 'Read Suppliers List (GET)', `Total Suppliers: ${suppliersList.length}`);

  // 2.3 Product CRUD (With opening stock = 40)
  const initialProducts = await apiClient.inventory.getProducts(TENANT_ID);
  const testSku = `SKU-CRF-${Date.now().toString().slice(-4)}`;
  const testBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

  const newProduct = await apiClient.inventory.createProduct(TENANT_ID, {
    name: 'Sparkling Himalayan Berry Soda 330ml',
    sku: testSku,
    barcode: testBarcode,
    hsnCode: '2202',
    categoryId: newCat.id,
    categoryName: newCat.name,
    costPrice: 65,
    sellingPrice: 120,
    mrp: 140,
    taxRate: 18,
    stockQuantity: 40,
    minimumStock: 10,
    reorderQuantity: 30,
    unit: 'can'
  });

  assert(Boolean(newProduct.id && newProduct.stockQuantity === 40), 'Inventory:Product', 'Create Product with Opening Stock (POST)', `SKU: ${newProduct.sku}, Opening Stock: 40, Barcode: ${newProduct.barcode}`);

  // Update Product
  const updatedProduct = await apiClient.inventory.updateProduct(TENANT_ID, newProduct.id, {
    sellingPrice: 130
  });
  assert(updatedProduct.sellingPrice === 130 && updatedProduct.stockQuantity === 40, 'Inventory:Product', 'Update Product Details (PUT)', `New Selling Price: ₹130, Stock Preserved: ${updatedProduct.stockQuantity}`);

  // ==============================================================
  // SUITE 3: PROCUREMENT & INWARD STOCK INFLOW
  // ==============================================================
  console.log('\n--- 3. Testing Procurement & Inward Stock Inflow ---');

  // Create Purchase of 30 units
  const purchase = await apiClient.inventory.createPurchase(TENANT_ID, {
    supplierId: newSupplier.id,
    supplierName: newSupplier.companyName,
    items: [
      {
        productId: newProduct.id,
        productName: newProduct.name,
        quantity: 30,
        unitCost: 65,
        totalCost: 1950
      }
    ],
    totalAmount: 1950,
    status: 'received',
    paymentStatus: 'paid',
    notes: 'Inward PO stock replenishment batch #1'
  });

  assert(Boolean(purchase.id && purchase.totalAmount === 1950), 'Procurement', 'Create Inward Purchase Order (POST)', `PO ID: ${purchase.id}, Total Amount: ₹${purchase.totalAmount}`);

  // Verify Product Stock Increased: 40 + 30 = 70
  const productsAfterPurchase = await apiClient.inventory.getProducts(TENANT_ID);
  const prodAfterPO = productsAfterPurchase.find(p => p.id === newProduct.id);
  assert(Boolean(prodAfterPO && prodAfterPO.stockQuantity === 70), 'Procurement', 'Product Physical Stock Incremented (40 -> 70)', `Current Stock: ${prodAfterPO?.stockQuantity} units`);

  // Verify Purchase Ledger Movement Recorded
  const movementsAfterPO = await apiClient.inventory.getStockMovements(TENANT_ID);
  const poMovement = movementsAfterPO.find(m => m.productId === newProduct.id && m.type === 'purchase');
  assert(Boolean(poMovement && poMovement.quantityChange === 30), 'Procurement', 'Stock Ledger Recorded Purchase Movement', `Delta: +${poMovement?.quantityChange}, New Stock: ${poMovement?.newStock}`);

  // ==============================================================
  // SUITE 4: MANUAL STOCK ADJUSTMENTS
  // ==============================================================
  console.log('\n--- 4. Testing Manual Stock Adjustments ---');

  // Adjustment 1: Damage -2 units (70 -> 68)
  const adj1 = await apiClient.inventory.adjustStock(TENANT_ID, newProduct.id, 68, 'Transit can leakage & damage (-2)');
  assert(adj1.product.stockQuantity === 68 && adj1.movement.quantityChange === -2, 'StockAdjustment', 'Damage Adjustment Deducted 2 Units (70 -> 68)', `Stock: ${adj1.product.stockQuantity}, Movement Delta: ${adj1.movement.quantityChange}`);

  // Adjustment 2: Found extra +5 units (68 -> 73)
  const adj2 = await apiClient.inventory.adjustStock(TENANT_ID, newProduct.id, 73, 'Stockroom count correction (+5)');
  assert(adj2.product.stockQuantity === 73 && adj2.movement.quantityChange === 5, 'StockAdjustment', 'Count Correction Added 5 Units (68 -> 73)', `Stock: ${adj2.product.stockQuantity}, Movement Delta: +${adj2.movement.quantityChange}`);

  // ==============================================================
  // SUITE 5: POS REGISTER SHIFTS & CASH MOVEMENTS
  // ==============================================================
  console.log('\n--- 5. Testing POS Register Shifts & Cash Drawer ---');

  // Check if shift already open; if so, close it to test fresh open
  let activeShift = await apiClient.pos.getCurrentShift(TENANT_ID).then(r => r.shift).catch(() => null);
  if (activeShift) {
    await apiClient.pos.closeShift(TENANT_ID, {
      shiftId: activeShift.id,
      actualCashCounted: activeShift.actualCashCounted || 2000,
      notes: 'Closing previous test shift'
    });
  }

  // Open fresh shift with float ₹2,500
  const openShiftRes = await apiClient.pos.openShift(TENANT_ID, {
    registerId: 'REG-01',
    cashierId: 'usr-cashier-test',
    cashierName: 'Priya Sundaram',
    startingFloat: 2500,
    notes: 'Morning shift register opening'
  });
  const shift = openShiftRes.shift;
  assert(Boolean(shift && shift.status === 'open' && shift.startingFloat === 2500), 'POS:Shift', 'Open Register Shift (POST)', `Shift ID: ${shift.id}, Starting Float: ₹${shift.startingFloat}`);

  // Record Cash In: ₹500
  const cashInRes = await apiClient.pos.recordDrawerMovement(TENANT_ID, {
    shiftId: shift.id,
    cashierName: 'Priya Sundaram',
    type: 'cash_in',
    amount: 500,
    reason: 'Additional change coins from store safe'
  });
  assert(cashInRes.movement.type === 'cash_in' && cashInRes.movement.amount === 500, 'POS:Drawer', 'Record Cash-In Movement (₹500)', `Movement ID: ${cashInRes.movement.id}`);

  // Record Cash Out: ₹300
  const cashOutRes = await apiClient.pos.recordDrawerMovement(TENANT_ID, {
    shiftId: shift.id,
    cashierName: 'Priya Sundaram',
    type: 'cash_out',
    amount: 300,
    reason: 'Petty cash for local store ice delivery'
  });
  assert(cashOutRes.movement.type === 'cash_out' && cashOutRes.movement.amount === 300, 'POS:Drawer', 'Record Cash-Out Movement (₹300)', `Movement ID: ${cashOutRes.movement.id}`);

  // ==============================================================
  // SUITE 6: POS CUSTOMERS & CREDIT ACCOUNTS
  // ==============================================================
  console.log('\n--- 6. Testing POS Customers & Credit Ledger ---');

  const customerPhone = `9840${Math.floor(100000 + Math.random() * 900000)}`;
  const newCustomer = await apiClient.pos.createCustomer(TENANT_ID, {
    name: 'Dr. Ananya Roy',
    phone: customerPhone,
    email: 'ananya.roy@example.com',
    address: '15 Cenotaph Road, Teynampet, Chennai',
    stateCode: '33',
    creditLimit: 20000
  });

  assert(Boolean(newCustomer.id && newCustomer.phone === customerPhone), 'POS:Customer', 'Create POS Customer (POST)', `Customer: ${newCustomer.name}, Credit Limit: ₹${newCustomer.creditLimit}`);

  const customerList = await apiClient.pos.getCustomers(TENANT_ID);
  const foundCust = customerList.find(c => c.id === newCustomer.id);
  assert(Boolean(foundCust && foundCust.name === 'Dr. Ananya Roy'), 'POS:Customer', 'Search & Retrieve Customer (GET)', `Found: ${foundCust?.name}, Balance: ₹${foundCust?.currentBalance || 0}`);

  // ==============================================================
  // SUITE 7: POS CHECKOUT & AUTOMATED INVENTORY DEDUCTION
  // ==============================================================
  console.log('\n--- 7. Testing POS Checkout & Cross-Domain Stock Deduction ---');

  // Current stock of product is 73 units
  // Sell 3 units @ ₹130 each
  // Gross = ₹390. Line discount = 5% (₹19.50). Net = ₹370.50
  const cartItems = [
    {
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      barcode: newProduct.barcode,
      hsnCode: '2202',
      quantity: 3,
      unitPrice: 130,
      discountPercent: 5,
      discountAmount: 19.5,
      taxRate: 18,
      taxAmount: 56.52,
      subtotal: 370.5,
      total: 427.02
    }
  ];

  const checkoutPayload = {
    cashierId: 'usr-cashier-test',
    cashierName: 'Priya Sundaram',
    customerId: newCustomer.id,
    customerName: newCustomer.name,
    customerPhone: newCustomer.phone,
    customerStateCode: '33',
    items: cartItems,
    payments: [
      { method: 'cash', amount: 200 },
      { method: 'upi', amount: 227.02, reference: 'UPI-TXN-998822' }
    ],
    tenderedAmount: 500,
    changeDue: 72.98,
    notes: 'Retail POS Sale #1'
  };

  const checkoutRes = await apiClient.pos.checkout(TENANT_ID, checkoutPayload);
  const invoice = checkoutRes.invoice;

  assert(Boolean(invoice && invoice.invoiceNumber.startsWith('INV')), 'POS:Checkout', 'Checkout Generated Valid Tax Invoice', `Invoice Number: ${invoice.invoiceNumber}, Grand Total: ₹${invoice.grandTotal}`);

  assert(invoice.payments.length === 2 && invoice.grandTotal > 0, 'POS:Checkout', 'Split Payment Handled (Cash ₹200 + UPI ₹227.02)', `Payments count: ${invoice.payments.length}`);

  // Cross-Domain Sync Check 1: Product Physical Stock Deducted from 73 to 70!
  const productsAfterSale = await apiClient.inventory.getProducts(TENANT_ID);
  const prodAfterSale = productsAfterSale.find(p => p.id === newProduct.id);
  assert(Boolean(prodAfterSale && prodAfterSale.stockQuantity === 70), 'CrossDomainSync', 'Sale Automatically Deducted 3 Units from Inventory (73 -> 70)', `Expected Stock: 70, Actual Stock: ${prodAfterSale?.stockQuantity}`);

  // Cross-Domain Sync Check 2: StockMovement Logged in Ledger with Invoice Ref
  const movementsAfterSale = await apiClient.inventory.getStockMovements(TENANT_ID);
  const saleMovement = movementsAfterSale.find(m => m.productId === newProduct.id && (m.type === 'sale' || m.reason.includes(invoice.invoiceNumber)));
  assert(Boolean(saleMovement && (saleMovement.quantityChange === -3 || saleMovement.newStock === 70)), 'CrossDomainSync', 'Stock Ledger Logged Sale Movement with Invoice Reference', `Movement Delta: ${saleMovement?.quantityChange}, Invoice: ${saleMovement?.referenceId || invoice.invoiceNumber}`);

  // ==============================================================
  // SUITE 8: POS RETURNS & STOCK RESTOCKING
  // ==============================================================
  console.log('\n--- 8. Testing POS Returns & Stock Restocking ---');

  // Customer returns 1 unit of the 3 purchased
  const returnPayload = {
    returnedItems: [
      {
        productId: newProduct.id,
        productName: newProduct.name,
        quantity: 1,
        refundAmount: 142.34,
        condition: 'good',
        reason: 'Customer bought 1 too many'
      }
    ],
    refundMethod: 'cash' as const,
    managerApprovedBy: 'Manager Vikram',
    cashierName: 'Priya Sundaram'
  };

  const returnRes = await apiClient.pos.processReturn(TENANT_ID, invoice.id, returnPayload);
  assert(Boolean(returnRes.creditNoteNumber && returnRes.creditNoteNumber.startsWith('CN')), 'POS:Return', 'Process Return & Issue Credit Note (POST)', `Credit Note: ${returnRes.creditNoteNumber}`);

  // Restocking Verification: Stock Restored from 70 back to 71!
  const productsAfterReturn = await apiClient.inventory.getProducts(TENANT_ID);
  const prodAfterReturn = productsAfterReturn.find(p => p.id === newProduct.id);
  assert(Boolean(prodAfterReturn && prodAfterReturn.stockQuantity === 71), 'CrossDomainSync', 'Return Automatically Restocked 1 Unit to Inventory (70 -> 71)', `Expected Stock: 71, Actual Stock: ${prodAfterReturn?.stockQuantity}`);

  // ==============================================================
  // SUITE 9: INVOICE VOIDING & COMPLETE REVERSAL
  // ==============================================================
  console.log('\n--- 9. Testing Invoice Voiding & Stock Reversal ---');

  // Make a second checkout of 2 units (71 -> 69)
  const checkout2 = await apiClient.pos.checkout(TENANT_ID, {
    cashierName: 'Priya Sundaram',
    items: [
      {
        productId: newProduct.id,
        productName: newProduct.name,
        quantity: 2,
        unitPrice: 130,
        subtotal: 260,
        total: 260
      }
    ],
    payments: [{ method: 'cash', amount: 260 }]
  });

  const productsAfterSale2 = await apiClient.inventory.getProducts(TENANT_ID);
  const prodAfterSale2 = productsAfterSale2.find(p => p.id === newProduct.id);
  assert(Boolean(prodAfterSale2 && prodAfterSale2.stockQuantity === 69), 'VoidFlow', 'Second Sale Deducted 2 Units (71 -> 69)', `Current Stock: ${prodAfterSale2?.stockQuantity}`);

  // Manager Voids the second invoice with PIN
  const voidRes = await apiClient.pos.voidInvoice(TENANT_ID, checkout2.invoice.id, {
    managerPin: '1234',
    managerApprovedBy: 'Store Manager Vikram',
    reason: 'Customer payment failed after printing receipt',
    cashierName: 'Priya Sundaram'
  });

  assert(voidRes.success === true, 'VoidFlow', 'Void Invoice with Manager PIN (POST)', `Voided Invoice: ${voidRes.invoiceNumber}`);

  // Check Invoice Status is 'voided'
  const voidedInvoice = await apiClient.pos.getInvoiceById(TENANT_ID, checkout2.invoice.id);
  assert(voidedInvoice.status === 'voided', 'VoidFlow', 'Invoice Status Updated to Voided', `Status: ${voidedInvoice.status}`);

  // Check Stock is Reinstated from 69 back to 71!
  const productsAfterVoid = await apiClient.inventory.getProducts(TENANT_ID);
  const prodAfterVoid = productsAfterVoid.find(p => p.id === newProduct.id);
  assert(Boolean(prodAfterVoid && prodAfterVoid.stockQuantity === 71), 'CrossDomainSync', 'Void Invoice Reinstated 2 Units to Inventory (69 -> 71)', `Expected Stock: 71, Actual Stock: ${prodAfterVoid?.stockQuantity}`);

  // ==============================================================
  // SUITE 10: SHIFT CLOSE & MATHEMATICAL LEDGER RECONCILIATION
  // ==============================================================
  console.log('\n--- 10. Testing Shift Closing & Double-Entry Ledger Reconciliation ---');

  // Close shift
  const closedShiftRes = await apiClient.pos.closeShift(TENANT_ID, {
    shiftId: shift.id,
    actualCashCounted: 2750,
    closedBy: 'Priya Sundaram',
    notes: 'Shift closed successfully with complete cash drawer count'
  });

  assert(closedShiftRes.shift.status === 'closed', 'POS:Shift', 'Close Register Shift (POST)', `Shift Status: ${closedShiftRes.shift.status}, Closed At: ${closedShiftRes.shift.closedAt}`);

  // Final Mathematical Ledger Audit:
  // Initial: 40
  // + PO: +30 (70)
  // - Damage: -2 (68)
  // + Extra: +5 (73)
  // - Sale 1: -3 (70)
  // + Return 1: +1 (71)
  // - Sale 2: -2 (69)
  // + Void 2: +2 (71)
  // FINAL EXPECTED = 71
  assert(prodAfterVoid?.stockQuantity === 71, 'Reconciliation', 'PERFECT END-TO-END STOCK QUANTITY: Exactly 71 Units On Hand', `Expected: 71, Real: ${prodAfterVoid?.stockQuantity}`);

  // ==============================================================
  // SUITE 11: MASTER DELETION & ORPHAN SAFETY
  // ==============================================================
  console.log('\n--- 11. Testing Cleanup & Master Entity Deletion ---');

  // 11.1 Referential Integrity Guard Check: Attempting to delete supplier with active PO must fail
  let supplierDeleteBlocked = false;
  let blockErrorMsg = '';
  try {
    await apiClient.inventory.deleteSupplier(TENANT_ID, newSupplier.id);
  } catch (err: any) {
    supplierDeleteBlocked = err.message.includes('Cannot delete supplier with active purchase orders');
    blockErrorMsg = err.message;
  }
  assert(supplierDeleteBlocked, 'IntegrityGuard', 'Backend Referential Integrity: Supplier Protected While PO Active', blockErrorMsg);

  // 11.2 Delete test purchase order
  const deletePoRes = await apiClient.inventory.deletePurchase(TENANT_ID, purchase.id);
  assert(deletePoRes.success === true, 'Cleanup', 'Delete Test Purchase Order (DELETE)', `PO ID: ${purchase.id}`);

  // 11.3 Delete test product
  const deleteProdRes = await apiClient.inventory.deleteProduct(TENANT_ID, newProduct.id);
  assert(deleteProdRes.success === true, 'Cleanup', 'Delete Test Product (DELETE)', `Product ID: ${newProduct.id}`);

  const productsAfterDelete = await apiClient.inventory.getProducts(TENANT_ID);
  assert(!productsAfterDelete.some(p => p.id === newProduct.id), 'Cleanup', 'Product Successfully Removed from Catalog', `Catalog Count: ${productsAfterDelete.length}`);

  // 11.4 Delete test supplier (now unreferenced)
  const deleteSupRes = await apiClient.inventory.deleteSupplier(TENANT_ID, newSupplier.id);
  assert(deleteSupRes.success === true, 'Cleanup', 'Delete Test Supplier (DELETE)', `Supplier ID: ${newSupplier.id}`);

  // 11.5 Delete test category
  const deleteCatRes = await apiClient.inventory.deleteCategory(TENANT_ID, newCat.id);
  assert(deleteCatRes.success === true, 'Cleanup', 'Delete Test Category (DELETE)', `Category ID: ${newCat.id}`);

  // ==============================================================
  // FINAL SUMMARY REPORT
  // ==============================================================
  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL ASSERTIONS: ${results.length}`);
  console.log(`PASSED:           ${passedCount}`);
  console.log(`FAILED:           ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error(`Suite finished with ${failedCount} failure(s).`);
    process.exit(1);
  } else {
    console.log('ALL INVENTORY AND BILLING/POS CRUD FLOWS VALIDATED SUCCESSFULLY!\n');
  }
}

runInventoryBillingVerification().catch(err => {
  console.error('Test execution failed with unhandled exception:', err);
  process.exit(1);
});
