import React, { useState } from 'react';
import { RestaurantTable } from '@infinityhub/types';
import { Users, UserCheck, X, AlertCircle } from 'lucide-react';

interface SeatTableModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onSeat: (tableId: string, guestCount: number, captainName: string) => Promise<void>;
}

export const SeatTableModal: React.FC<SeatTableModalProps> = ({
  isOpen,
  table,
  onClose,
  onSeat
}) => {
  const [guestCount, setGuestCount] = useState<number>(table?.capacity || 2);
  const [captainName, setCaptainName] = useState<string>('Captain Suresh');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !table) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSeat(table.id, guestCount, captainName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const CAPTAINS = ['Captain Suresh', 'Captain Meera', 'Captain Vikram', 'Captain Arun', 'Captain Priya'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400 font-bold text-lg">
              {table.tableNumber}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Seat Table {table.tableNumber}</h2>
              <p className="text-xs text-slate-400">Max Capacity: {table.capacity} guests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Guest Count Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Number of Covers (Guests)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-orange-500 focus-within:bg-white transition-all">
                <Users className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={table.capacity + 4}
                  value={guestCount}
                  onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm font-bold text-slate-900 bg-transparent outline-hidden"
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5">
                {[2, 4, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      guestCount === num
                        ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            {guestCount > table.capacity && (
              <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Guest count exceeds standard table capacity ({table.capacity} seats). Extra chairs needed.</span>
              </p>
            )}
          </div>

          {/* Assigned Server / Captain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Assigned Server / Captain
            </label>
            <div className="relative">
              <select
                value={captainName}
                onChange={e => setCaptainName(e.target.value)}
                className="w-full text-sm font-medium text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden transition-all"
              >
                {CAPTAINS.map(cap => (
                  <option key={cap} value={cap}>{cap}</option>
                ))}
              </select>
              <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-sm font-bold text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Seating Table...' : 'Seat & Open Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
