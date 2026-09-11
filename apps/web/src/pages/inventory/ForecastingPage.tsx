import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { forecastingService } from '../../services/forecastingService';
import { ForecastingReport, DemandTrend, DeadStockItem } from '@infinityhub/types';
import { formatCurrency } from '@infinityhub/ui';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Coins,
  Package,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Search,
  ShoppingCart
} from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant: currentTenant } = useTenant();
  const { showToast } = useToast();

  const [report, setReport] = useState<ForecastingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const rep = await forecastingService.getForecastingReport(currentTenant.id);
      setReport(rep);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate forecasting intelligence', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const filteredDemand = useMemo(() => {
    if (!report) return [];
    return report.demandVelocity.filter(d => {
      const matchesSearch =
        d.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === 'ALL' || d.stockoutRiskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [report, searchQuery, riskFilter]);

  const getRiskBadge = (level: DemandTrend['stockoutRiskLevel']) => {
    switch (level) {
      case 'critical':
        return <Badge variant="danger"><AlertTriangle className="w-3 h-3 mr-1" /> Stockout Risk (&le;5d)</Badge>;
      case 'moderate':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Moderate (&le;15d)</Badge>;
      default:
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Healthy Supply</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-primary-600" />
            Demand Forecasting & Inventory Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Predict stock run-out horizons, assess daily burn velocities, and eliminate dead working capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={loadData}
          >
            Re-calculate Forecasts
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ShoppingCart}
            onClick={() => navigate('/inventory/reorder')}
          >
            View Reorder Plan
          </Button>
        </div>
      </div>

      {isLoading || !report ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Computing algorithmic demand velocities and aging models..." />
        </div>
      ) : (
        <>
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tracked SKUs</span>
                <Package className="w-4 h-4 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{report.summary.totalSkus}</p>
              <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Active Ingestion</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stockout Hazards</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-2">{report.summary.stockoutRiskCount}</p>
              <span className="text-xs text-rose-600 font-medium mt-0.5 inline-block">Runout within &le;5 days</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dead Stock Items</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">{report.summary.deadStockCount}</p>
              <span className="text-xs text-amber-600 font-medium mt-0.5 inline-block">No sales in &gt;15 days</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trapped Capital</span>
                <Coins className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-700 mt-2">
                {formatCurrency(report.summary.totalCapitalLocked)}
              </p>
              <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Locked Working Capital</span>
            </Card>
          </div>

          {/* Section 1: Demand Velocity & Run-out Radar */}
          <Card className="border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  Run-Out Radar & Burn Velocity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluates sales trajectory over the last 30 days to project remaining runway.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter product..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <Select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Risk Levels' },
                    { value: 'critical', label: 'Critical Risk (≤5d)' },
                    { value: 'moderate', label: 'Moderate Risk (≤15d)' },
                    { value: 'healthy', label: 'Healthy Supply' }
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-right">30-Day Velocity</th>
                    <th className="py-3 px-4 text-right">Daily Burn Rate</th>
                    <th className="py-3 px-4 text-right">Runway Supply</th>
                    <th className="py-3 px-4 text-center">Stockout Threat</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDemand.map(d => (
                    <tr key={d.productId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{d.productName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{d.sku}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {d.unitsSoldLast30Days} units
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {d.dailyVelocity} / day
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {d.daysOfSupplyRemaining > 90 ? '90+ days' : `${d.daysOfSupplyRemaining} days`}
                      </td>
                      <td className="py-3 px-4 text-center">{getRiskBadge(d.stockoutRiskLevel)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/inventory/reorder')}
                        >
                          Reorder
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 2: Dead Working Capital Radar */}
          <Card className="border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  Dead Capital & Stagnant Inventory Radar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items holding cash that have had zero outward sales movements in the last 15+ days.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                {report.deadStock.length} SKUs Identified
              </span>
            </div>

            {report.deadStock.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Zero dead stock detected. Inventory turnover is optimal across all SKUs!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Stagnant Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-right">Units Trapped</th>
                      <th className="py-3 px-4 text-right">Unit Cost</th>
                      <th className="py-3 px-4 text-right">Capital Trapped</th>
                      <th className="py-3 px-4 text-right">Days Dormant</th>
                      <th className="py-3 px-4">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.deadStock.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {item.stockQuantity} units
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {formatCurrency(item.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          {formatCurrency(item.capitalLocked)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700 font-medium">
                          {item.daysWithoutMovement} days
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] bg-primary-50 text-primary-800 font-semibold px-2 py-0.5 rounded border border-primary-200">
                            Bundle Kit or 15% Clearance
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
