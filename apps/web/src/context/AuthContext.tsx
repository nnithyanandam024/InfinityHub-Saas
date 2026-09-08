import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Permission, AuthScope } from '@infinityhub/types';
import { authService } from '../services/authService';
import { ROLE_PERMISSIONS, ROLE_SCOPES } from '@infinityhub/constants';

interface AuthContextType {
  user: User | null;
  role: Role;
  scope: AuthScope;
  isPlatformScope: boolean;
  isTenantScope: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  switchRole: (role: Role, tenantId?: string) => Promise<void>;
  login: (email: string, password?: string, role?: Role) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then(u => setUser(u))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const role: Role = user?.role || 'STAFF';
  const scope: AuthScope = user?.scope || ROLE_SCOPES[role] || 'tenant';
  const isPlatformScope = scope === 'platform';
  const isTenantScope = scope === 'tenant';

  // ZERO-TRUST PERMISSION EVALUATION: Strict role-permission match without wildcards
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const switchRole = async (newRole: Role, tenantId?: string) => {
    setIsLoading(true);
    try {
      const updated = await authService.switchRole(newRole, tenantId || user?.tenantId);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string, targetRole?: Role) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(email, password, targetRole);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user currently logged in');
    await authService.changePassword(user.id, currentPassword, newPassword);
    setUser({ ...user, password: newPassword });
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        scope,
        isPlatformScope,
        isTenantScope,
        isLoading,
        hasPermission,
        switchRole,
        login,
        changePassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
