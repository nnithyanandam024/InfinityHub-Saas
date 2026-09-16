import React, { useRef } from 'react';
import { X, Printer, QrCode, Download } from 'lucide-react';
import type { Invoice } from '@infinityhub/types';

interface ReceiptModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  invoice,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-[22px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Tax Invoice Receipt — {invoice.invoiceNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 flex justify-center">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-[11px] text-slate-900 leading-tight space-y-3"
          >
            {/* Business Header */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black font-sans tracking-tight uppercase">
                {invoice.tenantName}
              </h2>
              <p className="text-[10px] text-slate-600">{invoice.tenantAddress}</p>
              <div className="text-[10px] font-bold text-slate-800">
                GSTIN: {invoice.tenantGstin}
              </div>
              <div className="text-[10px] text-slate-500">
                State: {invoice.tenantState} (Code {invoice.tenantStateCode})
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="text-center py-1 border-b border-dashed border-slate-300">
              <span className="font-bold uppercase tracking-wider text-xs block">
                TAX INVOICE
              </span>
              <span className="text-[10px] text-slate-500">
                (Rule 46 - CGST / SGST Rules)
              </span>
            </div>

            {/* Invoice Meta */}
            <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{new Date(invoice.invoiceDate).toLocaleString('en-IN')}</span>
              </div>
              {invoice.customerName && (
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold">{invoice.customerName}</span>
                </div>
              )}
              {invoice.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerGstin && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cust GSTIN:</span>
                  <span className="font-bold">{invoice.customerGstin}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div>
              <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-800 uppercase">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Amt</span>
              </div>

              <div className="divide-y divide-slate-100 py-1 space-y-1">
                {invoice.items.map((it, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="flex justify-between font-bold">
                      <span className="truncate pr-1">{it.productName}</span>
                      <span>₹{it.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>HSN:{it.hsnCode} · GST:{it.taxRate}%</span>
                      <span>{it.quantity} {it.unit} @ ₹{it.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal & Taxes Breakdown */}
            <div className="space-y-1 pt-2 border-t border-dashed border-slate-300 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Taxable Value:</span>
                <span>₹{invoice.taxableAmount.toFixed(2)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CGST Total:</span>
                    <span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SGST Total:</span>
                    <span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">IGST Total:</span>
                  <span>₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              )}
              {invoice.roundingAdjustment !== 0 && (
                <div className="flex justify-between text-slate-400 text-[9px]">
                  <span>Round Off:</span>
                  <span>{invoice.roundingAdjustment > 0 ? `+₹${invoice.roundingAdjustment}` : `-₹${Math.abs(invoice.roundingAdjustment)}`}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="py-2 px-3 bg-slate-50 border-y border-slate-800 flex justify-between items-baseline font-sans">
              <span className="font-bold text-xs uppercase">Grand Total:</span>
              <span className="text-base font-black text-slate-900">
                ₹{invoice.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Amount in Words */}
            <div className="text-[9px] text-slate-600 italic">
              <span className="font-bold not-italic">Amount in Words: </span>
              {invoice.grandTotalInWords}
            </div>

            {/* HSN Summary Table */}
            <div className="pt-2 border-t border-dashed border-slate-300">
              <span className="font-bold text-[9px] uppercase tracking-wider block mb-1">
                GST Tax Breakdown (HSN Summary)
              </span>
              <div className="text-[8px] space-y-0.5">
                <div className="grid grid-cols-12 font-bold border-b border-slate-200 pb-0.5">
                  <span className="col-span-3">HSN</span>
                  <span className="col-span-3 text-right">Taxable</span>
                  <span className="col-span-3 text-right">CGST+SGST</span>
                  <span className="col-span-3 text-right">Tax Amt</span>
                </div>
                {invoice.hsnSummary.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 text-slate-600">
                    <span className="col-span-3 font-mono">{h.hsnCode}</span>
                    <span className="col-span-3 text-right">₹{h.taxableValue.toFixed(2)}</span>
                    <span className="col-span-3 text-right">{h.cgstRate + h.sgstRate}%</span>
                    <span className="col-span-3 text-right font-bold text-slate-800">₹{h.totalTax.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenders Paid */}
            <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5 text-[10px]">
              <span className="font-bold uppercase text-[9px] block">Payment Received</span>
              {invoice.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span className="uppercase font-semibold">{p.method}</span>
                  <span>₹{p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Dynamic UPI QR Code & Footer */}
            <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-2">
              <div className="w-24 h-24 mx-auto p-1 bg-white border border-slate-300 rounded flex flex-col items-center justify-center">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
              <div className="text-[9px] text-slate-500 font-sans">
                Scan QR to Pay or Verify via UPI App
              </div>
              <div className="text-[8px] text-slate-400 space-y-0.5 pt-1">
                <div>Goods once sold can be returned within 7 days with original bill.</div>
                <div className="font-bold text-slate-600">*** THANK YOU! VISIT AGAIN ***</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
