import type { Tenant, TenantMobileBranding, ApplicationId } from '@infinityhub/types';
export declare class ApkBuilderService {
    /**
     * Get default branding for a tenant if not yet configured
     */
    static getDefaultBranding(tenant: Tenant): TenantMobileBranding;
    /**
     * Get path to the tenant's compiled APK file
     */
    static getApkFilePath(tenantId: string): string | null;
    /**
     * Builds or regenerates the tenant's branded Android APK
     */
    static buildBrandedApk(tenant: Tenant, options: {
        appName?: string;
        shortName?: string;
        logoUrl?: string;
        primaryColor?: string;
        accentColor?: string;
        appSuite?: ApplicationId;
    }): Promise<TenantMobileBranding>;
}
//# sourceMappingURL=apkBuilderService.d.ts.map