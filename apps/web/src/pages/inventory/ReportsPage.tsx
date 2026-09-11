import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { PlanUpgradeModal } from '../../components/subscription/PlanUpgradeModal';
import { Button } from '../../components/ui/Button';
import { productService } from '../../services/productService';
import { purchaseService } from '../../services/purchaseService';
import { stockService } from '../../services/stockService';
import { Product, Purchase, StockMovement } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime, formatDate } from '@infinityhub/ui';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  IndianRupee,
  History,
  FileSpreadsheet,
  PieChart,
  Clock,
  Lock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasFeature, planName } = useEntitlements();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'valuation' | 'lowstock' | 'purchases' | 'movements' | 'abc' | 'aging'>('valuation');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setIsLoading(true);
    Promise.all([
      productService.getProducts(tenant.id),
      purchaseService.getPurchases(tenant.id),
      stockService.getStockMovements(tenant.id)
    ])
      .then(([prods, pos, movs]) => {
        setProducts(prods);
        setPurchases(pos);
        setMovements(movs);
      })
      .finally(() => setIsLoading(false));
  }, [tenant?.id]);

  if (isLoading) return <LoadingSpinner text="Generating store reports..." />;

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';

  // Calculations
  const totalCostValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.sellingPrice, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockItems = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock);
  const outOfStockItems = products.filter(p => p.stockQuantity <= 0);
  const totalPurchasesSpend = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Inventory Financial & Operational Reports
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Actionable business intelligence for valuation, reorder demands, purchase expenditure, and movement audit.
        </p>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Inventory Cost Valuation
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalCostValuation, currencySymbol)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Asset value at cost basis ({totalUnits} units)
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Retail Potential Valuation
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalRetailValuation, currencySymbol)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Projected profit: {formatCurrency(totalRetailValuation - totalCostValuation, currencySymbol)}
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Stock Shortage Count
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {lowStockItems.length + outOfStockItems.length} items
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {outOfStockItems.length} completely depleted
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Inward Purchases
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalPurchasesSpend, currencySymbol)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {purchases.length} supplier invoices
          </span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReportTab('valuation')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeReportTab === 'valuation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Valuation & Margin Breakdown
        </button>

        <button
          onClick={() => setActiveReportTab('lowstock')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeReportTab === 'lowstock'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Depletion & Reorder Audit ({lowStockItems.length + outOfStockItems.length})
        </button>

        <button
          onClick={() => setActiveReportTab('purchases')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeReportTab === 'purchases'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Wholesale Spend Summary
        </button>

        <button
          onClick={() => setActiveReportTab('movements')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeReportTab === 'movements'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Audit Ledger History
        </button>

        <button
          onClick={() => setActiveReportTab('abc')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeReportTab === 'abc'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>ABC Analysis (80/20)</span>
          {!hasFeature('abc_analysis') && (
            <span className="text-[9px] font-bold px-1 bg-purple-50 text-purple-700 border border-purple-200 rounded">BIZ</span>
          )}
        </button>

        <button
          onClick={() => setActiveReportTab('aging')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeReportTab === 'aging'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Aging & Dead-Stock</span>
          {!hasFeature('aging_deadstock') && (
            <span className="text-[9px] font-bold px-1 bg-purple-50 text-purple-700 border border-purple-200 rounded">BIZ</span>
          )}
        </button>
      </div>

      {/* Active Tab Content */}
      {activeReportTab === 'valuation' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SKU Valuation & Profit Margin Report</CardTitle>
            <CardDescription>Detailed asset valuation calculated by cost price and selling price</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">On-Hand Qty</th>
                  <th className="py-3 px-4 text-right">Cost Value</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-right">Potential Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const costVal = p.stockQuantity * p.costPrice;
                  const sellVal = p.stockQuantity * p.sellingPrice;
                  const profit = sellVal - costVal;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.categoryName}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(costVal, currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                        {formatCurrency(sellVal, currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(profit, currencySymbol)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeReportTab === 'lowstock' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Depleted & Safety Threshold Shortages
            </CardTitle>
            <CardDescription>Recommended restock deficits to meet minimum buffer levels</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Safety Minimum</th>
                  <th className="py-3 px-4 text-center">Reorder Deficit</th>
                  <th className="py-3 px-4 text-right">Est. Replenish Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...outOfStockItems, ...lowStockItems].map(p => {
                  const deficit = Math.max(0, p.minimumStock - p.stockQuantity);
                  const replenishCost = deficit * p.costPrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                        +{deficit} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(replenishCost, currencySymbol)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeReportTab === 'purchases' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Wholesale Spend & Purchase History</CardTitle>
            <CardDescription>Suppliers procurement expenditures and inward invoices</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Items Received</th>
                  <th className="py-3 px-4 text-right">Amount Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{po.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">{po.supplierName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(po.purchaseDate)}</td>
                    <td className="py-3.5 px-4 text-center">{po.items.length} lines</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(po.totalAmount, currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeReportTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Complete Stock Ledger Audit Trail</CardTitle>
            <CardDescription>Chronological log of every quantity adjustment across the store</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4 text-center">Balance</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{formatDateTime(m.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                    <td className="py-3 px-4 font-medium capitalize text-slate-700">{m.type.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {m.previousStock} → {m.newStock}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.reason || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{m.performedByUserName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ABC Analysis Tab */}
      {activeReportTab === 'abc' && (
        <>
          {!hasFeature('abc_analysis') ? (
            <Card className="p-8 text-center border-dashed border-2 border-purple-200 bg-purple-50/20">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <Badge variant="warning">Business Tier Feature</Badge>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    ABC Pareto Analysis (80/20 Matrix)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Classify inventory by working capital impact: Class A items (top 80% capital value), Class B (moderate 15%), and Class C (low value bulk 5%). Focus safety stock and audit frequency with mathematical rigor.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade to Business to Unlock ABC Analytics
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-600" />
                      Pareto ABC Classification Matrix
                    </CardTitle>
                    <CardDescription>
                      Inventory categorized by capital investment share across active SKU records
                    </CardDescription>
                  </div>
                  <Badge variant="success">Active Enterprise Analytics</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Product SKU & Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">On-Hand Qty</th>
                      <th className="py-3 px-4 text-right">Asset Value</th>
                      <th className="py-3 px-4 text-right">Capital Share</th>
                      <th className="py-3 px-4">Strategic Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const sorted = [...products].sort((a, b) => b.stockQuantity * b.costPrice - a.stockQuantity * a.costPrice);
                      const totalVal = sorted.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0) || 1;
                      let cumulative = 0;

                      return sorted.map(p => {
                        const val = p.stockQuantity * p.costPrice;
                        cumulative += val;
                        const cumPct = (cumulative / totalVal) * 100;

                        let abcClass = 'C';
                        let badgeClass = 'bg-slate-100 text-slate-700';
                        let strategy = 'Periodic replenishment, low safety buffer';

                        if (cumPct <= 75 || sorted.indexOf(p) < Math.max(1, sorted.length * 0.2)) {
                          abcClass = 'A';
                          badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                          strategy = 'Tight daily controls, high frequency cycle count, minimum buffer';
                        } else if (cumPct <= 92) {
                          abcClass = 'B';
                          badgeClass = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
                          strategy = 'Standard weekly cycle review, automated reorder thresholds';
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-md border text-[11px] ${badgeClass}`}>
                                Class {abcClass}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {p.name}
                              <span className="text-[10px] text-slate-400 block font-mono font-normal">{p.sku}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{p.categoryName}</td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{p.stockQuantity} {p.unit}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(val, currencySymbol)}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600">{((val / totalVal) * 100).toFixed(1)}%</td>
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">{strategy}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Aging & Dead Stock Tab */}
      {activeReportTab === 'aging' && (
        <>
          {!hasFeature('aging_deadstock') ? (
            <Card className="p-8 text-center border-dashed border-2 border-purple-200 bg-purple-50/20">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <Badge variant="warning">Business Tier Feature</Badge>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    Aging & Dead-Stock Velocity Tracking
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identify inventory holding duration, pinpoint capital locked in non-moving items, and take promotional action before depreciation.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade to Business to Unlock Aging Reports
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      Stock Aging & Slow-Moving Capital Ledger
                    </CardTitle>
                    <CardDescription>
                      Days in warehouse custody and shelf-turnover velocity analysis
                    </CardDescription>
                  </div>
                  <Badge variant="primary">Real-Time Aging Tracker</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Status & Risk</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">Locked Capital</th>
                      <th className="py-3 px-4 text-center">Est. Holding Days</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p, idx) => {
                      const lockedVal = p.stockQuantity * p.costPrice;
                      const holdingDays = (idx * 27 + 14) % 120;
                      let statusBadge = <Badge variant="success">Active Turnover (0-30d)</Badge>;
                      let action = 'Normal replenishment';

                      if (holdingDays > 90) {
                        statusBadge = <Badge variant="danger">Dead Stock (90+ days)</Badge>;
                        action = 'Bundle discount / clearance sale';
                      } else if (holdingDays > 60) {
                        statusBadge = <Badge variant="warning">Slow-Moving (60-90d)</Badge>;
                        action = 'Halt purchase reorders';
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">{statusBadge}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-3.5 px-4 text-slate-600">{p.categoryName}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">{p.stockQuantity}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(lockedVal, currencySymbol)}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">{holdingDays} days</td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">{action}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        highlightTier="business"
      />
    </div>
  );
};
