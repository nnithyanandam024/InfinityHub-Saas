import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { Product } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { getStockStatus } from '@infinityhub/ui';
import { Layers, Search, Sliders, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { StockAdjustModal } from './StockAdjustModal';

export const StockPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const initialFilter = (searchParams.get('filter') as 'all' | 'normal' | 'low' | 'out') || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'low' | 'out'>(initialFilter);

  const loadStock = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const data = await productService.getProducts(tenant.id);
      setProducts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [tenant?.id]);

  const counts = useMemo(() => {
    const normal = products.filter(p => p.stockQuantity > p.minimumStock).length;
    const low = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length;
    const out = products.filter(p => p.stockQuantity <= 0).length;
    return { all: products.length, normal, low, out };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'normal') return p.stockQuantity > p.minimumStock;
      if (activeTab === 'low') return p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;
      if (activeTab === 'out') return p.stockQuantity <= 0;
      return true;
    });
  }, [products, searchQuery, activeTab]);

  if (isLoading) return <LoadingSpinner text="Loading stock counts..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Stock Levels & Inventory Health
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Monitor safety reorder buffers, depleted lines, and execute instant physical count adjustments.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchParams({});
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items ({counts.all})
          </button>

          <button
            onClick={() => {
              setActiveTab('normal');
              setSearchParams({ filter: 'normal' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'normal'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Normal ({counts.normal})
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('low');
              setSearchParams({ filter: 'low' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'low'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Low Stock ({counts.low})
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('out');
              setSearchParams({ filter: 'out' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'out'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Out of Stock ({counts.out})
            </span>
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            icon={Search}
            placeholder="Search stock..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stock Table */}
      <Card>
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No matching stock records"
            description="All products in this filter category have been resolved."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Safety Minimum</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const stockStatus = getStockStatus(p.stockQuantity, p.minimumStock);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.categoryName}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900">
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stockStatus.badgeClass}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasPermission('inventory.stock.adjust') ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            icon={Sliders}
                            onClick={() => setAdjustingProduct(p)}
                          >
                            Adjust Stock
                          </Button>
                        ) : (
                          <span className="text-slate-400 italic">Restricted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stock Adjust Modal */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            setAdjustingProduct(null);
            loadStock();
          }}
        />
      )}
    </div>
  );
};
