import { Role } from '@infinityhub/types';

export function canViewCosts(role?: Role): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER';
}

export function canEditProducts(role?: Role): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER';
}

export function canAdjustStock(role?: Role): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER' || role === 'STAFF';
}

export function canManageSettings(role?: Role): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER';
}

export function isSuperAdmin(role?: Role): boolean {
  return role === 'SUPER_ADMIN';
}
