import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { PlanUpgradeModal } from '../subscription/PlanUpgradeModal';
import { PLATFORM_MODULES } from '@infinityhub/constants';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  Truck,
  ShoppingCart,
  BarChart3,
  Store,
  Building,
  UserCog,
  Award,
  PackageCheck,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  CalendarClock,
  Binary,
  BellRing,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Banknote,
  Users,
  UtensilsCrossed,
  ChefHat,
  CookingPot,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const { tenant } = useTenant();
  const { tier, planName, hasFeature, isStarter, isProfessional, isBusiness } = useEntitlements();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const location = useLocation();

  const isPosApp = tenant?.applicationId === 'pos';
  const isRestaurantApp = tenant?.applicationId === 'restaurant';

  // Standardized button styling for uniform visual rhythm and alignment
  const getNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-colors font-medium ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-full shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E2E8F0] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            ∞
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#0F172A] font-display">
              InfinityHub
            </span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              {isRestaurantApp ? 'Restaurant Ops' : isPosApp ? 'Billing & POS' : 'Inventory App'}
            </span>
          </div>
        </div>

        {/* Tenant Switcher Brief */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-[#0F172A] truncate">{tenant?.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">
                {planName} Edition
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            title="Click to view plan tiers"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-transform hover:scale-105 cursor-pointer ${
              isBusiness
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : isProfessional
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {tier.toUpperCase()}
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6">
          {/* SECTION 1A: RESTAURANT OPERATIONS (When Restaurant app is active) */}
          {isRestaurantApp && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Restaurant Ops
              </div>
              <nav className="space-y-1">
                <NavLink
                  to="/restaurant/tables"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <UtensilsCrossed className="w-4 h-4 shrink-0 text-orange-600" />
                  <span className="flex-1">Floor Plan & Tables</span>
                </NavLink>

                <NavLink
                  to="/restaurant/kds"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <ChefHat className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="flex-1">Kitchen Display (KDS)</span>
                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Live</span>
                </NavLink>

                <NavLink
                  to="/restaurant/recipes"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <CookingPot className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>Recipes & BOM</span>
                </NavLink>

                <NavLink
                  to="/restaurant/audit"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Anti-Theft Audits</span>
                </NavLink>

                <NavLink
                  to="/restaurant/floor-settings"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Floor & Table Config</span>
                </NavLink>

                <NavLink
                  to="/pos/shifts"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Banknote className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Shifts & Cash Drawer</span>
                </NavLink>

                <NavLink
                  to="/pos/customers"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Customer Khata</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* SECTION 1B: POS BILLING OPERATIONS (When standalone POS app is active) */}
          {isPosApp && !isRestaurantApp && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billing & Counter
              </div>
              <nav className="space-y-1">
                <NavLink
                  to="/pos/terminal"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Receipt className="w-4 h-4 shrink-0 text-blue-600" />
                  <span className="flex-1">Billing Terminal</span>
                  <kbd className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">F12</kbd>
                </NavLink>

                <NavLink
                  to="/pos/invoices"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Invoices & Receipts</span>
                </NavLink>

                <NavLink
                  to="/pos/shifts"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Banknote className="w-4 h-4 shrink-0" />
                  <span>Cash Shifts & Drawer</span>
                </NavLink>

                <NavLink
                  to="/pos/customers"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Customer Khata</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* SECTION 1C: OVERVIEW FOR PURE INVENTORY APPS */}
          {!isPosApp && !isRestaurantApp && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Overview
              </div>
              <nav className="space-y-1">
                <NavLink
                  to="/dashboard"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* SECTION 2: INVENTORY CONTROL (Natively included in both POS and Inventory) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inventory Control
            </div>

            <nav className="space-y-1">
              <NavLink
                to="/inventory/products"
                onClick={onClose}
                className={() =>
                  getNavLinkClass(
                    location.pathname.startsWith('/inventory/products')
                  )
                }
              >
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Products Catalog</span>
              </NavLink>

              <NavLink
                to="/inventory/categories"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Categories</span>
              </NavLink>

              <NavLink
                to="/inventory/brands"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Brands</span>
              </NavLink>

              <NavLink
                to="/inventory/stock"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Stock & Ledger</span>
              </NavLink>

              <NavLink
                to="/inventory/stocktake"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span>Stocktake Audit</span>
              </NavLink>
            </nav>
          </div>

          {/* SECTION 3: PURCHASES & INWARDING */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Purchasing & Inward
            </div>

            <nav className="space-y-1">
              <NavLink
                to="/inventory/suppliers"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Suppliers</span>
              </NavLink>

              <NavLink
                to="/inventory/purchases"
                onClick={onClose}
                className={() =>
                  getNavLinkClass(
                    location.pathname.startsWith('/inventory/purchases')
                  )
                }
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>Purchase Invoices</span>
              </NavLink>
            </nav>
          </div>

          {/* SECTION 4: PROFESSIONAL KITS & BULK TOOLS */}
          {(hasFeature('bundles') || hasFeature('bulk_import')) && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Catalog Tools
                </span>
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">PRO</span>
              </div>

              <nav className="space-y-1">
                {hasFeature('bundles') && (
                  <NavLink
                    to="/inventory/bundles"
                    onClick={onClose}
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    <PackageCheck className="w-4 h-4 shrink-0" />
                    <span>Bundles & Kits</span>
                  </NavLink>
                )}

                {hasFeature('bulk_import') && (
                  <NavLink
                    to="/inventory/import"
                    onClick={onClose}
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>CSV Bulk Import</span>
                  </NavLink>
                )}
              </nav>
            </div>
          )}

          {/* SECTION 5: WAREHOUSING & TRANSFERS */}
          {hasFeature('warehouses') && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Warehousing
                </span>
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">PRO</span>
              </div>

              <nav className="space-y-1">
                <NavLink
                  to="/inventory/warehouses"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Warehouse className="w-4 h-4 shrink-0" />
                  <span>Warehouses & Bins</span>
                </NavLink>

                {hasFeature('transfers') && (
                  <NavLink
                    to="/inventory/transfers"
                    onClick={onClose}
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    <ArrowLeftRight className="w-4 h-4 shrink-0" />
                    <span>Stock Transfers</span>
                  </NavLink>
                )}
              </nav>
            </div>
          )}

          {/* SECTION 6: TRACKING, INTELLIGENCE & VALUATION */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tracking & Analytics
              </span>
            </div>

            <nav className="space-y-1">
              {hasFeature('batches') && (
                <NavLink
                  to="/inventory/batches"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <CalendarClock className="w-4 h-4 shrink-0" />
                  <span>Batches & Expiry</span>
                </NavLink>
              )}

              {hasFeature('serial_numbers') && (
                <NavLink
                  to="/inventory/serials"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Binary className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Serial Numbers</span>
                  <span className="text-[8px] font-bold px-1 bg-purple-50 text-purple-700 rounded">BIZ</span>
                </NavLink>
              )}

              {hasFeature('reorder') && (
                <NavLink
                  to="/inventory/reorder"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <BellRing className="w-4 h-4 shrink-0" />
                  <span>Reorder Alerts</span>
                </NavLink>
              )}

              {hasFeature('forecasting') && (
                <NavLink
                  to="/inventory/forecasting"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Demand Forecasting</span>
                </NavLink>
              )}

              <NavLink
                to="/inventory/reports"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Valuation & Reports</span>
              </NavLink>
            </nav>
          </div>

          {/* SECTION 7: STORE SETTINGS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Store Settings
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/settings/business"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>Business Profile</span>
              </NavLink>

              <NavLink
                to="/settings/users"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <UserCog className="w-4 h-4 shrink-0" />
                <span>Cashiers & Roles</span>
              </NavLink>

              {isRestaurantApp && (
                <NavLink
                  to="/restaurant/floor-settings"
                  onClick={onClose}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span>Floor & Tables Settings</span>
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      </aside>

      {/* Modal for tier switching & plan evaluation */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
};
