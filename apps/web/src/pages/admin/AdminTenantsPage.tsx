import React, { useState, useEffect } from 'react';
import { tenantService } from '../../services/tenantService';
import { Tenant } from '@infinityhub/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { Building2, Search, Plus, ShieldCheck, Lock, Sliders, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export const AdminTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const list = await tenantService.getTenants();
      setTenants(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const toggleTenantStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    await tenantService.updateTenantPlatformSettings(tenant.id, { status: newStatus as any });
    showToast(`Tenant ${tenant.name} status updated to ${newStatus}`, 'info');
    loadTenants();
  };

  const filtered = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.applicationName && t.applicationName.toLowerCase().includes(search.toLowerCase()));

    const matchesApp =
      selectedAppFilter === 'all' || t.applicationId === selectedAppFilter;

    return matchesSearch && matchesApp;
  });

  if (isLoading) return <LoadingSpinner text="Loading platform tenants registry..." />;

  const getAppBadge = (appId: string, appName?: string) => {
    switch (appId) {
      case 'inventory':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'restaurant':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pos':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'employee':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2 font-display">
            <Building2 className="w-5 h-5 text-blue-600" />
            Customers & Applications Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform account provisioning, assigned standalone applications, and subscription quota telemetry.
          </p>
        </div>

        <Link to="/platform">
          <Button size="sm" icon={Plus} className="shadow-xs">
            Provision New Customer
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search by customer, owner, or application..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Application Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedAppFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedAppFilter === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Applications ({tenants.length})
          </button>

          <button
            onClick={() => setSelectedAppFilter('inventory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedAppFilter === 'inventory'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            Inventory ({tenants.filter(t => t.applicationId === 'inventory').length})
          </button>

          <button
            onClick={() => setSelectedAppFilter('restaurant')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedAppFilter === 'restaurant'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            Restaurant ({tenants.filter(t => t.applicationId === 'restaurant').length})
          </button>

          <button
            onClick={() => setSelectedAppFilter('pos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedAppFilter === 'pos'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            POS ({tenants.filter(t => t.applicationId === 'pos').length})
          </button>

          <button
            onClick={() => setSelectedAppFilter('employee')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedAppFilter === 'employee'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            Employee ({tenants.filter(t => t.applicationId === 'employee').length})
          </button>
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Customer / Workspace</th>
                <th className="py-3 px-4">Purchased Application</th>
                <th className="py-3 px-4">Account Owner</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Product Quota</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Platform Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {filtered.map(t => {
                const u = t.usage;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      <Link to={`/admin/tenants/${t.id}`} className="hover:text-blue-600 font-bold">
                        {t.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono font-normal">{t.slug}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getAppBadge(t.applicationId, t.applicationName)}`}>
                        {t.applicationName || 'Inventory Management'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{t.ownerName}</div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
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
                            : t.status === 'trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/tenants/${t.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Inspect Metadata
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 text-xs ${
                            t.status === 'active'
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                          onClick={() => toggleTenantStatus(t)}
                        >
                          {t.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
