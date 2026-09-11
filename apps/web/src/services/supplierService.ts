import { Supplier } from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { mockStore } from '../data/mockStore';

export const supplierService = {
  async getSuppliers(tenantId: string): Promise<Supplier[]> {
    try {
      return await apiClient.inventory.getSuppliers(tenantId);
    } catch {
      return mockStore.getSuppliers(tenantId);
    }
  },

  async createSupplier(tenantId: string, data: Omit<Supplier, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    try {
      const created = await apiClient.inventory.createSupplier(tenantId, data);
      try { mockStore.addSupplier(tenantId, data); } catch {}
      return created;
    } catch {
      return mockStore.addSupplier(tenantId, data);
    }
  },

  async updateSupplier(tenantId: string, supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
    try {
      const updated = await apiClient.inventory.updateSupplier(tenantId, supplierId, updates);
      try { mockStore.updateSupplier(tenantId, supplierId, updates); } catch {}
      return updated;
    } catch {
      return mockStore.updateSupplier(tenantId, supplierId, updates);
    }
  },

  async deleteSupplier(tenantId: string, supplierId: string): Promise<void> {
    try {
      await apiClient.inventory.deleteSupplier(tenantId, supplierId);
      try { mockStore.deleteSupplier(tenantId, supplierId); } catch {}
    } catch {
      mockStore.deleteSupplier(tenantId, supplierId);
    }
  }
};
