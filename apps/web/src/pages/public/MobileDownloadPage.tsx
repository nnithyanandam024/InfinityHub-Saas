import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Package
} from 'lucide-react';
import { tenantService } from '../../services/tenantService';
import { TenantMobileBranding } from '@infinityhub/types';

export const MobileDownloadPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId') || 'tenant-abc-supermarket';
  const paramName = searchParams.get('name') || '';

  const [branding, setBranding] = useState<TenantMobileBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    tenantService
      .getAppBranding(tenantId)
      .then(data => {
        if (isMounted) {
          setBranding(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const appName = paramName || branding?.appName || 'Store Mobile Client';
  const primaryColor = branding?.primaryColor || '#2563EB';
  const logoUrl = branding?.logoUrl;
  const fileSizeMb = branding?.apkFileSizeMb || 34.8;
  const buildNumber = branding?.apkBuildNumber || 1;

  // Resolve download link: Relative path on Vercel/Web, API on local backend
  const isLocalApi =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const directDownloadUrl = isLocalApi
    ? `http://localhost:4000/api/v1/tenants/download-apk?tenantId=${tenantId}`
    : `/downloads/infinityhub-store.apk`;

  const safeFilename = `${(appName || 'store').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}-release.apk`;

  const handleDownloadClick = () => {
    setDownloadStarted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full pt-2 pb-4 flex items-center justify-between">
        <Link
          to="/settings/business"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Verified APK
        </span>
      </div>

      {/* Main Download Card */}
      <div className="max-w-md mx-auto w-full space-y-6 my-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
          {/* Ambient Glow */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          {/* App Icon Tile */}
          <div className="relative mx-auto mb-4 w-24 h-24 rounded-3xl p-1 shadow-xl border border-white/10" style={{ backgroundColor: primaryColor }}>
            <div className="w-full h-full rounded-[22px] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* App Title & Metadata */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-display mb-1">
            {appName}
          </h1>
          <p className="text-xs text-slate-400 font-medium mb-4">
            Official Android Store Client • v1.0.0 (Build #{buildNumber})
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              Android 8.0+
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {fileSizeMb} MB
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Signed & Ready
            </span>
          </div>

          {/* Big Download Button */}
          <a
            href={directDownloadUrl}
            download={safeFilename}
            onClick={handleDownloadClick}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-98 cursor-pointer hover:brightness-110"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Download Store APK</span>
          </a>

          {downloadStarted && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs text-left flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Download Started!</span>
                <span className="text-[11px] text-emerald-400/80">
                  Check your browser's download notifications. Tap the file once finished to install.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3-Step Sideloading Instructions */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-blue-400" />
            Quick Sideloading Guide
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-slate-300">
                Tap <strong>Download Store APK</strong> above. If Android warns <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-slate-300">
                When prompted, allow your browser permission to <strong>Install Unknown Apps</strong> in Settings.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-slate-300">
                Tap the downloaded file in your notification bar and click <strong>Install</strong> to launch your dedicated client.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full pt-4 pb-2 text-center text-[11px] text-slate-500">
        <span>InfinityHub SaaS • Dedicated Store Distribution</span>
      </div>
    </div>
  );
};
