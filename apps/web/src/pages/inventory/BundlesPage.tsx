import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bundleService } from '../../services/bundleService';
import { productService } from '../../services/productService';
import { ProductBundle, BundleItem, Product } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import { formatCurrency } from '@infinityhub/ui';
import { BundleAssembleModal } from './BundleAssembleModal';
import {
  Layers,
  Plus,
  Search,
  Package,
  Trash2,
  DollarSign,
  Boxes,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BundlesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [components, setComponents] = useState<BundleItem[]>([]);
  const [assemblyInstructions, setAssemblyInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-App Assembly / Disassembly Modal State
  const [assemblyModal, setAssemblyModal] = useState<{
    isOpen: boolean;
    mode: 'assemble' | 'disassemble';
    bundle: ProductBundle | null;
  }>({
    isOpen: false,
    mode: 'assemble',
    bundle: null
  });

  const canManage = hasPermission('inventory.bundles.manage') || hasPermission('inventory.products.create');

  const handleOpenAssemble = (bundle: ProductBundle) => {
    setAssemblyModal({
      isOpen: true,
      mode: 'assemble',
      bundle
    });
  };

  const handleOpenDisassemble = (bundle: ProductBundle) => {
    setAssemblyModal({
      isOpen: true,
      mode: 'disassemble',
      bundle
    });
  };

  const handleConfirmAssembly = async (quantity: number) => {
    if (!tenant || !user || !assemblyModal.bundle) return;
    const bundle = assemblyModal.bundle;
    if (assemblyModal.mode === 'assemble') {
      await bundleService.assembleBundle(tenant.id, bundle.id, quantity, { id: user.id, name: user.name });
      showToast(`Successfully assembled ${quantity} unit${quantity > 1 ? 's' : ''} of ${bundle.bundleProductName}`, 'success');
    } else {
      await bundleService.disassembleBundle(tenant.id, bundle.id, quantity, { id: user.id, name: user.name });
      showToast(`Successfully disassembled ${quantity} unit${quantity > 1 ? 's' : ''} of ${bundle.bundleProductName}`, 'success');
    }
    await loadData();
  };

  const loadData = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const [bundleData, productData] = await Promise.all([
        bundleService.getBundles(tenant.id),
        productService.getProducts(tenant.id)
      ]);
      setBundles(bundleData);
      setProducts(productData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load bundles', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const filteredBundles = useMemo(() => {
    return bundles.filter(b =>
      b.bundleProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.components.some(c => c.componentProductName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [bundles, searchQuery]);

  const openCreateModal = () => {
    setEditingBundle(null);
    setSelectedParentId(products[0]?.id || '');
    setComponents([]);
    setAssemblyInstructions('');
    setIsModalOpen(true);
  };

  const openEditModal = (bundle: ProductBundle) => {
    setEditingBundle(bundle);
    setSelectedParentId(bundle.bundleProductId);
    setComponents([...bundle.components]);
    setAssemblyInstructions(bundle.assemblyInstructions || '');
    setIsModalOpen(true);
  };

  const addComponentRow = () => {
    const available = products.filter(p => p.id !== selectedParentId);
    if (available.length === 0) {
      showToast('No available products to add as components', 'info');
      return;
    }
    const first = available[0];
    setComponents(prev => [
      ...prev,
      {
        componentProductId: first.id,
        componentProductName: first.name,
        sku: first.sku,
        quantity: 1,
        unitCost: first.costPrice
      }
    ]);
  };

  const updateComponent = (index: number, field: keyof BundleItem, value: any) => {
    setComponents(prev => {
      const next = [...prev];
      if (field === 'componentProductId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          next[index] = {
            ...next[index],
            componentProductId: prod.id,
            componentProductName: prod.name,
            sku: prod.sku,
            unitCost: prod.costPrice
          };
        }
      } else {
        next[index] = {
          ...next[index],
          [field]: value
        };
      }
      return next;
    });
  };

  const removeComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const rolledUpCost = components.reduce((acc, c) => acc + c.quantity * c.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!selectedParentId) {
      showToast('Please select a master bundle product', 'info');
      return;
    }
    if (components.length === 0) {
      showToast('Please add at least one component to the bundle', 'info');
      return;
    }

    const parentProd = products.find(p => p.id === selectedParentId);
    if (!parentProd) return;

    setIsSubmitting(true);
    try {
      await bundleService.saveBundle(tenant.id, {
        bundleProductId: selectedParentId,
        bundleProductName: parentProd.name,
        components,
        assemblyInstructions: assemblyInstructions.trim() || undefined
      });

      showToast(`Bundle configuration for "${parentProd.name}" saved!`, 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save bundle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Product Bundles & Kits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build combo packs, multi-item kits, and gift sets with automated component cost roll-up.
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            variant="primary"
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Configure Bundle
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configured Bundles</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{bundles.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Components</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {bundles.length > 0
                ? (bundles.reduce((acc, b) => acc + b.components.length, 0) / bundles.length).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Component Items</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {bundles.reduce((acc, b) => acc + b.components.reduce((sum, c) => sum + c.quantity, 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bundles by kit name or component product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bundles List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Loading product bundles..." />
        </div>
      ) : filteredBundles.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Product Bundles Configured"
          description={
            searchQuery
              ? 'No bundles matched your search criteria.'
              : 'Create promotional kits, gift combos, or multipacks composed of multiple inventory items.'
          }
          actionLabel={canManage && !searchQuery ? 'Configure First Bundle' : undefined}
          onAction={canManage && !searchQuery ? openCreateModal : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredBundles.map(bundle => {
            const parentProd = products.find(p => p.id === bundle.bundleProductId);
            const bundleCost = bundle.components.reduce((acc, c) => acc + c.quantity * c.unitCost, 0);
            const sellingPrice = parentProd?.sellingPrice || 0;
            const margin = sellingPrice > 0 ? (((sellingPrice - bundleCost) / sellingPrice) * 100).toFixed(1) : '0';

            return (
              <div
                key={bundle.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 border border-primary-100 dark:border-primary-900">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {bundle.bundleProductName}
                        </h3>
                        <Badge variant="primary">Bundle / Kit</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        SKU: {parentProd?.sku || 'N/A'} • {bundle.components.length} Component Items
                      </p>
                    </div>
                  </div>

                  {/* Pricing / Margin Summary */}
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Rolled-Up Cost</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(bundleCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Retail Price</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(sellingPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Margin</p>
                      <Badge variant={parseFloat(margin) >= 20 ? 'success' : 'warning'}>
                        {margin}%
                      </Badge>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAssemble(bundle)}
                          className="text-xs"
                        >
                          Assemble
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDisassemble(bundle)}
                          className="text-xs"
                        >
                          Disassemble
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(bundle)}
                        >
                          Edit BOM
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Component Breakdown Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="pb-2 font-semibold">Component Product</th>
                        <th className="pb-2 font-semibold">SKU</th>
                        <th className="pb-2 font-semibold text-center">Quantity Multiplier</th>
                        <th className="pb-2 font-semibold text-right">Unit Cost</th>
                        <th className="pb-2 font-semibold text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {bundle.components.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                            {comp.componentProductName}
                          </td>
                          <td className="py-2 font-mono text-slate-500">
                            {comp.sku}
                          </td>
                          <td className="py-2 text-center font-bold text-primary-600">
                            × {comp.quantity}
                          </td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(comp.unitCost)}
                          </td>
                          <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(comp.quantity * comp.unitCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bundle.assemblyInstructions && (
                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <span><strong>Assembly Notes:</strong> {bundle.assemblyInstructions}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBundle ? 'Edit Bundle Bill of Materials' : 'Configure New Bundle'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Master Product Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Master Bundle Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              disabled={!!editingBundle}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Retail: {formatCurrency(p.sellingPrice)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Select the finished SKU that customers purchase as a single kit.
            </p>
          </div>

          {/* Dynamic Components Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                Bundle Components (Bill of Materials) <span className="text-rose-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addComponentRow}
                className="flex items-center gap-1.5 text-xs py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Component
              </Button>
            </div>

            {components.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500 text-xs">
                No components added yet. Click &quot;Add Component&quot; to define items in this kit.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {components.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex-1">
                      <select
                        value={comp.componentProductId}
                        onChange={(e) => updateComponent(idx, 'componentProductId', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {products
                          .filter(p => p.id !== selectedParentId)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="w-24 flex items-center gap-1">
                      <span className="text-slate-400 font-semibold">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={comp.quantity}
                        onChange={(e) => updateComponent(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="w-28 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(comp.quantity * comp.unitCost)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeComponent(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Remove Component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Rolled-Up Cost Banner */}
            {components.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Total Rolled-Up Cost of Components:
                </span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-200">
                  {formatCurrency(rolledUpCost)}
                </span>
              </div>
            )}
          </div>

          {/* Assembly Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Assembly Instructions / Packaging SOP
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Wrap with holiday ribbon and include warranty flyer..."
              value={assemblyInstructions}
              onChange={(e) => setAssemblyInstructions(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Bundle Configuration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assemble / Disassemble In-App Modal */}
      <BundleAssembleModal
        isOpen={assemblyModal.isOpen}
        mode={assemblyModal.mode}
        bundle={assemblyModal.bundle}
        parentProduct={products.find(p => p.id === assemblyModal.bundle?.bundleProductId)}
        allProducts={products}
        onClose={() => setAssemblyModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAssembly}
      />
    </div>
  );
};
