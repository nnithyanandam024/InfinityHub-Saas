/**
 * Automated Verification Script: Full Restaurant Management Flow
 * Tests Front-of-House Table Management, Captain Order Pad, KDS, Anti-Theft Guards,
 * and Recipe/BOM Raw Material Inventory Auto-Deductions.
 */

import { mockStore } from '../apps/web/src/data/mockStore';

const TENANT_ID = 'tenant-xyz-restaurant';

function logStep(step: string, desc: string) {
  console.log(`\n================================================================`);
  console.log(`[TEST STEP] ${step}: ${desc}`);
  console.log(`================================================================`);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ ${message}`);
}

async function run() {
  console.log('🚀 Starting Restaurant Management E2E Flow Verification...\n');

  // Reset store to fresh state
  mockStore.resetAll();

  // -------------------------------------------------------------
  logStep('1', 'Validate Tenant Initialization & Master Catalog');
  // -------------------------------------------------------------
  const sections = mockStore.getRestaurantSections(TENANT_ID);
  const tables = mockStore.getRestaurantTables(TENANT_ID);
  const menuItems = mockStore.getRestaurantMenuItems(TENANT_ID);
  const recipes = mockStore.getRestaurantRecipes(TENANT_ID);
  const products = mockStore.getProducts(TENANT_ID);

  assert(sections.length >= 4, `Found ${sections.length} dining sections (AC, Terrace, Bar, PDR)`);
  assert(tables.length >= 14, `Found ${tables.length} tables`);
  assert(menuItems.length >= 9, `Found ${menuItems.length} gourmet menu items`);
  assert(recipes.length >= 3, `Found ${recipes.length} BOM recipes`);

  const paneerRaw = products.find(p => p.name.includes('Fresh Malai Paneer'));
  const chickenRaw = products.find(p => p.name.includes('Farm Fresh Chicken'));
  assert(!!paneerRaw, 'Raw Material: Fresh Malai Paneer exists in inventory');
  assert(!!chickenRaw, 'Raw Material: Farm Fresh Chicken exists in inventory');

  const initialPaneerStock = paneerRaw!.stockQuantity;
  const initialChickenStock = chickenRaw!.stockQuantity;
  console.log(`  Initial Raw Stock: Paneer = ${initialPaneerStock} kg, Chicken = ${initialChickenStock} kg`);

  // -------------------------------------------------------------
  logStep('2', 'Seat Table T-02 (4 Guests, Captain Rajesh)');
  // -------------------------------------------------------------
  const tableT02 = tables.find(t => t.tableNumber === 'T-02')!;
  assert(tableT02.status === 'vacant', 'Table T-02 is initially vacant');

  const seatedTable = mockStore.seatTable(TENANT_ID, tableT02.id, 4, 'Rajesh');
  assert(seatedTable.status === 'seated', 'Table T-02 transitioned to "seated"');
  assert(seatedTable.guestCount === 4, 'Guest count is 4');
  assert(seatedTable.captainName === 'Rajesh', 'Captain Rajesh assigned');
  assert(!!seatedTable.activeOrderId, `Active order ID created: ${seatedTable.activeOrderId}`);

  // -------------------------------------------------------------
  logStep('3', 'Captain Order Pad: Fire KOT 1 (Paneer Butter Masala + Dum Biryani + Garlic Naan)');
  // -------------------------------------------------------------
  const paneerButterMasala = menuItems.find(m => m.name.includes('Paneer Butter Masala'))!;
  const dumBiryani = menuItems.find(m => m.name.includes('Dum Mutton Biryani'))!;
  const garlicNaan = menuItems.find(m => m.name.includes('Garlic Butter Naan'))!;

  const { kot: kot1, table: orderedTable } = mockStore.fireKot(
    TENANT_ID,
    tableT02.id,
    [
      {
        menuItemId: paneerButterMasala.id,
        name: paneerButterMasala.name,
        quantity: 2,
        unitPrice: paneerButterMasala.price,
        station: 'kitchen',
        specialNotes: 'Extra fenugreek butter'
      },
      {
        menuItemId: dumBiryani.id,
        name: dumBiryani.name,
        quantity: 1,
        unitPrice: dumBiryani.price,
        station: 'kitchen',
        specialNotes: 'Hyderabadi style'
      },
      {
        menuItemId: garlicNaan.id,
        name: garlicNaan.name,
        quantity: 3,
        unitPrice: garlicNaan.price,
        station: 'tandoor'
      }
    ],
    'Rajesh'
  );

  assert(kot1.status === 'fired', `KOT 1 fired successfully (${kot1.kotNumber})`);
  assert(kot1.items.length === 3, 'KOT contains 3 distinct line items');
  assert(orderedTable.status === 'ordered', 'Table status transitioned to "ordered"');

  // Calculation check:
  // Paneer Butter Masala: 340 * 2 = 680
  // Dum Biryani: 480 * 1 = 480
  // Garlic Naan: 75 * 3 = 225
  // Subtotal = 1385. CGST 2.5% = 34.625, SGST 2.5% = 34.625, Total = 1454
  const expectedSubtotal = 340 * 2 + 480 * 1 + 75 * 3;
  const expectedCgst = expectedSubtotal * 0.025;
  const expectedSgst = expectedSubtotal * 0.025;
  const expectedTotal = Math.round(expectedSubtotal + expectedCgst + expectedSgst);

  const currentOrder = mockStore.getRestaurantOrders(TENANT_ID).find(o => o.id === orderedTable.activeOrderId)!;
  assert(currentOrder.subtotal === expectedSubtotal, `Subtotal ₹${currentOrder.subtotal} matches expected ₹${expectedSubtotal}`);
  assert(currentOrder.grandTotal === expectedTotal, `Grand total with 5% GST ₹${currentOrder.grandTotal} matches expected ₹${expectedTotal}`);
  assert(orderedTable.currentBillTotal === expectedTotal, `Table running total reflects ₹${expectedTotal}`);

  // -------------------------------------------------------------
  logStep('4', 'Kitchen Display System (KDS): Item Progression & Bump');
  // -------------------------------------------------------------
  // Mark garlic naan as ready
  const naanItem = kot1.items.find(i => i.name.includes('Garlic Butter Naan'))!;
  const updatedKot = mockStore.updateKotItemStatus(TENANT_ID, kot1.id, naanItem.id, 'ready');
  assert(updatedKot.items.find(i => i.id === naanItem.id)?.status === 'ready', 'Naan status updated to "ready"');

  // Bump the whole KOT (mark all remaining items ready)
  const bumpedKot = mockStore.bumpKot(TENANT_ID, kot1.id);
  assert(bumpedKot.status === 'ready', 'KOT bumped to "ready" status');
  assert(bumpedKot.items.every(i => i.status === 'ready'), 'All items in bumped KOT are "ready"');

  // Mark all served
  for (const itm of bumpedKot.items) {
    mockStore.updateKotItemStatus(TENANT_ID, kot1.id, itm.id, 'served');
  }
  const servedTable = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === tableT02.id)!;
  assert(servedTable.status === 'served', 'Table status updated to "served" once all items are served');

  // -------------------------------------------------------------
  logStep('5', 'Anti-Theft Guard: Manager PIN Void & Waste Register');
  // -------------------------------------------------------------
  // Fire an accidental extra item to test voiding
  const { kot: kot2 } = mockStore.fireKot(
    TENANT_ID,
    tableT02.id,
    [
      {
        menuItemId: paneerButterMasala.id,
        name: paneerButterMasala.name,
        quantity: 1,
        unitPrice: paneerButterMasala.price,
        station: 'kitchen',
        specialNotes: 'Wrong table order by captain'
      }
    ],
    'Rajesh'
  );

  const voidTargetItem = kot2.items[0];

  // Test unauthorized void without valid PIN
  let voidFailed = false;
  try {
    mockStore.voidKotItem(TENANT_ID, kot2.id, voidTargetItem.id, 'Guest rejected extra', '0000');
  } catch (err: any) {
    voidFailed = true;
    console.log(`  Expected Rejection: ${err.message}`);
  }
  assert(voidFailed, 'Unauthorized void correctly rejected when PIN is invalid');

  // Test authorized void with Manager PIN '1234'
  const { kot: voidedKot, wasteLog } = mockStore.voidKotItem(
    TENANT_ID,
    kot2.id,
    voidTargetItem.id,
    'Captain ordered duplicate by accident',
    '1234',
    'Manager Vikram'
  );

  assert(voidedKot.items.find(i => i.id === voidTargetItem.id)?.status === 'cancelled', 'Voided item status is "cancelled"');
  assert(wasteLog.status === 'approved', 'Waste register entry created as approved');
  assert(wasteLog.authorizedBy === 'Manager Vikram', 'Waste authorized by Manager Vikram');
  assert(wasteLog.estimatedCost > 0, `Waste cost ₹${wasteLog.estimatedCost} logged against kitchen loss register`);

  const wasteLogs = mockStore.getRestaurantWasteLogs(TENANT_ID);
  assert(wasteLogs.some(w => w.id === wasteLog.id), 'Waste log verified in tenant waste register');

  // Verify running total on table subtracted the cancelled item
  const postVoidTable = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === tableT02.id)!;
  assert(postVoidTable.currentBillTotal === expectedTotal, `Table running total reverted to ₹${expectedTotal} after voiding extra item`);

  // -------------------------------------------------------------
  logStep('6', 'Anti-Theft Guard: Table Transfer with Audit Lineage');
  // -------------------------------------------------------------
  const tableT06 = tables.find(t => t.tableNumber === 'T-06')!;
  assert(tableT06.status === 'vacant', 'Target Table T-06 is vacant');

  // Attempt transfer with wrong PIN
  let xferFailed = false;
  try {
    mockStore.transferTable(TENANT_ID, tableT02.id, tableT06.id, 'AC too cold, guest moved to T-06', '9999');
  } catch (err: any) {
    xferFailed = true;
    console.log(`  Expected Rejection: ${err.message}`);
  }
  assert(xferFailed, 'Unauthorized table transfer rejected without Manager PIN');

  const statusBeforeTransfer = postVoidTable.status;

  // Transfer with Manager PIN '1234'
  const transferAudit = mockStore.transferTable(
    TENANT_ID,
    tableT02.id,
    tableT06.id,
    'AC too cold near door, moved to indoor booth',
    '1234',
    'Rajesh'
  );

  assert(transferAudit.sourceTable === 'T-02', 'Source recorded as T-02');
  assert(transferAudit.targetTable === 'T-06', 'Target recorded as T-06');
  assert(transferAudit.authorizedBy === 'Manager Vikram', 'Transfer authorized by Manager Vikram');

  const refreshedT02 = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === tableT02.id)!;
  const refreshedT06 = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === tableT06.id)!;

  assert(refreshedT02.status === 'vacant', 'Source Table T-02 is now vacant');
  assert(refreshedT02.currentBillTotal === 0, 'Source Table T-02 bill total reset to 0');
  assert(refreshedT06.status === statusBeforeTransfer, `Target Table T-06 inherited order status "${statusBeforeTransfer}"`);
  assert(refreshedT06.currentBillTotal === expectedTotal, `Target Table T-06 inherited bill total ₹${expectedTotal}`);
  assert(refreshedT06.activeOrderId === currentOrder.id, 'Target Table T-06 inherited active order');

  const audits = mockStore.getTableAudits(TENANT_ID);
  assert(audits.some(a => a.id === transferAudit.id), 'Table transfer audit logged in permanent ledger');

  // -------------------------------------------------------------
  logStep('7', 'Anti-Theft Guard: Duplicate Guest Check Watermark & Reprint Log');
  // -------------------------------------------------------------
  // Print Check 1 (Original)
  const print1 = mockStore.printGuestCheck(TENANT_ID, tableT06.id, 'Cashier Priya');
  assert(print1.isDuplicate === false, 'First check print is marked as original (isDuplicate: false)');
  assert(print1.printCount === 1, 'Print count is 1');

  const billedTable = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === tableT06.id)!;
  assert(billedTable.status === 'billed', 'Table status transitioned to "billed"');

  // Print Check 2 (Duplicate Reprint)
  const print2 = mockStore.printGuestCheck(TENANT_ID, tableT06.id, 'Cashier Priya', 'Guest requested duplicate copy');
  assert(print2.isDuplicate === true, 'Second print is flagged as DUPLICATE REPRINT');
  assert(print2.printCount === 2, 'Print count incremented to 2');
  assert(print2.order.reprintHistory.length === 1, 'Reprint audit history contains entry');
  assert(print2.order.reprintHistory[0].reprintedBy === 'Cashier Priya', 'Cashier Priya logged as reprinting party');

  // -------------------------------------------------------------
  logStep('8', 'Table Settlement & BOM Raw Material Stock Auto-Deduction');
  // -------------------------------------------------------------
  // Settle Bill with 5% GST and multi-tender (Cash + UPI)
  const halfAmt = Math.floor(expectedTotal / 2);
  const remAmt = expectedTotal - halfAmt;

  const { order: settledOrder, table: settledTable } = mockStore.settleTableBill(
    TENANT_ID,
    tableT06.id,
    {
      payments: [
        { method: 'upi', amount: halfAmt, reference: 'UPI/REST/987211' },
        { method: 'cash', amount: remAmt }
      ],
      customerName: 'Amit Shah',
      customerPhone: '9876543210'
    }
  );

  assert(settledOrder.orderStatus === 'settled', 'Order status is "settled"');
  assert(settledOrder.payments.length === 2, 'Multi-tender payment recorded (UPI + Cash)');
  assert(settledTable.status === 'cleaning', 'Table transitioned to "cleaning"');
  assert(settledTable.currentBillTotal === 0, 'Table current bill total reset to 0');

  // Verify Recipe Raw Material Auto-Deduction in Inventory:
  // Recipe for Paneer Butter Masala: 0.20 kg Paneer per portion * 2 portions = 0.40 kg Paneer
  // Recipe for Dum Mutton Biryani: 0.25 kg Chicken/Meat per portion * 1 portion = 0.25 kg Chicken
  const updatedProducts = mockStore.getProducts(TENANT_ID);
  const postPaneer = updatedProducts.find(p => p.name.includes('Fresh Malai Paneer'))!;
  const postChicken = updatedProducts.find(p => p.name.includes('Farm Fresh Chicken'))!;

  const expectedPaneerStock = Number((initialPaneerStock - (0.20 * 2)).toFixed(3));
  const expectedChickenStock = Number((initialChickenStock - (0.25 * 1)).toFixed(3));

  console.log(`  Paneer Stock: ${initialPaneerStock} kg -> ${postPaneer.stockQuantity} kg (Expected: ${expectedPaneerStock} kg)`);
  console.log(`  Chicken Stock: ${initialChickenStock} kg -> ${postChicken.stockQuantity} kg (Expected: ${expectedChickenStock} kg)`);

  assert(postPaneer.stockQuantity === expectedPaneerStock, `Paneer deducted correctly by BOM (-0.40 kg)`);
  assert(postChicken.stockQuantity === expectedChickenStock, `Chicken deducted correctly by BOM (-0.25 kg)`);

  // Verify Stock Movements
  const movements = mockStore.getStockMovements(TENANT_ID);
  const paneerMovement = movements.find(m => m.productId === postPaneer.id && m.referenceId === settledOrder.id);
  const chickenMovement = movements.find(m => m.productId === postChicken.id && m.referenceId === settledOrder.id);

  assert(!!paneerMovement, 'Stock movement audit entry exists for Paneer BOM deduction');
  assert(paneerMovement!.quantityChange === -0.4, 'Paneer stock movement shows -0.4 quantity');
  assert(paneerMovement!.performedByUserId === 'system-recipe-engine', 'Attributed to system-recipe-engine');

  assert(!!chickenMovement, 'Stock movement audit entry exists for Chicken BOM deduction');
  assert(chickenMovement!.quantityChange === -0.25, 'Chicken stock movement shows -0.25 quantity');

  // -------------------------------------------------------------
  logStep('9', 'Reset Table to Vacant');
  // -------------------------------------------------------------
  const finalTable = mockStore.resetTableToVacant(TENANT_ID, tableT06.id);
  assert(finalTable.status === 'vacant', 'Table T-06 reset to "vacant" ready for next dining party');

  console.log('\n🎉 ALL RESTAURANT MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY! 🥂\n');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
