import { Warehouse, WarehouseLocation, StockBalance } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const warehouseService = {
  async getWarehouses(tenantId: string): Promise<Warehouse[]> {
    return mockStore.getWarehouses(tenantId);
  },

  async getWarehouseById(tenantId: string, id: string): Promise<Warehouse | null> {
    return mockStore.getWarehouseById(tenantId, id);
  },

  async createWarehouse(
    tenantId: string,
    data: Omit<Warehouse, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<Warehouse> {
    return mockStore.createWarehouse(tenantId, data);
  },

  async updateWarehouse(
    tenantId: string,
    id: string,
    updates: Partial<Warehouse>
  ): Promise<Warehouse> {
    return mockStore.updateWarehouse(tenantId, id, updates);
  },

  async getLocations(tenantId: string, warehouseId: string): Promise<WarehouseLocation[]> {
    return mockStore.getWarehouseLocations(tenantId, warehouseId);
  },

  async createLocation(
    tenantId: string,
    warehouseId: string,
    data: Omit<WarehouseLocation, 'id' | 'tenantId' | 'warehouseId'>
  ): Promise<WarehouseLocation> {
    return mockStore.createWarehouseLocation(tenantId, warehouseId, data);
  },

  async getStockBalances(tenantId: string, productId?: string, warehouseId?: string): Promise<StockBalance[]> {
    return mockStore.getStockBalances(tenantId, productId, warehouseId);
  }
};
