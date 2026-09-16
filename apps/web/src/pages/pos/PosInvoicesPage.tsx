import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { posService } from '../../services/posService';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { ManagerPinModal } from '../../components/pos/ManagerPinModal';
import {
  Search,
  Receipt,
  Printer,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  IndianRupee
} from 'lucide-react';
import type { Invoice } from '@infinityhub/types';

export const PosInvoicesPage: React.FC = () => {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Return modal state
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Defective product');
  const [returnMethod, setReturnMethod] = useState<'cash' | 'upi' | 'store_credit'>('cash');

  // Void modal state
  const [voidInvoiceTarget, setVoidInvoiceTarget] = useState<Invoice | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const loadInvoices = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const data = await posService.getInvoices(tenant.id, searchQuery);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type?.startsWith('pos:') || detail.type === 'stock:adjusted') {
        loadInvoices();
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id, searchQuery]);

  const handleOpenReceipt = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  const handleInitiateReturn = (inv: Invoice) => {
    setReturnInvoice(inv);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!tenant || !returnInvoice) return;
    try {
      const returnedItems = returnInvoice.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        refundAmount: item.total,
        reason: returnReason
      }));

      const res = await posService.processReturn(tenant.id, returnInvoice.id, {
        returnedItems,
        refundMethod: returnMethod,
        managerApprovedBy: 'Store Supervisor'
      });

      alert(`Sales Return Processed! Credit Note Generated: ${res.creditNoteNumber}`);
      setIsReturnModalOpen(false);
      setReturnInvoice(null);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to process return');
    }
  };

  const handleInitiateVoid = (inv: Invoice) => {
    setVoidInvoiceTarget(inv);
    setIsPinModalOpen(true);
  };

  const handleConfirmVoid = async (pinData: { pin: string; managerName: string; reason: string }) => {
    if (!tenant || !voidInvoiceTarget) return;
    try {
      await posService.voidInvoice(tenant.id, voidInvoiceTarget.id, {
        managerPin: pinData.pin,
        managerApprovedBy: pinData.managerName,
        reason: pinData.reason
      });
      alert(`Invoice ${voidInvoiceTarget.invoiceNumber} has been officially VOIDED. Stock deductions reversed.`);
      setVoidInvoiceTarget(null);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Void authorization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Sales Invoices & Tax Receipts
          </h1>
          <p className="text-xs text-slate-500">
            Rule 46 CGST compliant consecutive sales register, thermal reprints & return credit notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Invoice, Customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Invoice No</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Taxable (₹)</th>
                <th className="px-5 py-3.5">GST (₹)</th>
                <th className="px-5 py-3.5">Grand Total (₹)</th>
                <th className="px-5 py-3.5">Tender Mode</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No sales invoices found for this workspace. Complete a checkout in the POS Terminal.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {inv.customerName || 'Walk-in Retail Customer'}
                      </div>
                      {inv.customerPhone && (
                        <div className="text-[11px] text-slate-400">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      ₹{inv.taxableAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      ₹{inv.totalTax.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 font-display">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        {inv.payments.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {p.method}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReceipt(inv)}
                          title="Reprint Thermal Receipt"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleInitiateReturn(inv)}
                          title="Verified Return & Credit Note"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleInitiateVoid(inv)}
                          title="Manager Void (PIN Protected)"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedInvoice(null);
        }}
      />

      <ManagerPinModal
        isOpen={isPinModalOpen}
        actionDescription={`Void Invoice: ${voidInvoiceTarget?.invoiceNumber} (₹${voidInvoiceTarget?.grandTotal})`}
        onClose={() => {
          setIsPinModalOpen(false);
          setVoidInvoiceTarget(null);
        }}
        onAuthorize={handleConfirmVoid}
      />

      {/* Return Modal */}
      {isReturnModalOpen && returnInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Process Sales Return & Issue Credit Note
            </h3>
            <p className="text-xs text-slate-500">
              Original Invoice: <span className="font-bold text-slate-900">{returnInvoice.invoiceNumber}</span> (₹{returnInvoice.grandTotal})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Reason
              </label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                <option value="Defective product">Defective / Damaged Item</option>
                <option value="Customer Exchange">Customer Size / Spec Exchange</option>
                <option value="Dissatisfied with performance">Dissatisfied with performance</option>
                <option value="Incorrect billing">Incorrect billing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Tender Payout
              </label>
              <select
                value={returnMethod}
                onChange={e => setReturnMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                <option value="cash">Cash (Deducted from Register Drawer)</option>
                <option value="upi">UPI / Instant Bank Transfer</option>
                <option value="store_credit">Store Credit Note / Khata Credit</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              This action will automatically restock the returned items in inventory and issue an official GST Credit Note.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
