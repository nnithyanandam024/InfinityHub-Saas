import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Users,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, role, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'IH';

  // Clean, customer-friendly role label
  const roleDisplayNames: Record<string, string> = {
    TENANT_OWNER: 'Store Owner',
    MANAGER: 'Store Manager',
    STAFF: 'Store Staff',
    SUPER_ADMIN: 'Super Admin',
  };
  const roleLabel = roleDisplayNames[role] || role;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-6 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left side: Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right side: User Profile */}
      <div className="flex items-center gap-3">
        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#0F172A] leading-tight truncate max-w-[120px]">
                {user?.name || 'Active User'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Header */}
              <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                <div className="font-bold text-xs text-[#0F172A]">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Account Navigation Links */}
              <div className="py-1 text-xs">
                <Link
                  to="/settings/business"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Store Profile & Settings</span>
                </Link>

                <Link
                  to="/settings/users"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Team & Roles</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Change Password</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="pt-1 border-t border-[#E2E8F0]">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};
