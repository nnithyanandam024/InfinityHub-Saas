import { InventoryFeature, PlanTier } from './entitlement';

export type ApplicationId = 'inventory' | 'pos' | 'restaurant' | 'employee' | 'appointment';

// Backwards compatibility alias
export type ModuleId = ApplicationId;

export interface PlatformApplication {
  id: ApplicationId;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  isAvailable: boolean;
  coreNavItems: string[];
  serviceId: string;
  startingPrice: number;
  extendedFeatures: string[];
}

// Backwards compatibility alias
export type Module = PlatformApplication;

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface Plan {
  id: string;
  tier?: PlanTier;
  applicationId?: ApplicationId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxProducts: number;
  maxUsers: number;
  maxWarehouses?: number;
  storageMb?: number;
  features?: string[]; // Marketing bullet points
  includedFeatures?: InventoryFeature[]; // Technical feature keys
  includedModules?: string[];
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  applicationId?: ApplicationId;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  billingInterval: 'month' | 'year';
}

export interface WorkspaceIdentity {
  tenantId: string;
  applicationId: ApplicationId;
  applicationName: string;
  planId: string;
  planName: string;
  owner: {
    name: string;
    email: string;
  };
  status: 'active' | 'trial' | 'suspended' | 'expired' | 'canceled';
}
