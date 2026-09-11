import React from 'react';
import { MOCK_PLANS } from '../../data/initialData';
import { Button } from '../../components/ui/Button';
import { CreditCard, Check, Sparkles } from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2 font-display">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Subscription Plans & Packaging
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure platform pricing tiers, product quotas, and feature entitlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_PLANS.map(plan => (
          <div
            key={plan.id}
            className={`p-6 rounded-[14px] border flex flex-col justify-between transition-all ${
              plan.isPopular
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-md'
                : 'bg-white border-[#E2E8F0] shadow-2xs hover:shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-[#0F172A]">{plan.name}</span>
                {plan.isPopular && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    MOST POPULAR
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">₹{plan.monthlyPrice}</span>
                <span className="text-xs text-slate-500"> / month</span>
                <div className="text-[11px] text-slate-400 mt-1">or ₹{plan.annualPrice} billed annually</div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0] text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to {plan.maxProducts.toLocaleString()} Products Catalog</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{plan.maxUsers} Staff Accounts</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="capitalize">Included: {(plan.includedModules || ['inventory']).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time Multi-tenant Partition</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E2E8F0]">
              <Button
                size="sm"
                variant={plan.isPopular ? 'primary' : 'outline'}
                className="w-full"
              >
                Configure Pricing
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
