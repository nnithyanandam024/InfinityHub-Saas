import { ReorderRule, PurchaseSuggestion } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const reorderService = {
  async getReorderRules(tenantId: string): Promise<ReorderRule[]> {
    return mockStore.getReorderRules(tenantId);
  },

  async saveReorderRule(tenantId: string, rule: Omit<ReorderRule, 'id' | 'tenantId'>): Promise<ReorderRule> {
    return mockStore.saveReorderRule(tenantId, rule);
  },

  async getPurchaseSuggestions(tenantId: string): Promise<PurchaseSuggestion[]> {
    return mockStore.getPurchaseSuggestions(tenantId);
  }
};
