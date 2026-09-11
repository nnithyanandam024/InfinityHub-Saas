import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { purchaseService } from '../../services/purchaseService';
import { Purchase } from '@infinityhub/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '@infinityhub/ui';
import {
  ShoppingCart,
  Plus,
  FileText,
  Calendar,
  Eye,
  Trash2,
  Building,
  Package,
  AlertTriangle
} from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Details Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Void / Delete Modal
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPurchases = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const data = await purchaseService.getPurchases(tenant.id);
      setPurchases(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type?.startsWith('purchase:') || detail.type?.startsWith('product:')) {
        loadPurchases();
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  const handleConfirmDelete = async () => {
    if (!tenant || !deletingPurchase) return;
    setIsDeleting(true);
    try {
      await purchaseService.deletePurchase(tenant.id, deletingPurchase.id, {
        id: user?.id || 'usr-active',
        name: user?.name || 'Store Operator'
      });
      showToast(`Purchase order "${deletingPurchase.invoiceNumber}" voided and stock reversed`, 'success');
      setDeletingPurchase(null);
      loadPurchases();
    } catch (err: any) {
      showToast(err.message || 'Failed to void purchase order', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';

  if (isLoading) return <LoadingSpinner text="Loading purchase orders..." />;

  const canCreate = hasPermission('inventory.purchases.create');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Purchases & Inward Orders
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Record wholesale supplier invoices and track goods received into inventory.
          </p>
        </div>

        {canCreate && (
          <Link to="/inventory/purchases/new">
            <Button size="sm" icon={Plus}>
              New Purchase
            </Button>
          </Link>
        )}
      </div>

      {/* Purchases Table */}
      <Card>
        {purchases.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchases recorded"
            description="Create your first purchase order to replenish stock levels directly from suppliers."
            actionLabel={canCreate ? 'New Purchase' : undefined}
            onAction={() => (window.location.href = '/inventory/purchases/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice / PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4 text-center">Items Received</th>
                  <th className="py-3 px-4 text-right">Total Invoice Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.supplierName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(po.purchaseDate)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-800">
                        {po.items.length} line {po.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ({po.items.reduce((s, i) => s + i.quantity, 0)} units total)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(po.totalAmount, currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success" size="sm">
                        Received
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="View Purchase Details"
                          onClick={() => setSelectedPurchase(po)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canCreate && (
                          <button
                            type="button"
                            title="Void Purchase Order"
                            onClick={() => setDeletingPurchase(po)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Purchase Details Modal */}
      <Modal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={selectedPurchase ? `Invoice ${selectedPurchase.invoiceNumber}` : 'Purchase Details'}
        description="Detailed record of goods received from wholesale supplier"
        maxWidth="lg"
      >
        {selectedPurchase && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedPurchase.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Date</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{formatDate(selectedPurchase.purchaseDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Invoice Value</span>
                <span className="font-extrabold text-blue-600 text-sm mt-0.5 block">
                  {formatCurrency(selectedPurchase.totalAmount, currencySymbol)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Line Items Received ({selectedPurchase.items.length})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(item.unitCost, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.totalCost, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPurchase.notes && (
              <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
                <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                {selectedPurchase.notes}
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPurchase(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Void / Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingPurchase}
        onClose={() => setDeletingPurchase(null)}
        title="Void Purchase Order"
        description="Verify inward order cancellation and inventory rollback"
        maxWidth="sm"
      >
        {deletingPurchase && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Automated Inventory Rollback</p>
                <p className="mt-1 text-rose-800 leading-relaxed">
                  Voiding invoice <span className="font-bold">{deletingPurchase.invoiceNumber}</span> will automatically deduct the received quantities from current stock balances and record a compensating audit movement.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to void this purchase order of <span className="font-bold text-slate-900">{formatCurrency(deletingPurchase.totalAmount, currencySymbol)}</span> from <span className="font-bold text-slate-900">{deletingPurchase.supplierName}</span>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingPurchase(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Confirm Void & Rollback
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
