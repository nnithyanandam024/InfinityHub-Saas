import { ProductBundle } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const bundleService = {
  async getBundles(tenantId: string): Promise<ProductBundle[]> {
    return mockStore.getBundles(tenantId);
  },

  async getBundleByProductId(tenantId: string, bundleProductId: string): Promise<ProductBundle | null> {
    return mockStore.getBundleByProductId(tenantId, bundleProductId);
  },

  async saveBundle(
    tenantId: string,
    bundleData: Omit<ProductBundle, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProductBundle> {
    return mockStore.saveBundle(tenantId, bundleData);
  },

  async assembleBundle(
    tenantId: string,
    bundleId: string,
    quantity: number,
    user: { id: string; name: string }
  ) {
    return mockStore.assembleBundle(tenantId, bundleId, quantity, user.id, user.name);
  },

  async disassembleBundle(
    tenantId: string,
    bundleId: string,
    quantity: number,
    user: { id: string; name: string }
  ) {
    return mockStore.disassembleBundle(tenantId, bundleId, quantity, user.id, user.name);
  }
};
