import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { PLATFORM_APPLICATIONS } from '@infinityhub/constants';
import { Button } from '../../components/ui/Button';
import { AlertCircle, ArrowLeft, Store, Shield } from 'lucide-react';

interface ApplicationUnavailablePageProps {
  attemptedAppId?: string;
}

export const ApplicationUnavailablePage: React.FC<ApplicationUnavailablePageProps> = ({
  attemptedAppId
}) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const attemptedApp = PLATFORM_APPLICATIONS.find(a => a.id === attemptedAppId);
  const userApp = PLATFORM_APPLICATIONS.find(a => a.id === tenant?.applicationId) || {
    name: tenant?.applicationName || 'Inventory Management'
  };

  const handleReturn = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-3 py-0.5 rounded-full inline-block mb-3">
          Application Unavailable
        </span>

        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight font-display mb-2">
          Workspace Access Restricted
        </h1>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          This workspace <strong>({tenant?.name || 'Your Store'})</strong> does not have a license for{' '}
          <strong>{attemptedApp?.name || 'this application'}</strong>.
        </p>

        <div className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-left text-xs mb-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active Workspace:</span>
            <span className="font-semibold text-slate-800">{tenant?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Licensed Product:</span>
            <span className="font-semibold text-blue-600">{userApp.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Subscription Tier:</span>
            <span className="font-medium text-slate-700">{tenant?.planName}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          className="w-full"
          onClick={handleReturn}
          icon={ArrowLeft}
        >
          Return to {userApp.name}
        </Button>
      </div>
    </div>
  );
};
