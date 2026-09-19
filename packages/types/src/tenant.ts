import { ApplicationId } from './subscription';

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'canceled';

export interface TenantSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeZone: string;
  taxRate: number;
  enableBarcodeScanning: boolean;
  lowStockThresholdDefault: number;
}

export interface TenantUsageMetadata {
  productsCount: number;
  maxProductsQuota: number;
  usersCount: number;
  maxUsersQuota: number;
  storageUsedMb: number;
  maxStorageQuotaMb: number;
  lastActiveAt: string;
}

export interface TenantMobileBranding {
  appName: string;
  shortName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor?: string;
  appSuite: ApplicationId;
  apkVersion: string;
  apkBuildNumber: number;
  apkStatus: 'not_generated' | 'building' | 'ready' | 'failed';
  apkDownloadUrl?: string;
  apkFileSizeMb?: number;
  lastBuiltAt?: string;
  buildLogs?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  // Core Business Application mapping
  applicationId: ApplicationId;
  applicationName: string;
  planId: string;
  planName: string;
  status: TenantStatus;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  activeModules?: string[];
  settings: TenantSettings;
  branding?: TenantMobileBranding;
  usage?: TenantUsageMetadata;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
