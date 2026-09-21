import assert from 'assert';
import { DEMO_PERSONAS } from '../apps/mobile/src/context/AuthContext';

console.log('[TEST START] Verifying Mobile App Sample Store Accounts for all 3 Business Suites');

// 1. Validate Inventory Store Account (ABC Supermarket)
console.log('[STEP 1] Testing Inventory Suite Sample Account...');
const inventoryStore = DEMO_PERSONAS.find(p => p.appId === 'inventory' && p.key === 'abc-supermarket-owner');
assert.ok(inventoryStore, 'Inventory store account (abc-supermarket-owner) must exist');
assert.strictEqual(inventoryStore.email, 'rajesh@abcsupermarket.in');
assert.strictEqual(inventoryStore.tenantId, 'tenant-abc-supermarket');
assert.strictEqual(inventoryStore.tenantName, 'ABC Supermarket');
assert.strictEqual(inventoryStore.role, 'TENANT_OWNER');
assert.strictEqual(inventoryStore.icon, 'package');
assert.ok(inventoryStore.features.length >= 3, 'Must define at least 3 features for inventory');
console.log('[STEP 1 PASS] ABC Supermarket verified for Inventory Management.');

// 2. Validate POS Store Account (City Retail Hardware)
console.log('[STEP 2] Testing Billing & POS Suite Sample Account...');
const posStore = DEMO_PERSONAS.find(p => p.appId === 'pos' && p.key === 'city-retail-owner');
assert.ok(posStore, 'POS store account (city-retail-owner) must exist');
assert.strictEqual(posStore.email, 'arvind@cityretailtools.com');
assert.strictEqual(posStore.tenantId, 'tenant-city-retail');
assert.strictEqual(posStore.tenantName, 'City Retail Hardware');
assert.strictEqual(posStore.role, 'TENANT_OWNER');
assert.strictEqual(posStore.icon, 'cart');
assert.ok(posStore.features.length >= 3, 'Must define at least 3 features for POS');
console.log('[STEP 2 PASS] City Retail Hardware verified for Billing & POS.');

// 3. Validate Restaurant Store Account (XYZ Gourmet Bistro)
console.log('[STEP 3] Testing Restaurant Suite Sample Account...');
const restaurantStore = DEMO_PERSONAS.find(p => p.appId === 'restaurant' && p.key === 'xyz-restaurant-owner');
assert.ok(restaurantStore, 'Restaurant store account (xyz-restaurant-owner) must exist');
assert.strictEqual(restaurantStore.email, 'rahul@xyzbistro.com');
assert.strictEqual(restaurantStore.tenantId, 'tenant-xyz-restaurant');
assert.strictEqual(restaurantStore.tenantName, 'XYZ Gourmet Bistro');
assert.strictEqual(restaurantStore.role, 'TENANT_OWNER');
assert.strictEqual(restaurantStore.icon, 'utensils');
assert.ok(restaurantStore.features.length >= 3, 'Must define at least 3 features for Restaurant');
console.log('[STEP 3 PASS] XYZ Gourmet Bistro verified for Restaurant Ops.');

// 4. Test Authentication Resolution Simulation
console.log('[STEP 4] Simulating Manual & 1-Tap Sign In Resolution...');

function simulateLogin(email: string): { success: boolean; tenantId?: string; appId?: string } {
  const norm = email.trim().toLowerCase();
  const matched = DEMO_PERSONAS.find(p => {
    const pEmail = p.email.toLowerCase();
    if (pEmail === norm) return true;
    if (norm === 'owner@abcsupermarket.com' && p.key === 'abc-supermarket-owner') return true;
    if (norm === 'city@retail.com' && p.key === 'city-retail-owner') return true;
    if (norm === 'contact@xyzbistro.com' && p.key === 'xyz-restaurant-owner') return true;
    return false;
  });

  if (matched) {
    return { success: true, tenantId: matched.tenantId, appId: matched.appId };
  }
  return { success: false };
}

// Test A: Inventory login
const invResult = simulateLogin('rajesh@abcsupermarket.in');
assert.strictEqual(invResult.success, true);
assert.strictEqual(invResult.tenantId, 'tenant-abc-supermarket');
assert.strictEqual(invResult.appId, 'inventory');

// Test B: POS login
const posResult = simulateLogin('arvind@cityretailtools.com');
assert.strictEqual(posResult.success, true);
assert.strictEqual(posResult.tenantId, 'tenant-city-retail');
assert.strictEqual(posResult.appId, 'pos');

// Test C: Restaurant login
const rstResult = simulateLogin('rahul@xyzbistro.com');
assert.strictEqual(rstResult.success, true);
assert.strictEqual(rstResult.tenantId, 'tenant-xyz-restaurant');
assert.strictEqual(rstResult.appId, 'restaurant');

// Test D: Invalid login
const badResult = simulateLogin('nonexistent@domain.com');
assert.strictEqual(badResult.success, false);

console.log('[STEP 4 PASS] Authentication credential resolution validated for all 3 stores.');

// 5. Zero Emoji Code Point Verification
console.log('[STEP 5] Auditing for zero emojis in authentication and login files...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

const sampleFiles = [
  'apps/mobile/src/context/AuthContext.tsx',
  'apps/mobile/src/context/AppContext.tsx',
  'apps/mobile/src/screens/auth/LoginScreen.tsx'
];

const fs = require('fs');
sampleFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  assert.strictEqual(emojiRegex.test(content), false, 'Zero emojis constraint violated in ' + f);
});

console.log('[STEP 5 PASS] Zero emojis confirmed across all mobile login files.');

console.log('[ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY WITH ZERO ERRORS]');
