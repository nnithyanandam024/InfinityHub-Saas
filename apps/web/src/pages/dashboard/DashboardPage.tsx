import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { stockService } from '../../services/stockService';
import { Product, StockMovement, Supplier } from '@infinityhub/types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '@infinityhub/ui';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  Truck,
  IndianRupee,
  Plus,
  ShoppingCart,
  Sliders,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StockAdjustModal } from '../inventory/StockAdjustModal';

export const DashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected product for quick stock adjustment
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const loadDashboardData = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const [prods, sups, movs] = await Promise.all([
        productService.getProducts(tenant.id),
        supplierService.getSuppliers(tenant.id),
        stockService.getStockMovements(tenant.id)
      ]);
      setProducts(prods);
      setSuppliers(sups);
      setMovements(movs.slice(0, 6));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [tenant?.id]);

  if (isLoading) {
    return <LoadingSpinner text="Loading business dashboard..." />;
  }

  // Calculated metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock);
  const outOfStockProducts = products.filter(p => p.stockQuantity <= 0);
  const totalValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{tenant?.name}</h2>
            <Badge variant="primary" size="sm">
              {tenant?.planName} Plan
            </Badge>
          </div>
          <p className="text-xs text-[#64748B]">
            Real-time stock levels, replenishment priorities, and store health.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('inventory.purchases.create') && (
            <Link to="/inventory/purchases/new">
              <Button size="sm" variant="outline" icon={ShoppingCart}>
                New Purchase
              </Button>
            </Link>
          )}

          {hasPermission('inventory.products.create') && (
            <Link to="/inventory/products/new">
              <Button size="sm" icon={Plus}>
                Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtext="Active SKU Catalog"
          icon={Boxes}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => navigate('/inventory/products')}
        />

        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          subtext="Below safety buffer"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => navigate('/inventory/stock?filter=low')}
        />

        <StatCard
          title="Out of Stock"
          value={outOfStockProducts.length}
          subtext="Requires restocking"
          icon={XCircle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          onClick={() => navigate('/inventory/stock?filter=out')}
        />

        <StatCard
          title="Inventory Valuation"
          value={formatCurrency(totalValuation, currencySymbol)}
          subtext={`${suppliers.length} Active Suppliers`}
          icon={IndianRupee}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => navigate('/inventory/reports')}
        />
      </div>

      {/* Two-Column Section: Low Stock Priorities & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Priority Table (7 columns) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Urgent Stock Attention
                </CardTitle>
                <CardDescription>Items at or below safety reorder threshold</CardDescription>
              </div>
              <Link to="/inventory/stock?filter=low" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-x-auto">
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  All items are currently sufficiently stocked!
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-center">Current</th>
                      <th className="py-3 px-4 text-center">Minimum</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...outOfStockProducts, ...lowStockProducts].slice(0, 5).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#0F172A]">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-400">SKU: {item.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {item.stockQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {item.minimumStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.stockQuantity === 0 ? (
                            <Badge variant="danger" size="sm">Out</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Low</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasPermission('inventory.stock.adjust') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => setAdjustingProduct(item)}
                            >
                              Adjust
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Stock Movements (5 columns) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Recent Stock Movements
                </CardTitle>
                <CardDescription>Latest inventory transactions and adjustments</CardDescription>
              </div>
              <Link to="/inventory/reports" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Audit Log <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>

            <CardContent className="p-4 flex-1">
              {movements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No recent stock movements recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map(mov => (
                    <div
                      key={mov.id}
                      className="flex items-start justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-slate-900">{mov.productName}</span>
                        <span className="text-[11px] text-slate-500">
                          {mov.reason || mov.type.replace('_', ' ')} · {mov.performedByUserName}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(mov.createdAt)}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            mov.quantityChange > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Stock: {mov.previousStock} → {mov.newStock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal if triggered */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            setAdjustingProduct(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
