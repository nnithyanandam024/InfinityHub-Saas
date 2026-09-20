import React from 'react';
import { Tenant, Product, Category, Brand, Supplier, StockMovement } from '@infinityhub/types';
import { TenantData } from '../../../web/src/data/initialData';
interface TenantContextType {
    activeTenantId: string;
    tenantData: TenantData;
    tenant: Tenant;
    products: Product[];
    categories: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    stockMovements: StockMovement[];
    currencySymbol: string;
    formatPrice: (amount: number) => string;
    switchTenant: (tenantId: string) => void;
    updateProductStock: (productId: string, newStock: number, reason: string) => void;
    addProduct: (newProduct: Partial<Product>) => Product;
    updateProduct: (productId: string, updates: Partial<Product>) => void;
    deleteProduct: (productId: string) => void;
    addCategory: (name: string, description?: string) => Category;
    updateCategory: (categoryId: string, updates: Partial<Category>) => void;
    deleteCategory: (categoryId: string) => void;
    availableTenants: {
        id: string;
        name: string;
        planName: string;
        productCount: number;
        category: string;
    }[];
}
export declare const TenantProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useTenant: () => TenantContextType;
export {};
//# sourceMappingURL=TenantContext.d.ts.map