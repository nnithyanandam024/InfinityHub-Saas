import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { authService } from '../../services/authService';
import { mockStore } from '../../data/mockStore';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Building2,
  Boxes,
  Layers
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Find Account; Step 2: Set New Password; Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [accountPreview, setAccountPreview] = useState<{
    name: string;
    email: string;
    role: string;
    workspaceName: string;
  } | null>(null);

  // Step 2 Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Verify Account
  const handleLookupAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !emailNorm.includes('@')) {
      setError('Please enter a valid business email address.');
      return;
    }

    const user = mockStore.getUserByEmail(emailNorm);
    if (!user) {
      setError(`No account found matching "${email}". Please check your email or contact your workspace admin.`);
      return;
    }

    let workspaceName = 'InfinityHub Platform';
    if (user.tenantId) {
      const tenant = mockStore.getTenant(user.tenantId);
      if (tenant) {
        workspaceName = tenant.name;
      }
    }

    setAccountPreview({
      name: user.name,
      email: user.email,
      role: user.role.replace('_', ' '),
      workspaceName
    });
    setStep(2);
  };

  // Step 2: Save New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), newPassword);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLoginWithCredentials = () => {
    navigate('/login', {
      state: {
        email: email.trim().toLowerCase(),
        password: newPassword,
        message: 'Password reset successful! You can now sign in.'
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Column: Product Showcase & Security Pillars (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/login" className="flex items-center gap-3 mb-4 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              ∞
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                InfinityHub
              </span>
              <span className="block text-[10px] text-blue-400 font-semibold uppercase tracking-widest">
                Business SaaS Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition: Security & Recovery */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-Trust Security Layer
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              Enterprise Workspace Access & Recovery
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Cryptographically protected user credentials, strict multi-tenant boundary validation, and real-time permission sync.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Instant Account Verification</h4>
                <p className="text-xs text-slate-400 mt-0.5">Automated lookup against verified workspace directory records.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tenant-Scoped Password Sync</h4>
                <p className="text-xs text-slate-400 mt-0.5">Password updates synchronize immediately across POS, Inventory & Admin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Role-Preserving Session Security</h4>
                <p className="text-xs text-slate-400 mt-0.5">Owners, managers, and staff retain granular RBAC entitlements.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>© 2026 InfinityHub Technologies Inc.</span>
          <span>Enterprise Cloud Platform</span>
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              ∞
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#0F172A] font-display">
                InfinityHub
              </span>
              <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                Business SaaS Platform
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-display">
                {step === 1 && 'Reset your password'}
                {step === 2 && 'Set new password'}
                {step === 3 && 'Password updated!'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {step === 1 && 'Enter your business account email to locate your workspace credentials.'}
                {step === 2 && `Set and confirm a strong new password for ${accountPreview?.name || 'your account'}.`}
                {step === 3 && 'Your credentials have been securely updated across your workspace.'}
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ================= STEP 1: ACCOUNT LOOKUP ================= */}
          {step === 1 && (
            <form onSubmit={handleLookupAccount} className="space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                required
                icon={Mail}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@business.com"
              />

              {/* Demo Hint Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Demo Accounts
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEmail('rajesh@abcsupermarket.in')}
                    className="font-mono text-[11px] px-2 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 transition-colors"
                  >
                    rajesh@abcsupermarket.in
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('suresh@kumarstores.com')}
                    className="font-mono text-[11px] px-2 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 transition-colors"
                  >
                    suresh@kumarstores.com
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold shadow-sm"
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue to Reset
              </Button>

              <div className="text-center text-xs text-slate-500 pt-1">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* ================= STEP 2: SET NEW PASSWORD ================= */}
          {step === 2 && accountPreview && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Account Card Snippet */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{accountPreview.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {accountPreview.workspaceName} · <span className="font-mono">{accountPreview.email}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {accountPreview.role}
                </span>
              </div>

              {/* New Password Input with Universal Eye Toggle */}
              <Input
                label="New Password"
                type="password"
                required
                icon={Lock}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
              />

              {/* Confirm Password Input with Universal Eye Toggle */}
              <Input
                label="Confirm New Password"
                type="password"
                required
                icon={ShieldCheck}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />

              {/* Password Match Status Helper */}
              {newPassword && confirmPassword && (
                <div className="text-[11px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-10"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-2/3 h-10 font-semibold shadow-sm"
                >
                  Save Password
                </Button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: SUCCESS CONFIRMATION ================= */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Password Updated Successfully</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your credentials for <strong className="text-slate-800">{email}</strong> have been updated. You can now sign into your workspace.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Account Email:</span>
                  <span className="text-slate-900 font-mono font-medium">{email}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active & Verified
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoToLoginWithCredentials}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In with New Password
              </Button>
            </div>
          )}

          {/* Platform Footer Links */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 InfinityHub Inc.</span>
            <div className="flex items-center gap-3">
              <Link to="/platform" className="hover:text-slate-600 transition-colors">
                Platform
              </Link>
              <span>·</span>
              <Link to="/apps" className="hover:text-slate-600 transition-colors">
                Applications
              </Link>
              <span>·</span>
              <Link to="/login" className="hover:text-slate-600 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
