import { Category } from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { mockStore } from '../data/mockStore';

export const categoryService = {
  async getCategories(tenantId: string): Promise<Category[]> {
    try {
      return await apiClient.inventory.getCategories(tenantId);
    } catch {
      return mockStore.getCategories(tenantId);
    }
  },

  async createCategory(tenantId: string, data: Omit<Category, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'productCount'>): Promise<Category> {
    try {
      const created = await apiClient.inventory.createCategory(tenantId, data);
      try { mockStore.addCategory(tenantId, data); } catch {}
      return created;
    } catch {
      return mockStore.addCategory(tenantId, data);
    }
  },

  async updateCategory(tenantId: string, categoryId: string, updates: Partial<Category>): Promise<Category> {
    try {
      const updated = await apiClient.inventory.updateCategory(tenantId, categoryId, updates);
      try { mockStore.updateCategory(tenantId, categoryId, updates); } catch {}
      return updated;
    } catch {
      return mockStore.updateCategory(tenantId, categoryId, updates);
    }
  },

  async deleteCategory(tenantId: string, categoryId: string): Promise<void> {
    try {
      await apiClient.inventory.deleteCategory(tenantId, categoryId);
      try { mockStore.deleteCategory(tenantId, categoryId); } catch {}
    } catch {
      mockStore.deleteCategory(tenantId, categoryId);
    }
  }
};
