import {
  Role,
  Permission,
  PlatformPermission,
  TenantPermission,
  AuthScope,
  Module,
  PlatformApplication,
  ModuleId,
  StockMovementType,
  ProductStatus,
  SubscriptionStatus,
  TenantStatus,
  Plan,
  InventoryFeature,
  PlanTier,
  FeatureDefinition,
  TransferStatus,
  StocktakeStatus,
  SerialStatus,
  ApplicationId
} from '@infinityhub/types';

export const APP_NAME = 'InfinityHub';

export const APPLICATION_BUNDLES: Record<ApplicationId, ApplicationId[]> = {
  pos: ['pos', 'inventory'], // Billing & POS natively includes full Inventory Management
  inventory: ['inventory'], // Pure Inventory Management (stock, catalog, suppliers, purchases). Billing & POS is NOT included.
  restaurant: ['restaurant', 'pos', 'inventory'],
  employee: ['employee'],
  appointment: ['appointment']
};

export const ROLE_SCOPES: Record<Role, AuthScope> = {
  SUPER_ADMIN: 'platform',
  TENANT_OWNER: 'tenant',
  MANAGER: 'tenant',
  STAFF: 'tenant'
};

export const ROLES: Record<Role, { label: string; scope: AuthScope; description: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    scope: 'platform',
    description: 'Platform Scope: Manages platform tenants, subscriptions, quotas, and modules.'
  },
  TENANT_OWNER: {
    label: 'Tenant Owner',
    scope: 'tenant',
    description: 'Tenant Scope: Full control over store catalog, inventory, purchases, team, and business settings.'
  },
  MANAGER: {
    label: 'Store Manager',
    scope: 'tenant',
    description: 'Tenant Scope: Operational control over catalog, purchases, stock adjustments, and reports.'
  },
  STAFF: {
    label: 'Store Staff',
    scope: 'tenant',
    description: 'Tenant Scope: Read-only catalog lookup and basic stock visibility.'
  }
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'platform.access',
    'platform.tenants.view',
    'platform.tenants.create',
    'platform.tenants.manage',
    'platform.plans.manage',
    'platform.modules.manage',
    'platform.users.view',
    'platform.audit.view'
  ],
  TENANT_OWNER: [
    'dashboard.view',
    'inventory.products.view',
    'inventory.products.create',
    'inventory.products.update',
    'inventory.products.delete',
    'inventory.brands.manage',
    'inventory.bundles.manage',
    'inventory.stock.view',
    'inventory.stock.adjust',
    'inventory.categories.manage',
    'inventory.suppliers.manage',
    'inventory.purchases.view',
    'inventory.purchases.create',
    'inventory.reports.view',
    'settings.business.view',
    'settings.business.edit',
    'settings.users.view',
    'settings.users.manage',
    'pos.terminal.view',
    'pos.checkout',
    'pos.invoices.view',
    'pos.invoices.void',
    'pos.returns.create',
    'pos.shifts.view',
    'pos.shifts.manage',
    'pos.customers.manage',
    'pos.discount.apply',
    'pos.override.price'
  ],
  MANAGER: [
    'dashboard.view',
    'inventory.products.view',
    'inventory.products.create',
    'inventory.products.update',
    'inventory.brands.manage',
    'inventory.bundles.manage',
    'inventory.stock.view',
    'inventory.stock.adjust',
    'inventory.categories.manage',
    'inventory.suppliers.manage',
    'inventory.purchases.view',
    'inventory.purchases.create',
    'inventory.reports.view',
    'settings.business.view',
    'settings.users.view',
    'pos.terminal.view',
    'pos.checkout',
    'pos.invoices.view',
    'pos.invoices.void',
    'pos.returns.create',
    'pos.shifts.view',
    'pos.shifts.manage',
    'pos.customers.manage',
    'pos.discount.apply'
  ],
  STAFF: [
    'dashboard.view',
    'inventory.products.view',
    'inventory.stock.view',
    'pos.terminal.view',
    'pos.checkout',
    'pos.invoices.view',
    'pos.shifts.view'
  ]
};

export const PLATFORM_APPLICATIONS: PlatformApplication[] = [
  {
    id: 'inventory',
    name: 'Inventory Management',
    tagline: 'Precision Stock Control & Supply Chain',
    description: 'Track master SKU catalogs, multi-warehouse stock, categories, suppliers, purchase orders, and valuation ledgers (billing & counter checkout not included).',
    iconName: 'Boxes',
    isAvailable: true,
    startingPrice: 999,
    coreNavItems: ['Dashboard', 'Products', 'Categories', 'Suppliers', 'Purchases', 'Stock Ledger', 'Reports'],
    extendedFeatures: [
      'SKU Catalog & Variant Tracking',
      'Multi-Warehouse & Stock Ledger',
      'Category & Unit of Measure Management',
      'Supplier Directory & Lead Times',
      'Purchase Orders & Inward Replenishment',
      'Real-time Cost & Retail Valuation',
      'Automated Low-Stock Reorder Alerts',
      'Audit Trail of All Stock Adjustments'
    ],
    serviceId: 'inventory'
  },
  {
    id: 'pos',
    name: 'Billing & POS',
    tagline: 'High-Speed Retail Checkout & Unified Inventory',
    description: 'Rapid barcode billing, GST tax invoices, split payments, cash drawer shifts, and built-in full Inventory Management (products, categories, stock ledger, inwarding purchases).',
    iconName: 'Receipt',
    isAvailable: true,
    startingPrice: 1499,
    coreNavItems: ['Checkout POS', 'Invoices', 'Payment Registers', 'Products Catalog', 'Stock Ledger', 'Purchases'],
    extendedFeatures: [
      'Full Inventory Management Included (Zero Extra Subscription)',
      'Barcode Scanning & Rapid Checkout',
      'Rule 46 CGST Tax Invoices & UPI Dynamic QR',
      'Customer Khata Store Credit Ledger',
      'Cash Drawer Shifts & Z-Report Reconciliations',
      'Sales Returns & GST Credit Notes'
    ],
    serviceId: 'pos'
  },
  {
    id: 'restaurant',
    name: 'Restaurant Management',
    tagline: 'Dine-In, Kitchen Display & Table Operations',
    description: 'Table reservations, Kitchen Display System (KDS), digital menus, recipe costings, and split dining bills.',
    iconName: 'UtensilsCrossed',
    isAvailable: false,
    startingPrice: 1999,
    coreNavItems: ['Floor & Tables', 'Live Orders', 'Kitchen Display', 'Digital Menu', 'Recipes & Prep'],
    extendedFeatures: [
      'Visual Table & Dining Floor Management',
      'Kitchen Display System (KDS)',
      'Digital Menu & Modifier Pricing',
      'Split Billing & Table Turns',
      'Recipe Costing & Ingredients Deduction'
    ],
    serviceId: 'restaurant'
  },
  {
    id: 'employee',
    name: 'Employee Management',
    tagline: 'Workforce Attendance, Shifts & Payroll',
    description: 'Shift rosters, biometric/clock-in attendance, leave tracking, performance reviews, and salary slips.',
    iconName: 'Users',
    isAvailable: false,
    startingPrice: 1299,
    coreNavItems: ['Staff Directory', 'Shift Schedules', 'Attendance Log', 'Leave Requests', 'Payroll Run'],
    extendedFeatures: [
      'Staff Directory & Employment Profiles',
      'Shift Rostering & Schedule Distribution',
      'Attendance Logging & Time Tracking',
      'Leave Requests & Approval Chains',
      'Payroll Calculations & Payslip Generation'
    ],
    serviceId: 'employee'
  },
  {
    id: 'appointment',
    name: 'Appointment Management',
    tagline: 'Customer Booking & Service Calendars',
    description: 'Online booking links, calendar scheduling, SMS reminders, staff allocation, and recurring visits.',
    iconName: 'CalendarCheck',
    isAvailable: false,
    startingPrice: 899,
    coreNavItems: ['Booking Calendar', 'Appointments', 'Service Catalog', 'Staff Allocation', 'Client History'],
    extendedFeatures: [
      'Interactive Booking Calendars',
      'Customer Self-Scheduling Portals',
      'SMS & Email Reminder Automation',
      'Staff Availability & Resource Assignment',
      'Client Appointment History & Notes'
    ],
    serviceId: 'appointment'
  }
];

// Compatibility alias
export const PLATFORM_MODULES = PLATFORM_APPLICATIONS;

// ==========================================================
// CENTRAL INVENTORY FEATURE REGISTRY
// ==========================================================
export const INVENTORY_FEATURES: Record<InventoryFeature, FeatureDefinition> = {
  // Starter Tier Core Features
  products: {
    key: 'products',
    name: 'Products & SKU Catalog',
    category: 'core',
    description: 'Master product catalog, internal codes, classifications, and basic stock levels.',
    minPlanTier: 'starter'
  },
  categories: {
    key: 'categories',
    name: 'Product Categories',
    category: 'core',
    description: 'Hierarchical product groupings and departmental classifications.',
    minPlanTier: 'starter'
  },
  brands: {
    key: 'brands',
    name: 'Brand Profiles',
    category: 'core',
    description: 'Manufacturer directories and brand asset management.',
    minPlanTier: 'starter'
  },
  stock: {
    key: 'stock',
    name: 'Basic Stock & Adjustments',
    category: 'core',
    description: 'On-hand quantity tracking, manual +/- adjustments, damage write-offs, and stock ledger.',
    minPlanTier: 'starter'
  },
  barcode: {
    key: 'barcode',
    name: 'Barcode Generation & Labels',
    category: 'core',
    description: 'Code128 SVG barcode rendering, shelf tags, and thermal label studio.',
    minPlanTier: 'starter'
  },
  suppliers: {
    key: 'suppliers',
    name: 'Supplier Directory',
    category: 'core',
    description: 'Vendor profiles, lead times, tax registration, and order contacts.',
    minPlanTier: 'starter'
  },
  purchases: {
    key: 'purchases',
    name: 'Purchase Invoices & Receipts',
    category: 'core',
    description: 'Purchase invoices, goods receipts, and inward replenishment.',
    minPlanTier: 'starter'
  },
  stocktake: {
    key: 'stocktake',
    name: 'Stocktake & Cycle Counts',
    category: 'core',
    description: 'Physical audit sessions, variance detection, and discrepancy reconciliation.',
    minPlanTier: 'starter'
  },
  reports: {
    key: 'reports',
    name: 'Valuation & Standard Reports',
    category: 'core',
    description: 'Live asset valuation, category breakdowns, and audit summaries.',
    minPlanTier: 'starter'
  },
  audit_logs: {
    key: 'audit_logs',
    name: 'Stock Audit Trails',
    category: 'core',
    description: 'Immutable movement audit logs for adjustments, receipts, and operations.',
    minPlanTier: 'starter'
  },
  user_roles: {
    key: 'user_roles',
    name: 'Essential User Permissions',
    category: 'core',
    description: 'Standard role-based access control for Owner, Manager, and Staff seats.',
    minPlanTier: 'starter'
  },

  // Professional Tier Additions
  warehouses: {
    key: 'warehouses',
    name: 'Multiple Warehouses',
    category: 'professional',
    description: 'Multiple physical warehouses, storage hubs, and facility-specific balances.',
    minPlanTier: 'professional'
  },
  bin_locations: {
    key: 'bin_locations',
    name: 'Bin Storage Locations',
    category: 'professional',
    description: 'Aisle, rack, and shelf-level bin coordinate management within warehouses.',
    minPlanTier: 'professional',
    dependencies: ['warehouses']
  },
  transfers: {
    key: 'transfers',
    name: 'Warehouse Stock Transfers',
    category: 'professional',
    description: 'Stock transfer lifecycle (request, dispatch in-transit, receive) with ledger tracking.',
    minPlanTier: 'professional',
    dependencies: ['warehouses']
  },
  batches: {
    key: 'batches',
    name: 'Batch & Lot Tracking',
    category: 'professional',
    description: 'Production lot tracking, manufacturing stamps, and batch-specific balances.',
    minPlanTier: 'professional'
  },
  expiry: {
    key: 'expiry',
    name: 'Shelf-Life & Expiry Management',
    category: 'professional',
    description: 'Days-to-expiry tracking, expiring-soon alerts, and waste prevention.',
    minPlanTier: 'professional',
    dependencies: ['batches']
  },
  variants: {
    key: 'variants',
    name: 'Multi-Attribute Variants',
    category: 'professional',
    description: 'Product options (sizes, colors, flavors) with individual SKUs and barcodes.',
    minPlanTier: 'professional'
  },
  bundles: {
    key: 'bundles',
    name: 'Bundles & Composite Kits',
    category: 'professional',
    description: 'Bill of materials (BOM), combo packs, and automatic component cost roll-up.',
    minPlanTier: 'professional'
  },
  reorder: {
    key: 'reorder',
    name: 'Reorder Rules & Suggestions',
    category: 'professional',
    description: 'Safety stock alerts, reorder thresholds, and automated replenishment suggestions.',
    minPlanTier: 'professional'
  },
  forecasting: {
    key: 'forecasting',
    name: 'Demand Velocity & Forecasting',
    category: 'professional',
    description: 'Sales velocity, stockout projection dates, and seasonal replenishment forecasts.',
    minPlanTier: 'professional'
  },
  advanced_reports: {
    key: 'advanced_reports',
    name: 'Advanced Operational Reports',
    category: 'professional',
    description: 'Supplier lead-time analysis, transfer history audits, and purchase spend metrics.',
    minPlanTier: 'professional'
  },
  bulk_import: {
    key: 'bulk_import',
    name: 'CSV Bulk Catalog Import/Export',
    category: 'professional',
    description: 'Bulk CSV product importing and export with live validation and schema previews.',
    minPlanTier: 'professional'
  },
  automation: {
    key: 'automation',
    name: 'Operational Automation',
    category: 'professional',
    description: 'Automated reorder triggers, stock threshold notifications, and batch transitions.',
    minPlanTier: 'professional'
  },

  // Business Tier Additions
  serial_numbers: {
    key: 'serial_numbers',
    name: 'Serial Number Tracking',
    category: 'business',
    description: 'Unique unit tracking, IMEI/equipment assignment, and warranty lifecycle.',
    minPlanTier: 'business'
  },
  advanced_costing: {
    key: 'advanced_costing',
    name: 'Advanced Stock Valuation & Costing',
    category: 'business',
    description: 'FIFO, Weighted Average Costing (WAC), and landed cost allocations.',
    minPlanTier: 'business'
  },
  abc_analysis: {
    key: 'abc_analysis',
    name: 'ABC Inventory Analysis',
    category: 'business',
    description: '80/20 Pareto revenue analysis classifying items into high, medium, and low value.',
    minPlanTier: 'business'
  },
  aging_deadstock: {
    key: 'aging_deadstock',
    name: 'Aging & Dead-Stock Analysis',
    category: 'business',
    description: 'Identify slow-moving items, capital lockup, and shelf holding costs.',
    minPlanTier: 'business'
  },
  advanced_rbac: {
    key: 'advanced_rbac',
    name: 'Advanced Custom Permissions',
    category: 'business',
    description: 'Granular custom role configuration, field-level access, and security policies.',
    minPlanTier: 'business'
  },
  approval_workflows: {
    key: 'approval_workflows',
    name: 'Multi-Level Approval Workflows',
    category: 'business',
    description: 'Multi-stage sign-offs for purchase orders and high-value stock adjustments.',
    minPlanTier: 'business'
  },
  advanced_automation: {
    key: 'advanced_automation',
    name: 'Advanced Automation Engine',
    category: 'business',
    description: 'Custom condition-action triggers, automated transfers, and scheduled workflows.',
    minPlanTier: 'business'
  },
  api_webhooks: {
    key: 'api_webhooks',
    name: 'REST API & Webhooks',
    category: 'business',
    description: 'Developer endpoints and event webhooks for ERP, POS, and logistics integration.',
    minPlanTier: 'business'
  },
  offline_ops: {
    key: 'offline_ops',
    name: 'Offline Operations & Sync',
    category: 'business',
    description: 'Local store caching, offline transaction queuing, and conflict reconciliation.',
    minPlanTier: 'business'
  }
};

export const DEFAULT_PLAN_ENTITLEMENTS: Record<PlanTier, InventoryFeature[]> = {
  starter: [
    'products',
    'categories',
    'brands',
    'stock',
    'barcode',
    'suppliers',
    'purchases',
    'stocktake',
    'reports',
    'audit_logs',
    'user_roles'
  ],
  professional: [
    // Starter features
    'products',
    'categories',
    'brands',
    'stock',
    'barcode',
    'suppliers',
    'purchases',
    'stocktake',
    'reports',
    'audit_logs',
    'user_roles',
    // Professional features
    'warehouses',
    'bin_locations',
    'transfers',
    'batches',
    'expiry',
    'variants',
    'bundles',
    'reorder',
    'forecasting',
    'advanced_reports',
    'bulk_import',
    'automation'
  ],
  business: [
    // Starter features
    'products',
    'categories',
    'brands',
    'stock',
    'barcode',
    'suppliers',
    'purchases',
    'stocktake',
    'reports',
    'audit_logs',
    'user_roles',
    // Professional features
    'warehouses',
    'bin_locations',
    'transfers',
    'batches',
    'expiry',
    'variants',
    'bundles',
    'reorder',
    'forecasting',
    'advanced_reports',
    'bulk_import',
    'automation',
    // Business features
    'serial_numbers',
    'advanced_costing',
    'abc_analysis',
    'aging_deadstock',
    'advanced_rbac',
    'approval_workflows',
    'advanced_automation',
    'api_webhooks',
    'offline_ops'
  ]
};

export const DEFAULT_PLAN_LIMITS: Record<PlanTier, { maxProducts: number; maxUsers: number; maxWarehouses: number; storageMb: number }> = {
  starter: {
    maxProducts: 1000,
    maxUsers: 2,
    maxWarehouses: 1,
    storageMb: 1024
  },
  professional: {
    maxProducts: 10000,
    maxUsers: 5,
    maxWarehouses: 5,
    storageMb: 5120
  },
  business: {
    maxProducts: 100000,
    maxUsers: 20,
    maxWarehouses: 25,
    storageMb: 25600
  }
};

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    tier: 'starter',
    name: 'Starter',
    description: 'Essential business tooling for single-location retail and early growth stores.',
    monthlyPrice: 999,
    annualPrice: 9990,
    maxProducts: 1000,
    maxUsers: 2,
    maxWarehouses: 1,
    storageMb: 1024,
    includedFeatures: DEFAULT_PLAN_ENTITLEMENTS.starter,
    features: [
      'Core Product, Categories & Brands Catalog',
      'Basic stock tracking & manual adjustments',
      'Code128 barcode generation & labels',
      'Supplier records & purchase receipts',
      'Physical stocktake & cycle counting',
      'Basic inventory valuation & audit trail',
      '1,000 product records & 2 user seats'
    ]
  },
  {
    id: 'plan-professional',
    tier: 'professional',
    name: 'Professional',
    description: 'Operational acceleration with multi-warehouse, transfers, batches, variants, and forecasting.',
    monthlyPrice: 2499,
    annualPrice: 24990,
    maxProducts: 10000,
    maxUsers: 5,
    maxWarehouses: 5,
    storageMb: 5120,
    isPopular: true,
    includedFeatures: DEFAULT_PLAN_ENTITLEMENTS.professional,
    features: [
      'Everything in Starter, plus:',
      'Multiple warehouses & bin storage locations',
      'Inter-warehouse stock transfers & transit status',
      'Batch/lot numbers & shelf-life expiry tracking',
      'Multi-attribute product variants & composite bundles (BOM)',
      'Automated reorder suggestions & demand forecasting',
      'CSV bulk catalog import & export',
      '10,000 product records & 5 user seats'
    ]
  },
  {
    id: 'plan-enterprise',
    tier: 'business',
    name: 'Business',
    description: 'Complete enterprise inventory engine with serial numbers, ABC analysis, and approval workflows.',
    monthlyPrice: 5999,
    annualPrice: 59990,
    maxProducts: 100000,
    maxUsers: 20,
    maxWarehouses: 25,
    storageMb: 25600,
    includedFeatures: DEFAULT_PLAN_ENTITLEMENTS.business,
    features: [
      'Everything in Professional, plus:',
      'Individual serial number / IMEI tracking',
      'Advanced stock valuation (FIFO / WAC)',
      'ABC Pareto inventory analysis & dead-stock audits',
      'Multi-level purchase & adjustment approval workflows',
      'Advanced custom RBAC permissions',
      'Developer REST API & outbound webhooks',
      '100,000 product records & 20 user seats'
    ]
  }
];

export const SUBSCRIPTION_STATUSES: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  trialing: { label: 'Trial', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  past_due: { label: 'Past Due', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  canceled: { label: 'Canceled', color: 'text-slate-600 bg-slate-100 border-slate-200' }
};

export const TENANT_STATUSES: Record<TenantStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  trial: { label: 'Trial', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  suspended: { label: 'Suspended', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  expired: { label: 'Expired', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  canceled: { label: 'Canceled', color: 'text-slate-600 bg-slate-100 border-slate-200' }
};

export const PRODUCT_STATUSES: Record<ProductStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  inactive: { label: 'Inactive', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  draft: { label: 'Draft', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  archived: { label: 'Archived', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  discontinued: { label: 'Discontinued', color: 'text-rose-700 bg-rose-50 border-rose-200' }
};

export const TRANSFER_STATUSES: Record<TransferStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-slate-700 bg-slate-100 border-slate-200' },
  requested: { label: 'Requested', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  approved: { label: 'Approved', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  in_transit: { label: 'In Transit', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  received: { label: 'Received', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200' }
};

export const STOCKTAKE_STATUSES: Record<StocktakeStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  reconciled: { label: 'Reconciled', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-slate-600 bg-slate-100 border-slate-200' }
};

export const SERIAL_STATUSES: Record<SerialStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  allocated: { label: 'Allocated', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  sold: { label: 'Sold', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  defective: { label: 'Defective', color: 'text-rose-700 bg-rose-50 border-rose-200' }
};

export const TRACKING_TYPES = [
  { value: 'standard', label: 'Standard SKU Inventory' },
  { value: 'batch', label: 'Batch / Lot & Expiry Tracking' },
  { value: 'serial', label: 'Serial Number Tracking' }
] as const;

export const STANDARD_UNIT_CONVERSIONS = [
  { fromUnit: 'box', toUnit: 'pcs', multiplier: 12, description: '1 Box = 12 Pieces' },
  { fromUnit: 'carton', toUnit: 'pcs', multiplier: 24, description: '1 Carton = 24 Pieces' },
  { fromUnit: 'kg', toUnit: 'g', multiplier: 1000, description: '1 kg = 1,000 grams' },
  { fromUnit: 'l', toUnit: 'ml', multiplier: 1000, description: '1 Liter = 1,000 ml' }
];

export const STOCK_MOVEMENT_TYPES: Record<StockMovementType, { label: string; badge: string; isPositive: boolean }> = {
  purchase: { label: 'Purchase Receipt', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', isPositive: true },
  sale: { label: 'Customer Sale', badge: 'bg-blue-50 text-blue-700 border-blue-200', isPositive: false },
  adjustment_increase: { label: 'Manual Increase', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', isPositive: true },
  adjustment_decrease: { label: 'Manual Decrease', badge: 'bg-amber-50 text-amber-700 border-amber-200', isPositive: false },
  damage: { label: 'Damaged / Expired', badge: 'bg-rose-50 text-rose-700 border-rose-200', isPositive: false },
  correction: { label: 'Inventory Audit Correction', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', isPositive: true },
  stocktake: { label: 'Stocktake Reconciliation', badge: 'bg-purple-50 text-purple-700 border-purple-200', isPositive: true },
  transfer_in: { label: 'Transfer Receipt (In)', badge: 'bg-teal-50 text-teal-700 border-teal-200', isPositive: true },
  transfer_out: { label: 'Transfer Dispatch (Out)', badge: 'bg-orange-50 text-orange-700 border-orange-200', isPositive: false },
  bundle_assembly: { label: 'Kit Assembly', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', isPositive: true },
  bundle_disassembly: { label: 'Kit Disassembly', badge: 'bg-slate-50 text-slate-700 border-slate-200', isPositive: false }
};

export const UNITS_OF_MEASURE = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'meter', label: 'Meters (m)' }
] as const;

