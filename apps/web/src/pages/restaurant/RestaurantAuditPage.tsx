import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services/restaurantService';
import type { RestaurantWasteLog, TableTransferAudit, RestaurantOrder } from '@infinityhub/types';
import {
  ShieldAlert,
  Printer,
  ArrowRightLeft,
  Flame,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const RestaurantAuditPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'waste' | 'reprints' | 'transfers'>('waste');
  const [wasteLogs, setWasteLogs] = useState<RestaurantWasteLog[]>([]);
  const [transfers, setTransfers] = useState<TableTransferAudit[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadData = async () => {
    try {
      const [wasteData, xferData, ordData] = await Promise.all([
        restaurantService.getWasteLogs(tenantId),
        restaurantService.getTableAudits(tenantId),
        restaurantService.getOrders(tenantId)
      ]);
      setWasteLogs(wasteData);
      setTransfers(xferData);
      setOrders(ordData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Aggregate reprints
  const reprintRecords: Array<{
    orderNumber: string;
    tableNumber?: string;
    reprintedBy: string;
    timestamp: string;
    reason?: string;
    totalAmount: number;
  }> = [];

  orders.forEach(ord => {
    if (ord.reprintHistory && ord.reprintHistory.length > 0) {
      ord.reprintHistory.forEach(r => {
        reprintRecords.push({
          orderNumber: ord.orderNumber,
          tableNumber: ord.tableNumber,
          reprintedBy: r.reprintedBy,
          timestamp: r.timestamp,
          reason: r.reason,
          totalAmount: ord.grandTotal
        });
      });
    }
  });

  const totalWasteCost = wasteLogs.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);
  const totalReprintsCount = reprintRecords.length;
  const totalTransfersCount = transfers.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[18px] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A] font-display">
                  Restaurant Anti-Theft & Manager Control Audit
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider">
                  Loophole Guards
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Surveillance and fraud prevention log for void KOTs, kitchen spoilage, duplicate check reprints, and table transfers.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kitchen Spoilage & Waste Cost
            </div>
            <div className="text-2xl font-extrabold text-rose-700 mt-1 font-display">
              ₹{totalWasteCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {wasteLogs.length} voided / burned dishes logged
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Duplicate Bill Reprints
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1 font-display flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-500" />
              <span>{totalReprintsCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Flagged duplicate pro-forma prints
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Table Movements & Merges
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1 font-display flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-500" />
              <span>{totalTransfersCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Manager PIN authorized table moves
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('waste')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'waste'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Kitchen Waste & Void KOTs ({wasteLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reprints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reprints'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Duplicate Bill Reprints ({reprintRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transfers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Table Movements ({transfers.length})</span>
        </button>
      </div>

      {/* TAB 1: Kitchen Waste & Void KOTs */}
      {activeTab === 'waste' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Kitchen Waste Register (Voided Dishes)
            </h2>
            <span className="text-[11px] text-slate-500">Auto-logged on KOT cancellation with Manager PIN</span>
          </div>

          {wasteLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No food wastage or voided KOT dishes logged.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">KOT #</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Dish Item</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Cancellation Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wasteLogs.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(w.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{w.kotId || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{w.tableNumber || '—'}</td>
                    <td className="py-3 px-4 font-bold text-rose-800">{w.itemName}</td>
                    <td className="py-3 px-4">{w.quantity} {w.unit}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">₹{w.estimatedCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-600 italic">{w.reason}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                        {w.authorizedBy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: Duplicate Bill Reprints */}
      {activeTab === 'reprints' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Duplicate Pro-Forma Check Reprints
            </h2>
            <span className="text-[11px] text-slate-500">Flags potential cash pocketing or re-billing skimming</span>
          </div>

          {reprintRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No duplicate bill reprints detected.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Bill Amount</th>
                  <th className="py-3 px-4">Reprinted By</th>
                  <th className="py-3 px-4">Reprint Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reprintRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.orderNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.tableNumber || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{r.totalAmount}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.reprintedBy}</td>
                    <td className="py-3 px-4 text-slate-600 italic">{r.reason || 'Guest requested copy'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: Table Movements */}
      {activeTab === 'transfers' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Table Transfer & Lineage Audit Log
            </h2>
            <span className="text-[11px] text-slate-500">Prevents roving item fraud across tables</span>
          </div>

          {transfers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No table transfers logged yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Source Table</th>
                  <th className="py-3 px-4">Destination Table</th>
                  <th className="py-3 px-4">Items Transferred</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Transferred By</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-700">Table {t.sourceTable}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">Table {t.targetTable}</td>
                    <td className="py-3 px-4 font-semibold">{t.itemCount} item(s)</td>
                    <td className="py-3 px-4 text-slate-600 italic">{t.reason}</td>
                    <td className="py-3 px-4 text-slate-700">{t.transferredBy}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                        {t.authorizedBy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
