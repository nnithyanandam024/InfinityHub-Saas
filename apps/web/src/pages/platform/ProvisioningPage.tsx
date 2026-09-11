import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PLATFORM_APPLICATIONS, SUBSCRIPTION_PLANS } from '@infinityhub/constants';
import { ApplicationId } from '@infinityhub/types';
import { tenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Boxes,
  Receipt,
  UtensilsCrossed,
  Users,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Store,
  Building2,
  CheckCircle2,
  Loader2,
  Lock
} from 'lucide-react';

const APP_ICONS: Record<string, React.ElementType> = {
  inventory: Boxes,
  pos: Receipt,
  restaurant: UtensilsCrossed,
  employee: Users,
  appointment: CalendarCheck
};

type ProvisionStep =
  | 'SELECT_APPLICATION'
  | 'SELECT_PLAN'
  | 'BUSINESS_DETAILS'
  | 'CREATING_WORKSPACE'
  | 'WORKSPACE_READY';

export const ProvisioningPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setTenantId } = useTenant();
  const { showToast } = useToast();

  const queryApp = searchParams.get('app') as ApplicationId | null;
  const queryPlan = searchParams.get('plan');

  const [currentStep, setCurrentStep] = useState<ProvisionStep>(
    queryPlan ? 'BUSINESS_DETAILS' : queryApp ? 'SELECT_PLAN' : 'SELECT_APPLICATION'
  );

  const [selectedApp, setSelectedApp] = useState<ApplicationId>(queryApp || 'inventory');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(queryPlan || 'plan-professional');

  // Business Form State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98400 12345');
  const [address, setAddress] = useState('12 Anna Salai, Commercial Hub');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [ownerPassword, setOwnerPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');

  // Result state
  const [provisionedTenant, setProvisionedTenant] = useState<any>(null);
  const [creationProgress, setCreationProgress] = useState(0);

  const appData = PLATFORM_APPLICATIONS.find(a => a.id === selectedApp) || PLATFORM_APPLICATIONS[0];
  const planData = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  const handleStartCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !ownerName.trim() || !email.trim()) {
      showToast('Please fill in all required fields (Business name, Owner name, Email)', 'error');
      return;
    }

    if (ownerPassword && ownerPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (ownerPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setCurrentStep('CREATING_WORKSPACE');
    setCreationProgress(20);

    // Simulate realistic tenant partition provisioning state machine
    setTimeout(() => setCreationProgress(50), 400);
    setTimeout(() => setCreationProgress(80), 800);

    setTimeout(async () => {
      try {
        const newTenant = await tenantService.provisionTenant({
          name: businessName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          applicationId: selectedApp,
          applicationName: appData.name,
          planId: planData.id,
          planName: planData.name,
          password: ownerPassword || 'password123'
        });

        setProvisionedTenant(newTenant);
        setCreationProgress(100);
        setCurrentStep('WORKSPACE_READY');
        showToast(`Workspace provisioned successfully for ${newTenant.name}!`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Provisioning failed. Please retry.', 'error');
        setCurrentStep('BUSINESS_DETAILS');
      }
    }, 1200);
  };

  const handleEnterWorkspace = async () => {
    if (!provisionedTenant) return;
    try {
      await login(provisionedTenant.email, ownerPassword || 'password123', 'TENANT_OWNER');
      await setTenantId(provisionedTenant.id);
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between">
        <Link to="/platform" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            ∞
          </div>
          <div>
            <span className="text-base font-bold text-[#0F172A] tracking-tight font-display">
              InfinityHub
            </span>
            <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Workspace Provisioning
            </span>
          </div>
        </Link>

        {currentStep !== 'CREATING_WORKSPACE' && currentStep !== 'WORKSPACE_READY' && (
          <div className="text-xs text-slate-500 hidden sm:block">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Step Indicator */}
        {currentStep !== 'CREATING_WORKSPACE' && currentStep !== 'WORKSPACE_READY' && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
              
              {/* Step 1 */}
              <button
                onClick={() => setCurrentStep('SELECT_APPLICATION')}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 'SELECT_APPLICATION'
                    ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                    : 'bg-white border-2 border-blue-600 text-blue-600'
                }`}
              >
                1
              </button>

              {/* Step 2 */}
              <button
                onClick={() => setCurrentStep('SELECT_PLAN')}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 'SELECT_PLAN'
                    ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                    : currentStep === 'BUSINESS_DETAILS'
                    ? 'bg-white border-2 border-blue-600 text-blue-600'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                2
              </button>

              {/* Step 3 */}
              <button
                onClick={() => setCurrentStep('BUSINESS_DETAILS')}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 'BUSINESS_DETAILS'
                    ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                3
              </button>
            </div>
            
            <div className="flex justify-between max-w-md mx-auto text-[11px] font-semibold text-slate-500 mt-2 px-1">
              <span className={currentStep === 'SELECT_APPLICATION' ? 'text-blue-600' : ''}>Application</span>
              <span className={currentStep === 'SELECT_PLAN' ? 'text-blue-600' : ''}>Plan Tier</span>
              <span className={currentStep === 'BUSINESS_DETAILS' ? 'text-blue-600' : ''}>Business Setup</span>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT APPLICATION */}
        {currentStep === 'SELECT_APPLICATION' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-2xs animate-in fade-in duration-200">
            <div className="text-center sm:text-left mb-6 pb-4 border-b border-[#E2E8F0]">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-display">
                Choose Your Business Application
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Your workspace will be partitioned exclusively for the application you select.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {PLATFORM_APPLICATIONS.map(app => {
                const Icon = APP_ICONS[app.id] || Boxes;
                const isSelected = selectedApp === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0F172A] truncate">
                          {app.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                        {app.tagline}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link to="/apps" className="text-xs text-slate-500 hover:text-slate-800">
                Cancel
              </Link>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setCurrentStep('SELECT_PLAN')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next: Choose Plan
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT PLAN */}
        {currentStep === 'SELECT_PLAN' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-2xs animate-in fade-in duration-200">
            <div className="text-center sm:text-left mb-6 pb-4 border-b border-[#E2E8F0]">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Selected: {appData.name}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-display">
                Select Your Subscription Tier
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Frontend evaluation plan data — no payment gateway required at this stage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {SUBSCRIPTION_PLANS.map(plan => {
                const isSelected = selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#0F172A]">{plan.name}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="text-xl font-extrabold text-[#0F172A] mb-1">
                        ₹{plan.monthlyPrice.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500">/ mo</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-700 pt-3 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{plan.maxProducts.toLocaleString()} records</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{plan.maxUsers} staff accounts</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                          <span>{Math.round((plan.storageMb || 1024) / 1024)} GB storage</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentStep('SELECT_APPLICATION')}
              >
                Back: Application
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setCurrentStep('BUSINESS_DETAILS')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next: Business Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS DETAILS FORM */}
        {currentStep === 'BUSINESS_DETAILS' && (
          <form
            onSubmit={handleStartCreation}
            className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-2xs animate-in fade-in duration-200"
          >
            <div className="text-center sm:text-left mb-6 pb-4 border-b border-[#E2E8F0]">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Provisioning: {appData.name} · {planData.name} Plan
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-display">
                Business & Owner Profile
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter the details to initialize your isolated customer store workspace.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business / Store Name *"
                  placeholder="e.g. ABC Supermarket"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  required
                />
                <Input
                  label="Business Owner Full Name *"
                  placeholder="e.g. Rajesh Sharma"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Owner Email *"
                  type="email"
                  placeholder="owner@abcsupermarket.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Contact Phone"
                  placeholder="+91 98400 12345"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <Input
                label="Store Address"
                placeholder="Shop 12, Anna Salai Commercial Hub"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <select
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={currency}
                    onChange={e => {
                      setCurrency(e.target.value);
                      setCurrencySymbol(e.target.value === 'INR' ? '₹' : e.target.value === 'USD' ? '$' : '€');
                    }}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-xs font-mono text-slate-700 focus:outline-none"
                    value={currencySymbol}
                    readOnly
                  />
                </div>
              </div>

              {/* Password Configuration */}
              <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Account Credentials & Password</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Account Password *"
                    type="password"
                    placeholder="Min 6 characters"
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm Password *"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  You will use this password alongside your email (<span className="font-mono text-slate-700">{email || 'owner@business.com'}</span>) to sign into your workspace.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCurrentStep('SELECT_PLAN')}
              >
                Back: Plan
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                icon={Sparkles}
              >
                Create Workspace
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: CREATING WORKSPACE LOADER */}
        {currentStep === 'CREATING_WORKSPACE' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight font-display mb-2">
              Creating your workspace...
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              Partitioning store database, configuring {appData.name} workflows, and generating security credentials.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${creationProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {creationProgress}% complete
            </span>
          </div>
        )}

        {/* STEP 5: WORKSPACE READY */}
        {currentStep === 'WORKSPACE_READY' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-10 shadow-2xs max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full mb-2">
              Workspace Provisioned
            </span>

            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-display mb-1">
              Workspace Ready
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Your customer account is initialized and ready for immediate operation.
            </p>

            {/* Workspace Summary Card */}
            <div className="bg-slate-50/80 border border-[#E2E8F0] rounded-xl p-4 text-left text-xs mb-8 space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Business Store:</span>
                <span className="font-bold text-slate-900">{provisionedTenant?.name || businessName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Subscribed Application:</span>
                <span className="font-semibold text-blue-600">{appData.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Subscription Tier:</span>
                <span className="font-semibold text-slate-900">{planData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Identity:</span>
                <span className="font-mono text-slate-700">{ownerName} ({email})</span>
              </div>
            </div>

            {/* Direct Entry CTA */}
            <Button
              size="lg"
              variant="primary"
              className="w-full shadow-sm"
              onClick={handleEnterWorkspace}
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue to {appData.name}
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-14 bg-white border-t border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between text-xs text-slate-400 mt-auto">
        <span>© 2026 InfinityHub Business SaaS Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/platform" className="hover:text-slate-700">Platform Overview</Link>
          <Link to="/apps" className="hover:text-slate-700">Applications</Link>
          <Link to="/login" className="hover:text-slate-700">Customer Login</Link>
        </div>
      </footer>
    </div>
  );
};
