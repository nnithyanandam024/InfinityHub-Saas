import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, ModuleId, WorkspaceIdentity, TenantStatus } from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { tenantService } from '../services/tenantService';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenant: Tenant | null;
  tenants: Tenant[];
  workspace: WorkspaceIdentity | null;
  isLoading: boolean;
  setTenantId: (id: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  isModuleActive: (moduleId: ModuleId) => boolean;
  isApplicationAllowed: (appId: string) => boolean;
  accountStatus: TenantStatus;
  currencySymbol: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const ACTIVE_TENANT_KEY = 'infinityhub_active_tenant';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPlatformScope, user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (targetId?: string) => {
    setIsLoading(true);
    try {
      const list = await tenantService.getTenants();
      setTenants(list);

      // ACCESS BOUNDARY: Platform Super Admin has NO active customer tenant
      if (isPlatformScope) {
        setTenant(null);
        return;
      }

      // STRICT MULTI-TENANT ISOLATION:
      // Authenticated customer user is immutably bound to user.tenantId
      let resolvedId = user?.tenantId;
      if (!resolvedId) {
        resolvedId = targetId || localStorage.getItem(ACTIVE_TENANT_KEY) || list[0]?.id;
      }

      const current = list.find(t => t.id === resolvedId) || list[0] || null;
      setTenant(current);
      if (current) {
        localStorage.setItem(ACTIVE_TENANT_KEY, current.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isPlatformScope, user?.tenantId]);

  // Real-time synchronization subscription: broadcasts to browser components
  useEffect(() => {
    if (!tenant?.id) return;
    const unsubscribe = apiClient.subscribeToTenantSync(tenant.id, (event: any) => {
      window.dispatchEvent(new CustomEvent('infinityhub:sync', { detail: event }));
    });
    return () => {
      unsubscribe();
    };
  }, [tenant?.id]);

  const setTenantId = async (id: string) => {
    if (isPlatformScope) return; // Super Admin cannot set active customer tenant
    // If authenticated user belongs to a tenant, disallow switching to other tenants
    if (user?.tenantId && user.tenantId !== id) {
      console.warn(`Access Denied: User is strictly bound to store ${user.tenantId} and cannot access ${id}`);
      return;
    }
    await loadData(id);
  };

  const refreshTenant = async () => {
    if (tenant) {
      const updated = await tenantService.getTenantById(tenant.id);
      if (updated) setTenant(updated);
    }
  };

  const isModuleActive = (moduleId: ModuleId): boolean => {
    if (!tenant) return false;
    if (tenant.applicationId === moduleId) return true;
    return Boolean(tenant.activeModules?.includes(moduleId));
  };

  const isApplicationAllowed = (appId: string): boolean => {
    if (!tenant) return false;
    return (tenant.applicationId || 'inventory') === appId;
  };

  const workspace: WorkspaceIdentity | null = tenant
    ? {
        tenantId: tenant.id,
        applicationId: tenant.applicationId || 'inventory',
        applicationName: tenant.applicationName || 'Inventory Management',
        planId: tenant.planId,
        planName: tenant.planName,
        owner: {
          name: tenant.ownerName,
          email: tenant.email
        },
        status: tenant.status
      }
    : null;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenants,
        workspace,
        isLoading,
        setTenantId,
        refreshTenant,
        isModuleActive,
        isApplicationAllowed,
        accountStatus: tenant?.status || 'active',
        currencySymbol: tenant?.settings?.currencySymbol || '₹'
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
