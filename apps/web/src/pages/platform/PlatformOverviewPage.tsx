import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import {
  ArrowRight,
  Boxes,
  ShieldCheck,
  Zap,
  Building2,
  Lock,
  Layers,
  CheckCircle2,
  Store
} from 'lucide-react';

export const PlatformOverviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Platform Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            ∞
          </div>
          <div>
            <span className="text-base font-bold text-[#0F172A] tracking-tight font-display">
              InfinityHub
            </span>
            <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              SaaS Platform
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link to="/login">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
          <Link to="/apps">
            <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
              Explore Applications
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display leading-[1.15]">
          Business software for <br className="hidden sm:inline" />
          <span className="text-blue-600">your operations.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
          InfinityHub sells and provisions dedicated, industry-specific business applications on unified cloud infrastructure. Subscribe to the standalone solution you need with zero unwanted clutter.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link to="/apps">
            <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right" className="shadow-sm">
              Explore Applications
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Customer Sign In
            </Button>
          </Link>
        </div>

        {/* Three Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 text-left">
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-[16px] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Boxes className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Standalone Workspaces</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Each customer gets a dedicated workspace tailored exclusively to their purchased business product.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5 rounded-[16px] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Instant Provisioning</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Select your application, choose a plan tier, and launch an active business store in seconds.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5 rounded-[16px] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Strict Data Isolation</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your business records, stock balances, and private catalogs are partitioned securely to your store.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 bg-white border-t border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 InfinityHub Business SaaS Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/apps" className="hover:text-slate-700">Applications Catalog</Link>
          <Link to="/login" className="hover:text-slate-700">Customer Login</Link>
          <Link to="/admin/dashboard" className="hover:text-slate-700">Platform Admin</Link>
        </div>
      </footer>
    </div>
  );
};
