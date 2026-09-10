import { SerialNumber, SerialStatus } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const serialService = {
  async getSerialNumbers(tenantId: string, productId?: string): Promise<SerialNumber[]> {
    return mockStore.getSerialNumbers(tenantId, productId);
  },

  async registerSerialNumber(
    tenantId: string,
    data: Omit<SerialNumber, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SerialNumber> {
    return mockStore.registerSerialNumber(tenantId, data);
  },

  async createSerialNumber(
    tenantId: string,
    data: Omit<SerialNumber, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SerialNumber> {
    return this.registerSerialNumber(tenantId, data);
  },

  async updateSerialStatus(
    tenantId: string,
    id: string,
    status: SerialStatus,
    assignedCustomer?: string
  ): Promise<SerialNumber> {
    return mockStore.updateSerialStatus(tenantId, id, status, assignedCustomer);
  }
};
