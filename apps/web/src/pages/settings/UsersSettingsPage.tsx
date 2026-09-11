import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { User, Role } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { ROLES } from '@infinityhub/constants';
import {
  UserCog,
  Plus,
  ShieldCheck,
  Trash2,
  Edit2,
  Mail,
  User as UserIcon,
  AlertCircle,
  Shield,
  KeyRound,
  Wand2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

export const UsersSettingsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('MANAGER');
  const [invitePassword, setInvitePassword] = useState('');
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit Role State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('STAFF');
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleOpenEditRole = (targetUser: User) => {
    setEditingUser(targetUser);
    setSelectedRole(targetUser.role);
    setIsEditRoleModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !editingUser) return;
    setIsUpdatingRole(true);
    try {
      await userService.updateUser(tenant.id, editingUser.id, { role: selectedRole });
      showToast(`Updated role for ${editingUser.name}`, 'success');
      setIsEditRoleModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const loadUsers = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const u = await userService.getTenantUsers(tenant.id);
      setUsers(u);
    } catch (err: any) {
      showToast(err.message || 'Failed to load team members', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [tenant?.id]);

  const canManageUsers = hasPermission('settings.users.manage');

  const handleOpenInvite = () => {
    setInviteName('');
    setInviteEmail('');
    setInviteRole('MANAGER');
    setInvitePassword('');
    setShowInvitePassword(false);
    setInviteError(null);
    setIsInviteModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Pass-${randomPart}`;
    setInvitePassword(generated);
    setShowInvitePassword(true);
  };

  const handleCopyPassword = () => {
    if (!invitePassword) return;
    navigator.clipboard.writeText(invitePassword);
    showToast('Password copied to clipboard!', 'info');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!inviteName.trim()) {
      setInviteError('Please enter the team member\'s full name');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@') || !inviteEmail.includes('.')) {
      setInviteError('Please enter a valid work email address');
      return;
    }

    if (invitePassword && invitePassword.length < 6) {
      setInviteError('Custom password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setInviteError(null);

    try {
      const newUser = await userService.inviteUser(tenant.id, {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        password: invitePassword.trim() || undefined
      });
      showToast(`Invitation created for ${newUser.name} as ${ROLES[newUser.role]?.label || newUser.role}`, 'success');
      setIsInviteModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!tenant || !user) return;
    if (targetUser.id === user.id) {
      showToast('You cannot remove your own active account', 'error');
      return;
    }
    if (targetUser.role === 'TENANT_OWNER') {
      const ownerCount = users.filter(u => u.role === 'TENANT_OWNER').length;
      if (ownerCount <= 1) {
        showToast('Cannot remove the primary Store Owner', 'error');
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to revoke store access for ${targetUser.name} (${targetUser.email})?`)) {
      return;
    }

    try {
      await userService.deleteUser(tenant.id, targetUser.id, user.id);
      showToast(`Revoked store access for ${targetUser.name}`, 'success');
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove user', 'error');
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading team access list..." />;

  const roleOptions: { role: Role; label: string; description: string; badgeVariant: 'primary' | 'warning' | 'neutral' | 'success' }[] = [
    {
      role: 'MANAGER',
      label: 'Store Manager',
      description: 'Operational control: Catalog CRUD, purchases, stock adjustments, and reports.',
      badgeVariant: 'primary'
    },
    {
      role: 'STAFF',
      label: 'Store Staff',
      description: 'Restricted access: Product lookup and physical stock inquiry only.',
      badgeVariant: 'neutral'
    },
    {
      role: 'TENANT_OWNER',
      label: 'Co-Owner',
      description: 'Full store privileges: Catalog, inventory, purchasing, team, and business settings.',
      badgeVariant: 'warning'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            Team Members & Access Control
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Role-Based Access Control (RBAC) governing catalog edits, stock adjustments, and reports.
          </p>
        </div>

        {canManageUsers && (
          <Button size="sm" icon={Plus} onClick={handleOpenInvite}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Store Personnel ({users.length})</CardTitle>
          <CardDescription>Active staff assigned to {tenant?.name}</CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Permission Scope</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManageUsers && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isCurrentUser = user?.id === u.id;
                const isSoleOwner = u.role === 'TENANT_OWNER' && users.filter(x => x.role === 'TENANT_OWNER').length <= 1;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{u.name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {ROLES[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                      {ROLES[u.role]?.description}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </td>
                    {canManageUsers && (
                      <td className="py-3.5 px-4 text-right">
                        {!isCurrentUser && !isSoleOwner && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRole(u)}
                              title={`Edit role for ${u.name}`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title={`Revoke access for ${u.name}`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* RBAC Reference Guide */}
      <Card className="p-5 bg-slate-50 border-slate-200">
        <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Enterprise Role & Permission Matrix
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Tenant Owner</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Full store privileges: Catalog CRUD, manual stock adjustment, purchase creation, and team settings.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Store Manager</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Operational control: Add/edit products, receive purchases, execute stock adjustments, view reports.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Store Staff</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Restricted access: Product lookup and stock inquiry only. Stock adjustment and product deletion disabled.
            </p>
          </div>
        </div>
      </Card>

      {/* Invite Member In-App Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description={`Grant staff access to ${tenant?.name || 'this workspace'} with assigned RBAC permissions.`}
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Anand Kumar"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="e.g. anand@abcsupermarket.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              A workspace credentials invitation will be recorded for this email.
            </p>
          </div>

          {/* Password Configuration */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Initial Account Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
              >
                <Wand2 className="w-3 h-3 text-blue-500" />
                Generate Secure Password
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showInvitePassword ? 'text' : 'password'}
                placeholder="Optional (defaults to password123)"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="w-full pl-9 pr-20 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {invitePassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copy Password"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowInvitePassword(!showInvitePassword)}
                  title={showInvitePassword ? 'Hide password' : 'Show password'}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  {showInvitePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Leave blank to use default <span className="font-mono text-slate-600">password123</span> or click Generate to create a custom one.
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Role & Permission Scope *
            </label>
            <div className="space-y-2">
              {roleOptions.map(opt => (
                <label
                  key={opt.role}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    inviteRole === opt.role
                      ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.role}
                    checked={inviteRole === opt.role}
                    onChange={() => setInviteRole(opt.role)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      <Badge variant={opt.badgeVariant} size="sm">
                        {opt.role}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {inviteError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{inviteError}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false);
          setEditingUser(null);
        }}
        title={`Change Role for ${editingUser?.name || 'User'}`}
        description="Adjust access scope and operational permissions within this store"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div className="space-y-2">
            {roleOptions.map(opt => (
              <label
                key={opt.role}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedRole === opt.role
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value={opt.role}
                  checked={selectedRole === opt.role}
                  onChange={() => setSelectedRole(opt.role)}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                    <Badge variant={opt.badgeVariant} size="sm">
                      {opt.role}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditRoleModalOpen(false);
                setEditingUser(null);
              }}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUpdatingRole}
            >
              {isUpdatingRole ? 'Updating Role...' : 'Save Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
