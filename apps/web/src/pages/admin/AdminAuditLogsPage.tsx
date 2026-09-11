import React from 'react';
import { ScrollText, ShieldAlert } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const auditLogs = [
    { id: '1', action: 'TENANT_PROVISIONED', target: 'Apex Retailers', actor: 'Super Admin', time: '2026-09-10 08:30:12', ip: '192.168.1.1' },
    { id: '2', action: 'MODULE_ACTIVATED', target: 'Inventory Management (Kumar Stores)', actor: 'Suresh Kumar', time: '2026-09-09 17:42:01', ip: '103.21.14.88' },
    { id: '3', action: 'PLAN_UPGRADED', target: 'City Retail Hardware -> Enterprise', actor: 'Arvind Singhal', time: '2026-09-08 11:20:00', ip: '49.207.201.2' },
    { id: '4', action: 'BULK_STOCK_SYNC', target: 'Apex Retailers (PO-1024)', actor: 'Rajesh Sharma', time: '2026-09-08 09:15:30', ip: '157.48.20.10' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2 font-display">
          <ScrollText className="w-5 h-5 text-blue-600" />
          Global Audit Trail & Security Logs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable ledger of platform events, module activations, and tenant lifecycle updates.
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.time}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{log.target}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{log.actor}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
