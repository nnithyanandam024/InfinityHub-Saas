import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '@infinityhub/api-client';
import { INITIAL_TENANTS_MAP } from '../../../web/src/data/initialData';
import { useAuth } from './AuthContext';
const TenantContext = createContext(undefined);
export const TenantProvider = ({ children }) => {
    const { user } = useAuth();
    // Strictly bind active tenant to the authenticated user
    const activeTenantId = user?.tenantId || 'tenant-kumar-stores';
    const [tenantsState, setTenantsState] = useState(INITIAL_TENANTS_MAP);
    // Sync with Backend API Server
    const fetchStoreData = useCallback(async () => {
        try {
            const data = await apiClient.inventory.getStoreData(activeTenantId);
            if (data && data.products) {
                setTenantsState(prev => ({
                    ...prev,
                    [activeTenantId]: {
                        ...prev[activeTenantId],
                        tenant: data.tenant || prev[activeTenantId]?.tenant,
                        products: data.products || [],
                        categories: data.categories || [],
                        brands: data.brands || [],
                        suppliers: data.suppliers || [],
                        purchases: data.purchases || [],
                        stockMovements: data.stockMovements || []
                    }
                }));
            }
        }
        catch {
            // Fallback to local store if offline
        }
    }, [activeTenantId]);
    // Initial load
    useEffect(() => {
        fetchStoreData();
    }, [fetchStoreData]);
    // Real-Time Synchronization Subscription (Web -> Mobile & Mobile -> Web)
    useEffect(() => {
        const unsubscribe = apiClient.subscribeToTenantSync(activeTenantId, (_event) => {
            // When any entity is created, updated, deleted, or adjusted on Web, re-sync Mobile immediately
            fetchStoreData();
        });
        return () => {
            unsubscribe();
        };
    }, [activeTenantId, fetchStoreData]);
    const tenantData = useMemo(() => {
        return tenantsState[activeTenantId] || tenantsState['tenant-kumar-stores'] || Object.values(tenantsState)[0];
    }, [tenantsState, activeTenantId]);
    const currencySymbol = tenantData.tenant.settings?.currencySymbol || '₹';
    const formatPrice = (amount) => {
        return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
    };
    const switchTenant = (_tenantId) => {
        // Disabled in production: tenant is strictly bound to user session
    };
    const updateProductStock = (productId, newStock, reason) => {
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            const productIndex = current.products.findIndex(p => p.id === productId);
            if (productIndex === -1)
                return prev;
            const oldStock = current.products[productIndex].stockQuantity;
            const updatedProducts = [...current.products];
            updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                stockQuantity: newStock,
                updatedAt: new Date().toISOString()
            };
            const newMovement = {
                id: `mov-${Date.now()}`,
                tenantId: activeTenantId,
                productId,
                productName: updatedProducts[productIndex].name,
                type: newStock > oldStock ? 'adjustment_increase' : 'adjustment_decrease',
                quantityChange: newStock - oldStock,
                previousStock: oldStock,
                newStock,
                reason,
                performedByUserId: 'usr-mobile-operator',
                performedByUserName: 'Store Staff',
                createdAt: new Date().toISOString()
            };
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    products: updatedProducts,
                    stockMovements: [newMovement, ...current.stockMovements]
                }
            };
        });
        // 2. Transmit to Shared API Server (broadcasts to Web in real-time)
        apiClient.inventory.adjustStock(activeTenantId, productId, newStock, reason).catch(() => { });
    };
    const addProduct = (newProductData) => {
        const newProduct = {
            id: `prod-${Date.now()}`,
            tenantId: activeTenantId,
            name: newProductData.name || 'Untitled Product',
            sku: newProductData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            barcode: newProductData.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
            categoryId: newProductData.categoryId || (tenantData.categories[0]?.id || 'cat-1'),
            categoryName: newProductData.categoryName || (tenantData.categories[0]?.name || 'General'),
            brandId: newProductData.brandId,
            brandName: newProductData.brandName,
            unit: newProductData.unit || 'pcs',
            costPrice: Number(newProductData.costPrice) || 0,
            sellingPrice: Number(newProductData.sellingPrice) || 0,
            stockQuantity: Number(newProductData.stockQuantity) || 0,
            minimumStock: Number(newProductData.minimumStock) || 5,
            reorderQuantity: Number(newProductData.reorderQuantity) || 20,
            imagePath: newProductData.imagePath || newProductData.thumbnailPath,
            thumbnailPath: newProductData.thumbnailPath || newProductData.imagePath,
            hasVariants: false,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    products: [newProduct, ...current.products]
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.createProduct(activeTenantId, newProduct).catch(() => { });
        return newProduct;
    };
    const updateProduct = (productId, updates) => {
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    products: current.products.map(p => p.id === productId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.updateProduct(activeTenantId, productId, updates).catch(() => { });
    };
    const deleteProduct = (productId) => {
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    products: current.products.filter(p => p.id !== productId)
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.deleteProduct(activeTenantId, productId).catch(() => { });
    };
    const addCategory = (name, description) => {
        const newCat = {
            id: `cat-${Date.now()}`,
            tenantId: activeTenantId,
            name,
            description: description || '',
            productCount: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    categories: [...current.categories, newCat]
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.createCategory(activeTenantId, { name, description }).catch(() => { });
        return newCat;
    };
    const updateCategory = (categoryId, updates) => {
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    categories: current.categories.map(c => c.id === categoryId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.updateCategory(activeTenantId, categoryId, updates).catch(() => { });
    };
    const deleteCategory = (categoryId) => {
        // 1. Optimistic Local Update
        setTenantsState(prev => {
            const current = prev[activeTenantId];
            if (!current)
                return prev;
            return {
                ...prev,
                [activeTenantId]: {
                    ...current,
                    categories: current.categories.filter(c => c.id !== categoryId)
                }
            };
        });
        // 2. Transmit to Shared API Server
        apiClient.inventory.deleteCategory(activeTenantId, categoryId).catch(() => { });
    };
    const availableTenants = useMemo(() => {
        return Object.values(tenantsState).map(t => ({
            id: t.tenant.id,
            name: t.tenant.name,
            planName: t.tenant.planName || 'Standard',
            productCount: t.products.length,
            category: t.tenant.category || t.tenant.industry || 'Retail'
        }));
    }, [tenantsState]);
    const value = {
        activeTenantId,
        tenantData,
        tenant: tenantData.tenant,
        products: tenantData.products,
        categories: tenantData.categories,
        brands: tenantData.brands || [],
        suppliers: tenantData.suppliers,
        stockMovements: tenantData.stockMovements,
        currencySymbol,
        formatPrice,
        switchTenant,
        updateProductStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        availableTenants
    };
    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
//# sourceMappingURL=TenantContext.js.map