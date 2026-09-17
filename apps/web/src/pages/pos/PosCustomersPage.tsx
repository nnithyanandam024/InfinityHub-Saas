import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { posService } from '../../services/posService';
import {
  Users,
  Search,
  Plus,
  IndianRupee,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import type { PosCustomer } from '@infinityhub/types';

export const PosCustomersPage: React.FC = () => {
  const { tenant } = useTenant();
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    creditLimit: '15000'
  });

  // Settle Payment Modal
  const [activeCustomer, setActiveCustomer] = useState<PosCustomer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const loadCustomers = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const list = await posService.getCustomers(tenant.id);
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [tenant?.id]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      await posService.createCustomer(tenant.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        gstin: formData.gstin,
        creditLimit: Number(formData.creditLimit) || 10000
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', gstin: '', creditLimit: '15000' });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleRecordPayment = async () => {
    if (!tenant || !activeCustomer) return;
    try {
      await posService.recordCustomerPayment(tenant.id, activeCustomer.id, {
        amount: Number(paymentAmount) || 0,
        paymentMethod,
        notes: `Direct Khata settlement from customer`
      });
      alert(`Payment of ₹${paymentAmount} recorded successfully!`);
      setIsPaymentModalOpen(false);
      setActiveCustomer(null);
      setPaymentAmount('');
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Customer Directory & Khata Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Store credit limits, customer debt tracking, and payment settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map(c => {
          const creditUsagePercent = Math.min(100, Math.round((c.currentBalance / (c.creditLimit || 1)) * 100));

          return (
            <div
              key={c.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                  </div>
                  {c.currentBalance > 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                      Khata Due
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Clear
                    </span>
                  )}
                </div>

                {c.gstin && (
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    GSTIN: {c.gstin}
                  </div>
                )}
                {c.address && (
                  <div className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                    <span className="line-clamp-1">{c.address}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="text-base font-black text-slate-900 font-display">
                    ₹{c.currentBalance.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      creditUsagePercent > 80
                        ? 'bg-rose-500'
                        : creditUsagePercent > 50
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${creditUsagePercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Credit Limit: ₹{c.creditLimit.toLocaleString('en-IN')}</span>
                  <span>{creditUsagePercent}% utilized</span>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => {
                    setActiveCustomer(c);
                    setPaymentAmount(String(c.currentBalance));
                    setIsPaymentModalOpen(true);
                  }}
                  disabled={c.currentBalance <= 0}
                  className="w-full py-2 bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Receive Khata Payment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 font-display">
              Add New Customer / Store Account
            </h3>
            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Trade Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Suresh Enterprises"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 98401 22334"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional for B2B)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Credit Limit (₹)</label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Local shop/street address"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Khata Payment Modal */}
      {isPaymentModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Receive Khata Debt Payment
            </h3>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-bold text-slate-900">{activeCustomer.name}</span> (Current Balance: ₹{activeCustomer.currentBalance})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received (₹)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Tender
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                <option value="cash">Cash (Added to Register Drawer)</option>
                <option value="upi">UPI / Instant Bank Transfer</option>
                <option value="card">Card / Cheque</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
