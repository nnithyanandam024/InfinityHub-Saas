import { Permission, AuthScope } from './auth';

export type Role = 'SUPER_ADMIN' | 'TENANT_OWNER' | 'MANAGER' | 'STAFF';

export type UserStatus = 'active' | 'inactive' | 'invited';

export interface User {
  id: string;
  tenantId?: string; // Present only for Tenant Scope users; undefined for Platform Super Admin
  scope: AuthScope;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  password?: string;
  permissions: Permission[];
  createdAt: string;
  lastLoginAt?: string;
}

export * from './auth';
