import React from 'react';
import { Link } from 'react-router-dom';
import { PLATFORM_APPLICATIONS } from '@infinityhub/constants';
import { Button } from '../../components/ui/Button';
import {
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const APP_ICONS: Record<string, React.ElementType> = {
  inventory: Boxes,
  pos: Receipt,
  restaurant: UtensilsCrossed,
  employee: Users,
  appointment: CalendarCheck
};

export const AppsCatalogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/platform" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              ∞
            </div>
            <div>
              <span className="text-base font-bold text-[#0F172A] tracking-tight font-display">
                InfinityHub
              </span>
              <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Applications
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/platform" className="text-xs font-semibold text-slate-600 hover:text-slate-900 hidden sm:inline px-3 py-1.5 rounded-lg hover:bg-slate-100">
            About Platform
          </Link>
          <Link to="/login">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
          <Link to="/provision">
            <Button size="sm" variant="primary">
              Provision Store
            </Button>
          </Link>
        </div>
      </header>

      {/* Catalog Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Title Bar */}
        <div className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Independent SaaS Suites</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Applications Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Choose the dedicated software application tailored to your business operations. Each product is provisioned as an independent workspace with clean, dedicated navigation.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 text-xs text-slate-500 font-medium">
            5 Standalone Applications
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORM_APPLICATIONS.map(app => {
            const Icon = APP_ICONS[app.id] || Boxes;

            return (
              <div
                key={app.id}
                className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div>
                  {/* Icon & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                        app.isAvailable
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {app.isAvailable ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Production Live
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Pre-Registration
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <h2 className="text-lg font-bold text-[#0F172A] font-display">
                    {app.name}
                  </h2>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5 mb-2.5">
                    {app.tagline}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">
                    {app.description}
                  </p>

                  {/* Main capabilities */}
                  <div className="space-y-1.5 pt-4 border-t border-[#E2E8F0]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Main Capabilities
                    </span>
                    {app.coreNavItems.slice(0, 4).map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${app.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Starting Price & CTA */}
                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-slate-400">Starting from</span>
                    <span className="text-sm font-bold text-[#0F172A]">
                      ₹{app.startingPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ mo</span>
                    </span>
                  </div>

                  <Link to={`/apps/${app.id}`} className="block">
                    <Button
                      size="sm"
                      variant={app.isAvailable ? 'primary' : 'outline'}
                      className="w-full"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      View Application
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 bg-white border-t border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between text-xs text-slate-400 mt-auto">
        <span>© 2026 InfinityHub Business SaaS Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/platform" className="hover:text-slate-700">Platform Home</Link>
          <Link to="/login" className="hover:text-slate-700">Customer Login</Link>
          <Link to="/admin/dashboard" className="hover:text-slate-700">Super Admin</Link>
        </div>
      </footer>
    </div>
  );
};
