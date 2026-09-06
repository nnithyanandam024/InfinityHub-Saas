export type AuthScope = 'platform' | 'tenant';

export type PlatformPermission =
  | 'platform.access'
  | 'platform.tenants.view'
  | 'platform.tenants.create'
  | 'platform.tenants.manage'
  | 'platform.plans.manage'
  | 'platform.modules.manage'
  | 'platform.users.view'
  | 'platform.audit.view';

export type TenantPermission =
  // Dashboard
  | 'dashboard.view'
  // Inventory Products
  | 'inventory.products.view'
  | 'inventory.products.create'
  | 'inventory.products.update'
  | 'inventory.products.delete'
  // Inventory Stock
  | 'inventory.stock.view'
  | 'inventory.stock.adjust'
  // Inventory Categories, Brands, Bundles & Suppliers
  | 'inventory.categories.manage'
  | 'inventory.brands.manage'
  | 'inventory.bundles.manage'
  | 'inventory.suppliers.manage'
  // Inventory Purchases
  | 'inventory.purchases.view'
  | 'inventory.purchases.create'
  // Inventory Reports
  | 'inventory.reports.view'
  // Settings
  | 'settings.business.view'
  | 'settings.business.edit'
  | 'settings.users.view'
  | 'settings.users.manage'
  // Billing & POS
  | 'pos.terminal.view'
  | 'pos.checkout'
  | 'pos.invoices.view'
  | 'pos.invoices.void'
  | 'pos.returns.create'
  | 'pos.shifts.view'
  | 'pos.shifts.manage'
  | 'pos.customers.manage'
  | 'pos.discount.apply'
  | 'pos.override.price';

export type Permission = PlatformPermission | TenantPermission;

