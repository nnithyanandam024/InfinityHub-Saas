import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PLATFORM_APPLICATIONS } from '@infinityhub/constants';
import { ProvisionTenantModal } from './ProvisionTenantModal';
import { Button } from '../../components/ui/Button';
import {
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const PlatformHomePage: React.FC = () => {
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [defaultApp, setDefaultApp] = useState<'inventory' | 'pos' | 'restaurant' | 'employee' | 'appointment'>('inventory');
  const navigate = useNavigate();

  const handleOpenProvision = (appId: any = 'inventory') => {
    setDefaultApp(appId);
    setIsProvisionModalOpen(true);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Boxes': return Boxes;
      case 'Receipt': return Receipt;
      case 'UtensilsCrossed': return UtensilsCrossed;
      case 'Users': return Users;
      default: return CalendarCheck;
    }
  };

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

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button size="sm" variant="outline">
              Customer Sign In
            </Button>
          </Link>

          <Button size="sm" variant="primary" onClick={() => handleOpenProvision('inventory')} className="shadow-xs">
            Provision Store
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-16 pb-12 lg:pt-20 lg:pb-16 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Specialized Multi-Tenant SaaS Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display leading-tight max-w-3xl mx-auto">
          One Shared Platform. <br />
          <span className="text-blue-600">Dedicated Business Applications.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-4 leading-relaxed">
          InfinityHub provisions separate, industry-specific business applications on an isolated multi-tenant cloud foundation. Customers subscribe strictly to their required product with zero unwanted clutter.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button size="lg" onClick={() => handleOpenProvision('inventory')} icon={ArrowRight} iconPosition="right" className="shadow-md">
            Explore & Provision Inventory App
          </Button>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign In to Existing Workspace
            </Button>
          </Link>
        </div>
      </section>

      {/* Applications Catalog Grid */}
      <section className="px-4 py-8 lg:py-12 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight font-display">
              Standalone SaaS Applications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select the dedicated business software engineered for your operational workflow.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 mt-2 sm:mt-0">
            5 Independent Industry Applications
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORM_APPLICATIONS.map(app => {
            const Icon = getIcon(app.iconName);

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  app.isAvailable
                    ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-md'
                    : 'border-[#E2E8F0] shadow-2xs opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      app.isAvailable ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {app.isAvailable ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Production Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Pre-Registration
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] tracking-tight font-display">
                    {app.name}
                  </h3>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5 mb-2">
                    {app.tagline}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {app.description}
                  </p>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-1.5 text-xs text-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Included Workflows
                    </span>
                    {app.coreNavItems.map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${app.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  {app.isAvailable ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onClick={() => handleOpenProvision(app.id)}
                      >
                        Provision Store
                      </Button>
                      <Link to="/login" className="w-full">
                        <Button size="sm" variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenProvision(app.id)}
                    >
                      Request Provisioning
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="h-14 bg-white border-t border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 InfinityHub Business SaaS Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-slate-700">Customer Login</Link>
          <Link to="/admin/dashboard" className="hover:text-slate-700">Platform Admin</Link>
        </div>
      </footer>

      {/* Self-Serve Provisioning Modal */}
      <ProvisionTenantModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        defaultApplicationId={defaultApp}
      />
    </div>
  );
};
