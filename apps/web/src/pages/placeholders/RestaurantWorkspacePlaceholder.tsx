import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { UtensilsCrossed, CheckCircle2 } from 'lucide-react';

export const RestaurantWorkspacePlaceholder: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-[18px] shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] font-display">
              {tenant?.name} — Restaurant Management Workspace
            </h1>
            <p className="text-xs text-slate-500">
              Assigned SaaS Product: Restaurant Operations · {tenant?.planName} Tier
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Standalone Application Identity Confirmed</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            This customer store is provisioned exclusively for Restaurant Management (Tables, KDS, Orders). Your tenant partition is active with zero exposure to other industry products.
          </p>
        </div>
      </div>
    </div>
  );
};
