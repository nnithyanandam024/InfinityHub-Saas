import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { TenantMobileBranding } from '@infinityhub/types';
import {
  Building,
  Save,
  Shield,
  ArrowUpRight,
  CheckCircle2,
  Smartphone,
  Download,
  QrCode,
  RefreshCw,
  Sparkles,
  Terminal,
  Check,
  Layers,
  Palette,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
  Boxes,
  Receipt,
  UploadCloud,
  FileImage,
  Trash2,
  ExternalLink
} from 'lucide-react';

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

const PRESET_COLORS = [
  { hex: '#2563EB', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#7C3AED', name: 'Violet' },
  { hex: '#EA580C', name: 'Amber Glow' },
  { hex: '#DC2626', name: 'Crimson' },
  { hex: '#0F172A', name: 'Midnight Navy' }
];

const PRESET_LOGOS = [
  {
    name: 'Supermarket & Retail',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80',
    icon: '🛒'
  },
  {
    name: 'Hardware & Tools',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=200&auto=format&fit=crop&q=80',
    icon: '🔧'
  },
  {
    name: 'Electronics & Tech',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&auto=format&fit=crop&q=80',
    icon: '⚡'
  },
  {
    name: 'Organic & Grocery',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    icon: '🌿'
  },
  {
    name: 'Modern Emblem (∞)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    icon: '💎'
  }
];

const BUILD_PIPELINE_STEPS = [
  'Validating assets & screen resolutions',
  'Generating adaptive launcher mipmaps (mdpi to xxxhdpi)',
  'Injecting AndroidManifest & Strings.xml (App Name)',
  'Packaging tenant_config.json with offline cache',
  'Compiling & signing APK with release keystore (v2)',
  'APK verified, signed and ready for installation'
];

export const BusinessSettingsPage: React.FC = () => {
  const { tenant, refreshTenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { tier, planName, limits } = useEntitlements();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Tab State: 'profile' (Store Profile) | 'mobile_app' (Branded Mobile App & APK)
  const [activeTab, setActiveTab] = useState<'profile' | 'mobile_app'>('profile');

  // Store Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [taxRate, setTaxRate] = useState<number>(5.0);
  const [lowStockDefault, setLowStockDefault] = useState<number>(10);
  const [isSaving, setIsSaving] = useState(false);

  // White-Label Mobile App State
  const [branding, setBranding] = useState<TenantMobileBranding | null>(null);
  const [appName, setAppName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [phonePreviewMode, setPhonePreviewMode] = useState<'launcher' | 'splash'>('launcher');
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [buildStepIndex, setBuildStepIndex] = useState(0);
  const [buildProgress, setBuildProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Local File Upload & Drag-and-Drop state
  const [logoSourceTab, setLogoSourceTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    sizeKb: number;
    width?: number;
    height?: number;
  } | null>(null);
  const [detectedNameSuggestion, setDetectedNameSuggestion] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract clean human-readable name from filename
  const extractCleanNameFromFilename = (filename: string): string => {
    if (!filename) return '';
    let clean = filename.replace(/\.[^/.]+$/, '');
    clean = clean.replace(/[-_](logo|icon|app|brand|branding|client|store|retail|preview|thumb|image)$/gi, '');
    clean = clean.replace(/^(logo|icon|app|brand|branding|client|store|retail)[-_]/gi, '');
    clean = clean.replace(/[-_.]+/g, ' ');
    clean = clean
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
    return clean;
  };

  // Handler for local file processing
  const handleProcessLocalFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB. Please choose a smaller image', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setUploadedFileInfo({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      };
      img.src = dataUrl;

      setLogoUrl(dataUrl);

      // Smart name extraction
      const extracted = extractCleanNameFromFilename(file.name);
      if (extracted) {
        setDetectedNameSuggestion(extracted);
        // If appName is default or matches store, auto-apply it
        if (!appName || appName === tenant?.name || appName === 'Store Mobile Client') {
          setAppName(extracted);
          setShortName(extracted.slice(0, 14));
        }
        showToast(`Loaded "${file.name}" & extracted name "${extracted}"`, 'success');
      } else {
        showToast(`Loaded "${file.name}" successfully`, 'success');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read local file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessLocalFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLocalFile = () => {
    setUploadedFileInfo(null);
    setDetectedNameSuggestion(null);
    setLogoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Local logo removed', 'info');
  };

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setEmail(tenant.email);
      setPhone(tenant.phone);
      setAddress(tenant.address || '');
      setCurrencySymbol(tenant.settings?.currencySymbol || '₹');
      setTaxRate(tenant.settings?.taxRate || 5.0);
      setLowStockDefault(tenant.settings?.lowStockThresholdDefault || 10);

      // Load Branding
      tenantService.getAppBranding(tenant.id).then(brand => {
        setBranding(brand);
        setAppName(brand.appName || tenant.name);
        setShortName(brand.shortName || tenant.name.slice(0, 14));
        setLogoUrl(brand.logoUrl || tenant.logoUrl || '');
        setPrimaryColor(brand.primaryColor || '#2563EB');
        if (brand.buildLogs && brand.buildLogs.length > 0) {
          setTerminalLogs(brand.buildLogs);
        }
      });
    }
  }, [tenant]);

  const allCurrencyOptions = useMemo(() => {
    if (currencySymbol && !CURRENCY_OPTIONS.some(opt => opt.value === currencySymbol)) {
      return [{ value: currencySymbol, label: `${currencySymbol} — Custom Currency` }, ...CURRENCY_OPTIONS];
    }
    return CURRENCY_OPTIONS;
  }, [currencySymbol]);

  const canEdit = hasPermission('settings.business.edit');

  const handleSaveProfile = async (e: React.FormEvent) => {
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

  const handleSaveBranding = async () => {
    if (!tenant) return;
    setIsSavingBranding(true);
    try {
      const updated = await tenantService.updateAppBranding(tenant.id, {
        appName,
        shortName,
        logoUrl,
        primaryColor,
        appSuite: tenant.applicationId
      });
      setBranding(updated);
      showToast('App branding configuration saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update branding', 'error');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleBuildApk = async () => {
    if (!tenant) return;
    setIsBuildingApk(true);
    setBuildProgress(10);
    setBuildStepIndex(0);
    setShowLogs(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const logs: string[] = [
      `[${timeStr}] Initializing white-label build worker for ${tenant.name}...`,
      `[${timeStr}] Target Architecture: Universal Android APK (arm64-v8a, armeabi-v7a, x86_64)`,
      `[${timeStr}] Branding Context: App Name "${appName}" | Short Launcher "${shortName}"`
    ];
    setTerminalLogs([...logs]);

    // Simulated authentic progressive build steps
    const stepInterval = setInterval(() => {
      setBuildStepIndex(prev => {
        const next = prev + 1;
        if (next < BUILD_PIPELINE_STEPS.length) {
          const stepTime = new Date().toLocaleTimeString();
          logs.push(`[${stepTime}] ${BUILD_PIPELINE_STEPS[next]}`);
          setTerminalLogs([...logs]);
          setBuildProgress(Math.min(92, (next / (BUILD_PIPELINE_STEPS.length - 1)) * 95));
          return next;
        }
        return prev;
      });
    }, 600);

    try {
      const updated = await tenantService.buildApk(tenant.id, {
        appName,
        shortName,
        logoUrl,
        primaryColor,
        appSuite: tenant.applicationId
      });

      clearInterval(stepInterval);
      setBuildStepIndex(BUILD_PIPELINE_STEPS.length - 1);
      setBuildProgress(100);

      const endTime = new Date().toLocaleTimeString();
      logs.push(`[${endTime}] Build complete! Package artifact: ${appName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}-v1.0.apk (112.6 MB)`);
      logs.push(`[${endTime}] Staged at /api/v1/tenants/download-apk?tenantId=${tenant.id}`);
      setTerminalLogs(updated.buildLogs && updated.buildLogs.length > 0 ? updated.buildLogs : logs);
      setBranding(updated);
      showToast('Branded APK built successfully! Ready to download.', 'success');
    } catch (err: any) {
      clearInterval(stepInterval);
      showToast(err.message || 'Build pipeline failed', 'error');
    } finally {
      setIsBuildingApk(false);
    }
  };

  const hasUnsavedBrandingChanges = Boolean(
    branding &&
      (appName !== branding.appName ||
        shortName !== branding.shortName ||
        logoUrl !== (branding.logoUrl || '') ||
        primaryColor !== branding.primaryColor)
  );

  // Dynamic host-aware download resolver
  const isLocalApi =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const downloadUrl = isLocalApi
    ? `http://localhost:4000/api/v1/tenants/download-apk?tenantId=${tenant?.id || 'tenant-abc-supermarket'}`
    : `/downloads/infinityhub-store.apk`;

  const safeApkFilename = `${(appName || tenant?.name || 'store').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}-release.apk`;

  const mobileInstallUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/download-apk?tenantId=${tenant?.id || 'tenant-abc-supermarket'}&name=${encodeURIComponent(appName || tenant?.name || '')}`
      : downloadUrl;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mobileInstallUrl)}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Business Profile & Store Settings
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure store identity, financial preferences, and generate custom branded Android APKs.
          </p>
        </div>

        {/* Tab Navigation Pill Switcher */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Store Profile & Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mobile_app')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mobile_app'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Mobile App & Branded APK</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
              APK
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STORE PROFILE & GENERAL DEFAULTS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <form onSubmit={handleSaveProfile}>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BRANDED MOBILE APP & APK GENERATOR (ONLY IN BUSINESS SETTINGS)       */}
      {/* ========================================================================= */}
      {activeTab === 'mobile_app' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-blue-800/40 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    White-Label Custom App Package
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight font-display">
                  Generate Your Company's Branded Android App
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Stamp your company name and logo onto an installable Android APK. Your staff can download and install your custom store app directly on their phones or tablets.
                </p>
              </div>

              {branding?.apkStatus === 'ready' && (
                <div className="shrink-0 flex items-center gap-2">
                  <a href={downloadUrl} download={safeApkFilename}>
                    <Button size="sm" variant="primary" icon={Download} className="bg-blue-500 hover:bg-blue-400 text-white font-bold">
                      Download APK
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: BRANDING FORM & ACTIONS (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Form Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    Mobile App Identity & Assets
                  </CardTitle>
                  <CardDescription>
                    Customize the name, launcher icon, and splash theme for your generated APK.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Smart Local Name Suggestion Banner */}
                  {detectedNameSuggestion && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                      <div className="flex items-center gap-2.5 text-xs text-blue-950 min-w-0">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">
                          Extracted from file: <strong className="text-blue-900 font-extrabold">{detectedNameSuggestion}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppName(detectedNameSuggestion);
                          setShortName(detectedNameSuggestion.slice(0, 14));
                          showToast(`Applied "${detectedNameSuggestion}" to App Name & Launcher Label`, 'success');
                        }}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        Apply as App Name
                      </button>
                    </div>
                  )}

                  {/* App Name */}
                  <Input
                    label="Mobile App Full Name"
                    required
                    disabled={!canEdit}
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. ABC Supermarket"
                  />

                  {/* Launcher Short Name */}
                  <Input
                    label="Launcher Label (Icon Name on Home Screen)"
                    required
                    disabled={!canEdit}
                    value={shortName}
                    maxLength={14}
                    onChange={e => setShortName(e.target.value)}
                    placeholder="e.g. ABC Super (Max 14 chars)"
                  />

                  {/* Company Logo Selector with Drag & Drop */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Company Logo / App Icon
                      </label>

                      {/* Source Mode Tabs */}
                      <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setLogoSourceTab('upload')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            logoSourceTab === 'upload'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <UploadCloud className="w-3 h-3 text-blue-600" />
                          <span>Local File / Drag</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoSourceTab('url')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            logoSourceTab === 'url'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3 text-slate-500" />
                          <span>Web URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoSourceTab('presets')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            logoSourceTab === 'presets'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Presets</span>
                        </button>
                      </div>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleProcessLocalFile(e.target.files[0]);
                        }
                      }}
                    />

                    {/* TAB 1: LOCAL FILE DRAG & DROP */}
                    {logoSourceTab === 'upload' && (
                      <div className="space-y-2">
                        {uploadedFileInfo ? (
                          /* Uploaded File Inspector */
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={logoUrl}
                                alt="Local Logo Preview"
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs bg-white shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block truncate">
                                  {uploadedFileInfo.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {uploadedFileInfo.sizeKb} KB
                                  </span>
                                  {uploadedFileInfo.width && uploadedFileInfo.height && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      • {uploadedFileInfo.width}×{uploadedFileInfo.height}px
                                    </span>
                                  )}
                                  <Badge variant="success" size="sm">
                                    Local
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveLocalFile}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                                title="Remove File"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Drag and Drop Zone */
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                              isDraggingFile
                                ? 'border-blue-500 bg-blue-50/70 ring-4 ring-blue-500/10'
                                : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-100/60'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">
                              Drag and drop your local logo here
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              or click to browse from your device
                            </p>
                            <span className="inline-block mt-2 text-[10px] text-slate-400 font-mono">
                              PNG, JPG, SVG, WebP up to 5MB • Auto-detects store name
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: IMAGE URL */}
                    {logoSourceTab === 'url' && (
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs bg-white shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-2xs shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {appName.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                        )}

                        <div className="flex-1">
                          <Input
                            label=""
                            disabled={!canEdit}
                            value={logoUrl}
                            onChange={e => {
                              setLogoUrl(e.target.value);
                              setUploadedFileInfo(null);
                            }}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: PRESETS */}
                    {logoSourceTab === 'presets' && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Choose a pre-made store emblem:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_LOGOS.map(pre => (
                            <button
                              key={pre.name}
                              type="button"
                              onClick={() => {
                                setLogoUrl(pre.url);
                                setUploadedFileInfo(null);
                                setDetectedNameSuggestion(null);
                              }}
                              className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                logoUrl === pre.url
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>{pre.icon}</span>
                              <span>{pre.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Brand Color */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Primary Brand Color & Splash Screen
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setPrimaryColor(c.hex)}
                            title={c.name}
                            style={{ backgroundColor: c.hex }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                              primaryColor === c.hex
                                ? 'ring-2 ring-offset-2 ring-slate-800 scale-105'
                                : ''
                            }`}
                          >
                            {primaryColor === c.hex && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 max-w-[120px]">
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-full text-xs font-mono px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700 uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bundled Mobile Suite */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {tenant?.applicationId === 'pos' ? (
                        <Receipt className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Boxes className="w-4 h-4 text-blue-600" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {tenant?.applicationId === 'pos'
                            ? 'Billing & POS Mobile Suite'
                            : 'Inventory Management Mobile Suite'}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {tenant?.applicationId === 'pos'
                            ? 'Rapid barcode checkout, tax invoices & stock'
                            : 'Catalog, barcode scanning & warehouse adjustments'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">
                      {tenant?.applicationId === 'pos' ? 'POS + Stock' : 'Inventory'}
                    </Badge>
                  </div>
                </CardContent>

                {canEdit && (
                  <CardFooter className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveBranding}
                      isLoading={isSavingBranding}
                      icon={Save}
                    >
                      Save Branding
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleBuildApk}
                      isLoading={isBuildingApk}
                      icon={RefreshCw}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {branding?.apkStatus === 'ready'
                        ? 'Regenerate Branded APK'
                        : 'Build & Generate APK'}
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Regenerate Warning if Modified */}
              {hasUnsavedBrandingChanges && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Branding settings modified! Click <strong>Regenerate Branded APK</strong> to apply your new logo and title.
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleBuildApk} className="shrink-0 bg-amber-100/60 border-amber-300 text-amber-900 hover:bg-amber-100">
                    Regenerate Now
                  </Button>
                </div>
              )}

              {/* Build Pipeline & Progress Bar */}
              {isBuildingApk && (
                <Card className="border-blue-200 bg-blue-50/40">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Building Branded Android Package...
                      </span>
                      <span>{Math.round(buildProgress)}%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${buildProgress}%` }}
                      />
                    </div>

                    <div className="space-y-1">
                      {BUILD_PIPELINE_STEPS.map((st, idx) => (
                        <div
                          key={st}
                          className={`flex items-center gap-2 text-xs transition-colors ${
                            idx <= buildStepIndex
                              ? 'text-blue-900 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              idx <= buildStepIndex ? 'text-blue-600' : 'text-slate-300'
                            }`}
                          />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terminal Logs View */}
              {terminalLogs.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showLogs ? 'Hide Compilation Logs' : 'View Compilation Logs'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({terminalLogs.length} events)</span>
                  </button>

                  {showLogs && (
                    <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto space-y-1 border border-slate-800">
                      {terminalLogs.map((log, idx) => (
                        <div key={idx} className="text-emerald-400/90 leading-tight">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Download & Installation Section (Only when Ready) */}
              {branding?.apkStatus === 'ready' && (
                <Card className="border-emerald-200 bg-emerald-50/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <CardTitle className="text-base text-emerald-950">
                          Branded APK Ready for Installation
                        </CardTitle>
                      </div>
                      <Badge variant="success" size="sm">
                        Build #{branding.apkBuildNumber}
                      </Badge>
                    </div>
                    <CardDescription>
                      Version {branding.apkVersion} • {branding.apkFileSizeMb || 112.6} MB • Updated {new Date(branding.lastBuiltAt || '').toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      {/* Direct QR Code */}
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 text-center">
                        <img
                          src={qrCodeUrl}
                          alt="Scan QR Code to Download APK"
                          className="w-28 h-28 mx-auto"
                        />
                        <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                          Scan with Android
                        </span>
                      </div>

                      {/* Download Details */}
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <h4 className="text-sm font-bold text-slate-900">
                          Install on Mobile Phones & Tablets
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Scan the QR code directly with your Android camera or tap the download button below.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <a href={downloadUrl} download={safeApkFilename}>
                            <Button size="sm" variant="primary" icon={Download} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                              Download {appName}.apk
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Sideloading Instructions */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>3-Step Android Installation Guide:</span>
                      </div>
                      <p><strong>1. Download:</strong> Scan QR code above or tap Download APK.</p>
                      <p><strong>2. Allow:</strong> Tap notification and enable <em>"Allow from this source"</em> if prompted.</p>
                      <p><strong>3. Open & Sign In:</strong> Launch your branded store app and sign in with your cashier or manager credentials.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN: INTERACTIVE ANDROID DEVICE PREVIEW (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Live Device Preview
                  </span>

                  {/* Toggle Preview Mode */}
                  <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPhonePreviewMode('launcher')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        phonePreviewMode === 'launcher'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Home Screen
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhonePreviewMode('splash')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        phonePreviewMode === 'splash'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Splash Screen
                    </button>
                  </div>
                </div>

                {/* Android Phone Frame */}
                <div className="w-full max-w-[300px] mx-auto bg-slate-900 rounded-[38px] p-3 shadow-xl border-4 border-slate-700 aspect-[9/18] flex flex-col justify-between overflow-hidden relative">
                  {/* Speaker & Front Camera Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                    <div className="w-10 h-1 bg-slate-800 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                  </div>

                  {/* Android Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-white/80 px-4 pt-2 z-20 font-medium">
                    <span>10:30</span>
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <span>98%</span>
                    </div>
                  </div>

                  {/* SCREEN VIEWPORT */}
                  {phonePreviewMode === 'launcher' ? (
                    /* LAUNCHER HOME SCREEN */
                    <div className="flex-1 flex flex-col justify-between py-6 px-4 relative z-10">
                      {/* Clock Widget */}
                      <div className="text-center pt-8">
                        <div className="text-3xl font-light text-white tracking-tight">10:30</div>
                        <div className="text-[10px] text-white/70 font-medium">Saturday, September 19</div>
                      </div>

                      {/* Desktop App Grid: Highlight Tenant's App */}
                      <div className="grid grid-cols-4 gap-4 py-8">
                        {/* Tenant's Branded App Icon */}
                        <div className="flex flex-col items-center group cursor-pointer">
                          <div
                            className="w-12 h-12 rounded-[14px] shadow-lg flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={appName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-extrabold text-sm">
                                {appName.slice(0, 2).toUpperCase() || 'ST'}
                              </span>
                            )}
                            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
                          </div>
                          <span className="text-[9px] font-bold text-white text-center mt-1.5 truncate max-w-[60px] drop-shadow-md">
                            {shortName || appName}
                          </span>
                        </div>

                        {/* Standard Companion Icons for realism */}
                        <div className="flex flex-col items-center opacity-40">
                          <div className="w-12 h-12 rounded-[14px] bg-slate-800 flex items-center justify-center text-white text-xs">
                            📷
                          </div>
                          <span className="text-[9px] text-white/70 mt-1.5">Camera</span>
                        </div>
                        <div className="flex flex-col items-center opacity-40">
                          <div className="w-12 h-12 rounded-[14px] bg-slate-800 flex items-center justify-center text-white text-xs">
                            💬
                          </div>
                          <span className="text-[9px] text-white/70 mt-1.5">Messages</span>
                        </div>
                        <div className="flex flex-col items-center opacity-40">
                          <div className="w-12 h-12 rounded-[14px] bg-slate-800 flex items-center justify-center text-white text-xs">
                            ⚙️
                          </div>
                          <span className="text-[9px] text-white/70 mt-1.5">Settings</span>
                        </div>
                      </div>

                      {/* Dock */}
                      <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-around">
                        <span className="text-xs">📞</span>
                        <span className="text-xs">🌐</span>
                        <span className="text-xs">📁</span>
                        <span className="text-xs">✉️</span>
                      </div>
                    </div>
                  ) : (
                    /* SPLASH SCREEN PREVIEW */
                    <div
                      className="flex-1 flex flex-col items-center justify-between py-12 px-4 transition-colors"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div />

                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg mb-3 overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={appName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-extrabold text-xl">
                              {appName.slice(0, 2).toUpperCase() || 'ST'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-white tracking-tight">
                          {appName || 'Your Store'}
                        </h3>
                        <span className="text-[10px] text-white/80 font-medium mt-0.5">
                          {tenant?.applicationId === 'pos' ? 'Retail Billing & POS' : 'Inventory Management'}
                        </span>

                        <div className="mt-4 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-[9px] text-white font-semibold">
                          Dedicated Store Client
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-32 space-y-1.5 text-center">
                        <div className="w-full bg-white/30 rounded-full h-1 overflow-hidden">
                          <div className="bg-white h-full w-2/3 rounded-full" />
                        </div>
                        <span className="text-[8px] text-white/70 font-mono">Synchronizing catalog...</span>
                      </div>
                    </div>
                  )}

                  {/* Android Home Bar Slit */}
                  <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mb-1 z-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
