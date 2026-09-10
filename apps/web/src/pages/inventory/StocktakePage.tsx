import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { stocktakeService } from '../../services/stocktakeService';
import { warehouseService } from '../../services/warehouseService';
import { StocktakeSession, Warehouse } from '@infinityhub/types';
import { formatCurrency } from '@infinityhub/ui';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const StocktakePage: React.FC = () => {
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active session being counted or inspected
  const [activeSession, setActiveSession] = useState<StocktakeSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Session Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    notes: 'Periodic cycle count and physical inventory audit'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const loadData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const [sList, whList] = await Promise.all([
        stocktakeService.getSessions(currentTenant.id),
        warehouseService.getWarehouses(currentTenant.id)
      ]);
      setSessions(sList);
      setWarehouses(whList);

      if (sList.length > 0 && !activeSession) {
        // Automatically open the first in-progress session if any
        const inProg = sList.find(s => s.status === 'in_progress') || sList[0];
        setActiveSession(inProg);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load stocktake sessions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const openNewSessionModal = () => {
    setFormData({
      warehouseId: warehouses[0]?.id || '',
      notes: 'Scheduled periodic cycle count'
    });
    setIsModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !user) return;

    setIsSubmitting(true);
    try {
      const newSession = await stocktakeService.createSession(
        currentTenant.id,
        formData.warehouseId,
        formData.notes,
        user.id,
        user.name
      );
      showToast(`Stocktake session ${newSession.sessionNumber} started`, 'success');
      setIsModalOpen(false);
      await loadData();
      setActiveSession(newSession);
    } catch (err: any) {
      showToast(err.message || 'Error starting stocktake', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountChange = async (productId: string, newCountStr: string) => {
    if (!currentTenant || !activeSession || activeSession.status !== 'in_progress') return;
    const newCount = Math.max(0, parseInt(newCountStr) || 0);

    // Optimistic UI update
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(it => {
          if (it.productId === productId) {
            return {
              ...it,
              countedQuantity: newCount,
              variance: newCount - it.systemQuantity
            };
          }
          return it;
        })
      };
    });

    try {
      await stocktakeService.updateItemCount(currentTenant.id, activeSession.id, productId, newCount);
    } catch (err: any) {
      showToast('Failed to save count', 'error');
    }
  };

  const handleReconcile = async () => {
    if (!currentTenant || !user || !activeSession) return;
    const hasVariance = activeSession.items.some(i => i.variance !== 0);
    const msg = hasVariance
      ? `Reconciliation will automatically commit corrective ledger entries for ${activeSession.items.filter(i => i.variance !== 0).length} items with variances. Continue?`
      : 'All physical counts match system balances perfectly! Finalize audit?';

    if (!window.confirm(msg)) return;

    try {
      const reconciled = await stocktakeService.reconcileSession(
        currentTenant.id,
        activeSession.id,
        user.id,
        user.name
      );
      showToast(`Audit ${reconciled.sessionNumber} successfully reconciled to stock ledger!`, 'success');
      await loadData();
      setActiveSession(reconciled);
    } catch (err: any) {
      showToast(err.message || 'Failed to reconcile audit', 'error');
    }
  };

  const handleCancelSession = async () => {
    if (!currentTenant || !activeSession) return;
    if (!window.confirm('Cancel this stocktake audit session? No adjustments will be made.')) return;

    try {
      const cancelled = await stocktakeService.cancelSession(currentTenant.id, activeSession.id);
      showToast('Stocktake audit cancelled', 'info');
      await loadData();
      setActiveSession(cancelled);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel session', 'error');
    }
  };

  // Filtered items in active session
  const displayedItems = useMemo(() => {
    if (!activeSession) return [];
    if (!searchQuery.trim()) return activeSession.items;
    const q = searchQuery.toLowerCase();
    return activeSession.items.filter(i =>
      i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
    );
  }, [activeSession, searchQuery]);

  const sessionMetrics = useMemo(() => {
    if (!activeSession) return { totalVarianceUnits: 0, varianceValue: 0, discrepancyCount: 0 };
    let totalVarianceUnits = 0;
    let varianceValue = 0;
    let discrepancyCount = 0;

    for (const item of activeSession.items) {
      if (item.variance !== 0) {
        discrepancyCount++;
        totalVarianceUnits += item.variance;
        varianceValue += item.variance * item.unitCost;
      }
    }

    return { totalVarianceUnits, varianceValue, discrepancyCount };
  }, [activeSession]);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      inProgress: sessions.filter(s => s.status === 'in_progress').length,
      reconciled: sessions.filter(s => s.status === 'reconciled').length
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-primary-600" />
            Stocktake & Physical Cycle Counting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct periodic physical stock audits, record counted quantities, and reconcile variances.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openNewSessionModal}
          >
            Start New Audit Session
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Audits</span>
            <ClipboardCheck className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Historical Count Logs</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.inProgress}</p>
          <span className="text-xs text-amber-600 font-medium mt-0.5 inline-block">Active Counting Sheets</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reconciled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.reconciled}</p>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 inline-block">Committed to Ledger</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Variance Valuation</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(sessionMetrics.varianceValue)}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-0.5 inline-block">Current Active Discrepancy</span>
        </Card>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Loading audit sessions..." />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Stocktake Audits Yet"
          description="Start a physical cycle count to audit warehouse on-hand quantities against the digital ledger."
          actionLabel={canManage ? 'Start First Audit' : undefined}
          onAction={openNewSessionModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sessions List (Left Column) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Audit Sessions ({sessions.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {sessions.map(s => {
                const isSelected = activeSession?.id === s.id;
                const varianceCount = s.items.filter(i => i.variance !== 0).length;

                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/50 border-primary-500 shadow-sm ring-1 ring-primary-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {s.sessionNumber}
                      </span>
                      {s.status === 'in_progress' ? (
                        <Badge variant="warning">Counting In-Progress</Badge>
                      ) : s.status === 'reconciled' ? (
                        <Badge variant="success">Reconciled</Badge>
                      ) : (
                        <Badge variant="neutral">Cancelled</Badge>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.warehouseName}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{s.items.length} SKUs counted</span>
                      {varianceCount > 0 ? (
                        <span className="text-rose-600 font-semibold">{varianceCount} variances</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">100% matched</span>
                      )}
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      Initiated by {s.initiatedByUserName} on {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Counting Worksheet (Right Column) */}
          <div className="lg:col-span-8 space-y-4">
            {activeSession ? (
              <Card className="border-slate-200 overflow-hidden bg-white">
                {/* Worksheet Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                        {activeSession.sessionNumber}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{activeSession.warehouseName}</h2>
                      {activeSession.status === 'in_progress' ? (
                        <Badge variant="warning">In Progress</Badge>
                      ) : activeSession.status === 'reconciled' ? (
                        <Badge variant="success">Reconciled Audit</Badge>
                      ) : (
                        <Badge variant="neutral">Cancelled</Badge>
                      )}
                    </div>
                    {activeSession.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic">{activeSession.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && activeSession.status === 'in_progress' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSession}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ShieldCheck}
                        onClick={handleReconcile}
                      >
                        Reconcile Audit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Search in Worksheet */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search SKU in count sheet..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Showing {displayedItems.length} of {activeSession.items.length} SKUs
                  </div>
                </div>

                {/* Counting Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4 text-right">System Expected</th>
                        <th className="py-3 px-4 text-center">Physical Count</th>
                        <th className="py-3 px-4 text-right">Variance</th>
                        <th className="py-3 px-4 text-right">Impact Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedItems.map(item => {
                        const varianceValue = item.variance * item.unitCost;
                        const isMatched = item.variance === 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {item.sku}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {item.systemQuantity}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {activeSession.status === 'in_progress' ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={item.countedQuantity}
                                  onChange={(e) => handleCountChange(item.productId, e.target.value)}
                                  className="w-20 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{item.countedQuantity}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isMatched ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  0
                                </span>
                              ) : item.variance > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                  +{item.variance}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  {item.variance}
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 text-right font-semibold ${
                              isMatched ? 'text-slate-400' : item.variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {formatCurrency(varianceValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                Select an audit session on the left or create a new session to begin cycle counting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start Stocktake Audit Session"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Select
            label="Select Warehouse Facility to Audit *"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))}
            required
          />

          <Input
            label="Audit Notes / Objective"
            placeholder="e.g. End of month physical inventory reconciliation"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>Audit Mechanism:</strong> The system will capture a live snapshot of all registered product stock levels for this facility into a counting sheet. Your team can record actual counted units on-the-spot.
          </p>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Start Audit Sheet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
