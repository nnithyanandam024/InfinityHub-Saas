import { useMemo, useCallback } from 'react';
import { InventoryFeature, PlanTier, FeatureDefinition, TenantEntitlements } from '@infinityhub/types';
import { useTenant } from '../context/TenantContext';
import { entitlementService } from '../services/entitlementService';

export interface UseEntitlementsReturn {
  tier: PlanTier;
  planName: string;
  planId: string;
  isStarter: boolean;
  isProfessional: boolean;
  isBusiness: boolean;
  hasFeature: (feature: InventoryFeature) => boolean;
  getMinTier: (feature: InventoryFeature) => PlanTier;
  getFeatureInfo: (feature: InventoryFeature) => FeatureDefinition;
  entitlements: TenantEntitlements | null;
  limits: {
    maxProducts: number;
    maxUsers: number;
    maxWarehouses: number;
    storageMb: number;
  };
  canCreate: (resource: 'product' | 'warehouse' | 'user') => { allowed: boolean; current: number; max: number };
  upgradePlan: (targetPlanId: string) => Promise<void>;
}

export const useEntitlements = (): UseEntitlementsReturn => {
  const { tenant, refreshTenant } = useTenant();

  const entitlements = useMemo(() => {
    if (!tenant) return null;
    return entitlementService.getEntitlements(tenant.id);
  }, [tenant?.id, tenant?.planId]);

  const tier: PlanTier = entitlements?.planTier || 'starter';
  const planName = entitlements?.planName || (tier === 'business' ? 'Business' : tier === 'professional' ? 'Professional' : 'Starter');
  const planId = entitlements?.planId || 'plan-starter';

  const isStarter = tier === 'starter';
  const isProfessional = tier === 'professional';
  const isBusiness = tier === 'business';

  const hasFeature = useCallback(
    (feature: InventoryFeature): boolean => {
      if (!tenant) return false;
      return entitlementService.hasFeature(tenant.id, feature);
    },
    [tenant?.id, tenant?.planId]
  );

  const getMinTier = useCallback((feature: InventoryFeature): PlanTier => {
    return entitlementService.getFeatureMinTier(feature);
  }, []);

  const getFeatureInfo = useCallback((feature: InventoryFeature): FeatureDefinition => {
    return entitlementService.getFeatureInfo(feature);
  }, []);

  const limits = useMemo(() => {
    return (
      entitlements?.limits || {
        maxProducts: 1000,
        maxUsers: 2,
        maxWarehouses: 1,
        storageMb: 1024
      }
    );
  }, [entitlements]);

  const canCreate = useCallback(
    (resource: 'product' | 'warehouse' | 'user') => {
      if (!tenant) return { allowed: false, current: 0, max: 0 };
      return entitlementService.canCreate(tenant.id, resource);
    },
    [tenant?.id, tenant?.planId]
  );

  const upgradePlan = useCallback(
    async (targetPlanId: string) => {
      if (!tenant) return;
      await entitlementService.upgradeTenantPlan(tenant.id, targetPlanId);
      await refreshTenant();
    },
    [tenant?.id, refreshTenant]
  );

  return {
    tier,
    planName,
    planId,
    isStarter,
    isProfessional,
    isBusiness,
    hasFeature,
    getMinTier,
    getFeatureInfo,
    entitlements,
    limits,
    canCreate,
    upgradePlan
  };
};
