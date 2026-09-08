import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryFeature, PlanTier } from '@infinityhub/types';
import { useEntitlements } from '../../hooks/useEntitlements';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PlanUpgradeModal } from '../subscription/PlanUpgradeModal';
import { Lock, Sparkles, ArrowLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface RequireFeatureProps {
  feature: InventoryFeature;
  children: React.ReactNode;
}

export const RequireFeature: React.FC<RequireFeatureProps> = ({ feature, children }) => {
  const { hasFeature, getFeatureInfo, getMinTier, planName } = useEntitlements();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const info = getFeatureInfo(feature);
  const requiredTier: PlanTier = getMinTier(feature);
  const requiredTierName = requiredTier === 'business' ? 'Business' : 'Professional';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
        {/* Subtle accent backdrop */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-xs mb-4">
          <Lock className="w-6 h-6" />
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="warning">Feature Gate</Badge>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Requires {requiredTierName} Plan
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight mb-2">
          {info?.name || 'Advanced Feature'} is Locked
        </h2>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          Your workspace is currently on the <span className="font-bold text-[#0F172A]">{planName}</span> plan.{' '}
          {info?.description || 'This advanced operational tool is unlocked on higher tier plans.'}
        </p>

        {/* Value Callout Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Why upgrade to {requiredTierName}?</span>
          </div>
          <div className="space-y-1.5 pl-6 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlock full access to {info?.name || 'this feature'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Higher product SKU & user capacity quotas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Automated intelligence, ledger reconciliation, and reporting</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold shadow-xs"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            <span className="flex items-center gap-2">
              Upgrade to {requiredTierName}
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium"
            onClick={() => navigate('/inventory/products')}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Catalog
            </span>
          </Button>
        </div>
      </div>

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightTier={requiredTier as any}
      />
    </div>
  );
};
