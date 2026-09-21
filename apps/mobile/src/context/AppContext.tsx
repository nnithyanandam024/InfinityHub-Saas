import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTenant } from './TenantContext';

export type AppId = 'inventory' | 'pos' | 'restaurant' | 'app_catalog' | 'platform_admin';

export interface SuiteApp {
  id: AppId;
  name: string;
  tagline: string;
  status: 'active' | 'ready' | 'preview' | 'locked';
  icon: 'package' | 'cart' | 'store' | 'shield' | 'utensils';
  description: string;
  isLicensed?: boolean;
}

export const SUITE_APPS: SuiteApp[] = [
  {
    id: 'inventory',
    name: 'Inventory Management',
    tagline: 'Stock control, barcodes & warehouses',
    status: 'active',
    icon: 'package',
    description: 'Track SKU catalog, low-stock reorders, batch expiration, and physical audit counts.',
    isLicensed: true
  },
  {
    id: 'pos',
    name: 'Billing & POS',
    tagline: 'Retail barcode checkout',
    status: 'ready',
    icon: 'cart',
    description: 'Fast register checkout, digital receipt generation, and payment handling.',
    isLicensed: true
  },
  {
    id: 'restaurant',
    name: 'Restaurant Ops',
    tagline: 'Table management, Captain Pad & KDS',
    status: 'ready',
    icon: 'utensils',
    description: 'Visual floor plan, handheld captain order pad, kitchen line display, and table settlement.',
    isLicensed: true
  },
  {
    id: 'app_catalog',
    name: 'App Marketplace',
    tagline: 'Explore business suites',
    status: 'preview',
    icon: 'store',
    description: 'Discover Restaurant Management, HR/Payroll, and Appointment booking modules.',
    isLicensed: false
  }
];

interface AppContextType {
  activeAppId: AppId;
  activeApp: SuiteApp;
  switchApp: (appId: AppId) => void;
  availableApps: SuiteApp[];
  isPosLicensed: boolean;
  isRestaurantLicensed: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();
  const isPosLicensed = tenant?.applicationId === 'pos';
  const isRestaurantLicensed = tenant?.applicationId === 'restaurant';

  const [activeAppId, setActiveAppId] = useState<AppId>(() => (
    isRestaurantLicensed ? 'restaurant' : isPosLicensed ? 'pos' : 'inventory'
  ));

  useEffect(() => {
    if (tenant?.applicationId === 'restaurant') {
      setActiveAppId('restaurant');
    } else if (tenant?.applicationId === 'pos') {
      setActiveAppId('pos');
    } else if (tenant?.applicationId === 'inventory') {
      setActiveAppId('inventory');
    }
  }, [tenant?.applicationId]);

  const switchApp = (appId: AppId) => {
    if (appId === 'pos' && !isPosLicensed) {
      Alert.alert(
        'License Required',
        `Your active workspace (${tenant?.name || 'Store'}) is licensed for Inventory Management. Billing & POS counter is not included in this plan.`
      );
      return;
    }
    setActiveAppId(appId);
  };

  const availableApps: SuiteApp[] = useMemo(() => [
    {
      id: 'inventory',
      name: 'Inventory Management',
      tagline: isPosLicensed ? 'Included with Billing & POS' : 'Stock control, barcodes & warehouses',
      status: activeAppId === 'inventory' ? 'active' : 'ready',
      icon: 'package',
      description: 'Track SKU catalog, low-stock reorders, batch expiration, and physical audit counts.',
      isLicensed: true
    },
    {
      id: 'pos',
      name: 'Billing & POS',
      tagline: isPosLicensed ? 'Retail barcode checkout' : 'Requires POS Subscription',
      status: isPosLicensed ? (activeAppId === 'pos' ? 'active' : 'ready') : 'locked',
      icon: 'cart',
      description: isPosLicensed
        ? 'Fast register checkout, digital receipt generation, and payment handling.'
        : 'Billing counter is not included in Inventory Management. Upgrade to Billing & POS to unlock.',
      isLicensed: isPosLicensed
    },
    {
      id: 'restaurant',
      name: 'Restaurant Ops',
      tagline: isRestaurantLicensed ? 'Table management, Captain Pad & KDS' : 'Requires Restaurant Subscription',
      status: isRestaurantLicensed ? (activeAppId === 'restaurant' ? 'active' : 'ready') : 'locked',
      icon: 'utensils',
      description: isRestaurantLicensed
        ? 'Visual floor plan, handheld captain order pad, kitchen line display, and table settlement.'
        : 'Restaurant management is not enabled for this workspace.',
      isLicensed: isRestaurantLicensed
    },
    {
      id: 'app_catalog',
      name: 'App Marketplace',
      tagline: 'Explore business suites',
      status: 'preview',
      icon: 'store',
      description: 'Discover Restaurant Management, HR/Payroll, and Appointment booking modules.',
      isLicensed: false
    }
  ], [isPosLicensed, isRestaurantLicensed, activeAppId]);

  const activeApp = availableApps.find(a => a.id === activeAppId) || availableApps[0];

  return (
    <AppContext.Provider
      value={{
        activeAppId,
        activeApp,
        switchApp,
        availableApps,
        isPosLicensed,
        isRestaurantLicensed
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

