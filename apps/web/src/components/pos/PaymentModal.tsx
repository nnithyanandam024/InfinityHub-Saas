import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Split,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { PosCustomer } from '@infinityhub/types';

export type PaymentMethodType = 'cash' | 'upi' | 'card' | 'split' | 'credit_khata';

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  customer?: PosCustomer | null;
  upiId?: string;
  storeName?: string;
  invoicePreviewNumber?: string;
  onClose: () => void;
  onComplete: (paymentData: {
    method: PaymentMethodType;
    payments: Array<{ method: string; amount: number; referenceId?: string; cardLast4?: string; notes?: string }>;
    tenderedAmount: number;
    changeDue: number;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  customer,
  upiId = 'kumarstores@upi',
  storeName = 'InfinityHub Store',
  invoicePreviewNumber = 'INV-NEW',
  onClose,
  onComplete
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('cash');

  // Cash state
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const changeDue = Math.max(0, cashTendered - totalAmount);

  // Card state
  const [cardAuthCode, setCardAuthCode] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  // UPI state
  const [upiRefNumber, setUpiRefNumber] = useState('');

  // Split state
  const [splitCash, setSplitCash] = useState<number>(Math.round(totalAmount / 2));
  const [splitUpi, setSplitUpi] = useState<number>(totalAmount - Math.round(totalAmount / 2));
  const splitTotal = splitCash + splitUpi;
  const splitRemaining = totalAmount - splitTotal;

  // Khata state error
  const isKhataExceeded = customer
    ? customer.currentBalance + totalAmount > customer.creditLimit
    : true;

  useEffect(() => {
    setCashTendered(totalAmount);
    setSplitCash(Math.round(totalAmount / 2));
    setSplitUpi(totalAmount - Math.round(totalAmount / 2));
    setCardAuthCode('');
    setCardLast4('');
    setUpiRefNumber('');
  }, [totalAmount, isOpen]);

  if (!isOpen) return null;

  const quickDenominations = [10, 20, 50, 100, 200, 500];

  const handleAddDenomination = (denom: number) => {
    setCashTendered(prev => prev + denom);
  };

  const handleSetExactCash = () => {
    setCashTendered(totalAmount);
  };

  const handleSubmit = () => {
    if (selectedMethod === 'cash') {
      if (cashTendered < totalAmount) return;
      onComplete({
        method: 'cash',
        payments: [{ method: 'cash', amount: totalAmount }],
        tenderedAmount: cashTendered,
        changeDue
      });
    } else if (selectedMethod === 'upi') {
      onComplete({
        method: 'upi',
        payments: [
          {
            method: 'upi',
            amount: totalAmount,
            referenceId: upiRefNumber || `UPI-${Date.now().toString().slice(-6)}`
          }
        ],
        tenderedAmount: totalAmount,
        changeDue: 0
      });
    } else if (selectedMethod === 'card') {
      onComplete({
        method: 'card',
        payments: [
          {
            method: 'card',
            amount: totalAmount,
            referenceId: cardAuthCode || `AUTH-${Date.now().toString().slice(-4)}`,
            cardLast4: cardLast4 || '4242'
          }
        ],
        tenderedAmount: totalAmount,
        changeDue: 0
      });
    } else if (selectedMethod === 'split') {
      if (splitRemaining !== 0) return;
      onComplete({
        method: 'split',
        payments: [
          { method: 'cash', amount: splitCash },
          { method: 'upi', amount: splitUpi, referenceId: upiRefNumber || 'UPI-SPLIT' }
        ],
        tenderedAmount: totalAmount,
        changeDue: 0
      });
    } else if (selectedMethod === 'credit_khata') {
      if (!customer) return;
      onComplete({
        method: 'credit_khata',
        payments: [
          {
            method: 'credit_khata',
            amount: totalAmount,
            notes: `Khata Sale assigned to ${customer.name}`
          }
        ],
        tenderedAmount: totalAmount,
        changeDue: 0
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-[22px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Checkout Payment Terminal
            </span>
            <div className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
              <span>Total Payable:</span>
              <span className="text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Tabs, Right Form */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Method Selector Tabs */}
          <div className="md:col-span-4 space-y-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('cash')}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                selectedMethod === 'cash'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Cash</div>
                <div className="text-[10px] text-slate-500">Rupee currency notes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                selectedMethod === 'upi'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedMethod === 'upi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">UPI / QR</div>
                <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                selectedMethod === 'card'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Card (EDC)</div>
                <div className="text-[10px] text-slate-500">RuPay, Visa, Master</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('split')}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                selectedMethod === 'split'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedMethod === 'split' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Split className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Split Payment</div>
                <div className="text-[10px] text-slate-500">Cash + UPI split</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('credit_khata')}
              className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                selectedMethod === 'credit_khata'
                  ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedMethod === 'credit_khata' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Customer Khata</div>
                <div className="text-[10px] text-slate-500">Store Credit / Udhar</div>
              </div>
            </button>
          </div>

          {/* Method Detail Screen */}
          <div className="md:col-span-8 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            {/* CASH VIEW */}
            {selectedMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash Tendered from Customer
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={e => setCashTendered(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 text-2xl font-black rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:outline-hidden"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Indian Currency Chips */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Quick Currency Notes (Tap to Add)</span>
                    <button
                      type="button"
                      onClick={handleSetExactCash}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      Exact (₹{totalAmount})
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {quickDenominations.map(denom => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => handleAddDenomination(denom)}
                        className="py-2 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
                      >
                        + ₹{denom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Return Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  cashTendered >= totalAmount
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider block">
                      {cashTendered >= totalAmount ? 'Change Return Due' : 'Short / Insufficient Tender'}
                    </span>
                    <span className="text-2xl font-black font-display">
                      ₹{Math.abs(changeDue).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {cashTendered >= totalAmount ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-rose-600" />
                  )}
                </div>
              </div>
            )}

            {/* UPI VIEW */}
            {selectedMethod === 'upi' && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
                  {/* Dynamic UPI QR Code Canvas Mock */}
                  <div className="w-44 h-44 bg-slate-900 p-2 rounded-xl flex flex-col items-center justify-center text-white mx-auto relative overflow-hidden">
                    <QrCode className="w-32 h-32 text-white" />
                    <span className="text-[10px] font-bold bg-white text-slate-900 px-2 py-0.5 rounded-full mt-1">
                      BHIM UPI
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{storeName}</div>
                  <div className="font-mono text-slate-500 text-[11px]">VPA: {upiId}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    Exact Amount: ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    UPI UTR / Bank Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiRefNumber}
                    onChange={e => setUpiRefNumber(e.target.value)}
                    placeholder="e.g. 425100984512"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* CARD VIEW */}
            {selectedMethod === 'card' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                  Swipe, tap, or insert customer card on the wireless EDC terminal. Enter approval details below.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Terminal Auth / Approval Code
                  </label>
                  <input
                    type="text"
                    value={cardAuthCode}
                    onChange={e => setCardAuthCode(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Card Last 4 Digits (PCI Compliant Masked)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={e => setCardLast4(e.target.value)}
                    placeholder="e.g. 9012"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            )}

            {/* SPLIT VIEW */}
            {selectedMethod === 'split' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600">
                  Allocate total amount across multiple tender modes.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash Portion (₹)
                  </label>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSplitCash(val);
                      setSplitUpi(Math.max(0, totalAmount - val));
                    }}
                    className="w-full px-3.5 py-2 text-sm font-bold rounded-xl bg-white border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI Portion (₹)
                  </label>
                  <input
                    type="number"
                    value={splitUpi || ''}
                    onChange={e => setSplitUpi(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm font-bold rounded-xl bg-white border border-slate-300"
                  />
                </div>

                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                  splitRemaining === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <span>Unallocated Balance:</span>
                  <span>₹{splitRemaining}</span>
                </div>
              </div>
            )}

            {/* KHATA VIEW */}
            {selectedMethod === 'credit_khata' && (
              <div className="space-y-4">
                {!customer ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    No registered customer is selected on this order. Select a customer from the cart panel before charging to Store Khata.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                      <div className="text-slate-500">Phone: {customer.phone}</div>
                      {customer.gstin && <div className="text-slate-500">GSTIN: {customer.gstin}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">Current Outstanding</span>
                        <span className="text-base font-bold text-slate-800">
                          ₹{customer.currentBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">Credit Limit</span>
                        <span className="text-base font-bold text-slate-800">
                          ₹{customer.creditLimit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {isKhataExceeded && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Warning: This order exceeds customer credit limit!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  (selectedMethod === 'cash' && cashTendered < totalAmount) ||
                  (selectedMethod === 'split' && splitRemaining !== 0) ||
                  (selectedMethod === 'credit_khata' && !customer)
                }
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Print Bill (₹{totalAmount.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
