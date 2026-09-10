import { StocktakeSession } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const stocktakeService = {
  async getSessions(tenantId: string): Promise<StocktakeSession[]> {
    return mockStore.getStocktakeSessions(tenantId);
  },

  async getSessionById(tenantId: string, id: string): Promise<StocktakeSession | null> {
    return mockStore.getStocktakeSessionById(tenantId, id);
  },

  async createSession(
    tenantId: string,
    warehouseId: string,
    notes: string,
    userId: string,
    userName: string
  ): Promise<StocktakeSession> {
    return mockStore.createStocktakeSession(tenantId, warehouseId, notes, userId, userName);
  },

  async updateItemCount(
    tenantId: string,
    sessionId: string,
    productId: string,
    countedQuantity: number
  ): Promise<StocktakeSession> {
    return mockStore.updateStocktakeCount(tenantId, sessionId, productId, countedQuantity);
  },

  async reconcileSession(
    tenantId: string,
    sessionId: string,
    userId: string,
    userName: string
  ): Promise<StocktakeSession> {
    return mockStore.reconcileStocktakeSession(tenantId, sessionId, userId, userName);
  },

  async cancelSession(tenantId: string, sessionId: string): Promise<StocktakeSession> {
    return mockStore.cancelStocktakeSession(tenantId, sessionId);
  }
};
