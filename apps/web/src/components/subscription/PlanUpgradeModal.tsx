import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SUBSCRIPTION_PLANS } from '@infinityhub/constants';
import { useEntitlements } from '../../hooks/useEntitlements';
import { useToast } from '../../context/ToastContext';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightTier?: 'professional' | 'business';
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  highlightTier
}) => {
  const { tier: currentTier, planId: currentPlanId, upgradePlan } = useEntitlements();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectPlan = async (targetPlanId: string, targetName: string) => {
    if (targetPlanId === currentPlanId) {
      onClose();
      return;
    }
    setIsUpdating(true);
    try {
      await upgradePlan(targetPlanId);
      showToast(`Workspace subscription successfully updated to ${targetName}!`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" title="Change Workspace Subscription Plan">
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <Badge variant="primary" className="mb-2">
            Tiered Inventory Architecture
          </Badge>
          <h3 className="text-lg font-bold text-[#0F172A]">
            Select the Plan That Fits Your Scale
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Switch plans anytime to instantly unlock advanced operations, increased quotas, and automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.map(plan => {
            const isCurrent = plan.id === currentPlanId;
            const isTargetHighlight = highlightTier && plan.tier === highlightTier;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-xs'
                    : isTargetHighlight
                    ? 'border-amber-400 bg-amber-50/10 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                    Active Plan
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1 mt-1">
                    <h4 className="font-bold text-sm text-[#0F172A]">{plan.name}</h4>
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      {plan.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 min-h-[32px] leading-tight">
                    {plan.description}
                  </p>

                  <div className="mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-[#0F172A]">
                        ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Billed monthly or ₹{plan.annualPrice.toLocaleString('en-IN')}/year
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Included Capabilities:
                    </span>
                    {plan.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    className="w-full text-xs py-2"
                    disabled={isCurrent || isUpdating}
                    onClick={() => handleSelectPlan(plan.id, plan.name)}
                  >
                    {isCurrent ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Current Plan
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 justify-center">
                        Switch to {plan.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200 text-[11px] text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
          Upgrades take effect immediately across all active sessions and user roles in your workspace.
        </div>
      </div>
    </Modal>
  );
};
