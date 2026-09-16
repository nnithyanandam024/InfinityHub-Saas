import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayMs?: number;
  appName?: string;
  tagline?: string;
}

const STATUS_PIPELINE = [
  'Connecting to business data store...',
  'Mounting catalog schemas & price tiers...',
  'Synchronizing real-time inventory balances...',
  'Workspace initialized'
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayMs = 1500,
  appName = 'InfinityHub',
  tagline = 'Multi-Tenant Business SaaS Platform'
}) => {
  const [progress, setProgress] = useState(8);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Staged progress milestones
    const t1 = setTimeout(() => {
      setProgress(40);
      setStatusIndex(1);
    }, minDisplayMs * 0.25);

    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusIndex(2);
    }, minDisplayMs * 0.55);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusIndex(3);
    }, minDisplayMs * 0.85);

    const tFinish = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 400);
    }, minDisplayMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinish);
    };
  }, [minDisplayMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0F19] text-white transition-all duration-400 ease-out ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/15 blur-3xl -z-10 animate-pulse-glow pointer-events-none" />

      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-float-slow">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 p-0.5 shadow-2xl shadow-blue-500/30">
            <div className="w-full h-full rounded-[14px] bg-[#0F172A] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </div>
          {/* Subtle pulsating outer ring */}
          <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-md -z-10 animate-pulse-glow" />
        </div>

        {/* Brand Text */}
        <h1 className="text-2xl font-black text-white tracking-tight font-display mb-1.5">
          {appName}
        </h1>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-6">
          {tagline}
        </p>

        {/* Store Client Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-medium text-slate-300">Enterprise Cloud Node</span>
        </div>

        {/* Progress bar with shimmer effect */}
        <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden relative mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3 animate-shimmer-scan pointer-events-none" />
        </div>

        {/* Step Micro-copy */}
        <span className="text-xs font-medium text-slate-400 tracking-wide transition-opacity duration-200">
          {STATUS_PIPELINE[statusIndex]}
        </span>
      </div>
    </div>
  );
};
