import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { restaurantService } from '../../services/restaurantService';
import type {
  RestaurantSection,
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantKot,
  RestaurantOrder,
  TableStatus
} from '@infinityhub/types';
import {
  UtensilsCrossed,
  Users,
  Clock,
  Flame,
  CreditCard,
  Printer,
  Sparkles,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  LayoutGrid,
  Square,
  Circle,
  RectangleHorizontal,
  Search,
  Check,
  ChefHat
} from 'lucide-react';
import { SeatTableModal } from './components/SeatTableModal';
import { CaptainOrderPadModal } from './components/CaptainOrderPadModal';
import { TableSettlementModal } from './components/TableSettlementModal';
import { TableTransferModal } from './components/TableTransferModal';

export const RestaurantTablesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { hasFeature } = useEntitlements();

  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [kots, setKots] = useState<RestaurantKot[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Display Mode: 'spatial' (Visual Floor Layout) or 'grid' (Compact Operation Cards)
  const [viewMode, setViewMode] = useState<'spatial' | 'grid'>('spatial');

  // Filters
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [seatingTable, setSeatingTable] = useState<RestaurantTable | null>(null);
  const [orderingTable, setOrderingTable] = useState<RestaurantTable | null>(null);
  const [settlingTable, setSettlingTable] = useState<RestaurantTable | null>(null);
  const [transferringTable, setTransferringTable] = useState<RestaurantTable | null>(null);

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadData = async () => {
    try {
      const [secData, tblData, menuData, kotData, ordData] = await Promise.all([
        restaurantService.getSections(tenantId),
        restaurantService.getTables(tenantId),
        restaurantService.getMenuItems(tenantId),
        restaurantService.getKots(tenantId),
        restaurantService.getOrders(tenantId)
      ]);
      setSections(secData.sort((a, b) => a.sortOrder - b.sortOrder));
      setTables(tblData);
      setMenuItems(menuData);
      setKots(kotData);
      setOrders(ordData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load restaurant floor plan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // 8s auto-refresh
    return () => clearInterval(interval);
  }, [tenantId]);

  // Seating Handler
  const handleSeatTable = async (tableId: string, guestCount: number, captainName: string) => {
    try {
      await restaurantService.seatTable(tenantId, tableId, guestCount, captainName);
      showToast(`Table successfully seated with ${guestCount} guests`, 'success');
      await loadData();
      const updated = tables.find(t => t.id === tableId);
      if (updated) {
        setOrderingTable({ ...updated, status: 'seated', guestCount, assignedCaptain: captainName });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to seat table', 'error');
    }
  };

  // Fire KOT Handler
  const handleFireKot = async (tableId: string, items: any[], captainName: string) => {
    try {
      const { kot } = await restaurantService.fireKot(tenantId, tableId, items, captainName);
      showToast(`${kot.kotNumber} fired to kitchen successfully!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to fire KOT', 'error');
    }
  };

  // Void Item Handler
  const handleVoidItem = async (kotId: string, itemId: string, reason: string, managerPin: string) => {
    try {
      const { wasteLog } = await restaurantService.voidKotItem(tenantId, kotId, itemId, reason, managerPin);
      showToast(`Item void authorized by ${wasteLog.authorizedBy}. Logged in waste register.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Void authorization failed', 'error');
      throw err;
    }
  };

  // Transfer Table Handler
  const handleTransferTable = async (sourceId: string, targetId: string, reason: string, managerPin: string) => {
    try {
      const audit = await restaurantService.transferTable(tenantId, sourceId, targetId, reason, managerPin);
      showToast(`Transferred Table ${audit.sourceTable} to Table ${audit.targetTable}`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Transfer failed', 'error');
      throw err;
    }
  };

  // Print Guest Check
  const handlePrintCheck = async (table: RestaurantTable) => {
    try {
      const { order, isDuplicate, printCount } = await restaurantService.printGuestCheck(tenantId, table.id);
      if (isDuplicate) {
        showToast(`Printed duplicate check (#${printCount}) for Table ${table.tableNumber}. Logged in audit.`, 'info');
      } else {
        showToast(`Guest check printed for Table ${table.tableNumber}`, 'success');
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to print check', 'error');
    }
  };

  // Settle Bill
  const handleSettleBill = async (payload: any) => {
    if (!settlingTable) return;
    try {
      const { order } = await restaurantService.settleTableBill(tenantId, settlingTable.id, payload);
      showToast(`Order #${order.orderNumber} settled (₹${order.grandTotal}). Raw ingredients deducted from inventory!`, 'success');
      setSettlingTable(null);
      setOrderingTable(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to settle bill', 'error');
    }
  };

  // Reset Cleaning Table to Vacant
  const handleResetCleaning = async (tableId: string) => {
    try {
      await restaurantService.resetTableToVacant(tenantId, tableId);
      showToast('Table reset to Vacant and ready for seating', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset table', 'error');
    }
  };

  // KPIs
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status !== 'vacant' && t.status !== 'cleaning').length;
  const occupancyPercentage = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
  const activeCovers = tables.reduce((sum, t) => sum + (t.guestCount || 0), 0);
  const openKotsCount = kots.filter(k => k.status === 'fired' || k.status === 'preparing').length;
  const runningTableRevenue = tables.reduce((sum, t) => sum + (t.currentBillTotal || 0), 0);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (activeSectionId !== 'all' && t.sectionId !== activeSectionId) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = t.tableNumber.toLowerCase().includes(q);
        const matchesCaptain = t.assignedCaptain?.toLowerCase().includes(q) || false;
        if (!matchesNumber && !matchesCaptain) return false;
      }
      return true;
    });
  }, [tables, activeSectionId, statusFilter, searchQuery]);

  // Helper to compute dwell time
  const getDwellInfo = (table: RestaurantTable) => {
    if (!table.seatedAt) return null;
    const elapsedMinutes = Math.floor((Date.now() - new Date(table.seatedAt).getTime()) / (60 * 1000));
    return {
      minutes: elapsedMinutes,
      isWarning: elapsedMinutes >= 45 && elapsedMinutes < 75,
      isAlert: elapsedMinutes >= 75
    };
  };

  // Primary action click handler for spatial table view
  const handleTablePrimaryAction = (table: RestaurantTable) => {
    switch (table.status) {
      case 'vacant':
        setSeatingTable(table);
        break;
      case 'seated':
      case 'ordered':
      case 'served':
        setOrderingTable(table);
        break;
      case 'billed':
        setSettlingTable(table);
        break;
      case 'cleaning':
        handleResetCleaning(table.id);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-xs font-semibold">Loading Dining Floor Plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry KPIs */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[18px] shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A] font-display">
                  {tenant?.name || 'XYZ Gourmet Bistro'} · Floor Plan & Tables
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Floor
                </span>
                {!hasFeature('restaurant_kds') ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Starter · Direct Table Billing
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <ChefHat className="w-3 h-3 text-purple-600" />
                    Pro KDS Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time dining room occupancy, table dwell monitoring, and synchronized KOT dispatch
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode('spatial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'spatial'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visual Floor Layout"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                <span>Floor Layout</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid Cards"
              >
                <Square className="w-3.5 h-3.5 text-slate-500" />
                <span>Cards</span>
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh floor state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 font-display">
              {occupancyPercentage}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {occupiedTables} / {totalTables} tables active
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Covers</div>
            <div className="text-xl font-extrabold text-blue-700 mt-1 font-display flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{activeCovers}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Guests currently dining</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open KOTs</div>
            <div className="text-xl font-extrabold text-amber-700 mt-1 font-display flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{openKotsCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cooking in kitchen stations</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Running Revenue</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1 font-display">
              ₹{runningTableRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live active table subtotals</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Turnover Target</div>
            <div className="text-xl font-extrabold text-purple-700 mt-1 font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>45 mins</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ideal party dwell target</div>
          </div>
        </div>
      </div>

      {/* Section Tabs, Quick Status Chips & Search Bar */}
      <div className="space-y-3">
        {/* Row 1: Sections & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#E2E8F0] p-3 rounded-2xl shadow-2xs">
          {/* Sections Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveSectionId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSectionId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Sections ({tables.length})
            </button>
            {sections.map(sec => {
              const secTables = tables.filter(t => t.sectionId === sec.id);
              const occCount = secTables.filter(t => t.status !== 'vacant' && t.status !== 'cleaning').length;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeSectionId === sec.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeSectionId === sec.id
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {occCount}/{secTables.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search table code or server..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Row 2: Status Filter Chips with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Tables', count: tables.length, dot: 'bg-slate-400' },
            { id: 'vacant', label: 'Vacant', count: tables.filter(t => t.status === 'vacant').length, dot: 'bg-emerald-500' },
            { id: 'seated', label: 'Seated', count: tables.filter(t => t.status === 'seated').length, dot: 'bg-blue-500' },
            { id: 'ordered', label: 'Cooking', count: tables.filter(t => t.status === 'ordered').length, dot: 'bg-amber-500' },
            { id: 'served', label: 'Served', count: tables.filter(t => t.status === 'served').length, dot: 'bg-purple-500' },
            { id: 'billed', label: 'Billed', count: tables.filter(t => t.status === 'billed').length, dot: 'bg-yellow-500' },
            { id: 'cleaning', label: 'Cleaning', count: tables.filter(t => t.status === 'cleaning').length, dot: 'bg-slate-400' }
          ].map(st => {
            const isSelected = statusFilter === st.id;

            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-orange-50 border-orange-300 text-orange-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                <span>{st.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-orange-200 text-orange-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW MODE 1: VISUAL SPATIAL FLOOR LAYOUT */}
      {/* ======================================================== */}
      {viewMode === 'spatial' && (
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredTables.map(table => {
              const dwell = getDwellInfo(table);

              // Visual Status Rings & Halos
              let haloStyle = 'border-slate-200 bg-white hover:border-slate-300';
              let badgeColor = 'bg-slate-100 text-slate-700';

              if (table.status === 'vacant') {
                haloStyle = 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 hover:shadow-emerald-500/10 hover:shadow-lg';
                badgeColor = 'bg-emerald-100 text-emerald-800';
              } else if (table.status === 'seated') {
                haloStyle = 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-100 hover:border-blue-500 hover:shadow-blue-500/10 hover:shadow-lg';
                badgeColor = 'bg-blue-100 text-blue-800';
              } else if (table.status === 'ordered') {
                haloStyle = 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-100 hover:border-amber-500 hover:shadow-amber-500/10 hover:shadow-lg';
                badgeColor = 'bg-amber-100 text-amber-900';
              } else if (table.status === 'served') {
                haloStyle = 'border-purple-400 bg-purple-50/30 ring-2 ring-purple-100 hover:border-purple-500 hover:shadow-purple-500/10 hover:shadow-lg';
                badgeColor = 'bg-purple-100 text-purple-900';
              } else if (table.status === 'billed') {
                haloStyle = 'border-yellow-400 bg-yellow-50/30 ring-2 ring-yellow-100 hover:border-yellow-500 hover:shadow-yellow-500/10 hover:shadow-lg';
                badgeColor = 'bg-yellow-100 text-yellow-900';
              } else if (table.status === 'cleaning') {
                haloStyle = 'border-dashed border-slate-300 bg-slate-50/60 hover:border-slate-400';
                badgeColor = 'bg-slate-200 text-slate-700';
              }

              return (
                <div
                  key={table.id}
                  onClick={() => handleTablePrimaryAction(table)}
                  className="group flex flex-col items-center cursor-pointer transition-all"
                >
                  {/* Physical Table Object */}
                  <div className="relative p-2.5 flex items-center justify-center">
                    {/* Table Type: ROUND */}
                    {table.shape === 'round' && (
                      <div className="relative">
                        <div
                          className={`w-24 h-24 rounded-full border-2 ${haloStyle} shadow-xs flex flex-col items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md`}
                        >
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {table.tableNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {table.capacity} seats
                          </span>
                          {table.currentBillTotal ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5">
                              ₹{table.currentBillTotal}
                            </span>
                          ) : null}
                        </div>
                        {/* 4 chair dots around */}
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -top-1 left-1/2 -translate-x-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -bottom-1 left-1/2 -translate-x-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -left-1 -translate-y-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -right-1 -translate-y-1/2 group-hover:bg-orange-400 transition-colors"></span>
                      </div>
                    )}

                    {/* Table Type: RECTANGLE */}
                    {table.shape === 'rectangle' && (
                      <div className="relative">
                        <div
                          className={`w-32 h-20 rounded-2xl border-2 ${haloStyle} shadow-xs flex flex-col items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md`}
                        >
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {table.tableNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {table.capacity} covers
                          </span>
                          {table.currentBillTotal ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5">
                              ₹{table.currentBillTotal}
                            </span>
                          ) : null}
                        </div>
                        {/* Chairs top and bottom */}
                        <div className="flex justify-around w-full absolute -top-1 px-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                        </div>
                        <div className="flex justify-around w-full absolute -bottom-1 px-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors"></span>
                        </div>
                      </div>
                    )}

                    {/* Table Type: SQUARE (Default) */}
                    {(!table.shape || table.shape === 'square') && (
                      <div className="relative">
                        <div
                          className={`w-24 h-24 rounded-2xl border-2 ${haloStyle} shadow-xs flex flex-col items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md`}
                        >
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {table.tableNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {table.capacity} seats
                          </span>
                          {table.currentBillTotal ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5">
                              ₹{table.currentBillTotal}
                            </span>
                          ) : null}
                        </div>
                        {/* 4 chair dots around */}
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -top-1 left-1/2 -translate-x-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -bottom-1 left-1/2 -translate-x-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -left-1 -translate-y-1/2 group-hover:bg-orange-400 transition-colors"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute top-1/2 -right-1 -translate-y-1/2 group-hover:bg-orange-400 transition-colors"></span>
                      </div>
                    )}

                    {/* Status Badge Badge Pill on Top Right */}
                    <span className={`absolute -top-1 -right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase border shadow-2xs ${badgeColor}`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Subtext info */}
                  <div className="text-center mt-1">
                    {table.guestCount ? (
                      <div className="text-[11px] font-bold text-slate-800">
                        {table.guestCount} guests · {table.assignedCaptain || 'Captain'}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        {sections.find(s => s.id === table.sectionId)?.name}
                      </div>
                    )}

                    {dwell && (
                      <div className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dwell.minutes}m dwell</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW MODE 2: COMPACT OPERATIONAL GRID CARDS */}
      {/* ======================================================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map(table => {
            const dwell = getDwellInfo(table);

            // Status Styles
            let statusStyle = 'bg-white border-slate-200 text-slate-900';
            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

            if (table.status === 'vacant') {
              statusStyle = 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-400';
              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            } else if (table.status === 'seated') {
              statusStyle = 'bg-blue-50/30 border-blue-200 hover:border-blue-400';
              badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200';
            } else if (table.status === 'ordered') {
              statusStyle = 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/20 hover:border-amber-400';
              badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
            } else if (table.status === 'served') {
              statusStyle = 'bg-purple-50/30 border-purple-200 hover:border-purple-400';
              badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200';
            } else if (table.status === 'billed') {
              statusStyle = 'bg-yellow-50/40 border-yellow-300 hover:border-yellow-400';
              badgeStyle = 'bg-yellow-100 text-yellow-900 border-yellow-300';
            } else if (table.status === 'cleaning') {
              statusStyle = 'bg-slate-50 border-slate-300 hover:border-slate-400';
              badgeStyle = 'bg-slate-200 text-slate-700 border-slate-300';
            }

            return (
              <div
                key={table.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-md ${statusStyle}`}
              >
                <div>
                  {/* Table Header & Number */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs font-mono">
                        {table.tableNumber}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Table {table.tableNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity} Seats · {table.shape || 'square'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${badgeStyle}`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Table Details: Guests, Dwell Time, Captain */}
                  {table.status !== 'vacant' && table.status !== 'cleaning' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Covers Seated:</span>
                        <span className="font-bold text-slate-900">{table.guestCount || 2} guests</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Server:</span>
                        <span className="font-medium text-slate-800 truncate max-w-28">
                          {table.assignedCaptain || 'Captain'}
                        </span>
                      </div>

                      {/* Dwell / Idle Timer Alert */}
                      {dwell && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Dwell Time:</span>
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              dwell.isAlert
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                : dwell.isWarning
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'text-slate-700 bg-slate-100'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{dwell.minutes} mins</span>
                            {dwell.isAlert && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          </span>
                        </div>
                      )}

                      {/* Running Check Total */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold">Running Total:</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{(table.currentBillTotal || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons at bottom of card */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                  {table.status === 'vacant' && (
                    <button
                      onClick={() => setSeatingTable(table)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Seat Guests</span>
                    </button>
                  )}

                  {table.status === 'seated' && (
                    <button
                      onClick={() => setOrderingTable(table)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Take Order</span>
                    </button>
                  )}

                  {(table.status === 'ordered' || table.status === 'served') && (
                    <div className="w-full flex items-center gap-1.5">
                      <button
                        onClick={() => setOrderingTable(table)}
                        className="py-1.5 px-2 flex-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1"
                        title="Add items to order"
                      >
                        <UtensilsCrossed className="w-3 h-3 text-orange-600" />
                        <span>Items</span>
                      </button>

                      <button
                        onClick={() => handlePrintCheck(table)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center"
                        title="Print Guest Check"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                      </button>

                      <button
                        onClick={() => setSettlingTable(table)}
                        className="py-1.5 px-2.5 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors"
                        title="Direct Settle & Bill"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Settle</span>
                      </button>
                    </div>
                  )}

                  {table.status === 'billed' && (
                    <button
                      onClick={() => setSettlingTable(table)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Settle Bill</span>
                    </button>
                  )}

                  {table.status === 'cleaning' && (
                    <button
                      onClick={() => handleResetCleaning(table.id)}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mark Vacant</span>
                    </button>
                  )}

                  {/* Transfer Action for active dining tables */}
                  {(table.status === 'seated' || table.status === 'ordered' || table.status === 'served') && (
                    <button
                      onClick={() => setTransferringTable(table)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                      title="Transfer table"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <SeatTableModal
        isOpen={!!seatingTable}
        table={seatingTable}
        onClose={() => setSeatingTable(null)}
        onSeat={handleSeatTable}
      />

      <CaptainOrderPadModal
        isOpen={!!orderingTable}
        table={orderingTable}
        menuItems={menuItems}
        kots={kots}
        orders={orders}
        onClose={() => setOrderingTable(null)}
        onFireKot={handleFireKot}
        onVoidItem={handleVoidItem}
        onOpenSettlement={() => {
          if (orderingTable) {
            setSettlingTable(orderingTable);
            setOrderingTable(null);
          }
        }}
        onOpenTransfer={() => {
          if (orderingTable) {
            setTransferringTable(orderingTable);
            setOrderingTable(null);
          }
        }}
        onPrintGuestCheck={async () => {
          if (orderingTable) {
            await handlePrintCheck(orderingTable);
          }
        }}
      />

      <TableSettlementModal
        isOpen={!!settlingTable}
        table={settlingTable}
        kots={kots}
        orders={orders}
        onClose={() => setSettlingTable(null)}
        onSettle={handleSettleBill}
      />

      <TableTransferModal
        isOpen={!!transferringTable}
        sourceTable={transferringTable}
        allTables={tables}
        onClose={() => setTransferringTable(null)}
        onTransfer={handleTransferTable}
      />
    </div>
  );
};
