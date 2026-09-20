/**
 * Tiered Plan Structure & Feature Entitlements Automated Verification Suite
 */

import { mockStore } from '../apps/web/src/data/mockStore';
import { entitlementService } from '../apps/web/src/services/entitlementService';
import { INVENTORY_FEATURES, DEFAULT_PLAN_ENTITLEMENTS } from '@infinityhub/constants';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`   [${suite}] ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: 'Assertion failed', details });
    console.error(`   [${suite}] ${name} - FAILED: ${details}`);
  }
}

async function runTierVerification() {
  console.log('\n======================================================');
  console.log('   INFINITYHUB TIERED PLAN ENTITLEMENT VERIFICATION');
  console.log('======================================================\n');

  mockStore.resetAll();

  const STARTER_TENANT = 'tenant-kumar-stores';
  const PRO_TENANT = 'tenant-abc-supermarket';

  // 1. STARTER PLAN VERIFICATION
  console.log('--- 1. Starter Plan (Kumar Stores) ---');
  const starterEntitlements = entitlementService.getEntitlements(STARTER_TENANT);
  assert(starterEntitlements.planTier === 'starter', 'Starter', 'Tenant planTier is starter');
  assert(starterEntitlements.limits.maxWarehouses === 1, 'Starter', 'Starter maxWarehouses is 1');
  assert(starterEntitlements.limits.maxUsers === 2, 'Starter', 'Starter maxUsers is 2');
  assert(starterEntitlements.limits.maxProducts === 1000, 'Starter', 'Starter maxProducts is 1000');

  // Check essential core features present in Starter
  const expectedStarterFeatures = [
    'products',
    'categories',
    'brands',
    'stock',
    'barcode',
    'suppliers',
    'purchases',
    'stocktake',
    'reports',
    'audit_logs',
    'user_roles',
    'restaurant_floor_billing'
  ] as const;

  for (const f of expectedStarterFeatures) {
    assert(entitlementService.hasFeature(STARTER_TENANT, f), 'Starter Features', `Starter includes ${f}`);
  }

  // Check advanced features blocked in Starter
  const blockedInStarter = [
    'warehouses',
    'transfers',
    'batches',
    'expiry',
    'variants',
    'bundles',
    'reorder',
    'forecasting',
    'bulk_import',
    'serial_numbers',
    'abc_analysis',
    'aging_deadstock',
    'restaurant_kds'
  ] as const;

  for (const f of blockedInStarter) {
    assert(!entitlementService.hasFeature(STARTER_TENANT, f), 'Starter Blocks', `Starter strictly blocks ${f}`);
  }

  // 2. PROFESSIONAL PLAN VERIFICATION
  console.log('\n--- 2. Professional Plan (ABC Supermarket) ---');
  const proEntitlements = entitlementService.getEntitlements(PRO_TENANT);
  assert(proEntitlements.planTier === 'professional', 'Professional', 'Tenant planTier is professional');
  assert(proEntitlements.limits.maxWarehouses === 5, 'Professional', 'Pro maxWarehouses is 5');
  assert(proEntitlements.limits.maxUsers === 5, 'Professional', 'Pro maxUsers is 5');
  assert(proEntitlements.limits.maxProducts === 10000, 'Professional', 'Pro maxProducts is 10,000');

  // Check professional additions are present
  const expectedProFeatures = [
    'warehouses',
    'bin_locations',
    'transfers',
    'batches',
    'expiry',
    'variants',
    'bundles',
    'reorder',
    'forecasting',
    'advanced_reports',
    'bulk_import',
    'automation',
    'restaurant_floor_billing',
    'restaurant_kds',
    'restaurant_recipes',
    'restaurant_anti_theft'
  ] as const;

  for (const f of expectedProFeatures) {
    assert(entitlementService.hasFeature(PRO_TENANT, f), 'Pro Features', `Pro includes ${f}`);
  }

  // Check business features blocked in Professional
  const blockedInPro = [
    'serial_numbers',
    'advanced_costing',
    'abc_analysis',
    'aging_deadstock',
    'advanced_rbac',
    'approval_workflows',
    'advanced_automation',
    'api_webhooks',
    'offline_ops'
  ] as const;

  for (const f of blockedInPro) {
    assert(!entitlementService.hasFeature(PRO_TENANT, f), 'Pro Blocks', `Pro strictly blocks ${f}`);
  }

  // 3. DYNAMIC UPGRADE FLOW VERIFICATION
  console.log('\n--- 3. Dynamic Plan Upgrade Flow ---');
  // Upgrade Kumar Stores from Starter to Professional
  await entitlementService.upgradeTenantPlan(STARTER_TENANT, 'plan-professional');
  const afterProUpgrade = entitlementService.getEntitlements(STARTER_TENANT);
  assert(afterProUpgrade.planTier === 'professional', 'Upgrade', 'Kumar Stores upgraded to professional');
  assert(entitlementService.hasFeature(STARTER_TENANT, 'warehouses'), 'Upgrade', 'Kumar Stores now has warehouses');
  assert(entitlementService.hasFeature(STARTER_TENANT, 'batches'), 'Upgrade', 'Kumar Stores now has batches');
  assert(!entitlementService.hasFeature(STARTER_TENANT, 'serial_numbers'), 'Upgrade', 'Serial numbers still locked in Pro');

  // Upgrade to Business / Enterprise
  await entitlementService.upgradeTenantPlan(STARTER_TENANT, 'plan-enterprise');
  const afterBizUpgrade = entitlementService.getEntitlements(STARTER_TENANT);
  assert(afterBizUpgrade.planTier === 'business', 'Upgrade', 'Kumar Stores upgraded to business');
  assert(entitlementService.hasFeature(STARTER_TENANT, 'serial_numbers'), 'Upgrade', 'Kumar Stores now has serial numbers');
  assert(entitlementService.hasFeature(STARTER_TENANT, 'abc_analysis'), 'Upgrade', 'Kumar Stores now has ABC analysis');
  assert(entitlementService.hasFeature(STARTER_TENANT, 'aging_deadstock'), 'Upgrade', 'Kumar Stores now has aging deadstock');
  assert(afterBizUpgrade.limits.maxWarehouses === 25, 'Upgrade', 'Business maxWarehouses is 25');

  // Downgrade back to Starter to leave clean initial state
  await entitlementService.upgradeTenantPlan(STARTER_TENANT, 'plan-starter');
  const resetEntitlements = entitlementService.getEntitlements(STARTER_TENANT);
  assert(resetEntitlements.planTier === 'starter', 'Reset', 'Kumar Stores safely reset back to starter');

  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTierVerification().catch(err => {
  console.error('Fatal error in tier verification:', err);
  process.exit(1);
});
