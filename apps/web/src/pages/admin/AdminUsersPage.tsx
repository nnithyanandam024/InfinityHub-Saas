import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { User } from '@infinityhub/types';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { Users, Shield } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userService.getAllUsers()
      .then(u => setUsers(u))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner text="Querying global users directory..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2 font-display">
          <Users className="w-5 h-5 text-blue-600" />
          Global Tenant User Directory
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Directory of administrative, management, and staff credentials across workspaces.
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Tenant</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{u.tenantId || 'Global Platform Admin'}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
