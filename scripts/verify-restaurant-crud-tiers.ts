/**
 * Automated Verification Script: Multi-Tier Restaurant CRUD & Operational Logic
 * 
 * Verifies that all CRUD operations, data auto-initialization, and business logic
 * work consistently across all subscription tiers:
 *   1. Starter Tier (tenant-kumar-stores)
 *   2. Professional Tier (tenant-abc-supermarket)
 *   3. Business Tier (tenant-xyz-restaurant)
 */

import { mockStore } from '../apps/web/src/data/mockStore';

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
  console.log('🚀 Starting Comprehensive Restaurant Multi-Tier CRUD & Logic Verification...\n');

  mockStore.resetAll();

  // ============================================================================
  // TIER 1: STARTER TIER (tenant-kumar-stores)
  // Focus: Auto-seeding, Floor & Table CRUD, Menu Items CRUD, Fast Dine-in Billing
  // ============================================================================
  const STARTER_TENANT = 'tenant-kumar-stores';
  logStep('T1.1', 'Starter Tier Data Auto-Initialization');
  
  const starterSectionsInit = mockStore.getRestaurantSections(STARTER_TENANT);
  const starterTablesInit = mockStore.getRestaurantTables(STARTER_TENANT);
  const starterMenuInit = mockStore.getRestaurantMenuItems(STARTER_TENANT);

  assert(starterSectionsInit.length >= 2, `Starter tenant auto-initialized with ${starterSectionsInit.length} sections`);
  assert(starterTablesInit.length >= 6, `Starter tenant auto-initialized with ${starterTablesInit.length} tables`);
  assert(starterMenuInit.length >= 6, `Starter tenant auto-initialized with ${starterMenuInit.length} starter menu dishes`);

  // --- Section CRUD on Starter ---
  logStep('T1.2', 'Starter Tier: Section CRUD');
  const newSection = mockStore.createRestaurantSection(STARTER_TENANT, {
    name: 'Balcony Corner',
    description: 'Outdoor fresh air dining veranda',
    sortOrder: 4
  });
  assert(newSection.id.startsWith('sec-'), `Created section: ${newSection.name} (${newSection.id})`);

  const updatedSection = mockStore.updateRestaurantSection(STARTER_TENANT, newSection.id, {
    name: 'Rooftop Balcony',
    description: 'Upgraded scenic outdoor dining terrace',
    sortOrder: 5
  });
  assert(
    updatedSection.name === 'Rooftop Balcony' &&
    updatedSection.description === 'Upgraded scenic outdoor dining terrace' &&
    updatedSection.sortOrder === 5,
    'Updated section attributes'
  );

  // --- Table CRUD on Starter ---
  logStep('T1.3', 'Starter Tier: Table Single & Batch Creation, Editing, Deletion');
  const customTable = mockStore.createRestaurantTable(STARTER_TENANT, {
    sectionId: newSection.id,
    tableNumber: 'RB-01',
    capacity: 4,
    shape: 'rectangle',
    assignedCaptain: 'Ramesh'
  });
  assert(customTable.tableNumber === 'RB-01' && customTable.status === 'vacant', 'Created custom table RB-01');

  // Batch generation
  const batchTables = mockStore.batchCreateRestaurantTables(STARTER_TENANT, {
    sectionId: newSection.id,
    prefix: 'RB-',
    startNumber: 2,
    count: 3,
    capacity: 2,
    shape: 'round',
    assignedCaptain: 'Ramesh'
  });
  assert(batchTables.length === 3, `Batch generated 3 tables: ${batchTables.map(t => t.tableNumber).join(', ')}`);

  // Update table
  const updatedTable = mockStore.updateRestaurantTable(STARTER_TENANT, customTable.id, {
    capacity: 6,
    shape: 'round',
    assignedCaptain: 'Senior Captain Suresh'
  });
  assert(
    updatedTable.capacity === 6 &&
    updatedTable.shape === 'round' &&
    updatedTable.assignedCaptain === 'Senior Captain Suresh',
    'Table updated successfully'
  );

  // Delete batch table
  const tableToDelete = batchTables[2];
  mockStore.deleteRestaurantTable(STARTER_TENANT, tableToDelete.id);
  const tablesAfterDelete = mockStore.getRestaurantTables(STARTER_TENANT);
  assert(!tablesAfterDelete.some(t => t.id === tableToDelete.id), `Successfully deleted table ${tableToDelete.tableNumber}`);

  // --- Menu Item CRUD on Starter ---
  logStep('T1.4', 'Starter Tier: Digital Menu Dishes Full CRUD & Availability');
  const newDish = mockStore.createRestaurantMenuItem(STARTER_TENANT, {
    name: 'South Indian Filter Coffee',
    code: 'BEV-009',
    categoryId: 'cat-bev',
    categoryName: 'Beverages',
    price: 45,
    taxRate: 5,
    prepTimeMinutes: 5,
    station: 'bar',
    dietary: 'veg',
    description: 'Freshly brewed chicory coffee in brass dabara',
    isAvailable: true
  });
  assert(newDish.id.startsWith('itm-'), `Created new dish: ${newDish.name} (Code: ${newDish.code}, Price: ₹${newDish.price})`);

  const updatedDish = mockStore.updateRestaurantMenuItem(STARTER_TENANT, newDish.id, {
    price: 50,
    description: 'Freshly brewed aromatic South Indian coffee'
  });
  assert(updatedDish.price === 50, 'Updated dish price to ₹50');

  // Toggle availability (86'd out of stock)
  const toggledOff = mockStore.toggleMenuItemAvailability(STARTER_TENANT, newDish.id);
  assert(toggledOff.isAvailable === false, 'Marked dish out-of-stock (86-ed)');
  const toggledOn = mockStore.toggleMenuItemAvailability(STARTER_TENANT, newDish.id);
  assert(toggledOn.isAvailable === true, 'Restored dish availability');

  // Delete dish
  mockStore.deleteRestaurantMenuItem(STARTER_TENANT, newDish.id);
  const menuAfterDelete = mockStore.getRestaurantMenuItems(STARTER_TENANT);
  assert(!menuAfterDelete.some(m => m.id === newDish.id), 'Dish deleted successfully from menu');

  // --- Fast Dine-in Seating & Direct Settlement on Starter ---
  logStep('T1.5', 'Starter Tier: Fast Dine-in Seating & Direct Cash Settlement');
  const starterTable = mockStore.seatTable(STARTER_TENANT, customTable.id, 2, 'Ramesh');
  assert(starterTable.status === 'seated' && starterTable.guestCount === 2, 'Starter table seated');

  const teaDish = menuAfterDelete.find(m => m.categoryName.toLowerCase().includes('bev')) || menuAfterDelete[0];
  const dosasDish = menuAfterDelete.find(m => m.categoryName.toLowerCase().includes('main')) || menuAfterDelete[1];

  const { kot: starterKot } = mockStore.fireKot(
    STARTER_TENANT,
    customTable.id,
    [
      {
        menuItemId: teaDish.id,
        name: teaDish.name,
        quantity: 2,
        unitPrice: teaDish.price,
        station: teaDish.station || 'bar'
      },
      {
        menuItemId: dosasDish.id,
        name: dosasDish.name,
        quantity: 1,
        unitPrice: dosasDish.price,
        station: dosasDish.station || 'kitchen'
      }
    ],
    'Ramesh'
  );

  const tableWithOrder = mockStore.getRestaurantTables(STARTER_TENANT).find(t => t.id === customTable.id)!;
  assert(tableWithOrder.status === 'ordered', `Table ordered with running total ₹${tableWithOrder.currentBillTotal}`);
  assert(starterKot.items.length === 2, 'KOT contains 2 line items');

  // Guard: Confirm deletion is blocked while table is active
  let deleteBlocked = false;
  try {
    mockStore.deleteRestaurantTable(STARTER_TENANT, customTable.id);
  } catch (err: any) {
    deleteBlocked = true;
  }
  assert(deleteBlocked, 'Safety guard prevents deleting table with active seated order');

  // Settle bill directly
  const billTotal = tableWithOrder.currentBillTotal || 150;
  const { order: settledStarterOrder, table: settledStarterTable } = mockStore.settleTableBill(
    STARTER_TENANT,
    customTable.id,
    {
      payments: [{ method: 'cash', amount: billTotal }],
      customerName: 'Karthik',
      customerPhone: '9840123456'
    }
  );
  assert(settledStarterOrder.orderStatus === 'settled', 'Order settled successfully with cash');
  assert(settledStarterTable.status === 'cleaning', 'Table moved to cleaning status after settlement');

  mockStore.resetTableToVacant(STARTER_TENANT, customTable.id);
  const tableAfterReset = mockStore.getRestaurantTables(STARTER_TENANT).find(t => t.id === customTable.id)!;
  assert(tableAfterReset.status === 'vacant', 'Table reset to vacant ready for next guests');


  // ============================================================================
  // TIER 2: PROFESSIONAL TIER (tenant-abc-supermarket)
  // Focus: Recipe BOM CRUD, Multi-Station KDS line bump, BOM inventory auto-deductions
  // ============================================================================
  const PRO_TENANT = 'tenant-abc-supermarket';
  logStep('T2.1', 'Professional Tier Data Auto-Initialization & Inventory');

  const proSections = mockStore.getRestaurantSections(PRO_TENANT);
  const proTables = mockStore.getRestaurantTables(PRO_TENANT);
  const proMenuItems = mockStore.getRestaurantMenuItems(PRO_TENANT);
  assert(proSections.length >= 2, `Pro tenant auto-initialized with ${proSections.length} sections`);
  assert(proTables.length >= 6, `Pro tenant auto-initialized with ${proTables.length} tables`);
  assert(proMenuItems.length >= 6, `Pro tenant auto-initialized with ${proMenuItems.length} menu dishes`);

  // Check product raw materials in inventory
  let proProducts = mockStore.getProducts(PRO_TENANT);
  assert(proProducts.length > 0, `Pro tenant has ${proProducts.length} inventory products`);
  const rawIng1 = proProducts[0];
  const rawIng2 = proProducts[1] || proProducts[0];
  const initialStock1 = rawIng1.stockQuantity;

  // --- Recipe & BOM CRUD on Professional ---
  logStep('T2.2', 'Professional Tier: Recipe & BOM CRUD linked to Raw Products');
  const targetMenuItem = proMenuItems[0];
  
  const createdRecipe = mockStore.saveRecipe(PRO_TENANT, {
    id: `rec-${Date.now()}`,
    menuItemId: targetMenuItem.id,
    menuItemName: targetMenuItem.name,
    portionSize: '1 Serving',
    ingredients: [
      {
        rawMaterialProductId: rawIng1.id,
        rawMaterialName: rawIng1.name,
        quantityNeeded: 0.25,
        unit: rawIng1.unit || 'kg',
        unitCost: rawIng1.costPrice || 50
      },
      {
        rawMaterialProductId: rawIng2.id,
        rawMaterialName: rawIng2.name,
        quantityNeeded: 0.1,
        unit: rawIng2.unit || 'kg',
        unitCost: rawIng2.costPrice || 30
      }
    ],
    totalCost: 15.5,
    sellingPrice: targetMenuItem.price,
    marginPercentage: Number((((targetMenuItem.price - 15.5) / targetMenuItem.price) * 100).toFixed(1)),
    notes: 'Automated BOM auto-deduction'
  });
  assert(createdRecipe.ingredients.length === 2, `Saved recipe BOM for ${createdRecipe.menuItemName}`);

  const recipesAfterSave = mockStore.getRestaurantRecipes(PRO_TENANT);
  assert(recipesAfterSave.some(r => r.id === createdRecipe.id), 'Recipe successfully retrievable');

  // --- Kitchen Display System (KDS) & Multi-Station Routing ---
  logStep('T2.3', 'Professional Tier: Order Dispatch to KDS & Line Progression');
  const proTable = proTables[0];
  mockStore.seatTable(PRO_TENANT, proTable.id, 2, 'Captain Kiran');
  
  const { kot: proKot } = mockStore.fireKot(
    PRO_TENANT,
    proTable.id,
    [
      {
        menuItemId: targetMenuItem.id,
        name: targetMenuItem.name,
        quantity: 2,
        unitPrice: targetMenuItem.price,
        station: 'kitchen',
        specialNotes: 'Extra spicy'
      }
    ],
    'Captain Kiran'
  );
  assert(proKot.status === 'fired', 'KOT dispatched to kitchen line display');

  // Bump line item in KDS: cooking -> ready -> served
  const itemId = proKot.items[0].id;
  const readyKot = mockStore.updateKotItemStatus(PRO_TENANT, proKot.id, itemId, 'ready');
  assert(readyKot.items[0].status === 'ready', 'Line item bumped to "ready" on kitchen expo');

  const servedKot = mockStore.updateKotItemStatus(PRO_TENANT, proKot.id, itemId, 'served');
  assert(servedKot.items[0].status === 'served', 'Line item bumped to "served" at table');

  // Settle bill and verify BOM inventory deduction
  logStep('T2.4', 'Professional Tier: Settle Table & BOM Inventory Auto-Deduction');
  const tableToSettle = mockStore.getRestaurantTables(PRO_TENANT).find(t => t.id === proTable.id)!;
  mockStore.settleTableBill(PRO_TENANT, proTable.id, {
    payments: [{ method: 'card', amount: tableToSettle.currentBillTotal || 200 }]
  });
  
  const updatedProducts = mockStore.getProducts(PRO_TENANT);
  const updatedIng1 = updatedProducts.find(p => p.id === rawIng1.id)!;
  const expectedStockDeduction = 0.25 * 2; // 0.25 kg * 2 qty
  assert(
    Math.abs(updatedIng1.stockQuantity - (initialStock1 - expectedStockDeduction)) < 0.01,
    `BOM auto-deducted raw material "${rawIng1.name}": from ${initialStock1} to ${updatedIng1.stockQuantity} (Deducted: ${expectedStockDeduction})`
  );

  // Delete Recipe
  logStep('T2.5', 'Professional Tier: Delete Recipe BOM');
  mockStore.deleteRestaurantRecipe(PRO_TENANT, createdRecipe.id);
  const recipesAfterDelete = mockStore.getRestaurantRecipes(PRO_TENANT);
  assert(!recipesAfterDelete.some(r => r.id === createdRecipe.id), 'Recipe BOM successfully deleted');


  // ============================================================================
  // TIER 3: BUSINESS TIER (tenant-xyz-restaurant)
  // Focus: Table Transfers, Manager PIN Voids & Waste Logs, Anti-Theft Audit Trail
  // ============================================================================
  const BIZ_TENANT = 'tenant-xyz-restaurant';
  logStep('T3.1', 'Business Tier: Seating & Table-to-Table Transfer');

  const bizTables = mockStore.getRestaurantTables(BIZ_TENANT);
  const vacantTables = bizTables.filter(t => t.status === 'vacant');
  const tableSource = vacantTables[0];
  const tableTarget = vacantTables[1];

  mockStore.seatTable(BIZ_TENANT, tableSource.id, 4, 'Captain Rajesh');
  const bizMenu = mockStore.getRestaurantMenuItems(BIZ_TENANT);
  
  const { kot: bizKot } = mockStore.fireKot(
    BIZ_TENANT,
    tableSource.id,
    [
      {
        menuItemId: bizMenu[0].id,
        name: bizMenu[0].name,
        quantity: 2,
        unitPrice: bizMenu[0].price,
        station: 'kitchen'
      },
      {
        menuItemId: bizMenu[1].id,
        name: bizMenu[1].name,
        quantity: 1,
        unitPrice: bizMenu[1].price,
        station: 'kitchen'
      }
    ],
    'Captain Rajesh'
  );
  assert(bizKot.items.length === 2, 'Fired KOT with 2 dishes');

  // Transfer table
  const transferAudit = mockStore.transferTable(
    BIZ_TENANT,
    tableSource.id,
    tableTarget.id,
    'Guest requested AC booth seating',
    '1234',
    'Captain Rajesh'
  );
  assert(
    transferAudit.sourceTable === tableSource.tableNumber && transferAudit.targetTable === tableTarget.tableNumber,
    `Transferred active order from ${tableSource.tableNumber} to ${tableTarget.tableNumber}`
  );

  const refreshedSource = mockStore.getRestaurantTables(BIZ_TENANT).find(t => t.id === tableSource.id)!;
  const refreshedTarget = mockStore.getRestaurantTables(BIZ_TENANT).find(t => t.id === tableTarget.id)!;
  assert(refreshedSource.status === 'vacant', `Source table ${tableSource.tableNumber} returned to vacant`);
  assert(refreshedTarget.status === 'ordered' && refreshedTarget.currentBillTotal! > 0, `Target table ${tableTarget.tableNumber} received order & bill total`);

  // --- Manager PIN Void & Kitchen Waste Registration ---
  logStep('T3.2', 'Business Tier: Anti-Theft Manager PIN Void & Kitchen Waste Log');
  const itemToVoid = bizKot.items[0];

  const { kot: voidedKot, wasteLog } = mockStore.voidKotItem(
    BIZ_TENANT,
    bizKot.id,
    itemToVoid.id,
    'Guest changed mind before cooking',
    '1234',
    'Manager Vikram'
  );
  assert(voidedKot.items.find(i => i.id === itemToVoid.id)?.status === 'cancelled', 'Voided item status updated to "cancelled"');
  assert(wasteLog.status === 'approved' && wasteLog.authorizedBy === 'Manager Vikram', 'Waste register logged item void with manager approval');

  // Duplicate Check Reprint Warning
  logStep('T3.3', 'Business Tier: Anti-Theft Duplicate Check Reprint Flagging');
  const check1 = mockStore.printGuestCheck(BIZ_TENANT, refreshedTarget.id, 'Cashier Priya');
  assert(check1.isDuplicate === false, 'First bill print is marked original');

  const check2 = mockStore.printGuestCheck(BIZ_TENANT, refreshedTarget.id, 'Cashier Priya', 'Customer asked reprint');
  assert(check2.isDuplicate === true && check2.printCount === 2, 'Subsequent bill print flagged as DUPLICATE REPRINT');

  // Settle target table
  mockStore.settleTableBill(BIZ_TENANT, refreshedTarget.id, {
    payments: [{ method: 'upi', amount: refreshedTarget.currentBillTotal || 100 }]
  });
  const tableAfterFinalSettle = mockStore.getRestaurantTables(BIZ_TENANT).find(t => t.id === refreshedTarget.id)!;
  assert(tableAfterFinalSettle.status === 'cleaning', 'Business table settled and marked for cleaning');

  console.log('\n🎉 ALL MULTI-TIER CRUD & RESTAURANT LOGIC CHECKS PASSED WITH ZERO ERRORS!\n');
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
