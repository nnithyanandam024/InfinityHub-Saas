import { User, Role } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

export const userService = {
  async getTenantUsers(tenantId: string): Promise<User[]> {
    return mockStore.getTenantUsers(tenantId);
  },

  async getAllUsers(): Promise<User[]> {
    return mockStore.getAllUsers();
  },

  async inviteUser(tenantId: string, data: { name: string; email: string; role: Role; password?: string }): Promise<User> {
    return mockStore.inviteTenantUser(tenantId, data);
  },

  async updateUser(tenantId: string, userId: string, data: Partial<User>): Promise<User> {
    return mockStore.updateTenantUser(tenantId, userId, data);
  },

  async deleteUser(tenantId: string, userId: string, requesterUserId?: string): Promise<void> {
    return mockStore.deleteTenantUser(tenantId, userId, requesterUserId);
  }
};
