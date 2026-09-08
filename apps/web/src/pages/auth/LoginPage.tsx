import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  Boxes,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { useTenant } from '../../context/TenantContext';
import { tenantService } from '../../services/tenantService';
import { authService } from '../../services/authService';
import { Role } from '@infinityhub/types';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('rajesh@abcsupermarket.in');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAccountsOpen, setIsQuickAccountsOpen] = useState(true);
  const { login } = useAuth();
  const { setTenantId } = useTenant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.password) {
      setPassword(location.state.password);
    }
    if (location.state?.message) {
      showToast(location.state.message, 'success');
    }
  }, [location.state]);

  const resolveWorkspaceRoute = async (userEmail: string, userRole?: Role) => {
    if (userRole === 'SUPER_ADMIN' || userEmail === 'admin@infinityhub.io') {
      navigate('/admin/dashboard');
      return;
    }

    try {
      const tenants = await tenantService.getTenants();
      const currentUser = await authService.getCurrentUser();
      const userTenant = tenants.find(t => t.id === currentUser?.tenantId) || tenants[0];

      if (userTenant?.id) {
        await setTenantId(userTenant.id);
      }

      if (userTenant?.applicationId === 'pos') {
        navigate('/pos/dashboard');
      } else if (userTenant?.applicationId === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to InfinityHub!', 'success');
      await resolveWorkspaceRoute(email);
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetEmail: string, role?: any) => {
    setEmail(targetEmail);
    setPassword('password123');
    setIsLoading(true);
    try {
      await login(targetEmail, 'password123', role);
      showToast(`Signed in as ${targetEmail}`, 'success');
      await resolveWorkspaceRoute(targetEmail, role);
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Column: Product Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
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
          </div>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              Unify Your Multi-Store Inventory & SaaS Operations
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Real-time multi-store inventory tracking, supplier purchasing, warehouse stock ledger, and modern role-based access control.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-Tenant Inventory Control</h4>
                <p className="text-xs text-slate-400 mt-0.5">Strict partition isolation ensuring customer business privacy.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Role-Based Access Control</h4>
                <p className="text-xs text-slate-400 mt-0.5">Granular user permissions for owners, managers, and store staff.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live Stock Audit Trail</h4>
                <p className="text-xs text-slate-400 mt-0.5">Automated purchase receipts, damaged goods logging, and variance reconciliations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>© 2026 InfinityHub Technologies Inc.</span>
          <span>Enterprise Cloud Platform</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
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

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-display">
                Sign in to your workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your business credentials or choose an evaluation persona
              </p>
            </div>
            <Link
              to="/platform"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all shrink-0"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email Address"
              type="email"
              required
              icon={Mail}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@business.com"
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                required
                icon={Lock}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600">Remember this device</span>
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-semibold shadow-sm"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Workspace
            </Button>

            <div className="text-center text-xs text-slate-500 pt-1">
              Don't have an account?{' '}
              <Link
                to="/platform"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </form>

          {/* Quick Evaluation Persona Drawer */}
          <div className="border border-[#E2E8F0] bg-white rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsQuickAccountsOpen(!isQuickAccountsOpen)}
              className="w-full px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors border-b border-[#E2E8F0]"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Quick Evaluation Logins (1-Click Test)</span>
              </div>
              {isQuickAccountsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isQuickAccountsOpen && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* ABC Supermarket Owner - Inventory */}
                <button
                  type="button"
                  onClick={() => quickLogin('rajesh@abcsupermarket.in', 'TENANT_OWNER')}
                  className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>ABC Supermarket</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">Inventory</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">Rajesh Sharma (Owner)</div>
                </button>

                {/* Kavitha - Store Manager */}
                <button
                  type="button"
                  onClick={() => quickLogin('kavitha.mgr@abcsupermarket.in', 'MANAGER')}
                  className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>Store Operations</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">Manager</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">Kavitha (Catalog & Stock)</div>
                </button>

                {/* City Retail Hardware - Owner (Billing & POS + Inventory Included) */}
                <button
                  type="button"
                  onClick={() => quickLogin('arvind@cityretailtools.com', 'TENANT_OWNER')}
                  className="p-2.5 text-left rounded-lg bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 transition-all group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-emerald-800 flex items-center justify-between">
                    <span>City Retail Hardware</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">POS + Inventory</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">Arvind Singhal (Billing & Full Stock Suite)</div>
                </button>

                {/* City Retail - Cashier Staff */}
                <button
                  type="button"
                  onClick={() => quickLogin('cashier@cityretailtools.com', 'STAFF')}
                  className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>Billing Counter</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">Cashier</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">Dinesh Kumar (Terminal Checkout)</div>
                </button>

                {/* XYZ Bistro - Restaurant */}
                <button
                  type="button"
                  onClick={() => quickLogin('rahul@xyzbistro.com', 'TENANT_OWNER')}
                  className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 transition-all group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-orange-700 flex items-center justify-between">
                    <span>XYZ Gourmet Bistro</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">Restaurant</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">Rahul Kapoor (Tables & KDS)</div>
                </button>

                {/* Suspended Account Test */}
                <button
                  type="button"
                  onClick={() => quickLogin('owner@suspendedmart.in', 'TENANT_OWNER')}
                  className="p-2.5 text-left rounded-lg bg-rose-50/40 hover:bg-rose-50 border border-rose-200 transition-all group"
                >
                  <div className="font-bold text-rose-950 flex items-center justify-between">
                    <span>Metro Daily Mart</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">Suspended</span>
                  </div>
                  <div className="text-[11px] text-rose-700/80 mt-0.5 truncate">Dev Anand (Status Guard Test)</div>
                </button>

                {/* Super Admin */}
                <button
                  type="button"
                  onClick={() => quickLogin('admin@infinityhub.io', 'SUPER_ADMIN')}
                  className="p-2.5 text-left rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 transition-all group"
                >
                  <div className="font-bold text-indigo-950 flex items-center justify-between">
                    <span>Super Admin</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-200/80 text-indigo-900">Platform</span>
                  </div>
                  <div className="text-[11px] text-indigo-700/80 mt-0.5 truncate">Platform Console & Telemetry</div>
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            Protected by 256-bit SSL encryption and enterprise security
          </div>
        </div>
      </div>
    </div>
  );
};
