import {
  Tenant,
  TenantMobileBranding,
  User,
  Role,
  Product,
  Category,
  Supplier,
  Purchase,
  StockMovement,
  Plan,
  Module,
  TenantUsageMetadata,
  Brand,
  ProductVariant,
  ProductBundle,
  Warehouse,
  WarehouseLocation,
  StockBalance,
  StockTransfer,
  StockTransferItem,
  Batch,
  SerialNumber,
  SerialStatus,
  StocktakeSession,
  ReorderRule,
  PurchaseSuggestion,
  ForecastingReport,
  RestaurantSection,
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantOrder,
  RestaurantKot,
  RestaurantRecipe,
  RestaurantWasteLog,
  TableTransferAudit,
  KotItemStatus,
  CreateRestaurantSectionPayload,
  UpdateRestaurantSectionPayload,
  CreateRestaurantTablePayload,
  UpdateRestaurantTablePayload,
  BatchCreateTablesPayload,
  CreateRestaurantMenuItemPayload,
  UpdateRestaurantMenuItemPayload
} from '@infinityhub/types';
import { BulkImportRowData } from '@infinityhub/validation';
import { INITIAL_TENANTS_MAP, MOCK_PLANS, MOCK_SUPER_ADMIN_USER, TenantData } from './initialData';
import { PLATFORM_MODULES, ROLE_PERMISSIONS } from '@infinityhub/constants';

const STORAGE_KEY = 'infinityhub_saas_v6_full_architecture';

export class AccessBoundaryViolationError extends Error {
  constructor(message = 'Access Denied: Platform Super Admin is strictly prohibited from accessing customer private business data.') {
    super(message);
    this.name = 'AccessBoundaryViolationError';
  }
}

class MockDataStore {
  private data: Record<string, TenantData>;
  private superAdmin: User;
  private plans: Plan[];
  private modules: Module[];

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = parsed.data || INITIAL_TENANTS_MAP;
        this.superAdmin = parsed.superAdmin || MOCK_SUPER_ADMIN_USER;
        this.plans = parsed.plans || MOCK_PLANS;
        this.modules = parsed.modules || PLATFORM_MODULES;
        if (!this.data['tenant-xyz-restaurant']?.restaurantSections?.length) {
          this.data['tenant-xyz-restaurant'] = JSON.parse(JSON.stringify(INITIAL_TENANTS_MAP['tenant-xyz-restaurant']));
          this.persist();
        }
        return;
      } catch (e) {
        console.error('Failed to parse cached store, re-initializing defaults', e);
      }
    }

    this.data = JSON.parse(JSON.stringify(INITIAL_TENANTS_MAP));
    this.superAdmin = JSON.parse(JSON.stringify(MOCK_SUPER_ADMIN_USER));
    this.plans = JSON.parse(JSON.stringify(MOCK_PLANS));
    this.modules = JSON.parse(JSON.stringify(PLATFORM_MODULES));
    this.persist();
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: this.data,
        superAdmin: this.superAdmin,
        plans: this.plans,
        modules: this.modules
      }));
    }
  }

  public resetAll() {
    this.data = JSON.parse(JSON.stringify(INITIAL_TENANTS_MAP));
    this.superAdmin = JSON.parse(JSON.stringify(MOCK_SUPER_ADMIN_USER));
    this.plans = JSON.parse(JSON.stringify(MOCK_PLANS));
    this.modules = JSON.parse(JSON.stringify(PLATFORM_MODULES));
    this.persist();
  }

  // ==========================================================
  // PLATFORM SCOPE METHODS (Accessible to Super Admin)
  // ==========================================================

  /**
   * Super Admin retrieves tenant directory with usage quota telemetry only.
   * Private business records (products, purchases, suppliers) are never included.
   */
  public getTenants(): Tenant[] {
    return Object.values(this.data).map(t => {
      // Dynamically calculate live usage metadata
      const usage: TenantUsageMetadata = {
        productsCount: t.products.length,
        maxProductsQuota: t.tenant.usage?.maxProductsQuota || 5000,
        usersCount: t.users.length,
        maxUsersQuota: t.tenant.usage?.maxUsersQuota || 10,
        storageUsedMb: Math.max(5, t.products.length * 2 + t.purchases.length * 3),
        maxStorageQuotaMb: t.tenant.usage?.maxStorageQuotaMb || 1024,
        lastActiveAt: t.tenant.usage?.lastActiveAt || t.tenant.updatedAt
      };

      return {
        ...t.tenant,
        usage
      };
    });
  }

  public getTenant(tenantId: string): Tenant | undefined {
    const t = this.data[tenantId];
    if (!t) return undefined;
    return {
      ...t.tenant,
      usage: {
        productsCount: t.products.length,
        maxProductsQuota: t.tenant.usage?.maxProductsQuota || 5000,
        usersCount: t.users.length,
        maxUsersQuota: t.tenant.usage?.maxUsersQuota || 10,
        storageUsedMb: Math.max(5, t.products.length * 2 + t.purchases.length * 3),
        maxStorageQuotaMb: t.tenant.usage?.maxStorageQuotaMb || 1024,
        lastActiveAt: t.tenant.usage?.lastActiveAt || t.tenant.updatedAt
      }
    };
  }

  public updateTenantPlatformSettings(tenantId: string, updates: Partial<Tenant>): Tenant {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);
    t.tenant = {
      ...t.tenant,
      status: updates.status || t.tenant.status,
      planId: updates.planId || t.tenant.planId,
      planName: updates.planName || t.tenant.planName,
      applicationId: updates.applicationId || t.tenant.applicationId,
      applicationName: updates.applicationName || t.tenant.applicationName,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return t.tenant;
  }

  public provisionTenant(payload: {
    name: string;
    ownerName: string;
    email: string;
    phone: string;
    applicationId: 'inventory' | 'pos' | 'restaurant' | 'employee' | 'appointment';
    applicationName?: string;
    planId: string;
    planName?: string;
    password?: string;
  }): Tenant {
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `tenant-${slug}-${Date.now()}`;
    const plan = this.plans.find(p => p.id === payload.planId) || this.plans[0];
    const appNames: Record<string, string> = {
      inventory: 'Inventory Management',
      pos: 'Billing & POS',
      restaurant: 'Restaurant Management',
      employee: 'Employee Management',
      appointment: 'Appointment Management'
    };

    const newTenant: Tenant = {
      id,
      name: payload.name,
      slug,
      applicationId: payload.applicationId,
      applicationName: appNames[payload.applicationId] || 'Inventory Management',
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      ownerName: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      settings: {
        currency: 'INR',
        currencySymbol: '₹',
        dateFormat: 'DD/MM/YYYY',
        timeZone: 'Asia/Kolkata',
        taxRate: 5.0,
        enableBarcodeScanning: true,
        lowStockThresholdDefault: 10
      },
      usage: {
        productsCount: 0,
        maxProductsQuota: plan.maxProducts || 5000,
        usersCount: 1,
        maxUsersQuota: plan.maxUsers || 10,
        storageUsedMb: 2,
        maxStorageQuotaMb: 1024,
        lastActiveAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const ownerUser: User = {
      id: `usr-${id}-owner`,
      tenantId: id,
      scope: 'tenant',
      name: payload.ownerName,
      email: payload.email,
      role: 'TENANT_OWNER',
      password: payload.password || 'password123',
      permissions: ROLE_PERMISSIONS['TENANT_OWNER'],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.data[id] = {
      tenant: newTenant,
      users: [ownerUser],
      categories: [
        { id: `cat-${id}-1`, tenantId: id, name: 'General Catalog', description: 'Default category', productCount: 0, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      suppliers: [
        { id: `sup-${id}-1`, tenantId: id, name: 'Main Supplier', companyName: 'National Wholesalers', phone: payload.phone, email: 'orders@supplier.com', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      products: [],
      purchases: [],
      stockMovements: [],
      brands: [],
      variants: [],
      bundles: [],
      warehouses: [
        {
          id: `wh-${id}-main`,
          tenantId: id,
          name: 'Main Distribution Center',
          code: 'WH-MAIN',
          address: 'Headquarters',
          isDefault: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      warehouseLocations: [
        { id: `loc-${id}-1`, tenantId: id, warehouseId: `wh-${id}-main`, code: 'BIN-01', name: 'General Storage Bay' }
      ],
      stockBalances: [],
      stockTransfers: [],
      batches: [],
      serialNumbers: [],
      stocktakeSessions: [],
      reorderRules: []
    };

    this.persist();
    return newTenant;
  }


  public getSuperAdmin(): User {
    return this.superAdmin;
  }

  public getPlans(): Plan[] {
    return this.plans;
  }

  public getModules(): Module[] {
    return this.modules;
  }

  // ==========================================================
  // TENANT SCOPE METHODS (Protected by Privacy Boundary)
  // Super Admin is prohibited from reading or mutating customer business data.
  // ==========================================================

  private assertTenantAccess(requesterScope?: 'platform' | 'tenant') {
    if (requesterScope === 'platform') {
      throw new AccessBoundaryViolationError(
        'Zero-Trust Violation: Platform Super Admin is prohibited from reading or mutating customer private tenant business data.'
      );
    }
  }

  private ensureTenantCollections(tenantId: string): TenantData | null {
    const tenant = this.data[tenantId];
    if (!tenant) return null;
    if (!tenant.brands) tenant.brands = [];
    if (!tenant.variants) tenant.variants = [];
    if (!tenant.bundles) tenant.bundles = [];
    if (!tenant.warehouses || tenant.warehouses.length === 0) {
      tenant.warehouses = [
        {
          id: `wh-${tenant.tenant.slug}-main`,
          tenantId,
          name: 'Main Distribution Center',
          code: 'WH-MAIN',
          address: tenant.tenant.address || 'Headquarters',
          isDefault: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    if (!tenant.warehouseLocations || tenant.warehouseLocations.length === 0) {
      tenant.warehouseLocations = [
        {
          id: `loc-${tenant.tenant.slug}-1`,
          tenantId,
          warehouseId: tenant.warehouses[0].id,
          code: 'BIN-01',
          name: 'General Storage Bay',
          description: 'Default primary storage rack'
        }
      ];
    }
    if (!tenant.stockBalances) tenant.stockBalances = [];
    if (!tenant.stockTransfers) tenant.stockTransfers = [];
    if (!tenant.batches) tenant.batches = [];
    if (!tenant.serialNumbers) tenant.serialNumbers = [];
    if (!tenant.stocktakeSessions) tenant.stocktakeSessions = [];
    if (!tenant.reorderRules) tenant.reorderRules = [];
    return tenant;
  }

  public getBrands(tenantId: string, requesterScope?: 'platform' | 'tenant'): Brand[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) return [];
    if (!tenant.brands) tenant.brands = [];
    return tenant.brands;
  }

  public addBrand(
    tenantId: string,
    brandData: Omit<Brand, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'productCount'>,
    requesterScope?: 'platform' | 'tenant'
  ): Brand {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.brands) tenant.brands = [];

    const id = `brd-${tenant.tenant.slug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newBrand: Brand = {
      ...brandData,
      id,
      tenantId,
      productCount: 0,
      createdAt: now,
      updatedAt: now
    };
    tenant.brands.unshift(newBrand);
    this.persist();
    return newBrand;
  }

  public updateBrand(
    tenantId: string,
    brandId: string,
    updates: Partial<Brand>,
    requesterScope?: 'platform' | 'tenant'
  ): Brand {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.brands) tenant.brands = [];

    const index = tenant.brands.findIndex(b => b.id === brandId);
    if (index === -1) throw new Error(`Brand ${brandId} not found`);

    tenant.brands[index] = {
      ...tenant.brands[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return tenant.brands[index];
  }

  public deleteBrand(tenantId: string, brandId: string, requesterScope?: 'platform' | 'tenant'): void {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.brands) return;

    const assignedProducts = tenant.products.filter(p => p.brandId === brandId);
    if (assignedProducts.length > 0) {
      throw new Error(`Cannot delete brand: ${assignedProducts.length} product(s) are currently associated with it. Please reassign them first.`);
    }

    tenant.brands = tenant.brands.filter(b => b.id !== brandId);
    this.persist();
  }

  public getProducts(tenantId: string, requesterScope?: 'platform' | 'tenant'): Product[] {
    this.assertTenantAccess(requesterScope);
    return this.data[tenantId]?.products || [];
  }

  public getProduct(tenantId: string, productId: string, requesterScope?: 'platform' | 'tenant'): Product | undefined {
    this.assertTenantAccess(requesterScope);
    return this.data[tenantId]?.products.find(p => p.id === productId);
  }

  public addProduct(
    tenantId: string,
    productData: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    variants?: Omit<ProductVariant, 'id' | 'tenantId' | 'productId' | 'createdAt' | 'updatedAt'>[],
    requesterScope?: 'platform' | 'tenant'
  ): Product {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.variants) tenant.variants = [];

    const id = `prod-${tenant.tenant.slug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const category = tenant.categories.find(c => c.id === productData.categoryId);
    const brand = productData.brandId && tenant.brands ? tenant.brands.find(b => b.id === productData.brandId) : undefined;

    const newProduct: Product = {
      ...productData,
      id,
      tenantId,
      categoryName: category?.name || 'Uncategorized',
      brandName: brand?.name || productData.brandName,
      createdAt: now,
      updatedAt: now
    };

    if (variants && variants.length > 0) {
      newProduct.hasVariants = true;
      for (const v of variants) {
        tenant.variants.push({
          ...v,
          id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenantId,
          productId: id,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    tenant.products.unshift(newProduct);

    if (newProduct.stockQuantity > 0) {
      tenant.stockMovements.unshift({
        id: `mov-${Date.now()}`,
        tenantId,
        productId: id,
        productName: newProduct.name,
        type: 'correction',
        quantityChange: newProduct.stockQuantity,
        previousStock: 0,
        newStock: newProduct.stockQuantity,
        reason: 'Opening stock registration',
        performedByUserId: 'usr-active',
        performedByUserName: 'Current User',
        createdAt: now
      });
    }

    if (category) {
      category.productCount = (category.productCount || 0) + 1;
    }
    if (brand) {
      brand.productCount = (brand.productCount || 0) + 1;
    }

    this.persist();
    return newProduct;
  }

  public updateProduct(
    tenantId: string,
    productId: string,
    updates: Partial<Product>,
    variants?: Omit<ProductVariant, 'id' | 'tenantId' | 'productId' | 'createdAt' | 'updatedAt'>[],
    requesterScope?: 'platform' | 'tenant'
  ): Product {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.variants) tenant.variants = [];

    const index = tenant.products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error(`Product ${productId} not found`);

    const category = updates.categoryId ? tenant.categories.find(c => c.id === updates.categoryId) : undefined;
    const brand = updates.brandId && tenant.brands ? tenant.brands.find(b => b.id === updates.brandId) : undefined;

    tenant.products[index] = {
      ...tenant.products[index],
      ...updates,
      categoryName: category ? category.name : tenant.products[index].categoryName,
      brandName: brand ? brand.name : (updates.brandName || tenant.products[index].brandName),
      updatedAt: new Date().toISOString()
    };

    if (variants) {
      tenant.variants = tenant.variants.filter(v => v.productId !== productId);
      const now = new Date().toISOString();
      for (const v of variants) {
        tenant.variants.push({
          ...v,
          id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenantId,
          productId,
          createdAt: now,
          updatedAt: now
        });
      }
      tenant.products[index].hasVariants = variants.length > 0;
    }

    this.persist();
    return tenant.products[index];
  }

  public deleteProduct(tenantId: string, productId: string, requesterScope?: 'platform' | 'tenant'): void {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const productIndex = tenant.products.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error(`Product ${productId} not found`);

    const product = tenant.products[productIndex];

    // Decrement category productCount
    if (product.categoryId) {
      const category = tenant.categories.find(c => c.id === product.categoryId);
      if (category && (category.productCount || 0) > 0) {
        category.productCount = (category.productCount || 1) - 1;
      }
    }

    // Decrement brand productCount
    if (product.brandId && tenant.brands) {
      const brand = tenant.brands.find(b => b.id === product.brandId);
      if (brand && (brand.productCount || 0) > 0) {
        brand.productCount = (brand.productCount || 1) - 1;
      }
    }

    // Remove variants if any
    if (tenant.variants) {
      tenant.variants = tenant.variants.filter(v => v.productId !== productId);
    }

    // Remove bundles where this is the parent product
    if (tenant.bundles) {
      tenant.bundles = tenant.bundles.filter(b => b.bundleProductId !== productId);
    }

    tenant.products.splice(productIndex, 1);
    if (tenant.tenant.usage) {
      tenant.tenant.usage.productsCount = tenant.products.length;
    }
    this.persist();
  }

  public getProductVariants(tenantId: string, productId: string, requesterScope?: 'platform' | 'tenant'): ProductVariant[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant || !tenant.variants) return [];
    return tenant.variants.filter(v => v.productId === productId);
  }

  public getBundles(tenantId: string, requesterScope?: 'platform' | 'tenant'): ProductBundle[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant || !tenant.bundles) return [];
    return tenant.bundles;
  }

  public getBundleByProductId(tenantId: string, bundleProductId: string, requesterScope?: 'platform' | 'tenant'): ProductBundle | null {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant || !tenant.bundles) return null;
    return tenant.bundles.find(b => b.bundleProductId === bundleProductId) || null;
  }

  public saveBundle(
    tenantId: string,
    bundleData: Omit<ProductBundle, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    requesterScope?: 'platform' | 'tenant'
  ): ProductBundle {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);
    if (!tenant.bundles) tenant.bundles = [];

    const existingIndex = tenant.bundles.findIndex(b => b.bundleProductId === bundleData.bundleProductId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      tenant.bundles[existingIndex] = {
        ...tenant.bundles[existingIndex],
        ...bundleData,
        updatedAt: now
      };
      this.persist();
      return tenant.bundles[existingIndex];
    } else {
      const newBundle: ProductBundle = {
        ...bundleData,
        id: `bdl-${tenant.tenant.slug}-${Date.now()}`,
        tenantId,
        createdAt: now,
        updatedAt: now
      };
      tenant.bundles.unshift(newBundle);

      const prod = tenant.products.find(p => p.id === bundleData.bundleProductId);
      if (prod) {
        prod.isBundle = true;
      }

      this.persist();
      return newBundle;
    }
  }

  public assembleBundle(
    tenantId: string,
    bundleId: string,
    quantity: number,
    userId: string,
    userName: string,
    requesterScope?: 'platform' | 'tenant'
  ): { bundleProduct: Product; movements: StockMovement[] } {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const bundle = tenant.bundles?.find(b => b.id === bundleId || b.bundleProductId === bundleId);
    if (!bundle) throw new Error(`Bundle ${bundleId} not found`);

    const bundleProduct = tenant.products.find(p => p.id === bundle.bundleProductId);
    if (!bundleProduct) throw new Error(`Bundle master product not found`);

    // 1. Check component stock availability
    for (const comp of bundle.components) {
      const compProd = tenant.products.find(p => p.id === comp.componentProductId);
      const required = comp.quantity * quantity;
      if (!compProd || compProd.stockQuantity < required) {
        throw new Error(
          `Insufficient stock for component ${compProd?.name || comp.sku}. Required: ${required}, Available: ${compProd?.stockQuantity || 0}`
        );
      }
    }

    const now = new Date().toISOString();
    const movements: StockMovement[] = [];

    // 2. Atomic component deduction
    for (const comp of bundle.components) {
      const compProd = tenant.products.find(p => p.id === comp.componentProductId)!;
      const prev = compProd.stockQuantity;
      const required = comp.quantity * quantity;
      const next = prev - required;
      compProd.stockQuantity = next;
      compProd.updatedAt = now;

      const mov: StockMovement = {
        id: `mov-${Date.now()}-${comp.componentProductId}-basm`,
        tenantId,
        productId: comp.componentProductId,
        productName: compProd.name,
        type: 'bundle_assembly',
        quantityChange: -required,
        previousStock: prev,
        newStock: next,
        reason: `Assembly of ${quantity} × ${bundleProduct.name} (BOM component deduction)`,
        performedByUserId: userId,
        performedByUserName: userName,
        createdAt: now
      };
      tenant.stockMovements.unshift(mov);
      movements.push(mov);
    }

    // 3. Increment parent bundle stock
    const prevBundleStock = bundleProduct.stockQuantity;
    const nextBundleStock = prevBundleStock + quantity;
    bundleProduct.stockQuantity = nextBundleStock;
    bundleProduct.updatedAt = now;

    const bundleMov: StockMovement = {
      id: `mov-${Date.now()}-${bundleProduct.id}-badd`,
      tenantId,
      productId: bundleProduct.id,
      productName: bundleProduct.name,
      type: 'bundle_assembly',
      quantityChange: quantity,
      previousStock: prevBundleStock,
      newStock: nextBundleStock,
      reason: `Assembly of ${quantity} finished bundle kits`,
      performedByUserId: userId,
      performedByUserName: userName,
      createdAt: now
    };
    tenant.stockMovements.unshift(bundleMov);
    movements.push(bundleMov);

    this.persist();
    return { bundleProduct, movements };
  }

  public disassembleBundle(
    tenantId: string,
    bundleId: string,
    quantity: number,
    userId: string,
    userName: string,
    requesterScope?: 'platform' | 'tenant'
  ): { bundleProduct: Product; movements: StockMovement[] } {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const bundle = tenant.bundles?.find(b => b.id === bundleId || b.bundleProductId === bundleId);
    if (!bundle) throw new Error(`Bundle ${bundleId} not found`);

    const bundleProduct = tenant.products.find(p => p.id === bundle.bundleProductId);
    if (!bundleProduct) throw new Error(`Bundle master product not found`);

    if (bundleProduct.stockQuantity < quantity) {
      throw new Error(`Insufficient bundle stock to disassemble. On-hand: ${bundleProduct.stockQuantity}, Requested: ${quantity}`);
    }

    const now = new Date().toISOString();
    const movements: StockMovement[] = [];

    // 1. Decrement parent bundle stock
    const prevBundleStock = bundleProduct.stockQuantity;
    const nextBundleStock = prevBundleStock - quantity;
    bundleProduct.stockQuantity = nextBundleStock;
    bundleProduct.updatedAt = now;

    const bundleMov: StockMovement = {
      id: `mov-${Date.now()}-${bundleProduct.id}-bdis`,
      tenantId,
      productId: bundleProduct.id,
      productName: bundleProduct.name,
      type: 'bundle_disassembly',
      quantityChange: -quantity,
      previousStock: prevBundleStock,
      newStock: nextBundleStock,
      reason: `Disassembly of ${quantity} finished bundle kits`,
      performedByUserId: userId,
      performedByUserName: userName,
      createdAt: now
    };
    tenant.stockMovements.unshift(bundleMov);
    movements.push(bundleMov);

    // 2. Return components to stock
    for (const comp of bundle.components) {
      const compProd = tenant.products.find(p => p.id === comp.componentProductId);
      if (compProd) {
        const prev = compProd.stockQuantity;
        const restored = comp.quantity * quantity;
        const next = prev + restored;
        compProd.stockQuantity = next;
        compProd.updatedAt = now;

        const mov: StockMovement = {
          id: `mov-${Date.now()}-${comp.componentProductId}-brst`,
          tenantId,
          productId: comp.componentProductId,
          productName: compProd.name,
          type: 'bundle_disassembly',
          quantityChange: restored,
          previousStock: prev,
          newStock: next,
          reason: `Disassembly of ${quantity} × ${bundleProduct.name} (BOM component returned to inventory)`,
          performedByUserId: userId,
          performedByUserName: userName,
          createdAt: now
        };
        tenant.stockMovements.unshift(mov);
        movements.push(mov);
      }
    }

    this.persist();
    return { bundleProduct, movements };
  }

  public adjustStock(
    tenantId: string,
    productId: string,
    adjustment: {
      adjustmentType: 'increase' | 'decrease' | 'damage' | 'correction';
      quantity: number;
      reason: string;
      userId: string;
      userName: string;
    },
    requesterScope?: 'platform' | 'tenant'
  ): { product: Product; movement: StockMovement } {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const product = tenant.products.find(p => p.id === productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const prevStock = product.stockQuantity;
    let change = adjustment.quantity;
    let movementType: StockMovement['type'] = 'adjustment_increase';

    if (adjustment.adjustmentType === 'decrease') {
      change = -Math.abs(adjustment.quantity);
      movementType = 'adjustment_decrease';
    } else if (adjustment.adjustmentType === 'damage') {
      change = -Math.abs(adjustment.quantity);
      movementType = 'damage';
    } else if (adjustment.adjustmentType === 'correction') {
      movementType = 'correction';
      change = adjustment.quantity - prevStock;
    } else {
      change = Math.abs(adjustment.quantity);
      movementType = 'adjustment_increase';
    }

    const newStock = Math.max(0, prevStock + change);
    product.stockQuantity = newStock;
    product.updatedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      tenantId,
      productId,
      productName: product.name,
      type: movementType,
      quantityChange: change,
      previousStock: prevStock,
      newStock,
      reason: adjustment.reason,
      performedByUserId: adjustment.userId,
      performedByUserName: adjustment.userName,
      createdAt: new Date().toISOString()
    };

    tenant.stockMovements.unshift(movement);
    this.persist();

    return { product, movement };
  }

  public getCategories(tenantId: string, requesterScope?: 'platform' | 'tenant'): Category[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) return [];
    return tenant.categories.map(c => ({
      ...c,
      productCount: tenant.products.filter(p => p.categoryId === c.id).length
    }));
  }

  public addCategory(
    tenantId: string,
    categoryData: Omit<Category, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'productCount'>,
    requesterScope?: 'platform' | 'tenant'
  ): Category {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const newCat: Category = {
      ...categoryData,
      id: `cat-${tenant.tenant.slug}-${Date.now()}`,
      tenantId,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tenant.categories.push(newCat);
    this.persist();
    return newCat;
  }

  public updateCategory(
    tenantId: string,
    categoryId: string,
    updates: Partial<Category>,
    requesterScope?: 'platform' | 'tenant'
  ): Category {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const index = tenant.categories.findIndex(c => c.id === categoryId);
    if (index === -1) throw new Error(`Category ${categoryId} not found`);

    tenant.categories[index] = {
      ...tenant.categories[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.name && updates.name !== tenant.categories[index].name) {
      tenant.products.forEach(p => {
        if (p.categoryId === categoryId) {
          p.categoryName = updates.name!;
        }
      });
    }

    this.persist();
    return tenant.categories[index];
  }

  public deleteCategory(tenantId: string, categoryId: string, requesterScope?: 'platform' | 'tenant'): void {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const assignedProducts = tenant.products.filter(p => p.categoryId === categoryId);
    if (assignedProducts.length > 0) {
      throw new Error(`Cannot delete category: ${assignedProducts.length} product(s) are currently assigned to it. Please reassign them first.`);
    }

    tenant.categories = tenant.categories.filter(c => c.id !== categoryId);
    this.persist();
  }

  public getSuppliers(tenantId: string, requesterScope?: 'platform' | 'tenant'): Supplier[] {
    this.assertTenantAccess(requesterScope);
    return this.data[tenantId]?.suppliers || [];
  }

  public addSupplier(
    tenantId: string,
    supplierData: Omit<Supplier, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    requesterScope?: 'platform' | 'tenant'
  ): Supplier {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${tenant.tenant.slug}-${Date.now()}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tenant.suppliers.push(newSup);
    this.persist();
    return newSup;
  }

  public updateSupplier(
    tenantId: string,
    supplierId: string,
    updates: Partial<Supplier>,
    requesterScope?: 'platform' | 'tenant'
  ): Supplier {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const index = tenant.suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) throw new Error(`Supplier ${supplierId} not found`);

    tenant.suppliers[index] = {
      ...tenant.suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return tenant.suppliers[index];
  }

  public deleteSupplier(tenantId: string, supplierId: string, requesterScope?: 'platform' | 'tenant'): void {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const hasPurchases = tenant.purchases.some(p => p.supplierId === supplierId);
    if (hasPurchases) {
      throw new Error('Cannot delete supplier: one or more purchase orders are linked to this supplier.');
    }

    tenant.suppliers = tenant.suppliers.filter(s => s.id !== supplierId);
    this.persist();
  }

  public getPurchases(tenantId: string, requesterScope?: 'platform' | 'tenant'): Purchase[] {
    this.assertTenantAccess(requesterScope);
    return this.data[tenantId]?.purchases || [];
  }

  public createPurchase(
    tenantId: string,
    purchaseData: Omit<Purchase, 'id' | 'tenantId' | 'createdAt'>,
    user: { id: string; name: string },
    requesterScope?: 'platform' | 'tenant'
  ): Purchase {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const id = `po-${tenant.tenant.slug}-${Date.now()}`;
    const now = new Date().toISOString();

    const purchase: Purchase = {
      ...purchaseData,
      id,
      tenantId,
      createdAt: now
    };

    tenant.purchases.unshift(purchase);

    for (const item of purchase.items) {
      const product = tenant.products.find(p => p.id === item.productId);
      if (product) {
        const prev = product.stockQuantity;
        const next = prev + item.quantity;
        product.stockQuantity = next;
        product.updatedAt = now;

        tenant.stockMovements.unshift({
          id: `mov-${Date.now()}-${item.productId}`,
          tenantId,
          productId: product.id,
          productName: product.name,
          type: 'purchase',
          quantityChange: item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Goods receipt for Invoice ${purchase.invoiceNumber}`,
          referenceId: id,
          performedByUserId: user.id,
          performedByUserName: user.name,
          createdAt: now
        });
      }
    }

    this.persist();
    return purchase;
  }

  public getPurchaseById(tenantId: string, purchaseId: string, requesterScope?: 'platform' | 'tenant'): Purchase | null {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) return null;
    return tenant.purchases.find(p => p.id === purchaseId) || null;
  }

  public deletePurchase(
    tenantId: string,
    purchaseId: string,
    user: { id: string; name: string },
    requesterScope?: 'platform' | 'tenant'
  ): void {
    this.assertTenantAccess(requesterScope);
    const tenant = this.data[tenantId];
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const purchaseIndex = tenant.purchases.findIndex(p => p.id === purchaseId);
    if (purchaseIndex === -1) throw new Error(`Purchase order ${purchaseId} not found`);

    const purchase = tenant.purchases[purchaseIndex];
    const now = new Date().toISOString();

    for (const item of purchase.items) {
      const product = tenant.products.find(p => p.id === item.productId);
      if (product) {
        const prev = product.stockQuantity;
        const next = Math.max(0, prev - item.quantity);
        product.stockQuantity = next;
        product.updatedAt = now;

        tenant.stockMovements.unshift({
          id: `mov-${Date.now()}-${item.productId}-rev`,
          tenantId,
          productId: product.id,
          productName: product.name,
          type: 'correction',
          quantityChange: -item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Stock reversal for voided Invoice ${purchase.invoiceNumber}`,
          referenceId: purchase.id,
          performedByUserId: user.id,
          performedByUserName: user.name,
          createdAt: now
        });
      }
    }

    tenant.purchases.splice(purchaseIndex, 1);
    this.persist();
  }

  public getStockMovements(tenantId: string, productId?: string, requesterScope?: 'platform' | 'tenant'): StockMovement[] {
    this.assertTenantAccess(requesterScope);
    const movements = this.data[tenantId]?.stockMovements || [];
    if (productId) {
      return movements.filter(m => m.productId === productId);
    }
    return movements;
  }

  public getTenantUsers(tenantId: string): User[] {
    return this.data[tenantId]?.users || [];
  }

  public getAllUsers(): User[] {
    const allUsers: User[] = [this.superAdmin];
    for (const t of Object.values(this.data)) {
      allUsers.push(...t.users);
    }
    return allUsers;
  }

  public inviteTenantUser(tenantId: string, data: { name: string; email: string; role: Role; password?: string }): User {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);

    if (!data.name || !data.name.trim()) {
      throw new Error('User full name is required');
    }
    if (!data.email || !data.email.trim() || !data.email.includes('@')) {
      throw new Error('A valid email address is required');
    }

    const emailNorm = data.email.trim().toLowerCase();
    if (t.users.some(u => u.email.toLowerCase() === emailNorm)) {
      throw new Error(`A user with email "${data.email}" already exists in this organization.`);
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      scope: 'tenant',
      name: data.name.trim(),
      email: emailNorm,
      role: data.role,
      password: data.password || 'password123',
      status: 'active',
      permissions: ROLE_PERMISSIONS[data.role] || [],
      createdAt: new Date().toISOString()
    };

    t.users.push(newUser);
    this.persist();
    return newUser;
  }

  public getUserByEmail(email: string): User | undefined {
    const emailNorm = email.trim().toLowerCase();
    if (this.superAdmin.email.toLowerCase() === emailNorm) {
      return this.superAdmin;
    }
    for (const t of Object.values(this.data)) {
      const found = t.users.find(u => u.email.toLowerCase() === emailNorm);
      if (found) return found;
    }
    return undefined;
  }

  public updateUserPassword(userId: string, currentPassword: string, newPassword: string): boolean {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Check super admin
    if (this.superAdmin.id === userId) {
      const stored = this.superAdmin.password || 'password123';
      if (stored !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      this.superAdmin.password = newPassword;
      this.persist();
      return true;
    }

    // Check tenant users
    for (const t of Object.values(this.data)) {
      const user = t.users.find(u => u.id === userId);
      if (user) {
        const stored = user.password || 'password123';
        if (stored !== currentPassword) {
          throw new Error('Current password is incorrect');
        }
        user.password = newPassword;
        this.persist();
        return true;
      }
    }

    throw new Error('User account not found');
  }

  public resetUserPasswordByEmail(email: string, newPassword: string): boolean {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const emailNorm = email.trim().toLowerCase();
    if (this.superAdmin.email.toLowerCase() === emailNorm) {
      this.superAdmin.password = newPassword;
      this.persist();
      return true;
    }

    for (const t of Object.values(this.data)) {
      const user = t.users.find(u => u.email.toLowerCase() === emailNorm);
      if (user) {
        user.password = newPassword;
        this.persist();
        return true;
      }
    }

    throw new Error(`No account found registered with email "${email}"`);
  }

  public deleteTenantUser(tenantId: string, userId: string, requesterUserId?: string): void {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);

    if (requesterUserId && userId === requesterUserId) {
      throw new Error('You cannot remove your own active account');
    }

    const targetUser = t.users.find(u => u.id === userId);
    if (!targetUser) throw new Error('User not found');

    if (targetUser.role === 'TENANT_OWNER') {
      const ownerCount = t.users.filter(u => u.role === 'TENANT_OWNER').length;
      if (ownerCount <= 1) {
        throw new Error('Cannot remove the primary Store Owner. Transfer ownership before removing this account.');
      }
    }

    t.users = t.users.filter(u => u.id !== userId);
    this.persist();
  }

  public updateTenantUser(
    tenantId: string,
    userId: string,
    updates: Partial<User>
  ): User {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);

    const userIndex = t.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error(`User ${userId} not found`);

    const currentUser = t.users[userIndex];
    let newPermissions = currentUser.permissions;
    if (updates.role && updates.role !== currentUser.role) {
      newPermissions = ROLE_PERMISSIONS[updates.role] || [];
    }

    t.users[userIndex] = {
      ...currentUser,
      ...updates,
      permissions: updates.permissions || newPermissions
    };

    this.persist();
    return t.users[userIndex];
  }


  public updateTenantBusinessSettings(tenantId: string, updates: Partial<Tenant>): Tenant {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);
    t.tenant = {
      ...t.tenant,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return t.tenant;
  }

  public getAppBranding(tenantId: string): TenantMobileBranding {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);
    if (!t.tenant.branding) {
      t.tenant.branding = {
        appName: t.tenant.name,
        shortName: t.tenant.name.slice(0, 14),
        logoUrl: t.tenant.logoUrl || '',
        primaryColor: '#2563EB',
        accentColor: '#1D4ED8',
        appSuite: t.tenant.applicationId,
        apkVersion: '1.0.0',
        apkBuildNumber: 0,
        apkStatus: 'not_generated',
        buildLogs: []
      };
      this.persist();
    }
    return t.tenant.branding;
  }

  public updateAppBranding(tenantId: string, updates: Partial<TenantMobileBranding>): TenantMobileBranding {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);
    const existing = this.getAppBranding(tenantId);
    t.tenant.branding = {
      ...existing,
      ...updates
    };
    this.persist();
    return t.tenant.branding;
  }

  public buildApk(tenantId: string, options: Partial<TenantMobileBranding>): TenantMobileBranding {
    const t = this.data[tenantId];
    if (!t) throw new Error(`Tenant ${tenantId} not found`);
    const existing = this.getAppBranding(tenantId);
    const newBuildNumber = (existing.apkBuildNumber || 0) + 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const appName = options.appName || existing.appName || t.tenant.name;
    const shortName = options.shortName || existing.shortName || appName.slice(0, 14);
    const primaryColor = options.primaryColor || existing.primaryColor || '#2563EB';
    const appSuite = options.appSuite || existing.appSuite || t.tenant.applicationId;
    const logoUrl = options.logoUrl !== undefined ? options.logoUrl : existing.logoUrl;

    const buildLogs = [
      `[${timeStr}] Initializing white-label build pipeline for ${t.tenant.name}...`,
      `[${timeStr}] Workspace: ${tenantId} | App Suite: ${appSuite.toUpperCase()} | Build #${newBuildNumber}`,
      `[${timeStr}] Branding Assets: Setting app title to "${appName}" (Launcher: "${shortName}")`,
      `[${timeStr}] Palette Config: Primary Color ${primaryColor} | Splash Screen Branded`,
      `[${timeStr}] Icon Pipeline: Processing company logo -> Adaptive launcher mipmaps (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)`,
      `[${timeStr}] Manifest Patch: Injected android:label="@string/app_name" and store package identity`,
      `[${timeStr}] Config Stamped: Packaged tenant_config.json into android/assets with local offline cache`,
      `[${timeStr}] Compiling & Signing: Signed with release store keystore (Android Signature Scheme v2)`,
      `[${timeStr}] Output Artifact: ${appName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}-v1.0.0-b${newBuildNumber}.apk (112.6 MB)`,
      `[${timeStr}] APK Published & Ready for Installation`
    ];

    t.tenant.branding = {
      appName,
      shortName,
      logoUrl,
      primaryColor,
      accentColor: options.accentColor || existing.accentColor || '#1D4ED8',
      appSuite,
      apkVersion: '1.0.0',
      apkBuildNumber: newBuildNumber,
      apkStatus: 'ready',
      apkDownloadUrl: `http://localhost:4000/api/v1/tenants/download-apk?tenantId=${tenantId}`,
      apkFileSizeMb: 112.6,
      lastBuiltAt: now.toISOString(),
      buildLogs
    };

    this.persist();
    return t.tenant.branding;
  }

  // ==========================================================
  // MULTI-WAREHOUSE & INVENTORY LOCATIONS
  // ==========================================================
  public getWarehouses(tenantId: string, requesterScope?: 'platform' | 'tenant'): Warehouse[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.warehouses || [];
  }

  public getWarehouseById(tenantId: string, id: string, requesterScope?: 'platform' | 'tenant'): Warehouse | null {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.warehouses?.find(w => w.id === id) || null;
  }

  public createWarehouse(
    tenantId: string,
    data: Omit<Warehouse, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    requesterScope?: 'platform' | 'tenant'
  ): Warehouse {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const id = `wh-${tenant.tenant.slug}-${Date.now()}`;
    const now = new Date().toISOString();

    if (data.isDefault && tenant.warehouses) {
      tenant.warehouses.forEach(w => { w.isDefault = false; });
    }

    const newWarehouse: Warehouse = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now
    };

    tenant.warehouses?.unshift(newWarehouse);
    this.persist();
    return newWarehouse;
  }

  public updateWarehouse(
    tenantId: string,
    id: string,
    updates: Partial<Warehouse>,
    requesterScope?: 'platform' | 'tenant'
  ): Warehouse {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const index = tenant.warehouses?.findIndex(w => w.id === id) ?? -1;
    if (index === -1 || !tenant.warehouses) throw new Error(`Warehouse ${id} not found`);

    if (updates.isDefault) {
      tenant.warehouses.forEach(w => { w.isDefault = false; });
    }

    tenant.warehouses[index] = {
      ...tenant.warehouses[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return tenant.warehouses[index];
  }

  public getWarehouseLocations(tenantId: string, warehouseId: string, requesterScope?: 'platform' | 'tenant'): WarehouseLocation[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.warehouseLocations?.filter(l => l.warehouseId === warehouseId) || [];
  }

  public createWarehouseLocation(
    tenantId: string,
    warehouseId: string,
    data: Omit<WarehouseLocation, 'id' | 'tenantId' | 'warehouseId'>,
    requesterScope?: 'platform' | 'tenant'
  ): WarehouseLocation {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const id = `loc-${warehouseId}-${Date.now()}`;
    const newLocation: WarehouseLocation = {
      ...data,
      id,
      tenantId,
      warehouseId
    };

    tenant.warehouseLocations?.push(newLocation);
    this.persist();
    return newLocation;
  }

  public getStockBalances(tenantId: string, productId?: string, warehouseId?: string, requesterScope?: 'platform' | 'tenant'): StockBalance[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) return [];

    let balances = tenant.stockBalances || [];

    if (balances.length === 0 && tenant.products.length > 0 && tenant.warehouses && tenant.warehouses.length > 0) {
      const defaultWh = tenant.warehouses[0];
      balances = tenant.products.map(p => ({
        id: `sb-${tenant.tenant.slug}-${p.id}`,
        tenantId,
        productId: p.id,
        warehouseId: defaultWh.id,
        quantity: p.stockQuantity,
        reservedQuantity: 0,
        updatedAt: p.updatedAt
      }));
      tenant.stockBalances = balances;
      this.persist();
    }

    if (productId) {
      balances = balances.filter(b => b.productId === productId);
    }
    if (warehouseId) {
      balances = balances.filter(b => b.warehouseId === warehouseId);
    }
    return balances;
  }

  // ==========================================================
  // STOCK TRANSFERS
  // ==========================================================
  public getStockTransfers(tenantId: string, requesterScope?: 'platform' | 'tenant'): StockTransfer[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.stockTransfers || [];
  }

  public getStockTransferById(tenantId: string, id: string, requesterScope?: 'platform' | 'tenant'): StockTransfer | null {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.stockTransfers?.find(t => t.id === id) || null;
  }

  public createStockTransfer(
    tenantId: string,
    data: {
      sourceWarehouseId: string;
      destinationWarehouseId: string;
      notes?: string;
      items: Omit<StockTransferItem, 'id' | 'transferId'>[];
    },
    userId: string,
    userName: string,
    requesterScope?: 'platform' | 'tenant'
  ): StockTransfer {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const sourceWh = tenant.warehouses?.find(w => w.id === data.sourceWarehouseId);
    const destWh = tenant.warehouses?.find(w => w.id === data.destinationWarehouseId);
    if (!sourceWh || !destWh) throw new Error('Source or destination warehouse not found');

    const id = `tr-${tenant.tenant.slug}-${Date.now()}`;
    const transferNumber = `TR-${new Date().getFullYear()}-${String((tenant.stockTransfers?.length || 0) + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const transfer: StockTransfer = {
      id,
      tenantId,
      transferNumber,
      sourceWarehouseId: data.sourceWarehouseId,
      sourceWarehouseName: sourceWh.name,
      destinationWarehouseId: data.destinationWarehouseId,
      destinationWarehouseName: destWh.name,
      status: 'draft',
      items: data.items.map((it, idx) => ({
        ...it,
        id: `tri-${id}-${idx + 1}`,
        transferId: id
      })),
      notes: data.notes,
      createdByUserId: userId,
      createdByUserName: userName,
      createdAt: now,
      updatedAt: now
    };

    tenant.stockTransfers?.unshift(transfer);
    this.persist();
    return transfer;
  }

  public dispatchStockTransfer(tenantId: string, transferId: string, userId: string, userName: string, requesterScope?: 'platform' | 'tenant'): StockTransfer {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const transfer = tenant.stockTransfers?.find(t => t.id === transferId);
    if (!transfer) throw new Error(`Transfer ${transferId} not found`);
    if (transfer.status === 'received' || transfer.status === 'cancelled') {
      throw new Error(`Cannot dispatch transfer with status ${transfer.status}`);
    }

    const now = new Date().toISOString();
    transfer.status = 'in_transit';
    transfer.dispatchedAt = now;
    transfer.updatedAt = now;

    for (const item of transfer.items) {
      const product = tenant.products.find(p => p.id === item.productId);
      if (product) {
        const prev = product.stockQuantity;
        const next = Math.max(0, prev - item.quantity);
        product.stockQuantity = next;
        product.updatedAt = now;

        // Deduct from source warehouse balance
        const sbSource = tenant.stockBalances?.find(
          b => b.productId === item.productId && b.warehouseId === transfer.sourceWarehouseId
        );
        if (sbSource) {
          sbSource.quantity = Math.max(0, sbSource.quantity - item.quantity);
          sbSource.updatedAt = now;
        }

        tenant.stockMovements.unshift({
          id: `mov-${Date.now()}-${item.productId}-tout`,
          tenantId,
          productId: item.productId,
          productName: item.productName,
          type: 'transfer_out',
          quantityChange: -item.quantity,
          previousStock: prev,
          newStock: next,
          warehouseId: transfer.sourceWarehouseId,
          warehouseName: transfer.sourceWarehouseName,
          reason: `Stock Transfer ${transfer.transferNumber} dispatch to ${transfer.destinationWarehouseName}`,
          referenceId: transfer.id,
          performedByUserId: userId,
          performedByUserName: userName,
          createdAt: now
        });
      }
    }

    this.persist();
    return transfer;
  }

  public receiveStockTransfer(tenantId: string, transferId: string, userId: string, userName: string, requesterScope?: 'platform' | 'tenant'): StockTransfer {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const transfer = tenant.stockTransfers?.find(t => t.id === transferId);
    if (!transfer) throw new Error(`Transfer ${transferId} not found`);
    if (transfer.status === 'received' || transfer.status === 'cancelled') {
      throw new Error(`Cannot receive transfer with status ${transfer.status}`);
    }

    const now = new Date().toISOString();
    transfer.status = 'received';
    transfer.receivedAt = now;
    transfer.updatedAt = now;

    for (const item of transfer.items) {
      const product = tenant.products.find(p => p.id === item.productId);
      if (product) {
        const prev = product.stockQuantity;
        const next = prev + item.quantity;
        product.stockQuantity = next;
        product.updatedAt = now;

        // Credit to destination warehouse balance
        let sbDest = tenant.stockBalances?.find(
          b => b.productId === item.productId && b.warehouseId === transfer.destinationWarehouseId
        );
        if (sbDest) {
          sbDest.quantity += item.quantity;
          sbDest.updatedAt = now;
        } else if (tenant.stockBalances) {
          tenant.stockBalances.push({
            id: `sb-${tenant.tenant.slug}-${item.productId}-${transfer.destinationWarehouseId}`,
            tenantId,
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            quantity: item.quantity,
            reservedQuantity: 0,
            updatedAt: now
          });
        }

        tenant.stockMovements.unshift({
          id: `mov-${Date.now()}-${item.productId}-tin`,
          tenantId,
          productId: item.productId,
          productName: item.productName,
          type: 'transfer_in',
          quantityChange: item.quantity,
          previousStock: prev,
          newStock: next,
          warehouseId: transfer.destinationWarehouseId,
          warehouseName: transfer.destinationWarehouseName,
          reason: `Stock Transfer ${transfer.transferNumber} received at ${transfer.destinationWarehouseName}`,
          referenceId: transfer.id,
          performedByUserId: userId,
          performedByUserName: userName,
          createdAt: now
        });
      }
    }

    this.persist();
    return transfer;
  }

  public cancelStockTransfer(tenantId: string, transferId: string, _userId: string, _userName: string, requesterScope?: 'platform' | 'tenant'): StockTransfer {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const transfer = tenant.stockTransfers?.find(t => t.id === transferId);
    if (!transfer) throw new Error(`Transfer ${transferId} not found`);

    transfer.status = 'cancelled';
    transfer.updatedAt = new Date().toISOString();
    this.persist();
    return transfer;
  }

  // ==========================================================
  // BATCHES & SHELF-LIFE EXPIRY
  // ==========================================================
  public getBatches(tenantId: string, productId?: string, requesterScope?: 'platform' | 'tenant'): Batch[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    const batches = tenant?.batches || [];
    if (productId) {
      return batches.filter(b => b.productId === productId);
    }
    return batches;
  }

  public createBatch(
    tenantId: string,
    data: Omit<Batch, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>,
    requesterScope?: 'platform' | 'tenant'
  ): Batch {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const id = `bat-${tenant.tenant.slug}-${Date.now()}`;
    const now = new Date().toISOString();
    const batch: Batch = {
      ...data,
      id,
      tenantId,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    tenant.batches?.unshift(batch);
    this.persist();
    return batch;
  }

  // ==========================================================
  // SERIAL NUMBERS
  // ==========================================================
  public getSerialNumbers(tenantId: string, productId?: string, requesterScope?: 'platform' | 'tenant'): SerialNumber[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    const serials = tenant?.serialNumbers || [];
    if (productId) {
      return serials.filter(s => s.productId === productId);
    }
    return serials;
  }

  public registerSerialNumber(
    tenantId: string,
    data: Omit<SerialNumber, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>,
    requesterScope?: 'platform' | 'tenant'
  ): SerialNumber {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const id = `sn-${tenant.tenant.slug}-${Date.now()}`;
    const now = new Date().toISOString();
    const serial: SerialNumber = {
      ...data,
      id,
      tenantId,
      status: 'in_stock',
      createdAt: now,
      updatedAt: now
    };

    tenant.serialNumbers?.unshift(serial);
    this.persist();
    return serial;
  }

  public updateSerialStatus(
    tenantId: string,
    id: string,
    status: SerialStatus,
    assignedCustomer?: string,
    requesterScope?: 'platform' | 'tenant'
  ): SerialNumber {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const serial = tenant.serialNumbers?.find(s => s.id === id);
    if (!serial) throw new Error(`Serial ${id} not found`);

    serial.status = status;
    if (assignedCustomer !== undefined) serial.assignedCustomer = assignedCustomer;
    serial.updatedAt = new Date().toISOString();

    this.persist();
    return serial;
  }

  // ==========================================================
  // STOCKTAKE & CYCLE COUNTING
  // ==========================================================
  public getStocktakeSessions(tenantId: string, requesterScope?: 'platform' | 'tenant'): StocktakeSession[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.stocktakeSessions || [];
  }

  public getStocktakeSessionById(tenantId: string, id: string, requesterScope?: 'platform' | 'tenant'): StocktakeSession | null {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.stocktakeSessions?.find(s => s.id === id) || null;
  }

  public createStocktakeSession(
    tenantId: string,
    warehouseId: string,
    notes: string,
    userId: string,
    userName: string,
    requesterScope?: 'platform' | 'tenant'
  ): StocktakeSession {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const wh = tenant.warehouses?.find(w => w.id === warehouseId) || tenant.warehouses![0];
    const id = `stk-${tenant.tenant.slug}-${Date.now()}`;
    const sessionNumber = `STK-${new Date().getFullYear()}-${String((tenant.stocktakeSessions?.length || 0) + 1).padStart(2, '0')}`;
    const now = new Date().toISOString();

    const items = tenant.products.map(p => ({
      id: `stki-${id}-${p.id}`,
      sessionId: id,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      systemQuantity: p.stockQuantity,
      countedQuantity: p.stockQuantity,
      variance: 0,
      unitCost: p.costPrice
    }));

    const session: StocktakeSession = {
      id,
      tenantId,
      sessionNumber,
      warehouseId: wh.id,
      warehouseName: wh.name,
      status: 'in_progress',
      notes,
      items,
      initiatedByUserId: userId,
      initiatedByUserName: userName,
      createdAt: now,
      updatedAt: now
    };

    tenant.stocktakeSessions?.unshift(session);
    this.persist();
    return session;
  }

  public updateStocktakeCount(
    tenantId: string,
    sessionId: string,
    productId: string,
    countedQuantity: number,
    requesterScope?: 'platform' | 'tenant'
  ): StocktakeSession {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const session = tenant.stocktakeSessions?.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const item = session.items.find(it => it.productId === productId);
    if (item) {
      item.countedQuantity = countedQuantity;
      item.variance = countedQuantity - item.systemQuantity;
    }
    session.updatedAt = new Date().toISOString();

    this.persist();
    return session;
  }

  public reconcileStocktakeSession(
    tenantId: string,
    sessionId: string,
    userId: string,
    userName: string,
    requesterScope?: 'platform' | 'tenant'
  ): StocktakeSession {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const session = tenant.stocktakeSessions?.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.status !== 'in_progress') throw new Error(`Cannot reconcile session with status ${session.status}`);

    const now = new Date().toISOString();
    session.status = 'reconciled';
    session.reconciledAt = now;
    session.updatedAt = now;

    for (const item of session.items) {
      if (item.variance !== 0) {
        const product = tenant.products.find(p => p.id === item.productId);
        if (product) {
          const prev = product.stockQuantity;
          const next = item.countedQuantity;
          product.stockQuantity = next;
          product.updatedAt = now;

          tenant.stockMovements.unshift({
            id: `mov-${Date.now()}-${item.productId}-stk`,
            tenantId,
            productId: item.productId,
            productName: item.productName,
            type: 'stocktake',
            quantityChange: item.variance,
            previousStock: prev,
            newStock: next,
            warehouseId: session.warehouseId,
            warehouseName: session.warehouseName,
            reason: `Stocktake audit reconciliation (${session.sessionNumber}): variance ${item.variance > 0 ? '+' : ''}${item.variance}`,
            referenceId: session.id,
            performedByUserId: userId,
            performedByUserName: userName,
            createdAt: now
          });
        }
      }
    }

    this.persist();
    return session;
  }

  public cancelStocktakeSession(tenantId: string, sessionId: string, requesterScope?: 'platform' | 'tenant'): StocktakeSession {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const session = tenant.stocktakeSessions?.find(s => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    this.persist();
    return session;
  }

  // ==========================================================
  // REORDER RULES & PURCHASE SUGGESTIONS
  // ==========================================================
  public getReorderRules(tenantId: string, requesterScope?: 'platform' | 'tenant'): ReorderRule[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    return tenant?.reorderRules || [];
  }

  public saveReorderRule(tenantId: string, ruleData: Omit<ReorderRule, 'id' | 'tenantId'>, requesterScope?: 'platform' | 'tenant'): ReorderRule {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const existingIndex = tenant.reorderRules?.findIndex(r => r.productId === ruleData.productId) ?? -1;
    let rule: ReorderRule;

    if (existingIndex >= 0 && tenant.reorderRules) {
      rule = {
        ...tenant.reorderRules[existingIndex],
        ...ruleData
      };
      tenant.reorderRules[existingIndex] = rule;
    } else {
      rule = {
        ...ruleData,
        id: `ror-${tenant.tenant.slug}-${Date.now()}`,
        tenantId
      };
      tenant.reorderRules?.push(rule);
    }

    this.persist();
    return rule;
  }

  public getPurchaseSuggestions(tenantId: string, requesterScope?: 'platform' | 'tenant'): PurchaseSuggestion[] {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) return [];

    const suggestions: PurchaseSuggestion[] = [];
    const products = tenant.products || [];
    const rules = tenant.reorderRules || [];

    for (const p of products) {
      const rule = rules.find(r => r.productId === p.id);
      const reorderPoint = rule ? rule.reorderPoint : (p.reorderPoint || p.minimumStock || 10);
      const reorderQty = rule ? rule.reorderQuantity : (p.reorderQuantity || 50);

      if (p.stockQuantity <= reorderPoint) {
        const sup = tenant.suppliers.find(s => s.id === (rule?.preferredSupplierId || p.preferredSupplierId));
        suggestions.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentStock: p.stockQuantity,
          reorderPoint,
          suggestedQuantity: reorderQty,
          supplierId: sup?.id,
          supplierName: sup?.companyName || sup?.name || 'General Supplier',
          estimatedUnitCost: p.costPrice,
          estimatedTotalCost: reorderQty * p.costPrice
        });
      }
    }

    return suggestions;
  }

  // ==========================================================
  // FORECASTING & INVENTORY INTELLIGENCE
  // ==========================================================
  public getForecastingReport(tenantId: string, requesterScope?: 'platform' | 'tenant'): ForecastingReport {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) {
      return {
        tenantId,
        generatedAt: new Date().toISOString(),
        summary: { totalSkus: 0, stockoutRiskCount: 0, deadStockCount: 0, totalCapitalLocked: 0 },
        deadStock: [],
        demandVelocity: []
      };
    }

    const products = tenant.products || [];
    const movements = tenant.stockMovements || [];

    const deadStock = products
      .filter(p => p.stockQuantity > 0)
      .map(p => {
        const lastMov = movements.find(m => m.productId === p.id);
        const daysAgo = lastMov ? Math.floor((Date.now() - new Date(lastMov.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 45;
        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
          costPrice: p.costPrice,
          capitalLocked: p.stockQuantity * p.costPrice,
          daysWithoutMovement: daysAgo
        };
      })
      .filter(item => item.daysWithoutMovement >= 15);

    const demandVelocity = products.map(p => {
      const unitsSold = 15 + Math.floor((p.costPrice % 20));
      const dailyVelocity = parseFloat((unitsSold / 30).toFixed(2));
      const supplyDays = dailyVelocity > 0 ? Math.floor(p.stockQuantity / dailyVelocity) : 999;
      const riskLevel: 'critical' | 'moderate' | 'healthy' =
        supplyDays <= 5 ? 'critical' : supplyDays <= 15 ? 'moderate' : 'healthy';

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unitsSoldLast30Days: unitsSold,
        dailyVelocity,
        daysOfSupplyRemaining: supplyDays,
        stockoutRiskLevel: riskLevel
      };
    });

    const stockoutRiskCount = demandVelocity.filter(d => d.stockoutRiskLevel === 'critical').length;
    const totalCapitalLocked = deadStock.reduce((acc, curr) => acc + curr.capitalLocked, 0);

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSkus: products.length,
        stockoutRiskCount,
        deadStockCount: deadStock.length,
        totalCapitalLocked
      },
      deadStock,
      demandVelocity
    };
  }

  // ==========================================================
  // CSV BULK IMPORT
  // ==========================================================
  public bulkImportProducts(tenantId: string, rows: BulkImportRowData[], requesterScope?: 'platform' | 'tenant'): { importedCount: number } {
    this.assertTenantAccess(requesterScope);
    const tenant = this.ensureTenantCollections(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    let importedCount = 0;
    const now = new Date().toISOString();

    for (const row of rows) {
      let cat = tenant.categories.find(c => c.name.toLowerCase() === row.category.toLowerCase());
      if (!cat) {
        cat = {
          id: `cat-${tenant.tenant.slug}-${Date.now()}-${importedCount}`,
          tenantId,
          name: row.category,
          productCount: 0,
          status: 'active',
          createdAt: now,
          updatedAt: now
        };
        tenant.categories.push(cat);
      }
      cat.productCount = (cat.productCount || 0) + 1;

      let brandId = '';
      if (row.brand) {
        let brd = tenant.brands?.find(b => b.name.toLowerCase() === row.brand!.toLowerCase());
        if (!brd) {
          brd = {
            id: `brd-${tenant.tenant.slug}-${Date.now()}-${importedCount}`,
            tenantId,
            name: row.brand,
            productCount: 0,
            status: 'active',
            createdAt: now,
            updatedAt: now
          };
          tenant.brands?.push(brd);
        }
        brd.productCount = (brd.productCount || 0) + 1;
        brandId = brd.id;
      }

      const prodId = `prod-${tenant.tenant.slug}-${Date.now()}-${importedCount}`;
      const newProduct: Product = {
        id: prodId,
        tenantId,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        categoryId: cat.id,
        categoryName: cat.name,
        brandId: brandId || undefined,
        brandName: row.brand || undefined,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        mrp: row.mrp || row.sellingPrice,
        stockQuantity: row.stockQuantity,
        minimumStock: row.minimumStock || 5,
        unit: (row.unit as any) || 'pcs',
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      tenant.products.unshift(newProduct);
      importedCount++;

      if (row.stockQuantity > 0) {
        tenant.stockMovements.unshift({
          id: `mov-${Date.now()}-${prodId}-imp`,
          tenantId,
          productId: prodId,
          productName: row.name,
          type: 'adjustment_increase',
          quantityChange: row.stockQuantity,
          previousStock: 0,
          newStock: row.stockQuantity,
          reason: 'Initial opening balance from CSV bulk import',
          performedByUserId: 'usr-bulk-import',
          performedByUserName: 'Bulk Catalog Importer',
          createdAt: now
        });
      }
    }

    if (tenant.tenant.usage) {
      tenant.tenant.usage.productsCount = tenant.products.length;
    }
    this.persist();
    return { importedCount };
  }

  private getTenantData(tenantId: string): TenantData {
    const tenant = this.data[tenantId];
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found in store`);
    }
    return tenant;
  }

  // ==========================================================
  // RESTAURANT MANAGEMENT DOMAIN (FOH, KDS, Anti-Theft & BOM)
  // ==========================================================

  private ensureTenantRestaurantData(tenantId: string): TenantData {
    const tenant = this.getTenantData(tenantId);
    let changed = false;

    if (!tenant.restaurantSections || tenant.restaurantSections.length === 0) {
      tenant.restaurantSections = [
        { id: `sec-${tenantId}-1`, name: 'AC Dining Hall', description: 'Air-conditioned main dining area', sortOrder: 1 },
        { id: `sec-${tenantId}-2`, name: 'Open-Air Terrace', description: 'Breezy outdoor seating', sortOrder: 2 },
        { id: `sec-${tenantId}-3`, name: 'Express Counter', description: 'Quick service counter seating', sortOrder: 3 }
      ];
      changed = true;
    }

    if (!tenant.restaurantTables || tenant.restaurantTables.length === 0) {
      tenant.restaurantTables = [
        { id: `tbl-${tenantId}-1`, sectionId: tenant.restaurantSections[0].id, tableNumber: 'T-01', capacity: 2, status: 'vacant', shape: 'square', currentBillTotal: 0, activeKotIds: [] },
        { id: `tbl-${tenantId}-2`, sectionId: tenant.restaurantSections[0].id, tableNumber: 'T-02', capacity: 4, status: 'vacant', shape: 'square', currentBillTotal: 0, activeKotIds: [] },
        { id: `tbl-${tenantId}-3`, sectionId: tenant.restaurantSections[0].id, tableNumber: 'T-03', capacity: 4, status: 'vacant', shape: 'round', currentBillTotal: 0, activeKotIds: [] },
        { id: `tbl-${tenantId}-4`, sectionId: tenant.restaurantSections[1].id, tableNumber: 'TR-01', capacity: 4, status: 'vacant', shape: 'round', currentBillTotal: 0, activeKotIds: [] },
        { id: `tbl-${tenantId}-5`, sectionId: tenant.restaurantSections[1].id, tableNumber: 'TR-02', capacity: 6, status: 'vacant', shape: 'rectangle', currentBillTotal: 0, activeKotIds: [] },
        { id: `tbl-${tenantId}-6`, sectionId: tenant.restaurantSections[2].id, tableNumber: 'C-01', capacity: 2, status: 'vacant', shape: 'square', currentBillTotal: 0, activeKotIds: [] }
      ];
      changed = true;
    }

    if (!tenant.restaurantMenuItems || tenant.restaurantMenuItems.length === 0) {
      tenant.restaurantMenuItems = [
        { id: `itm-${tenantId}-1`, name: 'Special Filter Coffee', code: 'SFC', categoryId: 'cat-bev', categoryName: 'Beverages', price: 40, taxRate: 5, prepTimeMinutes: 5, station: 'bar', dietary: 'veg', isAvailable: true },
        { id: `itm-${tenantId}-2`, name: 'Masala Chai', code: 'MC', categoryId: 'cat-bev', categoryName: 'Beverages', price: 30, taxRate: 5, prepTimeMinutes: 5, station: 'bar', dietary: 'veg', isAvailable: true },
        { id: `itm-${tenantId}-3`, name: 'Crispy Butter Masala Dosa', code: 'BMD', categoryId: 'cat-mains', categoryName: 'Mains', price: 120, taxRate: 5, prepTimeMinutes: 10, station: 'kitchen', dietary: 'veg', isAvailable: true },
        { id: `itm-${tenantId}-4`, name: 'Paneer Butter Masala', code: 'PBM', categoryId: 'cat-curry', categoryName: 'Curries', price: 260, taxRate: 5, prepTimeMinutes: 15, station: 'kitchen', dietary: 'veg', isAvailable: true },
        { id: `itm-${tenantId}-5`, name: 'Butter Garlic Naan', code: 'BGN', categoryId: 'cat-breads', categoryName: 'Breads', price: 65, taxRate: 5, prepTimeMinutes: 8, station: 'tandoor', dietary: 'veg', isAvailable: true },
        { id: `itm-${tenantId}-6`, name: 'Dum Chicken Biryani', code: 'DCB', categoryId: 'cat-biryani', categoryName: 'Biryani & Rice', price: 320, taxRate: 5, prepTimeMinutes: 18, station: 'kitchen', dietary: 'non_veg', isAvailable: true },
        { id: `itm-${tenantId}-7`, name: 'Gulab Jamun with Rabdi', code: 'GJR', categoryId: 'cat-dessert', categoryName: 'Desserts', price: 110, taxRate: 5, prepTimeMinutes: 5, station: 'dessert', dietary: 'veg', isAvailable: true }
      ];
      changed = true;
    }

    if (!tenant.restaurantOrders) { tenant.restaurantOrders = []; changed = true; }
    if (!tenant.restaurantKots) { tenant.restaurantKots = []; changed = true; }
    if (!tenant.restaurantRecipes) { tenant.restaurantRecipes = []; changed = true; }
    if (!tenant.restaurantWasteLogs) { tenant.restaurantWasteLogs = []; changed = true; }
    if (!tenant.restaurantTableAudits) { tenant.restaurantTableAudits = []; changed = true; }

    if (changed) {
      this.persist();
    }
    return tenant;
  }

  public getRestaurantSections(tenantId: string): RestaurantSection[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantSections || [];
  }

  public getRestaurantTables(tenantId: string): RestaurantTable[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantTables || [];
  }

  public getRestaurantMenuItems(tenantId: string): RestaurantMenuItem[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantMenuItems || [];
  }

  public getRestaurantKots(tenantId: string): RestaurantKot[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantKots || [];
  }

  public getRestaurantOrders(tenantId: string): RestaurantOrder[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantOrders || [];
  }

  public getRestaurantRecipes(tenantId: string): RestaurantRecipe[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantRecipes || [];
  }

  public getRestaurantWasteLogs(tenantId: string): RestaurantWasteLog[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantWasteLogs || [];
  }

  public getTableAudits(tenantId: string): TableTransferAudit[] {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    return tenant.restaurantTableAudits || [];
  }

  public seatTable(
    tenantId: string,
    tableId: string,
    guestCount: number,
    captainName: string
  ): RestaurantTable {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const orderId = `ord-${Date.now()}`;
    table.status = 'seated';
    table.guestCount = guestCount;
    table.captainName = captainName;
    table.seatedAt = new Date().toISOString();
    table.activeOrderId = orderId;
    table.activeKotIds = [];
    table.currentBillTotal = 0;

    if (!tenant.restaurantOrders) tenant.restaurantOrders = [];
    const section = tenant.restaurantSections?.find((s: RestaurantSection) => s.id === table.sectionId);

    const newOrder: RestaurantOrder = {
      id: orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
      orderType: 'dine_in',
      tableId: table.id,
      tableNumber: table.tableNumber,
      sectionName: section?.name || 'Dining Area',
      guestCount,
      captainName,
      kots: [],
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      cgst: 0,
      sgst: 0,
      roundOff: 0,
      grandTotal: 0,
      payments: [],
      orderStatus: 'open',
      billPrintedCount: 0,
      reprintHistory: [],
      createdAt: new Date().toISOString()
    };
    tenant.restaurantOrders.unshift(newOrder);

    this.persist();
    return table;
  }

  public fireKot(
    tenantId: string,
    tableId: string,
    items: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      station: 'kitchen' | 'tandoor' | 'bar' | 'dessert' | 'pantry';
      selectedModifiers?: any[];
      specialNotes?: string;
    }>,
    captainName: string
  ): { kot: RestaurantKot; table: RestaurantTable } {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];
    if (!tenant.restaurantKots) tenant.restaurantKots = [];
    if (!tenant.restaurantOrders) tenant.restaurantOrders = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    let order = tenant.restaurantOrders.find((o: RestaurantOrder) => o.id === table.activeOrderId);
    if (!order) {
      // Auto-create order if table was somehow unseated
      const orderId = `ord-${Date.now()}`;
      order = {
        id: orderId,
        orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
        orderType: 'dine_in',
        tableId: table.id,
        tableNumber: table.tableNumber,
        guestCount: table.guestCount || 2,
        captainName: captainName || table.assignedCaptain || 'Captain',
        kots: [],
        subtotal: 0,
        discount: 0,
        serviceCharge: 0,
        cgst: 0,
        sgst: 0,
        roundOff: 0,
        grandTotal: 0,
        payments: [],
        orderStatus: 'open',
        billPrintedCount: 0,
        reprintHistory: [],
        createdAt: new Date().toISOString()
      };
      tenant.restaurantOrders.unshift(order);
      table.activeOrderId = orderId;
      table.seatedAt = table.seatedAt || new Date().toISOString();
    }

    const kotSeq = (tenant.restaurantKots.length + 1).toString().padStart(3, '0');
    const kotId = `kot-${Date.now()}`;
    const section = tenant.restaurantSections?.find((s: RestaurantSection) => s.id === table.sectionId);

    const kotItems = items.map((itm, idx) => ({
      id: `ki-${Date.now()}-${idx}`,
      menuItemId: itm.menuItemId,
      name: itm.name,
      quantity: itm.quantity,
      unitPrice: itm.unitPrice,
      selectedModifiers: itm.selectedModifiers,
      specialNotes: itm.specialNotes,
      station: itm.station || 'kitchen',
      status: 'cooking' as KotItemStatus
    }));

    const newKot: RestaurantKot = {
      id: kotId,
      kotNumber: `KOT-${kotSeq}`,
      orderId: order.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      sectionName: section?.name || 'Main Dining',
      station: items[0]?.station || 'kitchen',
      captainName: captainName || table.assignedCaptain || 'Captain',
      status: 'fired',
      items: kotItems,
      firedAt: new Date().toISOString()
    };

    tenant.restaurantKots.unshift(newKot);
    order.kots.push(newKot);

    // Recalculate order running total
    let subtotal = 0;
    for (const k of order.kots) {
      for (const itm of k.items) {
        if (itm.status !== 'cancelled') {
          const modTotal = (itm.selectedModifiers || []).reduce((acc: number, m: any) => acc + (m.extraPrice || 0), 0);
          subtotal += (itm.unitPrice + modTotal) * itm.quantity;
        }
      }
    }
    const cgst = subtotal * 0.025; // 2.5%
    const sgst = subtotal * 0.025; // 2.5%
    const grandTotal = Math.round(subtotal + cgst + sgst);

    order.subtotal = subtotal;
    order.cgst = cgst;
    order.sgst = sgst;
    order.grandTotal = grandTotal;

    table.status = 'ordered';
    table.lastKotAt = new Date().toISOString();
    table.currentBillTotal = grandTotal;
    if (!table.activeKotIds) table.activeKotIds = [];
    table.activeKotIds.push(kotId);

    this.persist();
    return { kot: newKot, table };
  }

  public updateKotItemStatus(
    tenantId: string,
    kotId: string,
    itemId: string,
    status: KotItemStatus
  ): RestaurantKot {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantKots) tenant.restaurantKots = [];

    const kot = tenant.restaurantKots.find((k: RestaurantKot) => k.id === kotId);
    if (!kot) throw new Error('KOT not found');

    const itm = kot.items.find((i: any) => i.id === itemId);
    if (itm) {
      itm.status = status;
    }

    const allReadyOrServed = kot.items.every((i: any) => i.status === 'ready' || i.status === 'served' || i.status === 'cancelled');
    if (allReadyOrServed && kot.status !== 'ready' && kot.status !== 'served') {
      kot.status = 'ready';
      kot.readyAt = new Date().toISOString();
    }

    // Also update table status to 'served' if all items served
    const table = tenant.restaurantTables?.find((t: RestaurantTable) => t.id === kot.tableId);
    if (table && status === 'served') {
      table.status = 'served';
    }

    this.persist();
    return kot;
  }

  public bumpKot(tenantId: string, kotId: string): RestaurantKot {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantKots) tenant.restaurantKots = [];

    const kot = tenant.restaurantKots.find((k: RestaurantKot) => k.id === kotId);
    if (!kot) throw new Error('KOT not found');

    kot.status = 'ready';
    kot.readyAt = new Date().toISOString();
    kot.items.forEach((i: any) => {
      if (i.status === 'cooking' || i.status === 'pending') {
        i.status = 'ready';
      }
    });

    this.persist();
    return kot;
  }

  public voidKotItem(
    tenantId: string,
    kotId: string,
    itemId: string,
    reason: string,
    managerPin: string,
    authorizedBy = 'Manager Vikram'
  ): { kot: RestaurantKot; wasteLog: RestaurantWasteLog } {
    if (managerPin !== '1234') {
      throw new Error('Invalid Manager PIN. Void authorization rejected.');
    }

    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantKots) tenant.restaurantKots = [];
    if (!tenant.restaurantWasteLogs) tenant.restaurantWasteLogs = [];

    const kot = tenant.restaurantKots.find((k: RestaurantKot) => k.id === kotId);
    if (!kot) throw new Error('KOT not found');

    const itm = kot.items.find((i: any) => i.id === itemId);
    if (!itm) throw new Error('Item not found in KOT');

    itm.status = 'cancelled';
    itm.cancelledReason = reason;
    itm.cancelledAt = new Date().toISOString();

    // Log in Kitchen Waste & Spoilage Register
    const recipe = tenant.restaurantRecipes?.find((r: RestaurantRecipe) => r.menuItemId === itm.menuItemId);
    const estimatedCost = (recipe ? recipe.totalCost : itm.unitPrice * 0.35) * itm.quantity;

    const wasteLog: RestaurantWasteLog = {
      id: `wst-${Date.now()}`,
      date: new Date().toISOString(),
      kotId: kot.kotNumber,
      tableNumber: kot.tableNumber,
      itemName: itm.name,
      quantity: itm.quantity,
      unit: 'portion',
      estimatedCost,
      reason: `Void KOT Item: ${reason}`,
      authorizedBy,
      status: 'approved'
    };
    tenant.restaurantWasteLogs.unshift(wasteLog);

    // Recalculate Table and Order Running Total
    const order = tenant.restaurantOrders?.find((o: RestaurantOrder) => o.id === kot.orderId);
    if (order) {
      let subtotal = 0;
      for (const k of order.kots) {
        for (const item of k.items) {
          if (item.status !== 'cancelled') {
            const modTotal = (item.selectedModifiers || []).reduce((acc: number, m: any) => acc + (m.extraPrice || 0), 0);
            subtotal += (item.unitPrice + modTotal) * item.quantity;
          }
        }
      }
      const cgst = subtotal * 0.025;
      const sgst = subtotal * 0.025;
      order.subtotal = subtotal;
      order.cgst = cgst;
      order.sgst = sgst;
      order.grandTotal = Math.round(subtotal + cgst + sgst);

      const table = tenant.restaurantTables?.find((t: RestaurantTable) => t.id === kot.tableId);
      if (table) {
        table.currentBillTotal = order.grandTotal;
      }
    }

    this.persist();
    return { kot, wasteLog };
  }

  public transferTable(
    tenantId: string,
    sourceTableId: string,
    targetTableId: string,
    reason: string,
    managerPin: string,
    transferredBy = 'Captain'
  ): TableTransferAudit {
    if (managerPin !== '1234') {
      throw new Error('Invalid Manager PIN. Table transfer rejected.');
    }

    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];
    if (!tenant.restaurantTableAudits) tenant.restaurantTableAudits = [];

    const source = tenant.restaurantTables.find((t: RestaurantTable) => t.id === sourceTableId);
    const target = tenant.restaurantTables.find((t: RestaurantTable) => t.id === targetTableId);

    if (!source || !target) throw new Error('Source or Target table not found');
    if (target.status !== 'vacant') throw new Error(`Target table ${target.tableNumber} is already occupied (${target.status})`);

    // Move order over
    target.status = source.status;
    target.activeOrderId = source.activeOrderId;
    target.activeKotIds = source.activeKotIds;
    target.guestCount = source.guestCount;
    target.seatedAt = source.seatedAt;
    target.lastKotAt = source.lastKotAt;
    target.currentBillTotal = source.currentBillTotal;
    target.assignedCaptain = source.assignedCaptain;

    // Reset source
    source.status = 'vacant';
    source.activeOrderId = undefined;
    source.activeKotIds = [];
    source.guestCount = undefined;
    source.seatedAt = undefined;
    source.lastKotAt = undefined;
    source.currentBillTotal = 0;

    // Update order reference
    const order = tenant.restaurantOrders?.find((o: RestaurantOrder) => o.id === target.activeOrderId);
    if (order) {
      order.tableId = target.id;
      order.tableNumber = target.tableNumber;
    }

    const audit: TableTransferAudit = {
      id: `xfer-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceTable: source.tableNumber,
      targetTable: target.tableNumber,
      transferredBy,
      authorizedBy: 'Manager Vikram',
      reason,
      itemCount: order?.kots.reduce((acc: number, k: RestaurantKot) => acc + k.items.length, 0) || 0
    };
    tenant.restaurantTableAudits.unshift(audit);

    this.persist();
    return audit;
  }

  public printGuestCheck(
    tenantId: string,
    tableId: string,
    reprintedBy = 'Cashier Priya',
    reprintReason?: string
  ): { order: RestaurantOrder; isDuplicate: boolean; printCount: number } {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const order = tenant.restaurantOrders?.find((o: RestaurantOrder) => o.id === table.activeOrderId);
    if (!order) throw new Error('Active order not found for table');

    table.status = 'billed';
    order.orderStatus = 'billed';
    order.lastBilledAt = new Date().toISOString();
    order.billPrintedCount = (order.billPrintedCount || 0) + 1;

    const isDuplicate = order.billPrintedCount > 1;
    if (isDuplicate) {
      order.reprintHistory.push({
        timestamp: new Date().toISOString(),
        reprintedBy,
        reason: reprintReason || 'Guest requested revised copy'
      });
    }

    this.persist();
    return { order, isDuplicate, printCount: order.billPrintedCount };
  }

  public settleTableBill(
    tenantId: string,
    tableId: string,
    payload: {
      payments: Array<{ method: 'cash' | 'upi' | 'card' | 'credit_khata' | 'split'; amount: number; reference?: string }>;
      customerName?: string;
      customerPhone?: string;
      serviceChargePercentage?: number;
      discountAmount?: number;
    }
  ): { order: RestaurantOrder; table: RestaurantTable } {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const order = tenant.restaurantOrders?.find((o: RestaurantOrder) => o.id === table.activeOrderId);
    if (!order) throw new Error('No active order to settle');

    // Calculate final billing breakdown
    let subtotal = 0;
    const soldMenuItems: Array<{ menuItemId: string; quantity: number }> = [];

    for (const k of order.kots) {
      for (const item of k.items) {
        if (item.status !== 'cancelled') {
          const modTotal = (item.selectedModifiers || []).reduce((acc: number, m: any) => acc + (m.extraPrice || 0), 0);
          subtotal += (item.unitPrice + modTotal) * item.quantity;
          soldMenuItems.push({ menuItemId: item.menuItemId, quantity: item.quantity });
        }
      }
    }

    const discount = payload.discountAmount || 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const serviceCharge = payload.serviceChargePercentage ? taxableSubtotal * (payload.serviceChargePercentage / 100) : 0;
    const cgst = taxableSubtotal * 0.025; // 2.5%
    const sgst = taxableSubtotal * 0.025; // 2.5%
    const exactTotal = taxableSubtotal + serviceCharge + cgst + sgst;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Number((grandTotal - exactTotal).toFixed(2));

    order.subtotal = subtotal;
    order.discount = discount;
    order.serviceCharge = serviceCharge;
    order.cgst = cgst;
    order.sgst = sgst;
    order.roundOff = roundOff;
    order.grandTotal = grandTotal;
    order.payments = payload.payments;
    order.customerName = payload.customerName;
    order.customerPhone = payload.customerPhone;
    order.orderStatus = 'settled';
    order.settledAt = new Date().toISOString();

    // ========================================================
    // BOM RECIPE INGREDIENT STOCK DEDUCTION
    // ========================================================
    if (tenant.restaurantRecipes && tenant.products) {
      for (const sold of soldMenuItems) {
        const recipe = tenant.restaurantRecipes.find((r: RestaurantRecipe) => r.menuItemId === sold.menuItemId);
        if (recipe) {
          for (const ing of recipe.ingredients) {
            const rawProd = tenant.products.find((p: Product) => p.id === ing.rawMaterialProductId);
            if (rawProd) {
              const consumed = Number((ing.quantityNeeded * sold.quantity).toFixed(3));
              const prev = rawProd.stockQuantity;
              rawProd.stockQuantity = Math.max(0, Number((rawProd.stockQuantity - consumed).toFixed(3)));
              rawProd.updatedAt = new Date().toISOString();

              if (!tenant.stockMovements) tenant.stockMovements = [];
              tenant.stockMovements.unshift({
                id: `mov-recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                tenantId,
                productId: rawProd.id,
                productName: rawProd.name,
                type: 'sale',
                quantityChange: -consumed,
                previousStock: prev,
                newStock: rawProd.stockQuantity,
                reason: `Recipe Auto-Deduct: Order ${order.orderNumber} (${recipe.menuItemName} x${sold.quantity})`,
                referenceId: order.id,
                performedByUserId: 'system-recipe-engine',
                performedByUserName: 'Recipe Auto-Deduction Engine',
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    // Set Table to Cleaning
    table.status = 'cleaning';
    table.activeOrderId = undefined;
    table.activeKotIds = [];
    table.currentBillTotal = 0;

    this.persist();
    return { order, table };
  }

  public saveRecipe(tenantId: string, recipe: RestaurantRecipe): RestaurantRecipe {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantRecipes) tenant.restaurantRecipes = [];

    const existingIndex = tenant.restaurantRecipes.findIndex((r: RestaurantRecipe) => r.id === recipe.id || r.menuItemId === recipe.menuItemId);
    if (existingIndex >= 0) {
      tenant.restaurantRecipes[existingIndex] = recipe;
    } else {
      tenant.restaurantRecipes.push(recipe);
    }

    this.persist();
    return recipe;
  }

  public resetTableToVacant(tenantId: string, tableId: string): RestaurantTable {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    table.status = 'vacant';
    table.guestCount = undefined;
    table.seatedAt = undefined;
    table.lastKotAt = undefined;
    table.currentBillTotal = 0;
    table.activeOrderId = undefined;
    table.activeKotIds = [];

    this.persist();
    return table;
  }

  // ==========================================================
  // FLOOR & TABLE CONFIGURATION (Sections & Tables CRUD)
  // ==========================================================

  public createRestaurantSection(
    tenantId: string,
    payload: CreateRestaurantSectionPayload
  ): RestaurantSection {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantSections) tenant.restaurantSections = [];

    const newSection: RestaurantSection = {
      id: `sec-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      sortOrder: payload.sortOrder || tenant.restaurantSections.length + 1
    };

    tenant.restaurantSections.push(newSection);
    this.persist();
    return newSection;
  }

  public updateRestaurantSection(
    tenantId: string,
    sectionId: string,
    payload: UpdateRestaurantSectionPayload
  ): RestaurantSection {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantSections) tenant.restaurantSections = [];

    const section = tenant.restaurantSections.find((s: RestaurantSection) => s.id === sectionId);
    if (!section) throw new Error('Dining section not found');

    if (payload.name !== undefined) section.name = payload.name.trim();
    if (payload.description !== undefined) section.description = payload.description.trim();
    if (payload.sortOrder !== undefined) section.sortOrder = payload.sortOrder;

    this.persist();
    return section;
  }

  public deleteRestaurantSection(tenantId: string, sectionId: string): void {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantSections) tenant.restaurantSections = [];
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const section = tenant.restaurantSections.find((s: RestaurantSection) => s.id === sectionId);
    if (!section) throw new Error('Dining section not found');

    // Safety guard: cannot delete if tables are assigned to this section
    const assignedTables = tenant.restaurantTables.filter(
      (t: RestaurantTable) => t.sectionId === sectionId
    );
    if (assignedTables.length > 0) {
      throw new Error(`Cannot delete section "${section.name}" because it contains ${assignedTables.length} table(s). Please delete or reassign them to another section first.`);
    }

    tenant.restaurantSections = tenant.restaurantSections.filter((s: RestaurantSection) => s.id !== sectionId);
    this.persist();
  }

  public createRestaurantTable(
    tenantId: string,
    payload: CreateRestaurantTablePayload
  ): RestaurantTable {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const normalizedNumber = payload.tableNumber.trim().toUpperCase();
    const existing = tenant.restaurantTables.find(
      (t: RestaurantTable) => t.tableNumber.toUpperCase() === normalizedNumber
    );
    if (existing) {
      throw new Error(`Table number "${payload.tableNumber}" is already in use.`);
    }

    const newTable: RestaurantTable = {
      id: `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sectionId: payload.sectionId,
      tableNumber: normalizedNumber,
      capacity: Math.max(1, payload.capacity || 4),
      status: 'vacant',
      shape: payload.shape || 'square',
      assignedCaptain: payload.assignedCaptain?.trim() || undefined,
      currentBillTotal: 0,
      activeKotIds: []
    };

    tenant.restaurantTables.push(newTable);
    this.persist();
    return newTable;
  }

  public updateRestaurantTable(
    tenantId: string,
    tableId: string,
    payload: UpdateRestaurantTablePayload
  ): RestaurantTable {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    if (payload.tableNumber !== undefined) {
      const normalized = payload.tableNumber.trim().toUpperCase();
      const duplicate = tenant.restaurantTables.find(
        (t: RestaurantTable) => t.id !== tableId && t.tableNumber.toUpperCase() === normalized
      );
      if (duplicate) {
        throw new Error(`Table number "${payload.tableNumber}" is already in use by another table.`);
      }
      table.tableNumber = normalized;
    }

    if (payload.sectionId !== undefined) table.sectionId = payload.sectionId;
    if (payload.capacity !== undefined) table.capacity = Math.max(1, payload.capacity);
    if (payload.shape !== undefined) table.shape = payload.shape;
    if (payload.assignedCaptain !== undefined) table.assignedCaptain = payload.assignedCaptain.trim() || undefined;
    if (payload.status !== undefined) table.status = payload.status;

    this.persist();
    return table;
  }

  public deleteRestaurantTable(tenantId: string, tableId: string): void {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const table = tenant.restaurantTables.find((t: RestaurantTable) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    if (table.status !== 'vacant' && table.status !== 'cleaning') {
      throw new Error(`Cannot delete Table ${table.tableNumber} while it is occupied (${table.status}). Please settle or transfer the table first.`);
    }

    tenant.restaurantTables = tenant.restaurantTables.filter((t: RestaurantTable) => t.id !== tableId);
    this.persist();
  }

  public batchCreateRestaurantTables(
    tenantId: string,
    payload: BatchCreateTablesPayload
  ): RestaurantTable[] {
    const tenant = this.getTenantData(tenantId);
    if (!tenant.restaurantTables) tenant.restaurantTables = [];

    const created: RestaurantTable[] = [];
    const prefix = (payload.prefix || 'T-').trim().toUpperCase();

    for (let i = 0; i < payload.count; i++) {
      const num = payload.startNumber + i;
      const tableNumber = `${prefix}${num < 10 ? '0' + num : num}`;

      // Skip if already exists
      if (tenant.restaurantTables.some((t: RestaurantTable) => t.tableNumber.toUpperCase() === tableNumber)) {
        continue;
      }

      const newTable: RestaurantTable = {
        id: `tbl-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        sectionId: payload.sectionId,
        tableNumber,
        capacity: Math.max(1, payload.capacity || 4),
        status: 'vacant',
        shape: payload.shape || 'square',
        assignedCaptain: payload.assignedCaptain?.trim() || undefined,
        currentBillTotal: 0,
        activeKotIds: []
      };

      tenant.restaurantTables.push(newTable);
      created.push(newTable);
    }

    this.persist();
    return created;
  }

  // ==========================================================
  // MENU ITEMS & DISHES CATALOG (CRUD & Availability)
  // ==========================================================

  public createRestaurantMenuItem(
    tenantId: string,
    payload: CreateRestaurantMenuItemPayload
  ): RestaurantMenuItem {
    const tenant = this.ensureTenantRestaurantData(tenantId);

    const code = (payload.code || payload.name.slice(0, 3)).trim().toUpperCase();
    const existing = tenant.restaurantMenuItems?.find(
      (m: RestaurantMenuItem) => m.code.toUpperCase() === code
    );
    if (existing) {
      throw new Error(`Item code "${code}" is already in use by "${existing.name}".`);
    }

    const newItem: RestaurantMenuItem = {
      id: `itm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: payload.name.trim(),
      code,
      categoryId: payload.categoryId || 'cat-general',
      categoryName: payload.categoryName?.trim() || 'General',
      price: Math.max(0, payload.price),
      taxRate: payload.taxRate ?? 5,
      prepTimeMinutes: payload.prepTimeMinutes || 10,
      station: payload.station || 'kitchen',
      dietary: payload.dietary || 'veg',
      description: payload.description?.trim() || '',
      isAvailable: payload.isAvailable ?? true,
      modifierGroups: payload.modifierGroups || []
    };

    if (!tenant.restaurantMenuItems) tenant.restaurantMenuItems = [];
    tenant.restaurantMenuItems.push(newItem);
    this.persist();
    return newItem;
  }

  public updateRestaurantMenuItem(
    tenantId: string,
    itemId: string,
    payload: UpdateRestaurantMenuItemPayload
  ): RestaurantMenuItem {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    const item = tenant.restaurantMenuItems?.find((m: RestaurantMenuItem) => m.id === itemId);
    if (!item) throw new Error('Menu item not found');

    if (payload.code !== undefined) {
      const code = payload.code.trim().toUpperCase();
      const duplicate = tenant.restaurantMenuItems?.find(
        (m: RestaurantMenuItem) => m.id !== itemId && m.code.toUpperCase() === code
      );
      if (duplicate) {
        throw new Error(`Item code "${code}" is already in use by "${duplicate.name}".`);
      }
      item.code = code;
    }

    if (payload.name !== undefined) item.name = payload.name.trim();
    if (payload.categoryId !== undefined) item.categoryId = payload.categoryId;
    if (payload.categoryName !== undefined) item.categoryName = payload.categoryName.trim();
    if (payload.price !== undefined) item.price = Math.max(0, payload.price);
    if (payload.taxRate !== undefined) item.taxRate = payload.taxRate;
    if (payload.prepTimeMinutes !== undefined) item.prepTimeMinutes = payload.prepTimeMinutes;
    if (payload.station !== undefined) item.station = payload.station;
    if (payload.dietary !== undefined) item.dietary = payload.dietary;
    if (payload.description !== undefined) item.description = payload.description.trim();
    if (payload.isAvailable !== undefined) item.isAvailable = payload.isAvailable;
    if (payload.modifierGroups !== undefined) item.modifierGroups = payload.modifierGroups;

    this.persist();
    return item;
  }

  public deleteRestaurantMenuItem(tenantId: string, itemId: string): void {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    const item = tenant.restaurantMenuItems?.find((m: RestaurantMenuItem) => m.id === itemId);
    if (!item) throw new Error('Menu item not found');

    // Safety guard: check if item is in any open or unbilled order
    const openOrders = tenant.restaurantOrders?.filter(o => o.orderStatus === 'open' || o.orderStatus === 'billed') || [];
    for (const order of openOrders) {
      for (const kot of order.kots) {
        if (kot.items.some(i => i.menuItemId === itemId && i.status !== 'cancelled')) {
          throw new Error(`Cannot delete "${item.name}" because it is currently ordered in active Order #${order.orderNumber}. Please settle or void the order first.`);
        }
      }
    }

    tenant.restaurantMenuItems = tenant.restaurantMenuItems?.filter((m: RestaurantMenuItem) => m.id !== itemId);
    // Also remove any linked recipe
    if (tenant.restaurantRecipes) {
      tenant.restaurantRecipes = tenant.restaurantRecipes.filter(r => r.menuItemId !== itemId);
    }
    this.persist();
  }

  public toggleMenuItemAvailability(tenantId: string, itemId: string): RestaurantMenuItem {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    const item = tenant.restaurantMenuItems?.find((m: RestaurantMenuItem) => m.id === itemId);
    if (!item) throw new Error('Menu item not found');
    item.isAvailable = !item.isAvailable;
    this.persist();
    return item;
  }

  public deleteRestaurantRecipe(tenantId: string, recipeId: string): void {
    const tenant = this.ensureTenantRestaurantData(tenantId);
    if (!tenant.restaurantRecipes) tenant.restaurantRecipes = [];
    tenant.restaurantRecipes = tenant.restaurantRecipes.filter(r => r.id !== recipeId);
    this.persist();
  }
}

export const mockStore = new MockDataStore();
