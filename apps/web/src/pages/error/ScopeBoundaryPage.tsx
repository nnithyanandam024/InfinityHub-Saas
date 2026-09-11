import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ScopeBoundaryPage: React.FC<{ type?: 'super_admin_blocked' | 'tenant_blocked' }> = ({
  type = 'super_admin_blocked'
}) => {
  const { role } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-[16px] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-200/60 px-2.5 py-0.5 rounded-full">
            Access Restricted
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-2">
            Customer Store Private Space
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Platform administrators manage tenancy and subscriptions; customer store records are private to the business.
          </p>
        </div>

        {/* Boundary Rules */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <span className="font-bold text-slate-900 block mb-1">
              Active Identity: <span className="font-mono text-blue-600">{role}</span> (Platform Scope)
            </span>
            <p className="text-slate-500 leading-relaxed">
              Platform administrators manage SaaS billing, subscriptions, and tenant provisioning, but do not have access to private customer business records.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Enforced Access Restrictions:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Customer Products
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Inventory Stock Records
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Purchase Invoices
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Supplier Contracts
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Financial Reports
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">✕</span> Store Private Settings
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Link to="/admin/dashboard">
              <Button size="sm" icon={ArrowLeft}>
                Return to Platform Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
