import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { ApplicationId } from '@infinityhub/types';
import { APPLICATION_BUNDLES } from '@infinityhub/constants';
import { LoadingSpinner } from '../ui/EmptyState';
import { ApplicationUnavailablePage } from '../../pages/error/ApplicationUnavailablePage';
import { ScopeBoundaryPage } from '../../pages/error/ScopeBoundaryPage';

interface RequireApplicationProps {
  appId: ApplicationId | ApplicationId[];
  children: React.ReactNode;
}

export const RequireApplication: React.FC<RequireApplicationProps> = ({
  appId,
  children
}) => {
  const { isPlatformScope, isLoading: authLoading } = useAuth();
  const { tenant, isLoading: tenantLoading } = useTenant();

  if (authLoading || (!isPlatformScope && tenantLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Validating workspace license..." />
      </div>
    );
  }

  // Super Admin cannot access customer application workspaces
  if (isPlatformScope) {
    return <ScopeBoundaryPage type="super_admin_blocked" />;
  }

  // Check if tenant's purchased application bundle matches required application
  // Billing & POS natively includes full Inventory Management
  const tenantAppId = tenant?.applicationId || 'inventory';
  const effectiveApps = APPLICATION_BUNDLES[tenantAppId] || [tenantAppId];

  const isAllowed = Array.isArray(appId)
    ? appId.some(id => effectiveApps.includes(id))
    : effectiveApps.includes(appId);

  if (!isAllowed) {
    return <ApplicationUnavailablePage attemptedAppId={Array.isArray(appId) ? appId[0] : appId} />;
  }

  return <>{children}</>;
};
