import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { batchService } from '../../services/batchService';
import { productService } from '../../services/productService';
import { warehouseService } from '../../services/warehouseService';
import { Batch, Product, Warehouse } from '@infinityhub/types';
import { batchSchema } from '@infinityhub/validation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  CalendarClock,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  Tag,
  ShieldAlert,
  Boxes
} from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    batchNumber: '',
    warehouseId: '',
    manufacturedAt: new Date().toISOString().split('T')[0],
    expiryAt: '',
    quantity: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [batchList, prodList, whList] = await Promise.all([
        batchService.getBatches(currentTenant.id),
        productService.getProducts(currentTenant.id),
        warehouseService.getWarehouses(currentTenant.id)
      ]);
      setBatches(batchList);
      setProducts(prodList);
      setWarehouses(whList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load batches', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const openCreateModal = () => {
    const today = new Date();
    const futureExpiry = new Date();
    futureExpiry.setMonth(today.getMonth() + 6);

    setFormData({
      productId: products[0]?.id || '',
      batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      warehouseId: warehouses[0]?.id || '',
      manufacturedAt: today.toISOString().split('T')[0],
      expiryAt: futureExpiry.toISOString().split('T')[0],
      quantity: 25
    });
    setIsModalOpen(true);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const prod = products.find(p => p.id === formData.productId);
    if (!prod) {
      showToast('Please select a valid product', 'info');
      return;
    }

    const validation = batchSchema.safeParse(formData);
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message || 'Validation error', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await batchService.createBatch(currentTenant.id, {
        productId: formData.productId,
        productName: prod.name,
        batchNumber: formData.batchNumber,
        warehouseId: formData.warehouseId,
        manufacturedAt: formData.manufacturedAt,
        expiryAt: formData.expiryAt,
        quantity: Number(formData.quantity),
        initialQuantity: Number(formData.quantity)
      });
      showToast('Batch registered successfully', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register batch', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute days to expiry and status
  const getExpiryDetails = (expiryDateStr?: string) => {
    if (!expiryDateStr) return { days: 999, label: 'No Expiry Set', color: 'neutral' };
    const now = new Date();
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { days: diffDays, label: 'Expired', color: 'danger' };
    }
    if (diffDays <= 30) {
      return { days: diffDays, label: `${diffDays} days remaining`, color: 'danger' };
    }
    if (diffDays <= 60) {
      return { days: diffDays, label: `${diffDays} days remaining`, color: 'warning' };
    }
    return { days: diffDays, label: `${diffDays} days remaining`, color: 'success' };
  };

  // Urgent expiring soon items (< 30 days)
  const expiringSoonBatches = useMemo(() => {
    return batches.filter(b => {
      if (!b.expiryAt || b.quantity <= 0) return false;
      const details = getExpiryDetails(b.expiryAt);
      return details.days <= 30;
    });
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchesSearch =
        b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProduct = selectedProduct === 'ALL' || b.productId === selectedProduct;
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }, [batches, searchQuery, selectedProduct, statusFilter]);

  const stats = useMemo(() => {
    const expiredCount = batches.filter(b => {
      if (!b.expiryAt) return false;
      return getExpiryDetails(b.expiryAt).days <= 0;
    }).length;

    return {
      total: batches.length,
      active: batches.filter(b => b.status === 'active').length,
      expiringSoon: expiringSoonBatches.length,
      expired: expiredCount
    };
  }, [batches, expiringSoonBatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-7 h-7 text-primary-600" />
            Batches & Shelf-Life Expiry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lot tracking, manufacturing dates, and automated expiry countdowns for perishable inventory.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openCreateModal}
          >
            Register Batch
          </Button>
        )}
      </div>

      {/* Expiring Soon Alert Banner */}
      {expiringSoonBatches.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900">
              Immediate Attention Required: {expiringSoonBatches.length} Batch(es) Expiring Within 30 Days
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Prioritize sales dispatch or discount promotions for early-expiry lots to prevent capital write-offs.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {expiringSoonBatches.slice(0, 3).map(b => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 text-[11px] bg-white text-rose-800 font-semibold px-2.5 py-1 rounded-md border border-rose-300"
                >
                  <Tag className="w-3 h-3" /> {b.productName} ({b.batchNumber}) — {getExpiryDetails(b.expiryAt).label} ({b.quantity} units)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Batches</span>
            <Boxes className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Registered Lots</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Lots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.active}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Stock Available</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expiring &lt;30 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.expiringSoon}</p>
          <span className="text-xs text-amber-600 font-medium mt-0.5 inline-block">Urgent Action</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expired</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.expired}</p>
          <span className="text-xs text-rose-600 font-medium mt-0.5 inline-block">Unsellable Stock</span>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lot / batch # or product..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
            />
          </div>

          <Select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Products' },
              ...products.map(p => ({ value: p.id, label: p.name }))
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Batch Statuses' },
              { value: 'active', label: 'Active Lots' },
              { value: 'expired', label: 'Expired' },
              { value: 'depleted', label: 'Depleted (0 stock)' }
            ]}
          />
        </div>
      </Card>

      {/* Batches Table */}
      <Card className="border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner text="Loading lot register..." />
          </div>
        ) : filteredBatches.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No Batches Found"
            description="Register batches to monitor manufacturing dates, lot codes, and shelf-life."
            actionLabel={canManage ? 'Register First Batch' : undefined}
            onAction={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch / Lot Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Manufactured</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Shelf-Life Status</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(b => {
                  const expiryDetails = getExpiryDetails(b.expiryAt);
                  const wh = warehouses.find(w => w.id === b.warehouseId);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {b.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{b.productName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {wh?.name || 'Main Facility'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.manufacturedAt ? new Date(b.manufacturedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {b.expiryAt ? new Date(b.expiryAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={expiryDetails.color as any}>
                          {expiryDetails.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {b.quantity} units
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Register Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Product Batch / Lot"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <Select
            label="Target Product SKU *"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Batch / Lot Number *"
              placeholder="e.g. LOT-2026-99"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              required
            />

            <Select
              label="Warehouse *"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Manufacturing Date"
              type="date"
              value={formData.manufacturedAt}
              onChange={(e) => setFormData({ ...formData, manufacturedAt: e.target.value })}
            />

            <Input
              label="Expiry Date *"
              type="date"
              value={formData.expiryAt}
              onChange={(e) => setFormData({ ...formData, expiryAt: e.target.value })}
              required
            />
          </div>

          <Input
            label="Batch Quantity (Units) *"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            required
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Register Lot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
