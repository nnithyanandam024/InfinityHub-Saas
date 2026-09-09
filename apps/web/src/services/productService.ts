import { Product, ProductVariant } from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { mockStore } from '../data/mockStore';

export const productService = {
  async getProducts(tenantId: string): Promise<Product[]> {
    try {
      return await apiClient.inventory.getProducts(tenantId);
    } catch {
      return mockStore.getProducts(tenantId);
    }
  },

  async getProductById(tenantId: string, productId: string): Promise<Product | null> {
    try {
      const prods = await apiClient.inventory.getProducts(tenantId);
      const found = prods.find((p: Product) => p.id === productId);
      if (found) return found;
      return mockStore.getProduct(tenantId, productId) || null;
    } catch {
      const p = mockStore.getProduct(tenantId, productId);
      return p || null;
    }
  },

  async createProduct(
    tenantId: string,
    productData: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    variants?: Omit<ProductVariant, 'id' | 'tenantId' | 'productId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Product> {
    try {
      const created = await apiClient.inventory.createProduct(tenantId, productData);
      try { mockStore.addProduct(tenantId, productData, variants); } catch {}
      return created;
    } catch {
      return mockStore.addProduct(tenantId, productData, variants);
    }
  },

  async updateProduct(
    tenantId: string,
    productId: string,
    updates: Partial<Product>,
    variants?: Omit<ProductVariant, 'id' | 'tenantId' | 'productId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Product> {
    try {
      const updated = await apiClient.inventory.updateProduct(tenantId, productId, updates);
      try { mockStore.updateProduct(tenantId, productId, updates, variants); } catch {}
      return updated;
    } catch {
      return mockStore.updateProduct(tenantId, productId, updates, variants);
    }
  },

  async getProductVariants(tenantId: string, productId: string): Promise<ProductVariant[]> {
    return mockStore.getProductVariants(tenantId, productId);
  },

  async archiveProduct(tenantId: string, productId: string): Promise<Product> {
    return this.updateProduct(tenantId, productId, { status: 'archived' });
  },

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    try {
      await apiClient.inventory.deleteProduct(tenantId, productId);
      try { mockStore.deleteProduct(tenantId, productId); } catch {}
    } catch {
      mockStore.deleteProduct(tenantId, productId);
    }
  }
};
