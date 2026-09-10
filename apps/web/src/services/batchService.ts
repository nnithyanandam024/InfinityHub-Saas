import { Batch } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const batchService = {
  async getBatches(tenantId: string, productId?: string): Promise<Batch[]> {
    return mockStore.getBatches(tenantId, productId);
  },

  async createBatch(
    tenantId: string,
    data: Omit<Batch, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Batch> {
    return mockStore.createBatch(tenantId, data);
  },

  async getExpiringSoonBatches(tenantId: string, daysThreshold: number = 30): Promise<Batch[]> {
    const allBatches = await this.getBatches(tenantId);
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    return allBatches.filter(b => {
      if (!b.expiryAt || b.quantity <= 0) return false;
      const expiry = new Date(b.expiryAt);
      return expiry <= thresholdDate;
    });
  },

  async getExpiringBatches(tenantId: string, daysThreshold: number = 30): Promise<Batch[]> {
    return this.getExpiringSoonBatches(tenantId, daysThreshold);
  }
};
