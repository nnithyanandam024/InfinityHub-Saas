import React, { useState, useEffect } from 'react';
import { tenantService } from '../../services/tenantService';
import { Tenant } from '@infinityhub/types';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import {
  Building2,
  Boxes,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Plus,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProvisionTenantModal } from '../platform/ProvisionTenantModal';

export const AdminDashboardPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);

  useEffect(() => {
    tenantService.getTenants()
      .then(t => setTenants(t))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner text="Connecting to Platform Console..." />;

  const activeTenants = tenants.filter(t => t.status === 'active');
  const trialTenants = tenants.filter(t => t.status === 'trial');

  const getAppBadgeColor = (appId?: string) => {
    switch (appId) {
      case 'inventory':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pos':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'restaurant':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'employee':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'appointment':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Platform Overview Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-[14px] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight font-display">
              Super Admin Platform Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-Product SaaS Platform managing customer tenant provisioning, product subscriptions, and infrastructure telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            icon={Plus}
            onClick={() => setIsProvisionOpen(true)}
          >
            Provision Store
          </Button>
          <Link to="/admin/tenants">
            <Button size="sm" variant="primary" icon={Building2} className="shadow-xs">
              Tenants Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Tenants
          </span>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">{tenants.length}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Isolated business stores
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Subscriptions
          </span>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">{activeTenants.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Recurring paid enterprise accounts</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Trial Accounts
          </span>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">{trialTenants.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Starter tier active evaluation</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            SaaS Applications
          </span>
          <div className="text-2xl font-bold text-blue-600 tracking-tight flex items-center gap-1.5">
            5 Separate Products
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Inventory, POS, Restaurant, HR, Cal</span>
        </div>
      </div>

      {/* Tenants Table Preview */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Registered Customer Workspaces</h3>
            <p className="text-xs text-slate-500 mt-0.5">Purchased business application and quota usage breakdown</p>
          </div>
          <Link to="/admin/tenants" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            View All Tenants <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Business Workspace</th>
                <th className="py-3 px-4">Subscribed SaaS Product</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Products Quota</th>
                <th className="py-3 px-4">Lifecycle</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {tenants.map(t => {
                const u = t.usage;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      <Link to={`/admin/tenants/${t.id}`} className="hover:text-blue-600 font-bold">
                        {t.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-normal">{t.ownerName} · {t.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getAppBadgeColor(t.applicationId)}`}>
                        {t.applicationName || 'Inventory Management'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                        {t.planName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {u ? `${u.productsCount} / ${u.maxProductsQuota.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/tenants/${t.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Inspect Quotas
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Wizard Modal */}
      <ProvisionTenantModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
      />
    </div>
  );
};
