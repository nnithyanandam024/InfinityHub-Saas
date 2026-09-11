import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { tenantService } from '../../services/tenantService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useEntitlements } from '../../hooks/useEntitlements';
import { PlanUpgradeModal } from '../../components/subscription/PlanUpgradeModal';
import { Building, Save, Shield, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const CURRENCY_OPTIONS = [
  { value: '₹', label: '₹ — INR (Indian Rupee)' },
  { value: '$', label: '$ — USD / CAD / AUD (Dollar)' },
  { value: '€', label: '€ — EUR (Euro)' },
  { value: '£', label: '£ — GBP (British Pound)' },
  { value: '¥', label: '¥ — JPY / CNY (Yen / Yuan)' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'S$', label: 'S$ — Singapore Dollar' },
  { value: 'RM', label: 'RM — Malaysian Ringgit' },
  { value: '₨', label: '₨ — PKR / LKR / NPR (Rupee)' },
  { value: '₩', label: '₩ — KRW (South Korean Won)' },
  { value: '฿', label: '฿ — THB (Thai Baht)' },
  { value: '₱', label: '₱ — PHP (Philippine Peso)' },
  { value: 'R$', label: 'R$ — BRL (Brazilian Real)' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'kr', label: 'kr — SEK / NOK / DKK (Krona)' },
  { value: 'R', label: 'R — ZAR (South African Rand)' }
];

export const BusinessSettingsPage: React.FC = () => {
  const { tenant, refreshTenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { tier, planName, limits } = useEntitlements();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [taxRate, setTaxRate] = useState<number>(5.0);
  const [lowStockDefault, setLowStockDefault] = useState<number>(10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setEmail(tenant.email);
      setPhone(tenant.phone);
      setAddress(tenant.address || '');
      setCurrencySymbol(tenant.settings?.currencySymbol || '₹');
      setTaxRate(tenant.settings?.taxRate || 5.0);
      setLowStockDefault(tenant.settings?.lowStockThresholdDefault || 10);
    }
  }, [tenant]);

  const allCurrencyOptions = useMemo(() => {
    if (currencySymbol && !CURRENCY_OPTIONS.some(opt => opt.value === currencySymbol)) {
      return [{ value: currencySymbol, label: `${currencySymbol} — Custom Currency` }, ...CURRENCY_OPTIONS];
    }
    return CURRENCY_OPTIONS;
  }, [currencySymbol]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSaving(true);
    try {
      await tenantService.updateTenant(tenant.id, {
        name,
        email,
        phone,
        address,
        settings: {
          ...tenant.settings,
          currencySymbol,
          taxRate,
          lowStockThresholdDefault: lowStockDefault
        }
      });
      await refreshTenant();
      showToast('Business profile settings saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = hasPermission('settings.business.edit');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Business Profile & Store Settings
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Configure physical store details, billing currency, default tax rates, and alert thresholds.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{tenant?.name}</CardTitle>
                <CardDescription>Tenant ID: {tenant?.id}</CardDescription>
              </div>
              <Badge variant="primary" size="sm">
                {tenant?.planName} Plan
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* General Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Store Identity
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Business Name"
                    required
                    disabled={!canEdit}
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <Input
                  label="Official Store Email"
                  type="email"
                  required
                  disabled={!canEdit}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                <Input
                  label="Official Phone Number"
                  required
                  disabled={!canEdit}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Physical Address / Outlet Location"
                    disabled={!canEdit}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Locale & Inventory Defaults */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Financial & Inventory Preferences
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Currency Symbol"
                  disabled={!canEdit}
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  options={allCurrencyOptions}
                />

                <Input
                  label="Default Tax Rate (%)"
                  type="number"
                  step="0.1"
                  disabled={!canEdit}
                  value={taxRate}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                />

                <Input
                  label="Default Low Stock Threshold"
                  type="number"
                  disabled={!canEdit}
                  value={lowStockDefault}
                  onChange={e => setLowStockDefault(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>
          </CardContent>

          {canEdit && (
            <CardFooter className="flex justify-end">
              <Button type="submit" size="sm" isLoading={isSaving} icon={Save}>
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Workspace & Subscription Information */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-800">
                <Shield className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-bold">Workspace & Tier Subscription</CardTitle>
              </div>
              <CardDescription>
                Account subscription details, active product licensing, and resource quotas.
              </CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-xs"
            >
              <span className="flex items-center gap-1.5">
                Change / Upgrade Plan
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Active Tier</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1.5">
                {planName}
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                  {tier}
                </span>
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Licensed Product</span>
              <span className="text-sm font-bold text-blue-700 mt-0.5 block">{tenant?.applicationName || 'Inventory Management'}</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Account Status</span>
              <div className="mt-0.5">
                <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'}>
                  {(tenant?.status || 'Active').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Products</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{limits.maxProducts.toLocaleString()} SKUs</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Warehouses</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{limits.maxWarehouses} Facility</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Team Seats</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{limits.maxUsers} Users</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cloud Storage</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{limits.storageMb >= 1024 ? `${limits.storageMb / 1024} GB` : `${limits.storageMb} MB`}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};

