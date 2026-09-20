/**
 * Automated Verification Script: Floor & Table Configuration Flow
 * Tests Section CRUD, Table CRUD, Batch Generation, and Safety Guards
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
    console.error(`[FAIL] ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

async function run() {
  console.log('[START] Starting Floor & Table Configuration Flow Verification...\n');

  // Reset store to fresh state
  mockStore.resetAll();

  // -------------------------------------------------------------
  logStep('1', 'Validate Initial Dining Sections & Tables');
  // -------------------------------------------------------------
  const initialSections = mockStore.getRestaurantSections(TENANT_ID);
  const initialSectionsCount = initialSections.length;
  const initialTables = mockStore.getRestaurantTables(TENANT_ID);

  assert(initialSectionsCount >= 4, `Initial sections count: ${initialSectionsCount}`);
  assert(initialTables.length >= 14, `Initial tables count: ${initialTables.length}`);

  // -------------------------------------------------------------
  logStep('2', 'Create New Dining Section (Rooftop Gazebo)');
  // -------------------------------------------------------------
  const newSection = mockStore.createRestaurantSection(TENANT_ID, {
    name: 'Rooftop Gazebo',
    description: 'Scenic open-air rooftop gazebo area with panoramic skyline view',
    sortOrder: 5
  });

  assert(!!newSection.id, `Created section ID: ${newSection.id}`);
  assert(newSection.name === 'Rooftop Gazebo', 'Section name is Rooftop Gazebo');
  assert(newSection.sortOrder === 5, 'Sort order is 5');

  const afterCreateSections = mockStore.getRestaurantSections(TENANT_ID);
  assert(afterCreateSections.length === initialSectionsCount + 1, 'Section count incremented by 1');

  // -------------------------------------------------------------
  logStep('3', 'Update Section Attributes');
  // -------------------------------------------------------------
  const updatedSection = mockStore.updateRestaurantSection(TENANT_ID, newSection.id, {
    name: 'Rooftop Star Gazebo',
    description: 'Upgraded luxury stargazing dining pods'
  });

  assert(updatedSection.name === 'Rooftop Star Gazebo', 'Section name updated to Rooftop Star Gazebo');
  assert(updatedSection.description === 'Upgraded luxury stargazing dining pods', 'Section description updated');

  // -------------------------------------------------------------
  logStep('4', 'Create Individual Table in New Section');
  // -------------------------------------------------------------
  const newTable = mockStore.createRestaurantTable(TENANT_ID, {
    sectionId: newSection.id,
    tableNumber: 'GZ-01',
    capacity: 6,
    shape: 'round',
    assignedCaptain: 'Captain Vikram'
  });

  assert(newTable.tableNumber === 'GZ-01', 'Created table GZ-01');
  assert(newTable.capacity === 6, 'Table capacity is 6');
  assert(newTable.shape === 'round', 'Table shape is round');
  assert(newTable.status === 'vacant', 'Table status defaults to vacant');
  assert(newTable.assignedCaptain === 'Captain Vikram', 'Assigned captain is Captain Vikram');

  // -------------------------------------------------------------
  logStep('5', 'Section Deletion Safety Guard (Cannot delete section with tables)');
  // -------------------------------------------------------------
  let sectionDeleteFailedAsExpected = false;
  try {
    mockStore.deleteRestaurantSection(TENANT_ID, newSection.id);
  } catch (err: any) {
    sectionDeleteFailedAsExpected = true;
    console.log(`  Expected Protection: ${err.message}`);
  }
  assert(sectionDeleteFailedAsExpected, 'Blocked deletion of section containing assigned tables');

  // -------------------------------------------------------------
  logStep('6', 'Table Deletion Safety Guard (Cannot delete occupied table)');
  // -------------------------------------------------------------
  // Seat table GZ-01
  mockStore.seatTable(TENANT_ID, newTable.id, 4, 'Captain Vikram');
  const seatedTable = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === newTable.id);
  assert(seatedTable?.status === 'seated', 'Table GZ-01 is now seated');

  let tableDeleteFailedAsExpected = false;
  try {
    mockStore.deleteRestaurantTable(TENANT_ID, newTable.id);
  } catch (err: any) {
    tableDeleteFailedAsExpected = true;
    console.log(`  Expected Protection: ${err.message}`);
  }
  assert(tableDeleteFailedAsExpected, 'Blocked deletion of actively occupied/seated table');

  // -------------------------------------------------------------
  logStep('7', 'Vacate & Delete Table');
  // -------------------------------------------------------------
  mockStore.resetTableToVacant(TENANT_ID, newTable.id);
  const vacantTable = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === newTable.id);
  assert(vacantTable?.status === 'vacant', 'Table GZ-01 reset to vacant');

  mockStore.deleteRestaurantTable(TENANT_ID, newTable.id);
  const tableCheck = mockStore.getRestaurantTables(TENANT_ID).find(t => t.id === newTable.id);
  assert(!tableCheck, 'Table GZ-01 successfully deleted and removed from tables list');

  // -------------------------------------------------------------
  logStep('8', 'Delete Section once empty');
  // -------------------------------------------------------------
  mockStore.deleteRestaurantSection(TENANT_ID, newSection.id);
  const sectionCheck = mockStore.getRestaurantSections(TENANT_ID).find(s => s.id === newSection.id);
  assert(!sectionCheck, 'Section successfully deleted once empty');

  // -------------------------------------------------------------
  logStep('9', 'Batch Table Generation');
  // -------------------------------------------------------------
  const firstSection = initialSections[0];
  const tablesBeforeBatch = mockStore.getRestaurantTables(TENANT_ID).length;

  const generatedTables = mockStore.batchCreateRestaurantTables(TENANT_ID, {
    sectionId: firstSection.id,
    prefix: 'VIP-',
    startNumber: 1,
    count: 4,
    capacity: 4,
    shape: 'rectangle',
    assignedCaptain: 'Captain Suresh'
  });

  assert(generatedTables.length === 4, `Batch generated 4 tables: ${generatedTables.map(t => t.tableNumber).join(', ')}`);
  assert(generatedTables[0].tableNumber === 'VIP-01', 'First table is VIP-01');
  assert(generatedTables[3].tableNumber === 'VIP-04', 'Last table is VIP-04');
  assert(generatedTables.every(t => t.shape === 'rectangle'), 'All generated tables have rectangle shape');
  assert(generatedTables.every(t => t.assignedCaptain === 'Captain Suresh'), 'Assigned captain is Captain Suresh');

  const tablesAfterBatch = mockStore.getRestaurantTables(TENANT_ID).length;
  assert(tablesAfterBatch === tablesBeforeBatch + 4, 'Total table count incremented by 4');

  // -------------------------------------------------------------
  logStep('10', 'Duplicate Table Number Prevention');
  // -------------------------------------------------------------
  let dupPrevented = false;
  try {
    mockStore.createRestaurantTable(TENANT_ID, {
      sectionId: firstSection.id,
      tableNumber: 'VIP-01', // Already created in batch
      capacity: 2
    });
  } catch (err: any) {
    dupPrevented = true;
    console.log(`  Expected Protection: ${err.message}`);
  }
  assert(dupPrevented, 'Prevented creation of duplicate table number VIP-01');

  console.log('\n[SUCCESS] ALL FLOOR & TABLE CONFIGURATION FLOW TESTS PASSED! \n');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
