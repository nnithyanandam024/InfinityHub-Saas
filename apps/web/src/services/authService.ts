import { User, Role } from '@infinityhub/types';
import { mockStore } from '../data/mockStore';

const AUTH_USER_KEY = 'infinityhub_auth_user_v2';
const ACTIVE_TENANT_KEY = 'infinityhub_active_tenant';

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, value); } catch { /* ignore */ }
    }
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  }
};

export const authService = {
  async getCurrentUser(): Promise<User> {
    const saved = safeStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default to ABC Supermarket Owner (Tenant Scope)
    const defaultUser = mockStore.getTenantUsers('tenant-abc-supermarket')[0];
    safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  async login(email: string, password?: string, role?: Role): Promise<User> {
    const emailNorm = email.trim().toLowerCase();
    if (role === 'SUPER_ADMIN' || emailNorm === 'admin@infinityhub.io') {
      const superAdmin = mockStore.getSuperAdmin();
      const storedPassword = superAdmin.password || 'password123';
      if (password && password !== storedPassword) {
        throw new Error('Invalid email or password');
      }
      safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(superAdmin));
      safeStorage.removeItem(ACTIVE_TENANT_KEY); // Super admin has no tenant
      return superAdmin;
    }

    const tenants = mockStore.getTenants();
    for (const t of tenants) {
      const users = mockStore.getTenantUsers(t.id);
      const found = users.find(u => u.email.toLowerCase() === emailNorm);
      if (found) {
        const storedPassword = found.password || 'password123';
        if (password && password !== storedPassword) {
          throw new Error('Invalid email or password');
        }
        safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(found));
        safeStorage.setItem(ACTIVE_TENANT_KEY, t.id);
        return found;
      }
    }

    throw new Error('Invalid email or password');
  },

  async resetPassword(email: string, newPassword: string): Promise<void> {
    mockStore.resetUserPasswordByEmail(email, newPassword);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    mockStore.updateUserPassword(userId, currentPassword, newPassword);
    const saved = safeStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === userId) {
          parsed.password = newPassword;
          safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }
    }
  },

  async switchRole(role: Role, tenantId?: string): Promise<User> {
    const currentUserStr = safeStorage.getItem(AUTH_USER_KEY);
    let currentUser: User | null = null;
    try {
      if (currentUserStr) currentUser = JSON.parse(currentUserStr);
    } catch {
      // ignore
    }

    if (role === 'SUPER_ADMIN') {
      const superAdmin = mockStore.getSuperAdmin();
      safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(superAdmin));
      safeStorage.removeItem(ACTIVE_TENANT_KEY);
      return superAdmin;
    }

    const targetTenantId = currentUser?.tenantId || tenantId || safeStorage.getItem(ACTIVE_TENANT_KEY) || 'tenant-abc-supermarket';
    const users = mockStore.getTenantUsers(targetTenantId);
    const matched = users.find(u => u.role === role) || users[0];
    safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(matched));
    safeStorage.setItem(ACTIVE_TENANT_KEY, targetTenantId);
    return matched;
  },

  async logout(): Promise<void> {
    safeStorage.removeItem(AUTH_USER_KEY);
    safeStorage.removeItem(ACTIVE_TENANT_KEY);
  }
};
