export type InventoryFeature =
  // Starter Tier Core Features
  | 'products'
  | 'categories'
  | 'brands'
  | 'stock'
  | 'barcode'
  | 'suppliers'
  | 'purchases'
  | 'stocktake'
  | 'reports'
  | 'audit_logs'
  | 'user_roles'
  | 'restaurant_floor_billing'
  // Professional Tier Additions
  | 'warehouses'
  | 'bin_locations'
  | 'transfers'
  | 'batches'
  | 'expiry'
  | 'variants'
  | 'bundles'
  | 'reorder'
  | 'forecasting'
  | 'advanced_reports'
  | 'bulk_import'
  | 'automation'
  | 'restaurant_kds'
  | 'restaurant_recipes'
  | 'restaurant_anti_theft'
  // Business Tier Additions
  | 'serial_numbers'
  | 'advanced_costing'
  | 'abc_analysis'
  | 'aging_deadstock'
  | 'advanced_rbac'
  | 'approval_workflows'
  | 'advanced_automation'
  | 'api_webhooks'
  | 'offline_ops';

export type PlanTier = 'starter' | 'professional' | 'business';

export interface FeatureDefinition {
  key: InventoryFeature;
  name: string;
  category: 'core' | 'professional' | 'business';
  description: string;
  minPlanTier: PlanTier;
  dependencies?: InventoryFeature[];
}

export interface TenantEntitlements {
  tenantId: string;
  planId: string;
  planTier: PlanTier;
  planName: string;
  features: InventoryFeature[];
  limits: {
    maxProducts: number;
    maxUsers: number;
    maxWarehouses: number;
    storageMb: number;
  };
}
