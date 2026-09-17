import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { posService } from '../../services/posService';
import { ManagerPinModal } from '../../components/pos/ManagerPinModal';
import {
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Unlock,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import type { RegisterShift } from '@infinityhub/types';

export const PosShiftsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<RegisterShift | null>(null);
  const [shifts, setShifts] = useState<RegisterShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [startingFloat, setStartingFloat] = useState('2000');

  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [movementAmount, setMovementAmount] = useState('500');
  const [movementReason, setMovementReason] = useState('Change float top-up');

  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState('0');
  const [closeShiftNotes, setCloseShiftNotes] = useState('');

  // Manager Pin Guard for No-Sale Drawer Pop
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const loadShifts = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const active = await posService.getCurrentShift(tenant.id);
      setCurrentShift(active);
      const history = await posService.getShifts(tenant.id);
      setShifts(history);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type?.startsWith('pos:shift') || detail.type === 'pos:drawer_moved') {
        loadShifts();
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  const handleOpenShift = async () => {
    if (!tenant) return;
    try {
      const shift = await posService.openShift(tenant.id, {
        startingFloat: Number(startingFloat) || 0,
        cashierId: user?.id || 'usr-1',
        cashierName: user?.name || 'Cashier',
        registerId: 'REG-01'
      });
      setCurrentShift(shift);
      setIsOpenShiftModalOpen(false);
      loadShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to open shift');
    }
  };

  const handleRecordMovement = async () => {
    if (!tenant || !currentShift) return;
    try {
      await posService.recordDrawerMovement(tenant.id, {
        shiftId: currentShift.id,
        type: movementType,
        amount: Number(movementAmount) || 0,
        reason: movementReason,
        cashierName: user?.name || 'Cashier'
      });
      setIsCashMovementModalOpen(false);
      loadShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to record movement');
    }
  };

  const handleTriggerNoSalePop = () => {
    setIsPinModalOpen(true);
  };

  const handleConfirmNoSalePop = async (pinData: { pin: string; managerName: string; reason: string }) => {
    if (!tenant || !currentShift) return;
    try {
      await posService.recordDrawerMovement(tenant.id, {
        shiftId: currentShift.id,
        type: 'drawer_pop_no_sale',
        amount: 0,
        reason: pinData.reason,
        managerApprovedBy: pinData.managerName,
        cashierName: user?.name || 'Cashier'
      });
      alert('Cash drawer opened without sale. Action recorded in immutable audit log.');
      loadShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to open drawer');
    }
  };

  const handleCloseShift = async () => {
    if (!tenant || !currentShift) return;
    try {
      const closed = await posService.closeShift(tenant.id, {
        shiftId: currentShift.id,
        actualCashCounted: Number(actualCashCounted) || 0,
        closedBy: user?.name || 'Store Manager',
        notes: closeShiftNotes
      });
      alert(`Shift closed successfully! Variance: ₹${closed.cashVariance}`);
      setCurrentShift(null);
      setIsCloseShiftModalOpen(false);
      loadShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to close shift');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Cash Drawer & Register Shifts
          </h1>
          <p className="text-xs text-slate-500">
            Float management, X-Report live readings, and end-of-day Z-Report register reconciliation
          </p>
        </div>

        <div>
          {!currentShift ? (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Open New Register Shift
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerNoSalePop}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Drawer (No-Sale)</span>
              </button>
              <button
                onClick={() => {
                  setActualCashCounted(String(currentShift.expectedCashInDrawer));
                  setIsCloseShiftModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Shift (Z-Report)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE SHIFT SUMMARY CARD */}
      {currentShift ? (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Active Register Shift ({currentShift.registerId})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Cashier: <span className="font-semibold text-slate-800">{currentShift.cashierName}</span> · Started at {new Date(currentShift.startTime).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMovementType('cash_in');
                  setIsCashMovementModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash In</span>
              </button>
              <button
                onClick={() => {
                  setMovementType('cash_out');
                  setIsCashMovementModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>Cash Out / Petty</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Float</span>
              <span className="text-lg font-black text-slate-900 font-display">
                ₹{currentShift.startingFloat.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Sales</span>
              <span className="text-lg font-black text-emerald-700 font-display">
                ₹{currentShift.cashSales.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI / QR Sales</span>
              <span className="text-lg font-black text-blue-700 font-display">
                ₹{currentShift.upiSales.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Card Sales</span>
              <span className="text-lg font-black text-indigo-700 font-display">
                ₹{currentShift.cardSales.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Khata</span>
              <span className="text-lg font-black text-purple-700 font-display">
                ₹{currentShift.creditKhataSales.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Cash in Drawer</span>
              <span className="text-lg font-black text-emerald-950 font-display">
                ₹{currentShift.expectedCashInDrawer.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Register Shift is Currently Active</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Opening a register shift assigns a cashier, records the starting physical float, and tracks drawer cash.
          </p>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Start Register Shift
          </button>
        </div>
      )}

      {/* SHIFT HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Shift Audit History & Day-End Z-Reports
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Shift ID</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Opened</th>
                <th className="px-5 py-3.5">Closed</th>
                <th className="px-5 py-3.5">Float</th>
                <th className="px-5 py-3.5">Expected Cash</th>
                <th className="px-5 py-3.5">Actual Counted</th>
                <th className="px-5 py-3.5">Discrepancy Variance</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No shift records found.
                  </td>
                </tr>
              ) : (
                shifts.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{s.id.slice(-8)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{s.cashierName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(s.startTime).toLocaleTimeString()}</td>
                    <td className="px-5 py-3.5 text-slate-500">{s.endTime ? new Date(s.endTime).toLocaleTimeString() : '—'}</td>
                    <td className="px-5 py-3.5 font-mono">₹{s.startingFloat}</td>
                    <td className="px-5 py-3.5 font-mono">₹{s.expectedCashInDrawer}</td>
                    <td className="px-5 py-3.5 font-mono font-bold">{s.actualCashCounted !== undefined ? `₹${s.actualCashCounted}` : '—'}</td>
                    <td className="px-5 py-3.5 font-mono">
                      {s.cashVariance !== undefined ? (
                        <span className={s.cashVariance === 0 ? 'text-emerald-700 font-bold' : s.cashVariance < 0 ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                          {s.cashVariance >= 0 ? `+₹${s.cashVariance}` : `-₹${Math.abs(s.cashVariance)}`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {/* Open Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Open Daily Register Shift
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Starting Cash Float (₹)
              </label>
              <input
                type="number"
                value={startingFloat}
                onChange={e => setStartingFloat(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white"
              >
                Start Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Movement Modal */}
      {isCashMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              {movementType === 'cash_in' ? 'Record Cash In / Float Addition' : 'Record Cash Out / Petty Expense'}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={movementAmount}
                onChange={e => setMovementAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (Audited)</label>
              <input
                type="text"
                value={movementReason}
                onChange={e => setMovementReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCashMovementModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordMovement}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white"
              >
                Confirm Movement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              End-of-Day Register Closing (Z-Report)
            </h3>
            <p className="text-xs text-slate-500">
              System calculates expected cash in drawer: <span className="font-bold text-slate-900">₹{currentShift.expectedCashInDrawer}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Physical Cash Counted in Drawer (₹)
              </label>
              <input
                type="number"
                value={actualCashCounted}
                onChange={e => setActualCashCounted(e.target.value)}
                className="w-full px-3 py-2.5 text-lg font-black rounded-xl border border-slate-300"
              />
            </div>
            {Number(actualCashCounted) !== currentShift.expectedCashInDrawer && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>Discrepancy (Over/Short):</span>
                <span className="font-bold font-mono">
                  {Number(actualCashCounted) - currentShift.expectedCashInDrawer >= 0
                    ? `+₹${Number(actualCashCounted) - currentShift.expectedCashInDrawer}`
                    : `-₹${Math.abs(Number(actualCashCounted) - currentShift.expectedCashInDrawer)}`}
                </span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Notes / Handover</label>
              <textarea
                value={closeShiftNotes}
                onChange={e => setCloseShiftNotes(e.target.value)}
                rows={2}
                placeholder="Notes for next shift..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseShift}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Finalize & Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager PIN for Drawer Pop */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        actionDescription="Open Cash Drawer without Sale (Audit Recorded)"
        onClose={() => setIsPinModalOpen(false)}
        onAuthorize={handleConfirmNoSalePop}
      />
    </div>
  );
};
