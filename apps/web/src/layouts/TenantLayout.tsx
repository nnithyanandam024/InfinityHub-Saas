import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ScopeBoundaryPage } from '../pages/error/ScopeBoundaryPage';

export const TenantLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading: authLoading, isPlatformScope, user } = useAuth();
  const { isLoading: tenantLoading, tenant } = useTenant();

  if (authLoading || (!isPlatformScope && tenantLoading)) {
    return (
      <LoadingScreen
        scope="tenant"
        storeName={tenant?.name}
        message={tenant?.name ? `Preparing ${tenant.name}...` : 'Loading Business Workspace...'}
        subMessage="Preparing your store catalog, real-time stock balances, and settings"
      />
    );
  }

  // ZERO-TRUST ACCESS BOUNDARY:
  // Super Admin cannot access customer tenant workspaces or private store layouts
  if (isPlatformScope) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <ScopeBoundaryPage type="super_admin_blocked" />
      </div>
    );
  }

  // MULTI-TENANT ISOLATION BOUNDARY:
  // User cannot view or access any store other than their authenticated tenant
  if (user?.tenantId && tenant?.id && user.tenantId !== tenant.id) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <ScopeBoundaryPage type="tenant_blocked" />
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-8">
          <div className="max-w-7xl w-full mx-auto animate-in fade-in duration-150">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

