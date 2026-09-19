import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Percent, IndianRupee, ShieldAlert, Tag, Check, Trash2 } from 'lucide-react';

export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemUnitPrice: number;
  itemQuantity: number;
  currentDiscountPercent: number;
  onApplyDiscount: (percent: number) => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemUnitPrice,
  itemQuantity,
  currentDiscountPercent,
  onApplyDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDiscountType('percent');
      setInputValue(currentDiscountPercent > 0 ? String(currentDiscountPercent) : '');
    }
  }, [isOpen, currentDiscountPercent]);

  const grossTotal = itemUnitPrice * itemQuantity;

  // Compute effective percent and discount amount
  const numericInput = Math.max(0, parseFloat(inputValue) || 0);

  let effectivePercent = 0;
  let effectiveDiscountAmount = 0;

  if (discountType === 'percent') {
    effectivePercent = Math.min(100, numericInput);
    effectiveDiscountAmount = Math.round(((grossTotal * effectivePercent) / 100) * 100) / 100;
  } else {
    effectiveDiscountAmount = Math.min(grossTotal, numericInput);
    effectivePercent = grossTotal > 0 ? Math.round(((effectiveDiscountAmount / grossTotal) * 100) * 10) / 10 : 0;
  }

  const netTotal = Math.max(0, grossTotal - effectiveDiscountAmount);
  const requiresManagerPin = effectivePercent > 10;

  const handleApply = () => {
    onApplyDiscount(effectivePercent);
    onClose();
  };

  const handleRemove = () => {
    onApplyDiscount(0);
    onClose();
  };

  const handlePreset = (percent: number) => {
    setDiscountType('percent');
    setInputValue(String(percent));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Apply Item Discount"
      description="Apply special concession or seasonal discount to the selected active ticket item"
    >
      <div className="space-y-5">
        {/* Item Target Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="text-xs font-bold text-slate-900 truncate">{itemName}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {itemQuantity} unit{itemQuantity > 1 ? 's' : ''} x ₹{itemUnitPrice.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Gross Total</div>
              <div className="text-sm font-bold text-slate-900">₹{grossTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Discount Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setDiscountType('percent');
                setInputValue(effectivePercent > 0 ? String(effectivePercent) : '');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                discountType === 'percent'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDiscountType('amount');
                setInputValue(effectiveDiscountAmount > 0 ? String(effectiveDiscountAmount) : '');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                discountType === 'amount'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Flat Amount (₹)</span>
            </button>
          </div>
        </div>

        {/* Preset Percentage Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePreset(pct)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  discountType === 'percent' && effectivePercent === pct
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {pct}% OFF
              </button>
            ))}
            {currentDiscountPercent > 0 && (
              <button
                type="button"
                onClick={() => handlePreset(0)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset (0%)</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Value */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {discountType === 'percent' ? 'Enter Percentage (0 to 100%)' : 'Enter Flat Discount (₹)'}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={discountType === 'percent' ? '100' : String(grossTotal)}
              step={discountType === 'percent' ? '0.5' : '1'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 250'}
              autoFocus
              className="w-full pl-3.5 pr-12 py-2.5 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              {discountType === 'percent' ? '%' : '₹'}
            </div>
          </div>
        </div>

        {/* Live Calculation Preview Box */}
        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Original Total:</span>
            <span className="font-semibold text-slate-800">₹{grossTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-amber-700 font-medium">
            <span>Discount Concession ({effectivePercent}%):</span>
            <span className="font-bold">-₹{effectiveDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
            <span className="font-bold text-slate-900">Net Payable for Item:</span>
            <span className="text-base font-extrabold text-blue-700">
              ₹{netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Manager PIN Notification Notice */}
        {requiresManagerPin && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Supervisor Authorization Required:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Discounts exceeding 10% require Manager PIN approval ({effectivePercent}% specified).
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {currentDiscountPercent > 0 ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Remove Discount
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply {effectivePercent > 0 ? `${effectivePercent}%` : ''} Discount</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
