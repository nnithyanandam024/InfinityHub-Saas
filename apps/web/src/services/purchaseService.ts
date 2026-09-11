import { Purchase } from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { mockStore } from '../data/mockStore';

export const purchaseService = {
  async getPurchases(tenantId: string): Promise<Purchase[]> {
    try {
      return await apiClient.inventory.getPurchases(tenantId);
    } catch {
      return mockStore.getPurchases(tenantId);
    }
  },

  async createPurchase(
    tenantId: string,
    purchaseData: Omit<Purchase, 'id' | 'tenantId' | 'createdAt'>,
    user: { id: string; name: string }
  ): Promise<Purchase> {
    try {
      const created = await apiClient.inventory.createPurchase(tenantId, purchaseData);
      try { mockStore.createPurchase(tenantId, purchaseData, user); } catch {}
      return created;
    } catch {
      return mockStore.createPurchase(tenantId, purchaseData, user);
    }
  },

  async getPurchaseById(tenantId: string, purchaseId: string): Promise<Purchase | null> {
    try {
      const list = await apiClient.inventory.getPurchases(tenantId);
      const found = list.find((p: Purchase) => p.id === purchaseId);
      if (found) return found;
      return mockStore.getPurchaseById(tenantId, purchaseId);
    } catch {
      return mockStore.getPurchaseById(tenantId, purchaseId);
    }
  },

  async deletePurchase(tenantId: string, purchaseId: string, user: { id: string; name: string }): Promise<void> {
    try {
      await apiClient.inventory.deletePurchase(tenantId, purchaseId);
      try { mockStore.deletePurchase(tenantId, purchaseId, user); } catch {}
    } catch {
      mockStore.deletePurchase(tenantId, purchaseId, user);
    }
  }
};
