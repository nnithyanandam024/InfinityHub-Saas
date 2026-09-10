import { StockTransfer, StockTransferItem } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const transferService = {
  async getTransfers(tenantId: string): Promise<StockTransfer[]> {
    return mockStore.getStockTransfers(tenantId);
  },

  async getTransferById(tenantId: string, id: string): Promise<StockTransfer | null> {
    return mockStore.getStockTransferById(tenantId, id);
  },

  async createTransfer(
    tenantId: string,
    data: {
      sourceWarehouseId: string;
      destinationWarehouseId: string;
      notes?: string;
      items: Omit<StockTransferItem, 'id' | 'transferId'>[];
    },
    userId: string,
    userName: string
  ): Promise<StockTransfer> {
    return mockStore.createStockTransfer(tenantId, data, userId, userName);
  },

  async dispatchTransfer(tenantId: string, transferId: string, userId: string, userName: string): Promise<StockTransfer> {
    return mockStore.dispatchStockTransfer(tenantId, transferId, userId, userName);
  },

  async receiveTransfer(tenantId: string, transferId: string, userId: string, userName: string): Promise<StockTransfer> {
    return mockStore.receiveStockTransfer(tenantId, transferId, userId, userName);
  },

  async cancelTransfer(tenantId: string, transferId: string, userId: string, userName: string): Promise<StockTransfer> {
    return mockStore.cancelStockTransfer(tenantId, transferId, userId, userName);
  },

  async updateTransferStatus(
    tenantId: string,
    transferId: string,
    status: 'in_transit' | 'received' | 'cancelled',
    user: { id: string; name: string }
  ): Promise<StockTransfer> {
    if (status === 'in_transit') return this.dispatchTransfer(tenantId, transferId, user.id, user.name);
    if (status === 'received') return this.receiveTransfer(tenantId, transferId, user.id, user.name);
    if (status === 'cancelled') return this.cancelTransfer(tenantId, transferId, user.id, user.name);
    throw new Error(`Unsupported status transition: ${status}`);
  }
};
