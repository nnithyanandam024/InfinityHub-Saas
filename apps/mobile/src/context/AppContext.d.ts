import React from 'react';
export type AppId = 'inventory' | 'pos' | 'app_catalog' | 'platform_admin';
export interface SuiteApp {
    id: AppId;
    name: string;
    tagline: string;
    status: 'active' | 'ready' | 'preview' | 'locked';
    icon: 'package' | 'cart' | 'store' | 'shield';
    description: string;
    isLicensed?: boolean;
}
export declare const SUITE_APPS: SuiteApp[];
interface AppContextType {
    activeAppId: AppId;
    activeApp: SuiteApp;
    switchApp: (appId: AppId) => void;
    availableApps: SuiteApp[];
    isPosLicensed: boolean;
}
export declare const AppProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useApp: () => AppContextType;
export {};
//# sourceMappingURL=AppContext.d.ts.map