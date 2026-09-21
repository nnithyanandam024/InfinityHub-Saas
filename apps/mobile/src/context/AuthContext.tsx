import React, { createContext, useContext, useState } from 'react';
import { Role } from '@infinityhub/types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  tenantName: string;
}

export interface DemoPersona {
  key: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  tenantId: string;
  tenantName: string;
  appId: 'inventory' | 'pos' | 'restaurant';
  appLabel: string;
  icon: 'package' | 'cart' | 'utensils';
  accentColor: string;
  description: string;
  features: string[];
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    key: 'abc-supermarket-owner',
    name: 'Rajesh Sharma',
    email: 'rajesh@abcsupermarket.in',
    role: 'TENANT_OWNER',
    roleLabel: 'Store Owner',
    tenantId: 'tenant-abc-supermarket',
    tenantName: 'ABC Supermarket',
    appId: 'inventory',
    appLabel: 'Inventory Management',
    icon: 'package',
    accentColor: '#2563EB',
    description: 'FMCG & grocery stock, purchase orders, and supplier catalogs',
    features: ['Multi-unit inventory', 'Purchase receipts', 'Barcode lookup', 'Stocktake audits']
  },
  {
    key: 'city-retail-owner',
    name: 'Arvind Singhal',
    email: 'arvind@cityretailtools.com',
    role: 'TENANT_OWNER',
    roleLabel: 'Store Owner',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    appId: 'pos',
    appLabel: 'Billing & POS',
    icon: 'cart',
    accentColor: '#4F46E5',
    description: 'High-speed barcode checkout, cash drawer shifts, and tax invoices',
    features: ['Rapid barcode POS', 'Cash / UPI / Card / Khata', 'Daily register shifts', 'Sales returns']
  },
  {
    key: 'xyz-restaurant-owner',
    name: 'Chef Rahul Kapoor',
    email: 'rahul@xyzbistro.com',
    role: 'TENANT_OWNER',
    roleLabel: 'Executive Chef & Owner',
    tenantId: 'tenant-xyz-restaurant',
    tenantName: 'XYZ Gourmet Bistro',
    appId: 'restaurant',
    appLabel: 'Restaurant Ops',
    icon: 'utensils',
    accentColor: '#EA580C',
    description: 'Floor tables, handheld Captain Pad, Kitchen Display System, and 86 menu control',
    features: ['Floor sections & tables', 'Captain Order Pad (KOT)', 'Kitchen bump bar (KDS)', 'Manager PIN voids']
  },
  {
    key: 'kumar-owner',
    name: 'Kumar Store Owner',
    email: 'owner@kumarstores.in',
    role: 'TENANT_OWNER',
    roleLabel: 'Store Owner',
    tenantId: 'tenant-kumar-stores',
    tenantName: 'Kumar Stores',
    appId: 'inventory',
    appLabel: 'Inventory Management',
    icon: 'package',
    accentColor: '#2563EB',
    description: 'General retail store management, catalog CRUD, and margins',
    features: ['Stock adjustment', 'Valuation reports', 'Product pricing']
  },
  {
    key: 'city-retail-cashier',
    name: 'Dinesh Kumar',
    email: 'cashier@cityretailtools.com',
    role: 'STAFF',
    roleLabel: 'Store Cashier',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    appId: 'pos',
    appLabel: 'Billing & POS',
    icon: 'cart',
    accentColor: '#4F46E5',
    description: 'Checkout desk, register shifts, and customer receipts',
    features: ['Fast checkout', 'Shift closing']
  },
  {
    key: 'xyz-restaurant-captain',
    name: 'Captain Suresh',
    email: 'suresh.captain@xyzbistro.com',
    role: 'STAFF',
    roleLabel: 'Floor Captain',
    tenantId: 'tenant-xyz-restaurant',
    tenantName: 'XYZ Gourmet Bistro',
    appId: 'restaurant',
    appLabel: 'Restaurant Ops',
    icon: 'utensils',
    accentColor: '#EA580C',
    description: 'Table seating, taking guest orders, and firing KOTs',
    features: ['Quick seat', 'KOT dispatching']
  }
];

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  loginAsPersona: (personaKey: string) => void;
  logout: () => void;
  updateUserTenant: (tenantId: string, tenantName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with unauthenticated user so login screen and 1-tap sample store accounts are displayed
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (email: string, _pass: string): boolean => {
    const emailNorm = email.trim().toLowerCase();
    const persona = DEMO_PERSONAS.find(p => {
      const pEmail = p.email.toLowerCase();
      if (pEmail === emailNorm) return true;
      if (emailNorm === 'owner@abcsupermarket.com' && p.key === 'abc-supermarket-owner') return true;
      if (emailNorm === 'city@retail.com' && p.key === 'city-retail-owner') return true;
      if (emailNorm === 'contact@xyzbistro.com' && p.key === 'xyz-restaurant-owner') return true;
      return false;
    });

    if (persona) {
      setUser({
        id: persona.key,
        name: persona.name,
        email: persona.email,
        role: persona.role,
        tenantId: persona.tenantId,
        tenantName: persona.tenantName
      });
      return true;
    }

    if (emailNorm.includes('restaurant') || emailNorm.includes('bistro')) {
      setUser({
        id: 'usr-custom-restaurant',
        name: 'Restaurant Operator',
        email,
        role: 'TENANT_OWNER',
        tenantId: 'tenant-xyz-restaurant',
        tenantName: 'XYZ Gourmet Bistro'
      });
      return true;
    }

    if (emailNorm.includes('pos') || emailNorm.includes('retail')) {
      setUser({
        id: 'usr-custom-pos',
        name: 'POS Operator',
        email,
        role: 'TENANT_OWNER',
        tenantId: 'tenant-city-retail',
        tenantName: 'City Retail Hardware'
      });
      return true;
    }

    return false;
  };

  const loginAsPersona = (personaKey: string) => {
    const persona = DEMO_PERSONAS.find(p => p.key === personaKey) || DEMO_PERSONAS[0];
    setUser({
      id: persona.key,
      name: persona.name,
      email: persona.email,
      role: persona.role,
      tenantId: persona.tenantId,
      tenantName: persona.tenantName
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserTenant = (tenantId: string, tenantName: string) => {
    if (user) {
      setUser({ ...user, tenantId, tenantName });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginAsPersona,
        logout,
        updateUserTenant
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
