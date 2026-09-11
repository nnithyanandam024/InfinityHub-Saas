import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PLATFORM_APPLICATIONS, SUBSCRIPTION_PLANS } from '@infinityhub/constants';
import { Button } from '../../components/ui/Button';
import {
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

const APP_ICONS: Record<string, React.ElementType> = {
  inventory: Boxes,
  pos: Receipt,
  restaurant: UtensilsCrossed,
  employee: Users,
  appointment: CalendarCheck
};

export const AppDetailPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const app = PLATFORM_APPLICATIONS.find(a => a.id === appId);

  if (!app) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Application Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested application could not be located in the catalog.</p>
        <Link to="/apps">
          <Button size="sm" icon={ArrowLeft}>Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const Icon = APP_ICONS[app.id] || Boxes;

  const handleSelectPlan = (planId: string) => {
    navigate(`/provision?app=${app.id}&plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/apps" className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Applications</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#0F172A]">{app.name}</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              service:{app.serviceId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button size="sm" variant="outline">Sign In</Button>
          </Link>
          <Button size="sm" variant="primary" onClick={() => handleSelectPlan('plan-professional')}>
            Choose Plan
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 space-y-12">
        {/* App Hero */}
        <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-10 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  app.isAvailable
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-display">
                    {app.name}
                  </h1>
                  {app.isAvailable ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Production Live
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Pre-Registration Suite
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-blue-600 mb-3">
                  {app.tagline}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-xs text-slate-400 mb-0.5">Plans starting at</div>
              <div className="text-2xl font-bold text-[#0F172A]">
                ₹{app.startingPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="mt-3 w-full sm:w-auto"
                onClick={() => handleSelectPlan('plan-professional')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Core Feature Capabilities Grid */}
          <div className="mt-8 pt-8 border-t border-[#E2E8F0]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Core Capabilities & Workflows Included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              {(app.extendedFeatures || app.coreNavItems).map(feature => (
                <div key={feature} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Plans Selection */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Select a Subscription Plan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose the right quota tier for your {app.name} workspace. Upgrade or adjust anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`bg-white rounded-[18px] border p-6 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-md relative'
                    : 'border-[#E2E8F0] shadow-2xs'
                }`}
              >
                <div>
                  {plan.isPopular && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider mb-3">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-[#0F172A]">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="text-2xl font-extrabold text-[#0F172A] mb-1">
                    ₹{plan.monthlyPrice.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-6">
                    or ₹{plan.annualPrice.toLocaleString()} billed annually
                  </div>

                  {/* Plan Features */}
                  <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0] text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{plan.maxProducts.toLocaleString()} Records / Products Quota</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{plan.maxUsers} Staff Accounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{Math.round((plan.storageMb || 1024) / 1024)} GB Cloud Storage</span>
                    </div>
                    {(plan.features || []).map(f => (
                      <div key={f} className="flex items-center gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E2E8F0]">
                  <Button
                    size="sm"
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Choose {plan.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 bg-white border-t border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between text-xs text-slate-400 mt-auto">
        <span>© 2026 InfinityHub Business SaaS Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/apps" className="hover:text-slate-700">All Applications</Link>
          <Link to="/login" className="hover:text-slate-700">Sign In</Link>
          <Link to="/admin/dashboard" className="hover:text-slate-700">Super Admin</Link>
        </div>
      </footer>
    </div>
  );
};
