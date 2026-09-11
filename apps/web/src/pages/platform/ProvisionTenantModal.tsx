import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { PLATFORM_APPLICATIONS } from '@infinityhub/constants';
import { ApplicationId } from '@infinityhub/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  X,
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ProvisionTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApplicationId?: ApplicationId;
  defaultApp?: any;
}

export const ProvisionTenantModal: React.FC<ProvisionTenantModalProps> = ({
  isOpen,
  onClose,
  defaultApplicationId = 'inventory',
  defaultApp
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const initialAppId = (defaultApp?.id || defaultApplicationId || 'inventory') as ApplicationId;
  const [selectedApp, setSelectedApp] = useState<ApplicationId>(initialAppId);

  React.useEffect(() => {
    if (defaultApp?.id) {
      setSelectedApp(defaultApp.id);
    } else if (defaultApplicationId) {
      setSelectedApp(defaultApplicationId);
    }
  }, [defaultApp, defaultApplicationId]);
  const [selectedPlan, setSelectedPlan] = useState<string>('plan-professional');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98400 12345');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { setTenantId } = useTenant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ownerName || !email) {
      showToast('Please fill in all business information', 'error');
      return;
    }

    if (password && password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTenant = await tenantService.provisionTenant({
        name: businessName,
        ownerName,
        email,
        phone,
        applicationId: selectedApp,
        planId: selectedPlan,
        password: password || 'password123'
      });

      showToast(`Account successfully provisioned for ${newTenant.name}!`, 'success');
      await login(email, password || 'password123', 'TENANT_OWNER');
      await setTenantId(newTenant.id);
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Provisioning failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Customer Onboarding & Provisioning
            </span>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Provision Business Workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              1
            </span>
            <span className={`font-semibold ${step === 1 ? 'text-blue-600' : 'text-slate-600'}`}>Application</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              2
            </span>
            <span className={`font-semibold ${step === 2 ? 'text-blue-600' : 'text-slate-600'}`}>Plan Tier</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              3
            </span>
            <span className={`font-semibold ${step === 3 ? 'text-blue-600' : 'text-slate-600'}`}>Business Info</span>
          </div>
        </div>

        {/* Step 1: Application Selection */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Select Your Business Application</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Each product is a standalone application customized for your industry workflows.
              </p>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {PLATFORM_APPLICATIONS.map(app => {
                const Icon = getIcon(app.iconName);
                const isSelected = selectedApp === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app.id)}
                    className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0F172A]">{app.name}</span>
                          {app.isAvailable ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Production Live
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              Phase 1+
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{app.description}</p>
                      </div>
                    </div>

                    <div className="mt-1">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <Button size="sm" onClick={() => setStep(2)} icon={ArrowRight} iconPosition="right">
                Continue to Plan Selection
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Choose Subscription Tier</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Predictable SaaS pricing with zero lock-in and transparent quota limits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSelectedPlan('plan-starter')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPlan === 'plan-starter'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                    : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-[#0F172A]">Starter</div>
                <div className="text-lg font-extrabold text-[#0F172A] mt-1">₹999<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                <p className="text-[11px] text-slate-500 mt-2">Up to 500 items catalog, 3 user seats</p>
              </div>

              <div
                onClick={() => setSelectedPlan('plan-professional')}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                  selectedPlan === 'plan-professional'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                    : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                }`}
              >
                <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                  POPULAR
                </span>
                <div className="font-bold text-xs text-[#0F172A]">Professional</div>
                <div className="text-lg font-extrabold text-[#0F172A] mt-1">₹2,499<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                <p className="text-[11px] text-slate-500 mt-2">Up to 5,000 items catalog, 10 user seats</p>
              </div>

              <div
                onClick={() => setSelectedPlan('plan-enterprise')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPlan === 'plan-enterprise'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                    : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-[#0F172A]">Enterprise</div>
                <div className="text-lg font-extrabold text-[#0F172A] mt-1">₹5,999<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                <p className="text-[11px] text-slate-500 mt-2">Up to 50,000 items catalog, 50 user seats</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)} icon={ArrowRight} iconPosition="right">
                Enter Business Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Business Information Form */}
        {step === 3 && (
          <form onSubmit={handleProvision} className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Business & Owner Credentials</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                We will provision a partitioned workspace and assign administrative credentials.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Store or Company Name"
                required
                placeholder="e.g. Metro Retail Supermarket"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Owner Full Name"
                  required
                  placeholder="e.g. Karthik Subramanian"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                />

                <Input
                  label="Work Email"
                  type="email"
                  required
                  placeholder="owner@business.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <Input
                label="Phone Number"
                placeholder="+91 98400 12345"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  label="Account Password *"
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Input
                  label="Confirm Password *"
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <Button size="sm" variant="outline" type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button size="sm" type="submit" isLoading={isSubmitting} icon={Sparkles}>
                Provision & Launch Workspace
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
