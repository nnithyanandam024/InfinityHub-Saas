import React, { useState } from 'react';
import { RestaurantTable, RestaurantOrder, RestaurantKot } from '@infinityhub/types';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Receipt,
  Percent,
  AlertCircle
} from 'lucide-react';

interface TableSettlementModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  kots: RestaurantKot[];
  orders: RestaurantOrder[];
  onClose: () => void;
  onSettle: (payload: {
    payments: Array<{ method: 'cash' | 'upi' | 'card' | 'credit_khata' | 'split'; amount: number; reference?: string }>;
    customerName?: string;
    customerPhone?: string;
    serviceChargePercentage?: number;
    discountAmount?: number;
  }) => Promise<void>;
}

export const TableSettlementModal: React.FC<TableSettlementModalProps> = ({
  isOpen,
  table,
  kots,
  orders,
  onClose,
  onSettle
}) => {
  const [splitMode, setSplitMode] = useState<'single' | 'equal_split' | 'split_pay'>('single');
  const [splitCount, setSplitCount] = useState<number>(2);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'split'>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [enableServiceCharge, setEnableServiceCharge] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  if (!isOpen || !table) return null;

  const activeOrder = orders.find(o => o.id === table.activeOrderId);
  const tableKots = kots.filter(k => k.tableId === table.id && k.status !== 'voided');

  // Calculate bill items
  const billItems: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];
  tableKots.forEach(kot => {
    kot.items.forEach(itm => {
      if (itm.status !== 'cancelled') {
        const modTotal = (itm.selectedModifiers || []).reduce((acc: number, m: any) => acc + (m.extraPrice || 0), 0);
        const effectivePrice = itm.unitPrice + modTotal;
        const existing = billItems.find(b => b.name === itm.name && b.unitPrice === effectivePrice);
        if (existing) {
          existing.quantity += itm.quantity;
          existing.total += effectivePrice * itm.quantity;
        } else {
          billItems.push({
            name: itm.name,
            quantity: itm.quantity,
            unitPrice: effectivePrice,
            total: effectivePrice * itm.quantity
          });
        }
      }
    });
  });

  const subtotal = billItems.reduce((sum, i) => sum + i.total, 0);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const serviceCharge = enableServiceCharge ? Math.round(taxableSubtotal * 0.05) : 0; // 5% optional service charge
  const cgst = Number((taxableSubtotal * 0.025).toFixed(2));
  const sgst = Number((taxableSubtotal * 0.025).toFixed(2));
  const exactGrandTotal = taxableSubtotal + serviceCharge + cgst + sgst;
  const grandTotal = Math.round(exactGrandTotal);
  const roundOff = Number((grandTotal - exactGrandTotal).toFixed(2));

  // Equal split calculations with penny-rounding balancing
  const splitPerPerson = Math.floor(grandTotal / splitCount);
  const splitRemainder = grandTotal - splitPerPerson * splitCount;

  const handleExecuteSettlement = async () => {
    setIsSettling(true);
    try {
      let payments: Array<{ method: 'cash' | 'upi' | 'card' | 'credit_khata' | 'split'; amount: number; reference?: string }> = [];

      if (paymentMethod === 'split') {
        payments = [
          { method: 'cash', amount: cashAmount || Math.round(grandTotal / 2) },
          { method: 'upi', amount: upiAmount || grandTotal - (cashAmount || Math.round(grandTotal / 2)), reference: 'UPI-TXN-REST' }
        ];
      } else {
        payments = [
          { method: paymentMethod, amount: grandTotal, reference: paymentMethod === 'upi' ? 'UPI-REST-QR' : undefined }
        ];
      }

      await onSettle({
        payments,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        serviceChargePercentage: enableServiceCharge ? 5 : 0,
        discountAmount: discountAmount || 0
      });

      onClose();
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-extrabold text-base">
              {table.tableNumber}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Settle Check · Table {table.tableNumber}</h2>
              <p className="text-xs text-slate-400">Order #{activeOrder?.orderNumber || 'ORD-001'} · Server: {table.assignedCaptain || 'Captain Suresh'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Bill Items Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Item Description</span>
              <span>Total (₹)</span>
            </div>
            <div className="p-3 divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {billItems.map((item, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.quantity}x</span>
                    <span className="text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Taxes, Service Charge & Discounts */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({billItems.length} items)</span>
              <span>₹{subtotal}</span>
            </div>

            {/* Service Charge Toggle (CCPA Compliant) */}
            <div className="flex items-center justify-between py-1 border-y border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableServiceCharge}
                  onChange={e => setEnableServiceCharge(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-semibold text-slate-800">Discretionary Service Charge (5%)</span>
              </label>
              <span className="font-semibold text-slate-800">₹{serviceCharge}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>CGST (2.5%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (2.5%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Rounding Adjustment</span>
                <span>{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total Due</span>
              <span className="text-emerald-700 text-xl font-display">₹{grandTotal}</span>
            </div>
          </div>

          {/* Split Bill Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Split Check Mode
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSplitMode('single')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    splitMode === 'single'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Single Bill
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('equal_split')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    splitMode === 'equal_split'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Equal Split</span>
                </button>
              </div>
            </div>

            {splitMode === 'equal_split' && (
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-orange-950">Number of guests splitting:</span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitCount(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold border ${
                          splitCount === num
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-orange-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600">Each Guest Pays:</span>
                  <span className="font-extrabold text-orange-700 text-sm">
                    ₹{splitPerPerson} {splitRemainder > 0 && `(+₹${splitRemainder} on final ticket)`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Tenders */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Card (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'split'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="text-xs font-bold">Split Tender</span>
              </button>
            </div>

            {/* Split Tender Inputs */}
            {paymentMethod === 'split' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cash Tendered (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={cashAmount || ''}
                    onChange={e => {
                      const val = Number(e.target.value) || 0;
                      setCashAmount(val);
                      setUpiAmount(Math.max(0, grandTotal - val));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Remaining"
                    value={upiAmount || ''}
                    onChange={e => setUpiAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-hidden font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Customer Metadata (Optional for Loyalty / Invoicing) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guest Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Anand Mahindra"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (WhatsApp Bill)
              </label>
              <input
                type="tel"
                placeholder="+91 98400 00000"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel & Keep Table Active
          </button>
          <button
            type="button"
            disabled={isSettling}
            onClick={handleExecuteSettlement}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSettling ? 'Settling & Deducting Stock...' : `Settle ₹${grandTotal} & Free Table`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
