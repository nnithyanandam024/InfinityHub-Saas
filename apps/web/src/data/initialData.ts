import { Tenant, User, Product, Category, Supplier, Purchase, StockMovement, Plan, Module, Brand, ProductVariant, ProductBundle, Warehouse, WarehouseLocation, StockBalance, StockTransfer, Batch, SerialNumber, StocktakeSession, ReorderRule } from '@infinityhub/types';
import { PLATFORM_MODULES, ROLE_PERMISSIONS, SUBSCRIPTION_PLANS } from '@infinityhub/constants';

export interface TenantData {
  tenant: Tenant;
  users: User[];
  brands?: Brand[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  variants?: ProductVariant[];
  bundles?: ProductBundle[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  warehouses?: Warehouse[];
  warehouseLocations?: WarehouseLocation[];
  stockBalances?: StockBalance[];
  stockTransfers?: StockTransfer[];
  batches?: Batch[];
  serialNumbers?: SerialNumber[];
  stocktakeSessions?: StocktakeSession[];
  reorderRules?: ReorderRule[];
}

export const MOCK_PLANS: Plan[] = SUBSCRIPTION_PLANS;

// PLATFORM SCOPE USER: Super Admin has NO tenantId and strictly platform permissions
export const MOCK_SUPER_ADMIN_USER: User = {
  id: 'usr-super-admin',
  scope: 'platform',
  name: 'Vikram Adithya',
  email: 'admin@infinityhub.io',
  role: 'SUPER_ADMIN',
  status: 'active',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  password: 'password123',
  permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginAt: '2026-09-10T06:30:00Z'
};

// ==========================================
// 1. ABC SUPERMARKET DATASET
// ==========================================
export const ABC_SUPERMARKET_DATA: TenantData = {
  tenant: {
    id: 'tenant-abc-supermarket',
    name: 'ABC Supermarket',
    slug: 'abc-supermarket',
    planId: 'plan-professional',
    planName: 'Professional',
    status: 'active',
    ownerName: 'Rajesh Sharma',
    email: 'contact@abcsupermarket.in',
    phone: '+91 98401 23456',
    address: '42 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
    applicationId: 'inventory',
    applicationName: 'Inventory Management',
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
      productsCount: 10,
      maxProductsQuota: 5000,
      usersCount: 3,
      maxUsersQuota: 10,
      storageUsedMb: 24,
      maxStorageQuotaMb: 1024,
      lastActiveAt: '2026-09-10T08:35:00Z'
    },
    subscriptionExpiresAt: '2026-10-15T00:00:00Z',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-09-08T14:30:00Z'
  },
  users: [
    {
      id: 'usr-abc-owner',
      tenantId: 'tenant-abc-supermarket',
      scope: 'tenant',
      name: 'Rajesh Sharma',
      email: 'rajesh@abcsupermarket.in',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-02-15T09:00:00Z'
    },
    {
      id: 'usr-abc-mgr',
      tenantId: 'tenant-abc-supermarket',
      scope: 'tenant',
      name: 'Kavitha Ramasamy',
      email: 'kavitha.mgr@abcsupermarket.in',
      role: 'MANAGER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.MANAGER,
      createdAt: '2026-03-01T10:00:00Z'
    },
    {
      id: 'usr-abc-staff',
      tenantId: 'tenant-abc-supermarket',
      scope: 'tenant',
      name: 'Manoj Kumar',
      email: 'manoj.staff@abcsupermarket.in',
      role: 'STAFF',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.STAFF,
      createdAt: '2026-04-12T11:00:00Z'
    }
  ],
  brands: [
    { id: 'brand-aashirvaad', tenantId: 'tenant-abc-supermarket', name: 'Aashirvaad', description: 'Whole wheat flour, organic grains and staples', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'brand-tata', tenantId: 'tenant-abc-supermarket', name: 'Tata Consumer', description: 'Salt, pulses, premium tea, and packaged foods', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'brand-britannia', tenantId: 'tenant-abc-supermarket', name: 'Britannia', description: 'Biscuits, bakery loaves, dairy cheese and butter', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'brand-amul', tenantId: 'tenant-abc-supermarket', name: 'Amul', description: 'Fresh butter, ghee, cheese slices and curd', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'brand-himalaya', tenantId: 'tenant-abc-supermarket', name: 'Himalaya Herbals', description: 'Personal care, soaps, shampoos, and wellness products', productCount: 1, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'brand-daawat', tenantId: 'tenant-abc-supermarket', name: 'Daawat', description: 'Traditional basmati rice and long grain varieties', productCount: 1, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' }
  ],
  categories: [
    { id: 'cat-abc-1', tenantId: 'tenant-abc-supermarket', name: 'Grocery & Staples', description: 'Rice, dals, flour, grains, and kitchen essentials', productCount: 4, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'cat-abc-2', tenantId: 'tenant-abc-supermarket', name: 'Cooking Oils & Ghee', description: 'Sunflower oil, mustard oil, groundnut oil, pure cow ghee', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'cat-abc-3', tenantId: 'tenant-abc-supermarket', name: 'Beverages', description: 'Tea, coffee, health drinks, packaged juices', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'cat-abc-4', tenantId: 'tenant-abc-supermarket', name: 'Dairy & Breakfast', description: 'Butter, cheese, milk, spreads, and breakfast cereals', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'cat-abc-5', tenantId: 'tenant-abc-supermarket', name: 'Personal Care & Hygiene', description: 'Soaps, handwash, shampoos, sanitizers', productCount: 2, status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' }
  ],
  suppliers: [
    { id: 'sup-abc-1', tenantId: 'tenant-abc-supermarket', name: 'Ravi Verma', companyName: 'Ravi Traders (Ravi Wholesale)', phone: '+91 98410 55678', email: 'orders@ravitraders.com', address: '12 Wholesale Bazaar, George Town, Chennai', taxNumber: '33AABCR1234F1Z1', status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'sup-abc-2', tenantId: 'tenant-abc-supermarket', name: 'Harish Patel', companyName: 'ABC Distributors Pvt Ltd', phone: '+91 98402 33441', email: 'sales@abcdist.co.in', address: 'Plot 7A, Industrial Estate, Guindy, Chennai', taxNumber: '33AABCA9876C1Z9', status: 'active', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
    { id: 'sup-abc-3', tenantId: 'tenant-abc-supermarket', name: 'Muralidharan', companyName: 'Sunrise Foods & Agro Supplies', phone: '+91 98433 99881', email: 'agro@sunrisegroup.in', address: '48 Grain Market Road, Madurai', taxNumber: '33AABCS4455D1Z5', status: 'active', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z' }
  ],
  products: [
    {
      id: 'prod-abc-1',
      tenantId: 'tenant-abc-supermarket',
      name: 'Ponni Boiled Rice 25kg',
      sku: 'R001',
      barcode: '8901030388121',
      categoryId: 'cat-abc-1',
      categoryName: 'Grocery & Staples',
      costPrice: 1250,
      sellingPrice: 1450,
      stockQuantity: 4,
      minimumStock: 10,
      unit: 'pack',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-09-08T11:00:00Z'
    },
    {
      id: 'prod-abc-2',
      tenantId: 'tenant-abc-supermarket',
      name: 'Refined White Sugar 5kg',
      sku: 'S001',
      barcode: '8901030388122',
      categoryId: 'cat-abc-1',
      categoryName: 'Grocery & Staples',
      costPrice: 220,
      sellingPrice: 280,
      stockQuantity: 2,
      minimumStock: 5,
      unit: 'pack',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-09-09T14:15:00Z'
    },
    {
      id: 'prod-abc-3',
      tenantId: 'tenant-abc-supermarket',
      name: 'Gold Winner Refined Sunflower Oil 1L',
      sku: 'O001',
      barcode: '8901030388123',
      categoryId: 'cat-abc-2',
      categoryName: 'Cooking Oils & Ghee',
      costPrice: 118,
      sellingPrice: 145,
      stockQuantity: 0,
      minimumStock: 8,
      unit: 'pack',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-09-10T08:00:00Z'
    },
    {
      id: 'prod-abc-4',
      tenantId: 'tenant-abc-supermarket',
      name: 'Daawat Rozana Super Basmati Rice 5kg',
      sku: 'R002',
      barcode: '8901030388124',
      categoryId: 'cat-abc-1',
      categoryName: 'Grocery & Staples',
      costPrice: 420,
      sellingPrice: 540,
      stockQuantity: 28,
      minimumStock: 6,
      unit: 'pack',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-09-01T12:00:00Z'
    },
    {
      id: 'prod-abc-5',
      tenantId: 'tenant-abc-supermarket',
      name: 'Aashirvaad Shudh Chakki Atta 10kg',
      sku: 'F001',
      barcode: '8901030388125',
      categoryId: 'cat-abc-1',
      categoryName: 'Grocery & Staples',
      costPrice: 380,
      sellingPrice: 460,
      stockQuantity: 18,
      minimumStock: 8,
      unit: 'pack',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-09-02T16:00:00Z'
    },
    {
      id: 'prod-abc-6',
      tenantId: 'tenant-abc-supermarket',
      name: 'GRB Pure Ghee 500ml Pet Jar',
      sku: 'G001',
      barcode: '8901030388126',
      categoryId: 'cat-abc-2',
      categoryName: 'Cooking Oils & Ghee',
      costPrice: 310,
      sellingPrice: 385,
      stockQuantity: 15,
      minimumStock: 5,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-09-05T09:00:00Z'
    },
    {
      id: 'prod-abc-7',
      tenantId: 'tenant-abc-supermarket',
      name: 'Tata Tea Gold Leaf 500g',
      sku: 'B001',
      barcode: '8901030388127',
      categoryId: 'cat-abc-3',
      categoryName: 'Beverages',
      costPrice: 240,
      sellingPrice: 295,
      stockQuantity: 3,
      minimumStock: 8,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-09-07T11:00:00Z'
    },
    {
      id: 'prod-abc-8',
      tenantId: 'tenant-abc-supermarket',
      name: 'Bru Instant Coffee Powder 200g Pouch',
      sku: 'B002',
      barcode: '8901030388128',
      categoryId: 'cat-abc-3',
      categoryName: 'Beverages',
      costPrice: 195,
      sellingPrice: 245,
      stockQuantity: 24,
      minimumStock: 6,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-02-22T10:00:00Z',
      updatedAt: '2026-09-04T15:00:00Z'
    },
    {
      id: 'prod-abc-9',
      tenantId: 'tenant-abc-supermarket',
      name: 'Amul Salted Table Butter 500g',
      sku: 'D001',
      barcode: '8901030388129',
      categoryId: 'cat-abc-4',
      categoryName: 'Dairy & Breakfast',
      costPrice: 235,
      sellingPrice: 275,
      stockQuantity: 9,
      minimumStock: 5,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-02-25T10:00:00Z',
      updatedAt: '2026-09-08T09:00:00Z'
    },
    {
      id: 'prod-abc-10',
      tenantId: 'tenant-abc-supermarket',
      name: 'Dettol Original Germ Protection Handwash 750ml Refill',
      sku: 'H001',
      barcode: '8901030388130',
      categoryId: 'cat-abc-5',
      categoryName: 'Personal Care & Hygiene',
      costPrice: 88,
      sellingPrice: 120,
      stockQuantity: 36,
      minimumStock: 10,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z'
    }
  ],
  variants: [
    {
      id: 'var-tea-250g',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-7',
      sku: 'T001-250G',
      barcode: '8901030388127-250',
      attributes: { 'Pack Size': '250g' },
      costPrice: 65,
      sellingPrice: 85,
      mrp: 90,
      stockQuantity: 20,
      status: 'active',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-02-18T10:00:00Z'
    },
    {
      id: 'var-tea-500g',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-7',
      sku: 'T001-500G',
      barcode: '8901030388127-500',
      attributes: { 'Pack Size': '500g' },
      costPrice: 120,
      sellingPrice: 155,
      mrp: 165,
      stockQuantity: 15,
      status: 'active',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-02-18T10:00:00Z'
    },
    {
      id: 'var-tea-1kg',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-7',
      sku: 'T001-1KG',
      barcode: '8901030388127-1K',
      attributes: { 'Pack Size': '1kg' },
      costPrice: 230,
      sellingPrice: 295,
      mrp: 310,
      stockQuantity: 10,
      status: 'active',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-02-18T10:00:00Z'
    }
  ],
  bundles: [
    {
      id: 'bndl-breakfast-kit',
      tenantId: 'tenant-abc-supermarket',
      bundleProductId: 'prod-abc-bndl-1',
      bundleProductName: 'Morning Breakfast Family Bundle',
      components: [
        { componentProductId: 'prod-abc-7', componentProductName: 'Tata Tea Gold Leaf Tea 500g', sku: 'T001', quantity: 1, unitCost: 120 },
        { componentProductId: 'prod-abc-8', componentProductName: 'Amul Salted Butter 500g', sku: 'B001', quantity: 1, unitCost: 225 },
        { componentProductId: 'prod-abc-2', componentProductName: 'Refined White Sugar 5kg', sku: 'S001', quantity: 1, unitCost: 220 }
      ],
      assemblyInstructions: 'Pack in insulated thermal tote bag with freshness seal.',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z'
    }
  ],
  purchases: [
    {
      id: 'po-abc-1024',
      tenantId: 'tenant-abc-supermarket',
      invoiceNumber: 'PO-1024',
      supplierId: 'sup-abc-1',
      supplierName: 'Ravi Traders (Ravi Wholesale)',
      purchaseDate: '2026-09-10',
      items: [
        { id: 'item-1024-1', productId: 'prod-abc-1', productName: 'Ponni Boiled Rice 25kg', sku: 'R001', quantity: 20, unitCost: 1250, totalCost: 25000 },
        { id: 'item-1024-2', productId: 'prod-abc-4', productName: 'Daawat Rozana Super Basmati Rice 5kg', sku: 'R002', quantity: 30, unitCost: 420, totalCost: 12600 },
        { id: 'item-1024-3', productId: 'prod-abc-5', productName: 'Aashirvaad Shudh Chakki Atta 10kg', sku: 'F001', quantity: 15, unitCost: 380, totalCost: 5700 }
      ],
      subtotal: 43300,
      tax: 0,
      discount: 800,
      totalAmount: 42500,
      status: 'completed',
      notes: 'Urgent weekend restocking for grain section',
      createdAt: '2026-09-10T08:30:00Z'
    }
  ],
  stockMovements: [
    {
      id: 'mov-abc-1',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-1',
      productName: 'Ponni Boiled Rice 25kg',
      type: 'purchase',
      quantityChange: 20,
      previousStock: 4,
      newStock: 24,
      reason: 'PO-1024 Goods Received',
      referenceId: 'po-abc-1024',
      performedByUserId: 'usr-abc-owner',
      performedByUserName: 'Rajesh Sharma',
      createdAt: '2026-09-10T08:35:00Z'
    }
  ],
  warehouses: [
    {
      id: 'wh-abc-main',
      tenantId: 'tenant-abc-supermarket',
      name: 'Main T. Nagar Central Depot',
      code: 'WH-TNAGAR',
      address: '42 Anna Salai, T. Nagar, Chennai',
      isDefault: true,
      status: 'active',
      createdAt: '2026-02-15T09:00:00Z',
      updatedAt: '2026-02-15T09:00:00Z'
    },
    {
      id: 'wh-abc-annex',
      tenantId: 'tenant-abc-supermarket',
      name: 'South Chennai Bulk Storage',
      code: 'WH-GUINDY',
      address: 'Plot 18, Guindy Industrial Estate, Chennai',
      isDefault: false,
      status: 'active',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z'
    }
  ],
  warehouseLocations: [
    { id: 'loc-abc-1', tenantId: 'tenant-abc-supermarket', warehouseId: 'wh-abc-main', code: 'AISLE-A1', name: 'Grain & Staples Rack A1', description: 'Heavy bulk bag pallets' },
    { id: 'loc-abc-2', tenantId: 'tenant-abc-supermarket', warehouseId: 'wh-abc-main', code: 'CHILL-01', name: 'Dairy Cold Storage 01', description: 'Refrigerated 4°C section' },
    { id: 'loc-abc-3', tenantId: 'tenant-abc-supermarket', warehouseId: 'wh-abc-annex', code: 'BULK-B4', name: 'Bulk Pallet Bay B4', description: 'Reserve overflow inventory' }
  ],
  stockBalances: [
    { id: 'sb-abc-1', tenantId: 'tenant-abc-supermarket', productId: 'prod-abc-1', warehouseId: 'wh-abc-main', locationId: 'loc-abc-1', quantity: 35, reservedQuantity: 5, updatedAt: '2026-09-10T08:30:00Z' },
    { id: 'sb-abc-2', tenantId: 'tenant-abc-supermarket', productId: 'prod-abc-4', warehouseId: 'wh-abc-main', locationId: 'loc-abc-1', quantity: 28, reservedQuantity: 0, updatedAt: '2026-09-10T08:30:00Z' },
    { id: 'sb-abc-3', tenantId: 'tenant-abc-supermarket', productId: 'prod-abc-9', warehouseId: 'wh-abc-main', locationId: 'loc-abc-2', quantity: 9, reservedQuantity: 0, updatedAt: '2026-09-08T09:00:00Z' }
  ],
  stockTransfers: [
    {
      id: 'tr-abc-101',
      tenantId: 'tenant-abc-supermarket',
      transferNumber: 'TR-2026-001',
      sourceWarehouseId: 'wh-abc-annex',
      sourceWarehouseName: 'South Chennai Bulk Storage',
      destinationWarehouseId: 'wh-abc-main',
      destinationWarehouseName: 'Main T. Nagar Central Depot',
      status: 'in_transit',
      items: [
        { id: 'tri-1', transferId: 'tr-abc-101', productId: 'prod-abc-1', productName: 'Ponni Boiled Rice 25kg', sku: 'R001', quantity: 15 }
      ],
      notes: 'Transferring weekend replenishment buffer to retail retail depot',
      createdByUserId: 'usr-abc-owner',
      createdByUserName: 'Rajesh Sharma',
      dispatchedAt: '2026-09-10T14:00:00Z',
      createdAt: '2026-09-10T12:00:00Z',
      updatedAt: '2026-09-10T14:00:00Z'
    }
  ],
  batches: [
    {
      id: 'bat-abc-001',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-9',
      productName: 'Amul Salted Table Butter 500g',
      batchNumber: 'LOT-AMUL-2026-09',
      warehouseId: 'wh-abc-main',
      manufacturedAt: '2026-08-01',
      expiryAt: '2026-09-28',
      quantity: 9,
      initialQuantity: 25,
      status: 'active',
      createdAt: '2026-08-05T10:00:00Z',
      updatedAt: '2026-08-05T10:00:00Z'
    },
    {
      id: 'bat-abc-002',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-10',
      productName: 'Dettol Original Germ Protection Handwash 750ml Refill',
      batchNumber: 'LOT-DTL-8834',
      warehouseId: 'wh-abc-main',
      manufacturedAt: '2026-06-01',
      expiryAt: '2027-06-01',
      quantity: 36,
      initialQuantity: 50,
      status: 'active',
      createdAt: '2026-06-10T10:00:00Z',
      updatedAt: '2026-06-10T10:00:00Z'
    }
  ],
  serialNumbers: [
    {
      id: 'sn-abc-001',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-1',
      productName: 'Ponni Boiled Rice 25kg (Bale Tag)',
      serialNumber: 'SR-PBR-2026-0001',
      status: 'in_stock',
      warehouseId: 'wh-abc-main',
      purchaseReference: 'PO-1024',
      createdAt: '2026-09-10T08:30:00Z',
      updatedAt: '2026-09-10T08:30:00Z'
    },
    {
      id: 'sn-abc-002',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-1',
      productName: 'Ponni Boiled Rice 25kg (Bale Tag)',
      serialNumber: 'SR-PBR-2026-0002',
      status: 'in_stock',
      warehouseId: 'wh-abc-main',
      purchaseReference: 'PO-1024',
      createdAt: '2026-09-10T08:30:00Z',
      updatedAt: '2026-09-10T08:30:00Z'
    }
  ],
  stocktakeSessions: [
    {
      id: 'stk-abc-001',
      tenantId: 'tenant-abc-supermarket',
      sessionNumber: 'STK-2026-01',
      warehouseId: 'wh-abc-main',
      warehouseName: 'Main T. Nagar Central Depot',
      status: 'in_progress',
      notes: 'Monthly cycle count of grains and dry staples aisle',
      items: [
        { id: 'stki-1', sessionId: 'stk-abc-001', productId: 'prod-abc-1', productName: 'Ponni Boiled Rice 25kg', sku: 'R001', systemQuantity: 35, countedQuantity: 35, variance: 0, unitCost: 1250 },
        { id: 'stki-2', sessionId: 'stk-abc-001', productId: 'prod-abc-4', productName: 'Daawat Rozana Super Basmati Rice 5kg', sku: 'R002', systemQuantity: 28, countedQuantity: 27, variance: -1, unitCost: 420 },
        { id: 'stki-3', sessionId: 'stk-abc-001', productId: 'prod-abc-5', productName: 'Aashirvaad Shudh Chakki Atta 10kg', sku: 'F001', systemQuantity: 18, countedQuantity: 18, variance: 0, unitCost: 380 }
      ],
      initiatedByUserId: 'usr-abc-owner',
      initiatedByUserName: 'Rajesh Sharma',
      createdAt: '2026-09-10T09:00:00Z',
      updatedAt: '2026-09-10T09:30:00Z'
    }
  ],
  reorderRules: [
    {
      id: 'ror-abc-1',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-3',
      productName: 'Gold Winner Refined Sunflower Oil 1L',
      minStock: 8,
      reorderPoint: 10,
      reorderQuantity: 40,
      preferredSupplierId: 'sup-abc-2',
      preferredSupplierName: 'Vasanth Foods & Dairy (Vasanth Agencies)',
      autoGeneratePO: true
    },
    {
      id: 'ror-abc-2',
      tenantId: 'tenant-abc-supermarket',
      productId: 'prod-abc-9',
      productName: 'Amul Salted Table Butter 500g',
      minStock: 5,
      reorderPoint: 12,
      reorderQuantity: 30,
      preferredSupplierId: 'sup-abc-2',
      preferredSupplierName: 'Vasanth Foods & Dairy (Vasanth Agencies)',
      autoGeneratePO: true
    }
  ]
};

// ==========================================
// 2. KUMAR STORES DATASET
// ==========================================
export const KUMAR_STORES_DATA: TenantData = {
  tenant: {
    id: 'tenant-kumar-stores',
    name: 'Kumar Stores',
    slug: 'kumar-stores',
    planId: 'plan-starter',
    planName: 'Starter',
    status: 'trial',
    ownerName: 'Suresh Kumar',
    email: 'suresh@kumarstores.com',
    phone: '+91 94440 98765',
    address: '18 Ritchie Street, Electronics Market, Chennai',
    applicationId: 'inventory',
    applicationName: 'Inventory Management',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 18.0,
      enableBarcodeScanning: true,
      lowStockThresholdDefault: 5
    },
    usage: {
      productsCount: 4,
      maxProductsQuota: 500,
      usersCount: 1,
      maxUsersQuota: 3,
      storageUsedMb: 8,
      maxStorageQuotaMb: 500,
      lastActiveAt: '2026-09-09T18:00:00Z'
    },
    subscriptionExpiresAt: '2026-09-25T00:00:00Z',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-07T16:00:00Z'
  },
  users: [
    {
      id: 'usr-kumar-owner',
      tenantId: 'tenant-kumar-stores',
      scope: 'tenant',
      name: 'Suresh Kumar',
      email: 'suresh@kumarstores.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-08-01T10:00:00Z'
    }
  ],
  categories: [
    { id: 'cat-kum-1', tenantId: 'tenant-kumar-stores', name: 'Mobile Accessories', description: 'Cases, tempered glass, cables and adapters', productCount: 3, status: 'active', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z' },
    { id: 'cat-kum-2', tenantId: 'tenant-kumar-stores', name: 'Charging & Power', description: 'Fast chargers, GaN adapters, power banks', productCount: 2, status: 'active', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z' },
    { id: 'cat-kum-3', tenantId: 'tenant-kumar-stores', name: 'Audio & Wearables', description: 'TWS earbuds, Bluetooth neckbands, smartwatches', productCount: 2, status: 'active', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z' }
  ],
  suppliers: [
    { id: 'sup-kum-1', tenantId: 'tenant-kumar-stores', name: 'Alok Jain', companyName: 'Apex Electronics Supplies', phone: '+91 98840 11223', email: 'alok@apexelectronics.in', address: 'Shop 4, Narayana Mudali St, Chennai', taxNumber: '33AAICA2211E1Z3', status: 'active', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z' }
  ],
  products: [
    {
      id: 'prod-kum-1',
      tenantId: 'tenant-kumar-stores',
      name: 'GaN 65W Dual Port Fast Charger',
      sku: 'CHG-65W',
      barcode: '890455500101',
      categoryId: 'cat-kum-2',
      categoryName: 'Charging & Power',
      costPrice: 850,
      sellingPrice: 1499,
      stockQuantity: 18,
      minimumStock: 5,
      unit: 'pcs',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-08-01T11:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z'
    },
    {
      id: 'prod-kum-2',
      tenantId: 'tenant-kumar-stores',
      name: 'Braided 100W USB-C to USB-C Cable 2M',
      sku: 'CBL-CC-2M',
      barcode: '890455500102',
      categoryId: 'cat-kum-1',
      categoryName: 'Mobile Accessories',
      costPrice: 140,
      sellingPrice: 399,
      stockQuantity: 42,
      minimumStock: 10,
      unit: 'pcs',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1608248597359-25339d671ec4?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1608248597359-25339d671ec4?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-08-01T11:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z'
    },
    {
      id: 'prod-kum-3',
      tenantId: 'tenant-kumar-stores',
      name: 'Pro ANC Wireless Earbuds with Spatial Audio',
      sku: 'AUD-TWS-PRO',
      barcode: '890455500103',
      categoryId: 'cat-kum-3',
      categoryName: 'Audio & Wearables',
      costPrice: 1100,
      sellingPrice: 2299,
      stockQuantity: 1,
      minimumStock: 4,
      unit: 'pcs',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-08-03T11:00:00Z',
      updatedAt: '2026-09-09T18:00:00Z'
    },
    {
      id: 'prod-kum-4',
      tenantId: 'tenant-kumar-stores',
      name: 'Magnetic 10000mAh Slim Power Bank',
      sku: 'PB-MAG-10K',
      barcode: '890455500104',
      categoryId: 'cat-kum-2',
      categoryName: 'Charging & Power',
      costPrice: 750,
      sellingPrice: 1599,
      stockQuantity: 0,
      minimumStock: 5,
      unit: 'pcs',
      status: 'active',
      imagePath: 'https://images.unsplash.com/photo-1609592424040-5e5898d975db?w=1000&auto=format&fit=crop&q=80',
      thumbnailPath: 'https://images.unsplash.com/photo-1609592424040-5e5898d975db?w=300&auto=format&fit=crop&q=80',
      createdAt: '2026-08-04T11:00:00Z',
      updatedAt: '2026-09-10T09:00:00Z'
    }
  ],
  purchases: [],
  stockMovements: []
};

// ==========================================
// 3. GREEN MART DATASET
// ==========================================
export const GREEN_MART_DATA: TenantData = {
  tenant: {
    id: 'tenant-green-mart',
    name: 'Green Mart Organics',
    slug: 'green-mart',
    planId: 'plan-professional',
    planName: 'Professional',
    status: 'active',
    ownerName: 'Priya Narayanan',
    email: 'priya@greenmartorganics.com',
    phone: '+91 97910 44332',
    address: '88 Greenways Road, R.A. Puram, Chennai',
    applicationId: 'inventory',
    applicationName: 'Inventory Management',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 0.0,
      enableBarcodeScanning: true,
      lowStockThresholdDefault: 8
    },
    usage: {
      productsCount: 2,
      maxProductsQuota: 5000,
      usersCount: 1,
      maxUsersQuota: 10,
      storageUsedMb: 5,
      maxStorageQuotaMb: 1024,
      lastActiveAt: '2026-09-09T11:00:00Z'
    },
    subscriptionExpiresAt: '2026-11-20T00:00:00Z',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z'
  },
  users: [
    {
      id: 'usr-green-owner',
      tenantId: 'tenant-green-mart',
      scope: 'tenant',
      name: 'Priya Narayanan',
      email: 'priya@greenmartorganics.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-03-10T09:00:00Z'
    }
  ],
  categories: [
    { id: 'cat-grn-1', tenantId: 'tenant-green-mart', name: 'Millets & Heritage Rice', description: 'Unpolished traditional grains and millets', productCount: 2, status: 'active', createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-03-10T09:00:00Z' }
  ],
  suppliers: [],
  products: [
    {
      id: 'prod-grn-1',
      tenantId: 'tenant-green-mart',
      name: 'Organic Traditional Kodo Millet (Varagu) 1kg',
      sku: 'MLT-KOD-01',
      barcode: '8907812001',
      categoryId: 'cat-grn-1',
      categoryName: 'Millets & Heritage Rice',
      costPrice: 90,
      sellingPrice: 140,
      stockQuantity: 32,
      minimumStock: 8,
      unit: 'pack',
      status: 'active',
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z'
    }
  ],
  purchases: [],
  stockMovements: []
};

// ==========================================
// 4. CITY RETAIL DATASET
// ==========================================
export const CITY_RETAIL_DATA: TenantData = {
  tenant: {
    id: 'tenant-city-retail',
    name: 'City Retail Hardware',
    slug: 'city-retail',
    planId: 'plan-enterprise',
    planName: 'Enterprise',
    status: 'active',
    ownerName: 'Arvind Singhal',
    email: 'arvind@cityretailtools.com',
    phone: '+91 98200 66778',
    address: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    applicationId: 'pos',
    applicationName: 'Billing & POS',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 18.0,
      enableBarcodeScanning: true,
      lowStockThresholdDefault: 5
    },
    usage: {
      productsCount: 2,
      maxProductsQuota: 50000,
      usersCount: 1,
      maxUsersQuota: 50,
      storageUsedMb: 42,
      maxStorageQuotaMb: 5120,
      lastActiveAt: '2026-09-09T17:00:00Z'
    },
    subscriptionExpiresAt: '2027-01-10T00:00:00Z',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-09-06T15:00:00Z'
  },
  users: [
    {
      id: 'usr-city-owner',
      tenantId: 'tenant-city-retail',
      scope: 'tenant',
      name: 'Arvind Singhal',
      email: 'arvind@cityretailtools.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-01-20T08:00:00Z'
    },
    {
      id: 'usr-city-owner-alias',
      tenantId: 'tenant-city-retail',
      scope: 'tenant',
      name: 'Arvind Singhal',
      email: 'city@retail.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-01-20T08:00:00Z'
    },
    {
      id: 'usr-city-cashier',
      tenantId: 'tenant-city-retail',
      scope: 'tenant',
      name: 'Dinesh Kumar',
      email: 'cashier@cityretailtools.com',
      role: 'STAFF',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.STAFF,
      createdAt: '2026-01-20T08:00:00Z'
    }
  ],
  categories: [],
  suppliers: [],
  products: [],
  purchases: [],
  stockMovements: []
};

// ==========================================
// 5. XYZ RESTAURANT DATASET
// ==========================================
export const XYZ_RESTAURANT_DATA: TenantData = {
  tenant: {
    id: 'tenant-xyz-restaurant',
    name: 'XYZ Gourmet Bistro',
    slug: 'xyz-bistro',
    planId: 'plan-professional',
    planName: 'Professional',
    status: 'active',
    ownerName: 'Chef Rahul Kapoor',
    email: 'contact@xyzbistro.com',
    phone: '+91 98840 77112',
    address: '14 Park Avenue, Indiranagar, Bengaluru',
    applicationId: 'restaurant',
    applicationName: 'Restaurant Management',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 5.0,
      enableBarcodeScanning: false,
      lowStockThresholdDefault: 10
    },
    usage: {
      productsCount: 0,
      maxProductsQuota: 5000,
      usersCount: 4,
      maxUsersQuota: 10,
      storageUsedMb: 12,
      maxStorageQuotaMb: 1024,
      lastActiveAt: '2026-09-10T09:15:00Z'
    },
    subscriptionExpiresAt: '2026-12-31T00:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-09-10T09:15:00Z'
  },
  users: [
    {
      id: 'usr-xyz-owner',
      tenantId: 'tenant-xyz-restaurant',
      scope: 'tenant',
      name: 'Chef Rahul Kapoor',
      email: 'rahul@xyzbistro.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-04-01T08:00:00Z'
    }
  ],
  categories: [],
  suppliers: [],
  products: [],
  purchases: [],
  stockMovements: []
};

// ==========================================
// 6. APEX GLOBAL CORP (EMPLOYEE MGMT)
// ==========================================
export const APEX_CORP_DATA: TenantData = {
  tenant: {
    id: 'tenant-apex-corp',
    name: 'Apex Global Corp',
    slug: 'apex-corp',
    planId: 'plan-enterprise',
    planName: 'Enterprise',
    status: 'trial',
    ownerName: 'Neha Deshmukh',
    email: 'hr@apexglobalcorp.com',
    phone: '+91 99000 88221',
    address: 'Tech Park Zone 2, Whitefield, Bengaluru',
    applicationId: 'employee',
    applicationName: 'Employee Management',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 0.0,
      enableBarcodeScanning: false,
      lowStockThresholdDefault: 5
    },
    usage: {
      productsCount: 0,
      maxProductsQuota: 50000,
      usersCount: 12,
      maxUsersQuota: 50,
      storageUsedMb: 35,
      maxStorageQuotaMb: 5120,
      lastActiveAt: '2026-09-10T07:45:00Z'
    },
    subscriptionExpiresAt: '2026-09-30T00:00:00Z',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-09-08T11:00:00Z'
  },
  users: [
    {
      id: 'usr-apex-owner',
      tenantId: 'tenant-apex-corp',
      scope: 'tenant',
      name: 'Neha Deshmukh',
      email: 'neha@apexglobalcorp.com',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-07-15T09:00:00Z'
    }
  ],
  categories: [],
  suppliers: [],
  products: [],
  purchases: [],
  stockMovements: []
};

export const SUSPENDED_STORE_DATA: TenantData = {
  tenant: {
    id: 'tenant-suspended-store',
    name: 'Metro Daily Mart',
    slug: 'metro-mart',
    planId: 'plan-starter',
    planName: 'Starter',
    status: 'suspended',
    ownerName: 'Dev Anand',
    email: 'contact@metromart.in',
    phone: '+91 98400 99887',
    applicationId: 'inventory',
    applicationName: 'Inventory Management',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      taxRate: 5.0,
      enableBarcodeScanning: false,
      lowStockThresholdDefault: 10
    },
    usage: {
      productsCount: 15,
      maxProductsQuota: 500,
      usersCount: 1,
      maxUsersQuota: 3,
      storageUsedMb: 5,
      maxStorageQuotaMb: 1024,
      lastActiveAt: '2026-08-20T10:00:00Z'
    },
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  users: [
    {
      id: 'usr-suspended-owner',
      tenantId: 'tenant-suspended-store',
      scope: 'tenant',
      name: 'Dev Anand',
      email: 'owner@suspendedmart.in',
      role: 'TENANT_OWNER',
      status: 'active',
      password: 'password123',
      permissions: ROLE_PERMISSIONS.TENANT_OWNER,
      createdAt: '2026-03-01T08:00:00Z'
    }
  ],
  categories: [],
  suppliers: [],
  products: [],
  purchases: [],
  stockMovements: []
};

export const INITIAL_TENANTS_MAP: Record<string, TenantData> = {
  'tenant-abc-supermarket': ABC_SUPERMARKET_DATA,
  'tenant-kumar-stores': KUMAR_STORES_DATA,
  'tenant-green-mart': GREEN_MART_DATA,
  'tenant-city-retail': CITY_RETAIL_DATA,
  'tenant-xyz-restaurant': XYZ_RESTAURANT_DATA,
  'tenant-apex-corp': APEX_CORP_DATA,
  'tenant-suspended-store': SUSPENDED_STORE_DATA
};
