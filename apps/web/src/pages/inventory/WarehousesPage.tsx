import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/productService';
import { Warehouse, WarehouseLocation, StockBalance, Product } from '@infinityhub/types';
import { warehouseSchema, warehouseLocationSchema } from '@infinityhub/validation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Box,
  Building,
  Edit2,
  Boxes,
  ArrowRight
} from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected warehouse for viewing its locations & distribution
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [whFormData, setWhFormData] = useState({
    name: '',
    code: '',
    address: '',
    isDefault: false,
    status: 'active' as 'active' | 'inactive'
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locFormData, setLocFormData] = useState({
    warehouseId: '',
    code: '',
    name: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [whList, prods, bList] = await Promise.all([
        warehouseService.getWarehouses(currentTenant.id),
        productService.getProducts(currentTenant.id),
        warehouseService.getStockBalances(currentTenant.id)
      ]);
      setWarehouses(whList);
      setProducts(prods);
      setBalances(bList);

      // Load locations for all warehouses
      const allLocs: WarehouseLocation[] = [];
      for (const w of whList) {
        const wLocs = await warehouseService.getLocations(currentTenant.id, w.id);
        allLocs.push(...wLocs);
      }
      setLocations(allLocs);

      if (whList.length > 0 && selectedWarehouseId === 'all') {
        setSelectedWarehouseId(whList[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load warehouses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  // Handlers for Warehouse Modal
  const openCreateWarehouse = () => {
    setEditingWarehouse(null);
    setWhFormData({
      name: '',
      code: `WH-${String(warehouses.length + 1).padStart(2, '0')}`,
      address: '',
      isDefault: warehouses.length === 0,
      status: 'active'
    });
    setIsWarehouseModalOpen(true);
  };

  const openEditWarehouse = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setWhFormData({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
      isDefault: wh.isDefault,
      status: wh.status
    });
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const validation = warehouseSchema.safeParse(whFormData);
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message || 'Validation error', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingWarehouse) {
        await warehouseService.updateWarehouse(currentTenant.id, editingWarehouse.id, whFormData);
        showToast('Warehouse updated successfully', 'success');
      } else {
        await warehouseService.createWarehouse(currentTenant.id, whFormData);
        showToast('Warehouse facility created successfully', 'success');
      }
      setIsWarehouseModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error saving warehouse', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Location Modal
  const openCreateLocation = (targetWhId?: string) => {
    setLocFormData({
      warehouseId: targetWhId || (selectedWarehouseId !== 'all' ? selectedWarehouseId : warehouses[0]?.id || ''),
      code: '',
      name: '',
      description: ''
    });
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const validation = warehouseLocationSchema.safeParse({
      code: locFormData.code,
      name: locFormData.name,
      description: locFormData.description
    });
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message || 'Validation error', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await warehouseService.createLocation(currentTenant.id, locFormData.warehouseId, {
        code: locFormData.code,
        name: locFormData.name,
        description: locFormData.description
      });
      showToast('Storage location created', 'success');
      setIsLocationModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error saving location', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active warehouse details
  const activeWarehouse = useMemo(() => {
    if (selectedWarehouseId === 'all') return null;
    return warehouses.find(w => w.id === selectedWarehouseId);
  }, [warehouses, selectedWarehouseId]);

  const activeLocations = useMemo(() => {
    if (selectedWarehouseId === 'all') return locations;
    return locations.filter(l => l.warehouseId === selectedWarehouseId);
  }, [locations, selectedWarehouseId]);

  // Filtered Stock Balances for the table
  const displayedBalances = useMemo(() => {
    let result = balances;
    if (selectedWarehouseId !== 'all') {
      result = result.filter(b => b.warehouseId === selectedWarehouseId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => {
        const prod = products.find(p => p.id === b.productId);
        return prod?.name.toLowerCase().includes(q) || prod?.sku.toLowerCase().includes(q);
      });
    }
    return result;
  }, [balances, selectedWarehouseId, searchQuery, products]);

  const totalCapacityUnits = useMemo(() => {
    return balances.reduce((acc, b) => acc + b.quantity, 0);
  }, [balances]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <WarehouseIcon className="w-7 h-7 text-primary-600" />
            Warehouses & Storage Facilities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage multi-depot inventory, storage aisles, cold rooms, and bin/shelf allocation.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => openCreateLocation()}
              disabled={warehouses.length === 0}
            >
              Add Bin Location
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Building}
              onClick={openCreateWarehouse}
            >
              New Warehouse
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Facilities</span>
            <Building className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{warehouses.length}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Active Stock Depots</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bin Locations</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{locations.length}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Racks, Bins & Aisles</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stocked SKUs</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{products.length}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Catalog Product Lines</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Units on Hand</span>
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCapacityUnits.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Physical Inventory Units</span>
        </Card>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Loading warehouses and bin locations..." />
        </div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No Warehouses Configured"
          description="Register your first warehouse or store facility to begin tracking multi-location inventory."
          actionLabel={canManage ? 'Add First Warehouse' : undefined}
          onAction={openCreateWarehouse}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Warehouse Directory List (Left Column) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Warehouses ({warehouses.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {warehouses.map(wh => {
                const whLocCount = locations.filter(l => l.warehouseId === wh.id).length;
                const isSelected = selectedWarehouseId === wh.id;

                return (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/50 border-primary-500 shadow-sm ring-1 ring-primary-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">{wh.name}</h4>
                          {wh.isDefault && (
                            <Badge variant="primary" size="sm">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                            {wh.code}
                          </span>
                          <span>•</span>
                          <span>{whLocCount} bin locations</span>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditWarehouse(wh);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white"
                          title="Edit Warehouse"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {wh.address && (
                      <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="line-clamp-1">{wh.address}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warehouse Details & Storage Locations (Right Column) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Selected Warehouse Header Card */}
            {activeWarehouse && (
              <Card className="p-5 border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{activeWarehouse.name}</h2>
                      <span className="font-mono text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded font-semibold">
                        {activeWarehouse.code}
                      </span>
                      {activeWarehouse.isDefault && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Default Outlet
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {activeWarehouse.address || 'Address not specified'}
                    </p>
                  </div>

                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => openCreateLocation(activeWarehouse.id)}
                    >
                      Add Bin Location
                    </Button>
                  )}
                </div>

                {/* Storage Bins / Aisles inside this warehouse */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Assigned Storage Bins & Shelves ({activeLocations.length})
                    </h4>
                  </div>

                  {activeLocations.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                      No bin or rack locations defined yet. Click "Add Bin Location" to set up aisles.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {activeLocations.map(loc => (
                        <div
                          key={loc.id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {loc.code}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 mt-1.5 truncate">{loc.name}</p>
                            {loc.description && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{loc.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Warehouse Stock Balances Table */}
            <Card className="border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Stock Allocation ({displayedBalances.length} SKUs)
                  </h3>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product or SKU..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Storage Facility</th>
                      <th className="py-3 px-4 text-right">Physical On-Hand</th>
                      <th className="py-3 px-4 text-right">Reserved</th>
                      <th className="py-3 px-4 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedBalances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          No stock balance recorded for this warehouse view.
                        </td>
                      </tr>
                    ) : (
                      displayedBalances.map(b => {
                        const prod = products.find(p => p.id === b.productId);
                        const wh = warehouses.find(w => w.id === b.warehouseId);
                        const available = Math.max(0, b.quantity - (b.reservedQuantity || 0));

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{prod?.name || 'Unknown SKU'}</span>
                              <span className="text-[11px] text-slate-400">{prod?.categoryName}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-600">
                              {prod?.sku || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="font-medium text-slate-800">{wh?.name}</span>
                              <span className="block text-[11px] text-slate-400 font-mono">{wh?.code}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              {b.quantity} {prod?.unit || 'pcs'}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-amber-600">
                              {b.reservedQuantity || 0}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">
                              {available} {prod?.unit || 'pcs'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title={editingWarehouse ? 'Edit Warehouse Facility' : 'Add Warehouse Facility'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveWarehouse} className="space-y-4">
          <Input
            label="Warehouse / Outlet Name *"
            placeholder="e.g. South Chennai Depot"
            value={whFormData.name}
            onChange={(e) => setWhFormData({ ...whFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Facility Code *"
              placeholder="e.g. WH-SOUTH"
              value={whFormData.code}
              onChange={(e) => setWhFormData({ ...whFormData, code: e.target.value.toUpperCase() })}
              required
            />

            <Select
              label="Operating Status"
              value={whFormData.status}
              onChange={(e) => setWhFormData({ ...whFormData, status: e.target.value as any })}
              options={[
                { value: 'active', label: 'Active Facility' },
                { value: 'inactive', label: 'Inactive / Maintenance' }
              ]}
            />
          </div>

          <Input
            label="Street Address / Location Details"
            placeholder="e.g. Plot 14, Guindy Industrial Estate, Chennai"
            value={whFormData.address}
            onChange={(e) => setWhFormData({ ...whFormData, address: e.target.value })}
          />

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={whFormData.isDefault}
                onChange={(e) => setWhFormData({ ...whFormData, isDefault: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Set as Primary / Default Distribution Depot
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsWarehouseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingWarehouse ? 'Save Changes' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Location Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Add Storage Bin or Rack"
        maxWidth="md"
      >
        <form onSubmit={handleSaveLocation} className="space-y-4">
          <Select
            label="Assign to Warehouse Facility *"
            value={locFormData.warehouseId}
            onChange={(e) => setLocFormData({ ...locFormData, warehouseId: e.target.value })}
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location / Bin Code *"
              placeholder="e.g. AISLE-B02"
              value={locFormData.code}
              onChange={(e) => setLocFormData({ ...locFormData, code: e.target.value.toUpperCase() })}
              required
            />

            <Input
              label="Location Label *"
              placeholder="e.g. Dairy Chiller 2"
              value={locFormData.name}
              onChange={(e) => setLocFormData({ ...locFormData, name: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description / Special Instructions"
            placeholder="e.g. Heavy pallet storage; temperature maintained at 4°C"
            value={locFormData.description}
            onChange={(e) => setLocFormData({ ...locFormData, description: e.target.value })}
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Bin Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
