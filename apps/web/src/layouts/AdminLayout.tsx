import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Building2,
  CreditCard,
  Boxes,
  Users,
  ScrollText,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { ScopeBoundaryPage } from '../pages/error/ScopeBoundaryPage';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { mockStore } from '../data/mockStore';
import { useToast } from '../context/ToastContext';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { isPlatformScope, user, logout, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <LoadingScreen
        scope="admin"
        message="Connecting to Platform Admin Plane..."
        subMessage="Auditing multi-tenant cluster statistics and active subscriptions"
      />
    );
  }

  // ACCESS BOUNDARY: Only users with Platform Scope can view the platform admin control plane
  if (!isPlatformScope) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <ScopeBoundaryPage type="tenant_blocked" />
      </div>
    );
  }

  const activeLink =
    'flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-100 transition-colors';
  const inactiveLink =
    'flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-colors';

  const handleSignOut = async () => {
    await logout();
    showToast('Signed out of Platform Console', 'info');
    navigate('/login');
  };

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Super Admin Light Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-full shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                ∞
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-[#0F172A] font-display">
                  InfinityHub
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Platform Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-6">
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Overview
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Platform Metrics</span>
                </NavLink>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SaaS Operations
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/admin/tenants"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Tenants Directory</span>
                </NavLink>

                <NavLink
                  to="/admin/plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Plans & Quotas</span>
                </NavLink>

                <NavLink
                  to="/admin/modules"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  <span>Modules Catalog</span>
                </NavLink>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Governance & Security
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Global Users</span>
                </NavLink>

                <NavLink
                  to="/admin/audit-logs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <ScrollText className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </NavLink>
              </div>
            </div>
          </nav>

          {/* User Card at Bottom */}
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                SA
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#0F172A] truncate">Super Admin</div>
                <div className="text-[10px] text-slate-500 font-medium">Platform Scope</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Topbar */}
          <header className="shrink-0 z-30 h-16 px-4 lg:px-8 border-b border-[#E2E8F0] bg-white flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">
                  Multi-Tenant Platform Governance
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  SaaS Orchestration · Subscriptions & Tenants Quotas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Health pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Clusters Operational</span>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    SA
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#0F172A] leading-tight">Platform Admin</span>
                    <span className="text-[10px] text-slate-500 leading-tight">admin@infinityhub.io</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-[#E2E8F0]">
                      <div className="font-bold text-xs text-[#0F172A]">Super Admin</div>
                      <div className="text-[11px] text-slate-400">admin@infinityhub.io</div>
                      <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Platform Scope
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        to="/admin/tenants"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>Tenants Registry</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (confirm('Reset all mock platform tenants and data to initial seed state?')) {
                            mockStore.resetAll();
                            showToast('Platform sandbox reset to initial state', 'success');
                            setTimeout(() => window.location.reload(), 300);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 text-left"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span>Reset Platform Seed Data</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#E2E8F0]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

        <main className="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-8">
          <div className="max-w-7xl w-full mx-auto animate-in fade-in duration-150">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
