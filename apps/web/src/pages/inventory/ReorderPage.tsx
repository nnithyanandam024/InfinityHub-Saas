import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reorderService } from '../../services/reorderService';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { ReorderRule, PurchaseSuggestion, Product, Supplier } from '@infinityhub/types';
import { reorderRuleSchema } from '@infinityhub/validation';
import { formatCurrency } from '@infinityhub/ui';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  BellRing,
  Plus,
  Search,
  ShoppingCart,
  TrendingDown,
  Truck,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  Package
} from 'lucide-react';

export const ReorderPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'suggestions' | 'rules'>('suggestions');
  const [searchQuery, setSearchQuery] = useState('');

  // Rule Modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    productId: '',
    minStock: 5,
    reorderPoint: 10,
    reorderQuantity: 50,
    preferredSupplierId: '',
    autoGeneratePO: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [sugList, ruleList, prodList, supList] = await Promise.all([
        reorderService.getPurchaseSuggestions(currentTenant.id),
        reorderService.getReorderRules(currentTenant.id),
        productService.getProducts(currentTenant.id),
        supplierService.getSuppliers(currentTenant.id)
      ]);
      setSuggestions(sugList);
      setRules(ruleList);
      setProducts(prodList);
      setSuppliers(supList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load reorder data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleFormData({
      productId: products[0]?.id || '',
      minStock: 5,
      reorderPoint: 10,
      reorderQuantity: 50,
      preferredSupplierId: suppliers[0]?.id || '',
      autoGeneratePO: true
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const prod = products.find(p => p.id === ruleFormData.productId);
    if (!prod) {
      showToast('Select a product', 'info');
      return;
    }

    const sup = suppliers.find(s => s.id === ruleFormData.preferredSupplierId);

    const validation = reorderRuleSchema.safeParse({
      productId: ruleFormData.productId,
      minStock: Number(ruleFormData.minStock),
      reorderPoint: Number(ruleFormData.reorderPoint),
      reorderQuantity: Number(ruleFormData.reorderQuantity),
      preferredSupplierId: ruleFormData.preferredSupplierId,
      autoGeneratePO: ruleFormData.autoGeneratePO
    });

    if (!validation.success) {
      showToast(validation.error.errors[0]?.message || 'Validation error', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await reorderService.saveReorderRule(currentTenant.id, {
        productId: ruleFormData.productId,
        productName: prod.name,
        minStock: Number(ruleFormData.minStock),
        reorderPoint: Number(ruleFormData.reorderPoint),
        reorderQuantity: Number(ruleFormData.reorderQuantity),
        preferredSupplierId: ruleFormData.preferredSupplierId || undefined,
        preferredSupplierName: sup?.companyName || sup?.name || undefined,
        autoGeneratePO: ruleFormData.autoGeneratePO
      });
      showToast('Reorder rule saved successfully', 'success');
      setIsRuleModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save rule', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group suggestions by Supplier for intelligent bulk ordering
  const groupedSuggestions = useMemo(() => {
    const map: Record<string, { supplierName: string; supplierId?: string; items: PurchaseSuggestion[] }> = {};

    for (const item of suggestions) {
      const supKey = item.supplierId || 'unassigned';
      const supName = item.supplierName || 'General Wholesaler';

      if (!map[supKey]) {
        map[supKey] = {
          supplierName: supName,
          supplierId: item.supplierId,
          items: []
        };
      }
      map[supKey].items.push(item);
    }

    return Object.values(map);
  }, [suggestions]);

  const stats = useMemo(() => {
    const totalSuggestedUnits = suggestions.reduce((acc, s) => acc + s.suggestedQuantity, 0);
    const totalEstimatedCapital = suggestions.reduce((acc, s) => acc + s.estimatedTotalCost, 0);

    return {
      triggerCount: suggestions.length,
      totalUnits: totalSuggestedUnits,
      capitalNeeded: totalEstimatedCapital,
      rulesCount: rules.length
    };
  }, [suggestions, rules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-primary-600" />
            Automated Reordering & Replenishment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detect low-stock thresholds, compute suggested PO quantities, and reorder with single-click grouping.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              onClick={openCreateRule}
            >
              Configure Rule
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => navigate('/inventory/purchases/new')}
            >
              New Purchase Order
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock SKUs</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.triggerCount}</p>
          <span className="text-xs text-rose-600 font-medium mt-0.5 inline-block">At or Below Reorder Point</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Suggested Order</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalUnits.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Recommended Units</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Replenishment Capital</span>
            <ShoppingCart className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(stats.capitalNeeded)}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Estimated PO Expenditure</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Rules</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.rulesCount}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Automated Thresholds</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'suggestions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Replenishment Suggestions ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'rules'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Configured Reorder Rules ({rules.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Analyzing inventory levels and reorder rules..." />
        </div>
      ) : activeTab === 'suggestions' ? (
        suggestions.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="All Stock Levels Are Healthy"
            description="No SKUs are currently at or below their reorder points. Your inventory is safely stocked!"
          />
        ) : (
          <div className="space-y-6">
            {groupedSuggestions.map((group, gIdx) => {
              const groupTotal = group.items.reduce((acc, i) => acc + i.estimatedTotalCost, 0);

              return (
                <Card key={gIdx} className="border-slate-200 overflow-hidden bg-white shadow-sm">
                  {/* Group Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{group.supplierName}</h3>
                        <p className="text-xs text-slate-500">
                          {group.items.length} low-stock item(s) • Total Estimated: {formatCurrency(groupTotal)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={ShoppingCart}
                      onClick={() => navigate('/inventory/purchases/new')}
                    >
                      Generate Purchase Order
                    </Button>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Product SKU</th>
                          <th className="py-3 px-4">Current Stock</th>
                          <th className="py-3 px-4">Reorder Point</th>
                          <th className="py-3 px-4 text-center">Suggested Qty</th>
                          <th className="py-3 px-4 text-right">Unit Cost</th>
                          <th className="py-3 px-4 text-right">Total Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map(it => (
                          <tr key={it.productId} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{it.productName}</span>
                              <span className="font-mono text-[11px] text-slate-400">{it.sku}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-rose-600">
                              {it.currentStock} units
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600">
                              {it.reorderPoint} units
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-primary-50 text-primary-700 font-bold px-2.5 py-1 rounded-md border border-primary-200">
                                +{it.suggestedQuantity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {formatCurrency(it.estimatedUnitCost)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {formatCurrency(it.estimatedTotalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Rules Tab */
        <Card className="border-slate-200 overflow-hidden">
          {rules.length === 0 ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="No Reorder Rules Configured"
              description="Define minimum safety stock and reorder trigger points for your high-velocity catalog items."
              actionLabel={canManage ? 'Set First Rule' : undefined}
              onAction={openCreateRule}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Min Stock (Buffer)</th>
                    <th className="py-3 px-4">Reorder Trigger Point</th>
                    <th className="py-3 px-4">Suggested Restock Qty</th>
                    <th className="py-3 px-4">Preferred Supplier</th>
                    <th className="py-3 px-4 text-center">Auto PO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.productName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {r.minStock} units
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {r.reorderPoint} units
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {r.reorderQuantity} units
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {r.preferredSupplierName || 'Any Wholesaler'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={r.autoGeneratePO ? 'success' : 'neutral'}>
                          {r.autoGeneratePO ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Configure Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Configure Product Reorder Rule"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <Select
            label="Product Item *"
            value={ruleFormData.productId}
            onChange={(e) => setRuleFormData({ ...ruleFormData, productId: e.target.value })}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Safety Min Stock *"
              type="number"
              min="0"
              value={ruleFormData.minStock}
              onChange={(e) => setRuleFormData({ ...ruleFormData, minStock: parseInt(e.target.value) || 0 })}
              required
            />

            <Input
              label="Reorder Trigger *"
              type="number"
              min="1"
              value={ruleFormData.reorderPoint}
              onChange={(e) => setRuleFormData({ ...ruleFormData, reorderPoint: parseInt(e.target.value) || 1 })}
              required
            />

            <Input
              label="Restock Quantity *"
              type="number"
              min="1"
              value={ruleFormData.reorderQuantity}
              onChange={(e) => setRuleFormData({ ...ruleFormData, reorderQuantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <Select
            label="Preferred Replenishment Supplier"
            value={ruleFormData.preferredSupplierId}
            onChange={(e) => setRuleFormData({ ...ruleFormData, preferredSupplierId: e.target.value })}
            options={[
              { value: '', label: 'Select Preferred Supplier (Optional)' },
              ...suppliers.map(s => ({ value: s.id, label: s.companyName || s.name }))
            ]}
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ruleFormData.autoGeneratePO}
                onChange={(e) => setRuleFormData({ ...ruleFormData, autoGeneratePO: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Include in 1-Click Purchase Order Generation
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Reorder Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
