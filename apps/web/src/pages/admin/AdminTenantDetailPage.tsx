import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tenantService } from '../../services/tenantService';
import { Tenant } from '@infinityhub/types';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { PLATFORM_MODULES } from '@infinityhub/constants';
import { ArrowLeft, Building2, ShieldCheck, Check, Calendar, HardDrive, Users, Boxes } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminTenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    tenantService.getTenantById(id)
      .then(t => setTenant(t))
      .finally(() => setIsLoading(false));
  }, [id]);

  const toggleModule = async (moduleId: string) => {
    if (!tenant) return;
    const current = [...(tenant.activeModules || [tenant.applicationId || 'inventory'])];
    const index = current.indexOf(moduleId);
    if (index > -1) {
      if (moduleId === 'inventory') {
        showToast('Core Inventory module is required for primary business tenancy', 'error');
        return;
      }
      current.splice(index, 1);
    } else {
      current.push(moduleId);
    }

    const updated = await tenantService.updateTenantPlatformSettings(tenant.id, { activeModules: current });
    setTenant(updated);
    showToast(`Updated module feature flag for ${tenant.name}`, 'success');
  };

  const toggleStatus = async () => {
    if (!tenant) return;
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const updated = await tenantService.updateTenantPlatformSettings(tenant.id, { status: newStatus as any });
    setTenant(updated);
    showToast(`Account status set to ${newStatus.toUpperCase()}`, 'info');
  };

  if (isLoading) return <LoadingSpinner text="Fetching tenant metadata..." />;
  if (!tenant) return <EmptyState title="Tenant Not Found" description="Could not locate tenant record." />;

  const u = tenant.usage;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/tenants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tenants Directory
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight font-display">{tenant.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              tenant.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {tenant.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Slug: <span className="font-mono font-medium text-slate-700">{tenant.slug}</span> · Plan: {tenant.planName}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className={`h-8 text-xs ${
            tenant.status === 'active'
              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
          }`}
          onClick={toggleStatus}
        >
          {tenant.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
        </Button>
      </div>

      {/* Quota & Resource Usage Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Product Catalog Quota
          </span>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {u?.productsCount} <span className="text-xs font-normal text-slate-400">/ {u?.maxProductsQuota.toLocaleString()} items</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((u?.productsCount || 0) / (u?.maxProductsQuota || 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Staff Seats Allocated
          </span>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {u?.usersCount} <span className="text-xs font-normal text-slate-400">/ {u?.maxUsersQuota} seats</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((u?.usersCount || 0) / (u?.maxUsersQuota || 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Storage Consumption
          </span>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {u?.storageUsedMb} MB <span className="text-xs font-normal text-slate-400">/ {u?.maxStorageQuotaMb} MB</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((u?.storageUsedMb || 0) / (u?.maxStorageQuotaMb || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Account & Subscription Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs space-y-3 text-xs">
          <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
            Tenant Identity & Contact
          </h4>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Business Owner:</span>
              <span className="font-semibold text-slate-900">{tenant.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Official Email:</span>
              <span className="text-slate-700">{tenant.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-mono text-slate-700">{tenant.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registered On:</span>
              <span className="font-mono text-slate-700">{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-[14px] shadow-2xs space-y-3 text-xs">
          <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
            Subscription & Lifecycle
          </h4>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Plan:</span>
              <span className="font-semibold text-blue-600">{tenant.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subscription Expiration:</span>
              <span className="font-semibold text-emerald-600">
                {tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString() : 'Active Ongoing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Telemetry Ping:</span>
              <span className="font-mono text-slate-700">{u?.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Recent'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Status:</span>
              <span className="text-emerald-600 font-semibold">Current / Good Standing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Application Subscription & Entitlements */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Assigned SaaS Product
            </span>
            <h4 className="font-bold text-[#0F172A] text-base">
              {tenant.applicationName || 'Inventory Management'}
            </h4>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Service ID: {tenant.applicationId || 'inventory'}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Active business application workspace and feature entitlements assigned to this account.
        </p>

        <div className="bg-slate-50/80 rounded-xl p-4 border border-[#E2E8F0]">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Included Product Capabilities:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Catalog & SKU Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Categories & Unit Taxing</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Supplier Relationship Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Purchase Orders & Receipts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Real-time Stock Adjustment Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Inventory Valuation Reporting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
