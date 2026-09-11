import { InventoryFeature, PlanTier, FeatureDefinition, TenantEntitlements } from '@infinityhub/types';
import { INVENTORY_FEATURES, DEFAULT_PLAN_ENTITLEMENTS, DEFAULT_PLAN_LIMITS } from '@infinityhub/constants';
import { mockStore } from '../data/mockStore';

export const entitlementService = {
  getEntitlements(tenantId: string): TenantEntitlements {
    const tenant = mockStore.getTenant(tenantId);
    const plans = mockStore.getPlans();
    const plan = plans.find(p => p.id === tenant?.planId) || plans[0];

    const tier: PlanTier = plan.tier || (plan.id.includes('starter') ? 'starter' : plan.id.includes('professional') ? 'professional' : 'business');
    const features: InventoryFeature[] = plan.includedFeatures || DEFAULT_PLAN_ENTITLEMENTS[tier] || DEFAULT_PLAN_ENTITLEMENTS.starter;
    const defaultLimits = DEFAULT_PLAN_LIMITS[tier];

    return {
      tenantId,
      planId: plan.id,
      planTier: tier,
      planName: plan.name,
      features,
      limits: {
        maxProducts: plan.maxProducts || defaultLimits.maxProducts,
        maxUsers: plan.maxUsers || defaultLimits.maxUsers,
        maxWarehouses: plan.maxWarehouses || defaultLimits.maxWarehouses,
        storageMb: plan.storageMb || defaultLimits.storageMb
      }
    };
  },

  hasFeature(tenantId: string, feature: InventoryFeature): boolean {
    const entitlements = this.getEntitlements(tenantId);
    return entitlements.features.includes(feature);
  },

  getFeatureInfo(feature: InventoryFeature): FeatureDefinition {
    return INVENTORY_FEATURES[feature];
  },

  getFeatureMinTier(feature: InventoryFeature): PlanTier {
    return INVENTORY_FEATURES[feature]?.minPlanTier || 'starter';
  },

  getPlanTierName(tier: PlanTier): string {
    switch (tier) {
      case 'business':
        return 'Business';
      case 'professional':
        return 'Professional';
      case 'starter':
      default:
        return 'Starter';
    }
  },

  async upgradeTenantPlan(tenantId: string, planId: string): Promise<any> {
    const plans = mockStore.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error(`Target plan ${planId} not found`);

    return mockStore.updateTenantPlatformSettings(tenantId, {
      planId: plan.id,
      planName: plan.name
    });
  },

  getAllFeatures(): FeatureDefinition[] {
    return Object.values(INVENTORY_FEATURES);
  },

  canCreate(tenantId: string, resource: 'product' | 'warehouse' | 'user'): { allowed: boolean; current: number; max: number } {
    const entitlements = this.getEntitlements(tenantId);
    let current = 0;
    let max = 0;

    if (resource === 'product') {
      current = mockStore.getProducts(tenantId).length;
      max = entitlements.limits.maxProducts;
    } else if (resource === 'warehouse') {
      current = mockStore.getWarehouses(tenantId).length;
      max = entitlements.limits.maxWarehouses;
    } else if (resource === 'user') {
      current = mockStore.getTenantUsers(tenantId).length;
      max = entitlements.limits.maxUsers;
    }

    return {
      allowed: current < max,
      current,
      max
    };
  }
};
