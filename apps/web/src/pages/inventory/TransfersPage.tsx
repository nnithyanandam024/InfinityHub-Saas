import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { transferService } from '../../services/transferService';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/productService';
import { StockTransfer, Warehouse, Product, StockTransferItem } from '@infinityhub/types';
import { stockTransferSchema } from '@infinityhub/validation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // New Transfer Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    notes: '',
    items: [{ productId: '', productName: '', sku: '', quantity: 1 }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [trList, whList, prodList] = await Promise.all([
        transferService.getTransfers(currentTenant.id),
        warehouseService.getWarehouses(currentTenant.id),
        productService.getProducts(currentTenant.id)
      ]);
      setTransfers(trList);
      setWarehouses(whList);
      setProducts(prodList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load stock transfers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const openNewTransfer = () => {
    if (warehouses.length < 2) {
      showToast('You need at least two warehouses to perform a stock transfer.', 'info');
      return;
    }
    setFormData({
      sourceWarehouseId: warehouses[0]?.id || '',
      destinationWarehouseId: warehouses[1]?.id || '',
      notes: '',
      items: [{ productId: products[0]?.id || '', productName: products[0]?.name || '', sku: products[0]?.sku || '', quantity: 1 }]
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: products[0]?.id || '', productName: products[0]?.name || '', sku: products[0]?.sku || '', quantity: 1 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        productName: prod?.name || '',
        sku: prod?.sku || ''
      };
    } else if (field === 'quantity') {
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, parseInt(value) || 1)
      };
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !user) return;

    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      showToast('Source and destination warehouses cannot be the same', 'info');
      return;
    }

    if (formData.items.some(i => !i.productId || i.quantity <= 0)) {
      showToast('Please select products and valid quantities', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await transferService.createTransfer(
        currentTenant.id,
        {
          sourceWarehouseId: formData.sourceWarehouseId,
          destinationWarehouseId: formData.destinationWarehouseId,
          notes: formData.notes,
          items: formData.items
        },
        user.id,
        user.name
      );
      showToast('Stock transfer created successfully', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creating transfer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (transferId: string) => {
    if (!currentTenant || !user) return;
    try {
      await transferService.dispatchTransfer(currentTenant.id, transferId, user.id, user.name);
      showToast('Transfer marked as In Transit. Stock deducted from origin depot.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch transfer', 'error');
    }
  };

  const handleReceive = async (transferId: string) => {
    if (!currentTenant || !user) return;
    try {
      await transferService.receiveTransfer(currentTenant.id, transferId, user.id, user.name);
      showToast('Transfer completed. Stock credited to destination depot.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to receive transfer', 'error');
    }
  };

  const handleCancel = async (transferId: string) => {
    if (!currentTenant || !user) return;
    if (!window.confirm('Are you sure you want to cancel this transfer?')) return;
    try {
      await transferService.cancelTransfer(currentTenant.id, transferId, user.id, user.name);
      showToast('Transfer cancelled', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel transfer', 'error');
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesSearch =
        t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sourceWarehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destinationWarehouseName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [transfers, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      inTransit: transfers.filter(t => t.status === 'in_transit').length,
      received: transfers.filter(t => t.status === 'received').length,
      draft: transfers.filter(t => t.status === 'draft').length
    };
  }, [transfers]);

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'in_transit':
        return <Badge variant="warning"><Truck className="w-3 h-3 mr-1" /> In Transit</Badge>;
      case 'received':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Received</Badge>;
      case 'cancelled':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="neutral"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 text-primary-600" />
            Inter-Warehouse Stock Transfers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Safely dispatch and receive stock between warehouses with ledger audit trails.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openNewTransfer}
          >
            Create Stock Transfer
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">All Movements</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Transit</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.inTransit}</p>
          <span className="text-xs text-amber-600 font-medium mt-0.5 inline-block">Active On The Road</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.received}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Fully Reconciled</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drafts</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.draft}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Pending Dispatch</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transfer # or warehouse..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft Transfers' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'received', label: 'Completed (Received)' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Transfers List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Loading transfer log..." />
        </div>
      ) : filteredTransfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No Transfers Found"
          description="Move goods between branch locations or distribution centers to rebalance inventory."
          actionLabel={canManage ? 'Create First Transfer' : undefined}
          onAction={openNewTransfer}
        />
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map(tr => {
            const totalItemsCount = tr.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <Card key={tr.id} className="p-5 border-slate-200 hover:border-slate-300 transition-all bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {tr.transferNumber}
                      </span>
                      {getStatusBadge(tr.status)}
                      <span className="text-xs text-slate-400">
                        Created on {new Date(tr.createdAt).toLocaleDateString()} by {tr.createdByUserName}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{tr.sourceWarehouseName}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Building className="w-4 h-4 text-primary-500" />
                        <span>{tr.destinationWarehouseName}</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{tr.items.length} unique SKUs</span>
                      <span>({totalItemsCount} total units)</span>
                      {tr.notes && <span className="italic text-slate-400">• Note: {tr.notes}</span>}
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTransfer(selectedTransfer?.id === tr.id ? null : tr)}
                    >
                      {selectedTransfer?.id === tr.id ? 'Hide Items' : 'View Manifest'}
                    </Button>

                    {canManage && tr.status === 'draft' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Truck}
                          onClick={() => handleDispatch(tr.id)}
                        >
                          Dispatch
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(tr.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {canManage && tr.status === 'in_transit' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PackageCheck}
                        onClick={() => handleReceive(tr.id)}
                      >
                        Receive Goods
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Manifest Table */}
                {selectedTransfer?.id === tr.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Transfer Cargo Manifest
                    </h4>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Product Name</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3 text-right">Transfer Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {tr.items.map(it => (
                            <tr key={it.id}>
                              <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                              <td className="py-2 px-3 font-mono text-slate-500">{it.sku}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">{it.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Inter-Warehouse Transfer"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Source Warehouse (Origin) *"
              value={formData.sourceWarehouseId}
              onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
              options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))}
              required
            />

            <Select
              label="Destination Warehouse (Target) *"
              value={formData.destinationWarehouseId}
              onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
              options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))}
              required
            />
          </div>

          <Input
            label="Transfer Notes / Shipping Reference"
            placeholder="e.g. Weekend retail restocking request"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {/* Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products to Transfer ({formData.items.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddItem}
              >
                Add SKU
              </Button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      label="Select Product"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      options={products.map(p => ({
                        value: p.id,
                        label: `${p.name} (Stock: ${p.stockQuantity} ${p.unit})`
                      }))}
                      required
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      label="Qty to Move"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="mt-6 text-rose-500 hover:text-rose-700 p-1.5"
                      title="Remove Item"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
