import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { TenantLayout } from '../layouts/TenantLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Guards
import { RequireApplication } from '../components/auth/RequireApplication';
import { AccountStatusGuard } from '../components/auth/AccountStatusGuard';
import { RequireFeature } from '../components/auth/RequireFeature';

// Platform Public Experience
import { PlatformOverviewPage } from '../pages/platform/PlatformOverviewPage';
import { AppsCatalogPage } from '../pages/platform/AppsCatalogPage';
import { AppDetailPage } from '../pages/platform/AppDetailPage';
import { ProvisioningPage } from '../pages/platform/ProvisioningPage';
import { MobileDownloadPage } from '../pages/public/MobileDownloadPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Tenant Inventory Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductsPage } from '../pages/inventory/ProductsPage';
import { NewProductPage } from '../pages/inventory/NewProductPage';
import { ProductDetailPage } from '../pages/inventory/ProductDetailPage';
import { EditProductPage } from '../pages/inventory/EditProductPage';
import { CategoriesPage } from '../pages/inventory/CategoriesPage';
import { BrandsPage } from '../pages/inventory/BrandsPage';
import { BundlesPage } from '../pages/inventory/BundlesPage';
import { WarehousesPage } from '../pages/inventory/WarehousesPage';
import { TransfersPage } from '../pages/inventory/TransfersPage';
import { BatchesPage } from '../pages/inventory/BatchesPage';
import { SerialsPage } from '../pages/inventory/SerialsPage';
import { StocktakePage } from '../pages/inventory/StocktakePage';
import { ReorderPage } from '../pages/inventory/ReorderPage';
import { BulkImportPage } from '../pages/inventory/BulkImportPage';
import { ForecastingPage } from '../pages/inventory/ForecastingPage';
import { SuppliersPage } from '../pages/inventory/SuppliersPage';
import { PurchasesPage } from '../pages/inventory/PurchasesPage';
import { NewPurchasePage } from '../pages/inventory/NewPurchasePage';
import { StockPage } from '../pages/inventory/StockPage';
import { ReportsPage } from '../pages/inventory/ReportsPage';
import { BusinessSettingsPage } from '../pages/settings/BusinessSettingsPage';
import { UsersSettingsPage } from '../pages/settings/UsersSettingsPage';

// Tenant Billing & POS Pages
import { PosTerminalPage } from '../pages/pos/PosTerminalPage';
import { PosInvoicesPage } from '../pages/pos/PosInvoicesPage';
import { PosShiftsPage } from '../pages/pos/PosShiftsPage';
import { PosCustomersPage } from '../pages/pos/PosCustomersPage';

// Tenant Restaurant Pages
import { RestaurantTablesPage } from '../pages/restaurant/RestaurantTablesPage';
import { KitchenDisplayPage } from '../pages/restaurant/KitchenDisplayPage';
import { RestaurantRecipesPage } from '../pages/restaurant/RestaurantRecipesPage';
import { RestaurantAuditPage } from '../pages/restaurant/RestaurantAuditPage';
import { RestaurantFloorSettingsPage } from '../pages/restaurant/RestaurantFloorSettingsPage';

// Placeholder Workspaces for Other Standalone Products
import { PosWorkspacePlaceholder } from '../pages/placeholders/PosWorkspacePlaceholder';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminTenantsPage } from '../pages/admin/AdminTenantsPage';
import { AdminTenantDetailPage } from '../pages/admin/AdminTenantDetailPage';
import { AdminPlansPage } from '../pages/admin/AdminPlansPage';
import { AdminModulesPage } from '../pages/admin/AdminModulesPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';

// 404 Page
import { EmptyState } from '../components/ui/EmptyState';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
    <EmptyState
      title="Page Not Found (404)"
      description="The requested page route does not exist or has been relocated."
      actionLabel="Return to Dashboard"
      onAction={() => (window.location.href = '/dashboard')}
    />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect: Default to /platform for discovery or /dashboard */}
      <Route path="/" element={<Navigate to="/platform" replace />} />

      {/* Public Platform Website & Application Catalog */}
      <Route path="/platform" element={<PlatformOverviewPage />} />
      <Route path="/apps" element={<AppsCatalogPage />} />
      <Route path="/apps/:appId" element={<AppDetailPage />} />
      <Route path="/provision" element={<ProvisioningPage />} />
      <Route path="/download-apk" element={<MobileDownloadPage />} />

      {/* Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Navigate to="/platform" replace />} />
        <Route path="/register" element={<Navigate to="/platform" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Customer Workspace Routes */}
      <Route
        element={
          <AccountStatusGuard>
            <TenantLayout />
          </AccountStatusGuard>
        }
      >
        {/* Inventory Application Workspace (Phase 1 Live Flagship) */}
        <Route
          path="/dashboard"
          element={
            <RequireApplication appId="inventory">
              <DashboardPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireApplication appId="inventory">
              <Navigate to="/inventory/products" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/products"
          element={
            <RequireApplication appId="inventory">
              <ProductsPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/products/new"
          element={
            <RequireApplication appId="inventory">
              <NewProductPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/products/:id"
          element={
            <RequireApplication appId="inventory">
              <ProductDetailPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/products/:id/edit"
          element={
            <RequireApplication appId="inventory">
              <EditProductPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/brands"
          element={
            <RequireApplication appId="inventory">
              <BrandsPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/categories"
          element={
            <RequireApplication appId="inventory">
              <CategoriesPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/bundles"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="bundles">
                <BundlesPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/suppliers"
          element={
            <RequireApplication appId="inventory">
              <SuppliersPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/purchases"
          element={
            <RequireApplication appId="inventory">
              <PurchasesPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/purchases/new"
          element={
            <RequireApplication appId="inventory">
              <NewPurchasePage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/stock"
          element={
            <RequireApplication appId="inventory">
              <StockPage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/import"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="bulk_import">
                <BulkImportPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/warehouses"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="warehouses">
                <WarehousesPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/transfers"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="transfers">
                <TransfersPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/batches"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="batches">
                <BatchesPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/serials"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="serial_numbers">
                <SerialsPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/stocktake"
          element={
            <RequireApplication appId="inventory">
              <StocktakePage />
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/reorder"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="reorder">
                <ReorderPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/forecasting"
          element={
            <RequireApplication appId="inventory">
              <RequireFeature feature="forecasting">
                <ForecastingPage />
              </RequireFeature>
            </RequireApplication>
          }
        />
        <Route
          path="/inventory/reports"
          element={
            <RequireApplication appId="inventory">
              <ReportsPage />
            </RequireApplication>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireApplication appId="inventory">
              <Navigate to="/settings/business" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/settings/business"
          element={
            <RequireApplication appId="inventory">
              <BusinessSettingsPage />
            </RequireApplication>
          }
        />
        <Route
          path="/settings/users"
          element={
            <RequireApplication appId="inventory">
              <UsersSettingsPage />
            </RequireApplication>
          }
        />

        {/* Standalone Billing & POS Workspace Routes (Includes full Inventory natively) */}
        <Route
          path="/pos"
          element={
            <RequireApplication appId="pos">
              <Navigate to="/pos/terminal" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/pos/dashboard"
          element={
            <RequireApplication appId="pos">
              <Navigate to="/pos/terminal" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/pos/terminal"
          element={
            <RequireApplication appId="pos">
              <PosTerminalPage />
            </RequireApplication>
          }
        />
        <Route
          path="/pos/invoices"
          element={
            <RequireApplication appId="pos">
              <PosInvoicesPage />
            </RequireApplication>
          }
        />
        <Route
          path="/pos/shifts"
          element={
            <RequireApplication appId="pos">
              <PosShiftsPage />
            </RequireApplication>
          }
        />
        <Route
          path="/pos/customers"
          element={
            <RequireApplication appId="pos">
              <PosCustomersPage />
            </RequireApplication>
          }
        />

        {/* Standalone Restaurant Management Workspace Routes */}
        <Route
          path="/restaurant"
          element={
            <RequireApplication appId="restaurant">
              <Navigate to="/restaurant/tables" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/dashboard"
          element={
            <RequireApplication appId="restaurant">
              <Navigate to="/restaurant/tables" replace />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/tables"
          element={
            <RequireApplication appId="restaurant">
              <RestaurantTablesPage />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/kds"
          element={
            <RequireApplication appId="restaurant">
              <KitchenDisplayPage />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/recipes"
          element={
            <RequireApplication appId="restaurant">
              <RestaurantRecipesPage />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/audit"
          element={
            <RequireApplication appId="restaurant">
              <RestaurantAuditPage />
            </RequireApplication>
          }
        />
        <Route
          path="/restaurant/floor-settings"
          element={
            <RequireApplication appId="restaurant">
              <RestaurantFloorSettingsPage />
            </RequireApplication>
          }
        />
      </Route>

      {/* Super Admin Control Plane */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/tenants" element={<AdminTenantsPage />} />
        <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
        <Route path="/admin/plans" element={<AdminPlansPage />} />
        <Route path="/admin/subscriptions" element={<AdminPlansPage />} />
        <Route path="/admin/modules" element={<AdminModulesPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
