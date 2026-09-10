import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { serialService } from '../../services/serialService';
import { productService } from '../../services/productService';
import { warehouseService } from '../../services/warehouseService';
import { SerialNumber, Product, Warehouse, SerialStatus } from '@infinityhub/types';
import { serialNumberSchema } from '@infinityhub/validation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  Binary,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building,
  User,
  ShieldCheck
} from 'lucide-react';

export const SerialsPage: React.FC = () => {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [serials, setSerials] = useState<SerialNumber[]>([]);
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
    serialNumber: '',
    warehouseId: '',
    purchaseReference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [sList, prodList, whList] = await Promise.all([
        serialService.getSerialNumbers(currentTenant.id),
        productService.getProducts(currentTenant.id),
        warehouseService.getWarehouses(currentTenant.id)
      ]);
      setSerials(sList);
      setProducts(prodList);
      setWarehouses(whList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load serial numbers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const openCreateModal = () => {
    setFormData({
      productId: products[0]?.id || '',
      serialNumber: `SN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      warehouseId: warehouses[0]?.id || '',
      purchaseReference: 'PO-RECEIPT'
    });
    setIsModalOpen(true);
  };

  const handleCreateSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const prod = products.find(p => p.id === formData.productId);
    if (!prod) {
      showToast('Please select a valid product', 'info');
      return;
    }

    const validation = serialNumberSchema.safeParse(formData);
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message || 'Validation error', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await serialService.registerSerialNumber(currentTenant.id, {
        productId: formData.productId,
        productName: prod.name,
        serialNumber: formData.serialNumber,
        warehouseId: formData.warehouseId,
        purchaseReference: formData.purchaseReference
      });
      showToast('Serial number registered successfully', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register serial number', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (serialId: string, newStatus: SerialStatus) => {
    if (!currentTenant) return;
    try {
      await serialService.updateSerialStatus(currentTenant.id, serialId, newStatus);
      showToast(`Unit marked as ${newStatus.replace('_', ' ')}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const filteredSerials = useMemo(() => {
    return serials.filter(s => {
      const matchesSearch =
        s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProduct = selectedProduct === 'ALL' || s.productId === selectedProduct;
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }, [serials, searchQuery, selectedProduct, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: serials.length,
      inStock: serials.filter(s => s.status === 'in_stock').length,
      allocated: serials.filter(s => s.status === 'allocated').length,
      sold: serials.filter(s => s.status === 'sold').length,
      defective: serials.filter(s => s.status === 'defective').length
    };
  }, [serials]);

  const getStatusBadge = (status: SerialStatus) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> In Stock</Badge>;
      case 'allocated':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Allocated</Badge>;
      case 'sold':
        return <Badge variant="neutral"><User className="w-3 h-3 mr-1" /> Sold</Badge>;
      case 'defective':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Defective</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Binary className="w-7 h-7 text-primary-600" />
            Serial Number Tracking Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track individual serialized units, warranty tags, customer assignments, and RMA returns.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openCreateModal}
          >
            Register Serial Number
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Serialized</span>
            <Binary className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Units on Register</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available In-Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.inStock}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Ready to Sell</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sold / Delivered</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.sold}</p>
          <span className="text-xs text-indigo-600 font-medium mt-0.5 inline-block">Active Warranty</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Defective / RMA</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.defective}</p>
          <span className="text-xs text-rose-600 font-medium mt-0.5 inline-block">Quarantined</span>
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
              placeholder="Search serial # or product..."
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
              { value: 'ALL', label: 'All Lifecycle Statuses' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'allocated', label: 'Allocated' },
              { value: 'sold', label: 'Sold' },
              { value: 'defective', label: 'Defective / Damaged' }
            ]}
          />
        </div>
      </Card>

      {/* Serials Table */}
      <Card className="border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner text="Loading serial registry..." />
          </div>
        ) : filteredSerials.length === 0 ? (
          <EmptyState
            icon={Binary}
            title="No Serial Numbers Found"
            description="Register individual serialized items to track warranties, provenance, and status."
            actionLabel={canManage ? 'Register First Unit' : undefined}
            onAction={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Warehouse Facility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purchase Ref / Notes</th>
                  <th className="py-3 px-4">Registered Date</th>
                  {canManage && <th className="py-3 px-4 text-right">Quick Transition</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSerials.map(s => {
                  const wh = warehouses.find(w => w.id === s.warehouseId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {s.serialNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {s.productName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {wh?.name || 'Main Distribution Depot'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(s.status)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {s.purchaseReference || 'Direct Inward'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <select
                            value={s.status}
                            onChange={(e) => handleUpdateStatus(s.id, e.target.value as SerialStatus)}
                            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 hover:border-slate-300 focus:outline-none"
                          >
                            <option value="in_stock">In Stock</option>
                            <option value="allocated">Allocated</option>
                            <option value="sold">Sold</option>
                            <option value="defective">Defective</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Register Serial Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Serialized Unit"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSerial} className="space-y-4">
          <Select
            label="Product Item *"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Serial Number (Unique Barcode Tag) *"
              placeholder="e.g. SN-2026-0001"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
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

          <Input
            label="Purchase Reference / Invoice #"
            placeholder="e.g. PO-1024 or Supplier Batch"
            value={formData.purchaseReference}
            onChange={(e) => setFormData({ ...formData, purchaseReference: e.target.value })}
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Register Serial
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
