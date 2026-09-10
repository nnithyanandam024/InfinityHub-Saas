import { Brand } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const brandService = {
  async getBrands(tenantId: string): Promise<Brand[]> {
    return mockStore.getBrands(tenantId);
  },

  async createBrand(
    tenantId: string,
    data: Omit<Brand, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'productCount'>
  ): Promise<Brand> {
    return mockStore.addBrand(tenantId, data);
  },

  async updateBrand(
    tenantId: string,
    id: string,
    updates: Partial<Brand>
  ): Promise<Brand> {
    return mockStore.updateBrand(tenantId, id, updates);
  },

  async deleteBrand(tenantId: string, id: string): Promise<void> {
    return mockStore.deleteBrand(tenantId, id);
  }
};
