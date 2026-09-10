import { Product, StockMovement } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const stockService = {
  async getStockOverview(tenantId: string): Promise<Product[]> {
    return mockStore.getProducts(tenantId);
  },

  async getStockMovements(tenantId: string, productId?: string): Promise<StockMovement[]> {
    return mockStore.getStockMovements(tenantId, productId);
  },

  async adjustStock(
    tenantId: string,
    productId: string,
    adjustment: {
      adjustmentType: 'increase' | 'decrease' | 'damage' | 'correction';
      quantity: number;
      reason: string;
      userId: string;
      userName: string;
    }
  ): Promise<{ product: Product; movement: StockMovement }> {
    return mockStore.adjustStock(tenantId, productId, adjustment);
  }
};
