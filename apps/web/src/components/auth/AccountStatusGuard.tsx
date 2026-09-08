import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { AlertTriangle, Clock, ShieldAlert, LogOut, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AccountStatusGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant, accountStatus } = useTenant();
  const { logout, isPlatformScope } = useAuth();
  const navigate = useNavigate();

  // Super Admin is platform scope and not subject to tenant account status
  if (isPlatformScope) {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // SUSPENDED ACCOUNT SCREEN
  if (accountStatus === 'suspended') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-rose-200 shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full inline-block mb-3">
            Account Suspended
          </span>

          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight font-display mb-2">
            Workspace Temporarily Suspended
          </h1>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Access to <strong>{tenant?.name || 'this workspace'}</strong> has been paused. Please contact platform administration to reactivate your store.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-6 text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Support Email:</span>
              <span className="font-mono font-medium text-slate-800">support@infinityhub.io</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-mono text-slate-700">{tenant?.id}</span>
            </div>
          </div>

          <Button size="sm" variant="outline" className="w-full" onClick={handleSignOut} icon={LogOut}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // EXPIRED ACCOUNT SCREEN
  if (accountStatus === 'expired') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-amber-200 shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full inline-block mb-3">
            Subscription Expired
          </span>

          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight font-display mb-2">
            Renewal Required
          </h1>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Your subscription for <strong>{tenant?.applicationName || 'Inventory Management'}</strong> has expired. Renew your plan to continue accessing your store catalog.
          </p>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="w-full" onClick={handleSignOut} icon={LogOut}>
              Sign Out
            </Button>
            <Link to="/provision" className="w-full">
              <Button size="sm" variant="primary" className="w-full" icon={ArrowRight} iconPosition="right">
                Renew Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CANCELED ACCOUNT SCREEN
  if (accountStatus === 'canceled') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-slate-200 shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight font-display mb-2">
            Account Unavailable
          </h1>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            This workspace ({tenant?.name}) has been canceled and is no longer available.
          </p>

          <Button size="sm" variant="outline" className="w-full" onClick={handleSignOut} icon={LogOut}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // TRIAL OR ACTIVE ACCOUNT
  return (
    <>
      {accountStatus === 'trial' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Evaluation Trial Active:</strong> You have 14 days remaining in your {tenant?.applicationName} trial period.
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
