import React, { createContext, useContext, useState } from 'react';

export type AppId = 'inventory' | 'pos' | 'app_catalog' | 'platform_admin';

export interface SuiteApp {
  id: AppId;
  name: string;
  tagline: string;
  status: 'active' | 'ready' | 'preview';
  icon: 'package' | 'cart' | 'store' | 'shield';
  description: string;
}

export const SUITE_APPS: SuiteApp[] = [
  {
    id: 'inventory',
    name: 'Inventory Management',
    tagline: 'Stock control, barcodes & warehouses',
    status: 'active',
    icon: 'package',
    description: 'Track SKU catalog, low-stock reorders, batch expiration, and physical audit counts.'
  },
  {
    id: 'pos',
    name: 'Billing & POS',
    tagline: 'Retail barcode checkout',
    status: 'ready',
    icon: 'cart',
    description: 'Fast register checkout, digital receipt generation, and payment handling.'
  },
  {
    id: 'app_catalog',
    name: 'App Marketplace',
    tagline: 'Explore business suites',
    status: 'preview',
    icon: 'store',
    description: 'Discover Restaurant Management, HR/Payroll, and Appointment booking modules.'
  }
];

interface AppContextType {
  activeAppId: AppId;
  activeApp: SuiteApp;
  switchApp: (appId: AppId) => void;
  availableApps: SuiteApp[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAppId, setActiveAppId] = useState<AppId>('inventory');

  const activeApp =
    SUITE_APPS.find(a => a.id === activeAppId) || SUITE_APPS[0];

  const switchApp = (appId: AppId) => {
    setActiveAppId(appId);
  };

  return (
    <AppContext.Provider
      value={{
        activeAppId,
        activeApp,
        switchApp,
        availableApps: SUITE_APPS
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
