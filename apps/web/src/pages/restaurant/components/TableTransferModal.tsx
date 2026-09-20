import React, { useState } from 'react';
import { RestaurantTable } from '@infinityhub/types';
import { ArrowRightLeft, ShieldCheck, X, AlertTriangle } from 'lucide-react';

interface TableTransferModalProps {
  isOpen: boolean;
  sourceTable: RestaurantTable | null;
  allTables: RestaurantTable[];
  onClose: () => void;
  onTransfer: (sourceTableId: string, targetTableId: string, reason: string, managerPin: string) => Promise<void>;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  isOpen,
  sourceTable,
  allTables,
  onClose,
  onTransfer
}) => {
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [reason, setReason] = useState<string>('Guest requested outdoor terrace seating');
  const [managerPin, setManagerPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  if (!isOpen || !sourceTable) return null;

  // Only vacant tables can be transfer targets
  const vacantTables = allTables.filter(t => t.id !== sourceTable.id && t.status === 'vacant');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableId) {
      setErrorMsg('Please select a target vacant table.');
      return;
    }
    setErrorMsg('');
    setIsTransferring(true);
    try {
      await onTransfer(sourceTable.id, targetTableId, reason, managerPin);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authorization failed. Invalid PIN.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Transfer Table {sourceTable.tableNumber}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Transferring moves all active KOT items and billing history to the destination table. An immutable audit record will be logged.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Destination Table (Must be Vacant)
            </label>
            {vacantTables.length === 0 ? (
              <p className="text-xs text-rose-600 font-medium">No vacant tables currently available.</p>
            ) : (
              <select
                value={targetTableId}
                onChange={e => setTargetTableId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden font-bold"
                required
              >
                <option value="">-- Choose Vacant Table --</option>
                {vacantTables.map(t => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} (Capacity: {t.capacity} pax)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Table Movement
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
            >
              <option value="Guest requested outdoor terrace seating">Guest requested outdoor terrace seating</option>
              <option value="AC too cold / drafty near current table">AC too cold / drafty near current table</option>
              <option value="Combined large party relocation">Combined large party relocation</option>
              <option value="Table maintenance / cleaning issue">Table maintenance / cleaning issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Manager Security PIN (Demo: 1234)
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="Enter 4-digit PIN"
              value={managerPin}
              onChange={e => setManagerPin(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden"
              required
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetTableId || !managerPin || isTransferring}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isTransferring ? 'Transferring...' : 'Authorize Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
