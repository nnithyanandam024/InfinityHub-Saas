import { Tenant } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const tenantService = {
  async getTenants(): Promise<Tenant[]> {
    return mockStore.getTenants();
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    const tenant = mockStore.getTenant(id);
    return tenant || null;
  },

  // Platform Scope update: status (active/suspended), plan, modules
  async updateTenantPlatformSettings(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    return mockStore.updateTenantPlatformSettings(id, updates);
  },

  // Tenant Scope update: private business profile and settings
  async updateBusinessSettings(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    return mockStore.updateTenantBusinessSettings(id, updates);
  },

  // Backward compatibility alias
  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    return mockStore.updateTenantBusinessSettings(id, updates);
  },

  // Self-Serve Customer Provisioning
  async provisionTenant(payload: {
    name: string;
    ownerName: string;
    email: string;
    phone: string;
    applicationId: 'inventory' | 'pos' | 'restaurant' | 'employee' | 'appointment';
    applicationName?: string;
    planId: string;
    planName?: string;
    password?: string;
  }): Promise<Tenant> {
    return mockStore.provisionTenant(payload);
  },

  // White-Label Mobile App Branding & APK Build
  async getAppBranding(tenantId: string) {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/app-branding?tenantId=${tenantId}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback to mockStore
    }
    return mockStore.getAppBranding(tenantId);
  },

  async updateAppBranding(tenantId: string, updates: any) {
    try {
      const res = await fetch('http://localhost:4000/api/v1/tenants/app-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...updates })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback to mockStore
    }
    return mockStore.updateAppBranding(tenantId, updates);
  },

  async buildApk(tenantId: string, updates: any) {
    try {
      const res = await fetch('http://localhost:4000/api/v1/tenants/build-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...updates })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback to mockStore
    }
    return mockStore.buildApk(tenantId, updates);
  }
};

