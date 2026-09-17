import React, { useState } from 'react';
import { ShieldCheck, X, AlertTriangle } from 'lucide-react';

interface ManagerPinModalProps {
  isOpen: boolean;
  title?: string;
  actionDescription: string;
  onClose: () => void;
  onAuthorize: (data: { pin: string; reason: string; managerName: string }) => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  title = 'Supervisor Authorization Required',
  actionDescription,
  onClose,
  onAuthorize
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('Customer Request');
  const [managerName, setManagerName] = useState('Store Manager');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleConfirm = () => {
    if (pin !== '1234' && pin !== 'password123') {
      setError('Invalid Manager PIN. Default test PIN is 1234');
      return;
    }
    if (!reason.trim()) {
      setError('A valid authorization reason is required');
      return;
    }

    onAuthorize({ pin, reason, managerName });
    setPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">{title}</h3>
              <p className="text-[11px] text-slate-500">Security Audit & Anti-Fraud Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-semibold">Action: </span>
              {actionDescription}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Authorization Reason (Recorded in Audit Log)
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Customer Request">Customer Request / Change of Mind</option>
              <option value="Wrong Item Scanned">Wrong Item Scanned / Barcode Error</option>
              <option value="Promotional Clearance">Promotional Clearance / Special Discount</option>
              <option value="Tender / Payment Mismatch">Tender / Payment Method Mismatch</option>
              <option value="Change Float Addition">Change Float Addition / Petty Cash</option>
              <option value="Test Print / Hardware Verification">Test Print / Hardware Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Approving Supervisor
            </label>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
              placeholder="Supervisor Name"
            />
          </div>

          {/* PIN Input Display */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter 4-Digit Manager PIN
            </label>
            <div className="h-12 w-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center tracking-[0.6em] text-xl font-mono font-bold text-slate-800">
              {pin ? '•'.repeat(pin.length) : <span className="text-xs tracking-normal text-slate-400 font-sans">Enter PIN</span>}
            </div>
            {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              DEL
            </button>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              Authorize Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
