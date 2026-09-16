import React from 'react';
import { Loader2, ShieldCheck, Boxes, Store } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  scope?: 'tenant' | 'admin' | 'stock';
  storeName?: string;
  applicationId?: 'inventory' | 'pos' | 'restaurant' | 'employee';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  subMessage,
  fullScreen = true,
  scope = 'tenant',
  storeName,
  applicationId = 'inventory'
}) => {
  const isAdmin = scope === 'admin';

  const defaultMessage = isAdmin
    ? 'Initializing Platform Control Plane...'
    : storeName
    ? `Preparing ${storeName} Workspace...`
    : 'Loading Business Workspace...';

  const defaultSub = isAdmin
    ? 'Verifying zero-trust administrative credentials and cluster telemetry'
    : 'Synchronizing real-time catalog, stock levels, and store registers';

  const displayMessage = message || defaultMessage;
  const displaySubMessage = subMessage || defaultSub;

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto relative">
      {/* Glassmorphic Card */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-900/5 flex flex-col items-center">
        {/* Animated Concentric Aura & Center Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div
            className={`absolute w-24 h-24 rounded-full -z-10 animate-pulse-glow ${
              isAdmin ? 'bg-emerald-400/20' : 'bg-blue-500/20'
            }`}
          />

          {/* Orbiting Ring Indicator */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg ${
              isAdmin
                ? 'bg-slate-900 text-emerald-400 shadow-emerald-500/10 border border-slate-800'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : storeName ? (
              <Store className="w-8 h-8 text-white" />
            ) : (
              <Boxes className="w-8 h-8 text-white" />
            )}

            {/* Micro rotating indicator border */}
            <div className="absolute -inset-1.5 rounded-[18px] border border-blue-500/30 border-t-transparent animate-spin pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Title */}
        <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight mb-2">
          {displayMessage}
        </h3>

        {/* Subtitle / Context Micro-copy */}
        {displaySubMessage && (
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6">
            {displaySubMessage}
          </p>
        )}

        {/* Modern Live Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span className="text-[11px] font-semibold text-slate-600 tracking-wide uppercase">
            {isAdmin ? 'Verifying Platform Scope' : 'Active Store Session'}
          </span>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center">
      {content}
    </div>
  );
};
