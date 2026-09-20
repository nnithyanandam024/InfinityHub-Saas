import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
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
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { SeatTableModal } from './components/SeatTableModal';
import { CaptainOrderPadModal } from './components/CaptainOrderPadModal';
import { TableSettlementModal } from './components/TableSettlementModal';
import { TableTransferModal } from './components/TableTransferModal';

export const RestaurantTablesPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [kots, setKots] = useState<RestaurantKot[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      setSections(secData);
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
    const interval = setInterval(loadData, 10000); // 10s auto-refresh
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
      return true;
    });
  }, [tables, activeSectionId, statusFilter]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-xs font-semibold">Loading Floor Plan & Tables...</p>
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
                  {tenant?.name || 'XYZ Gourmet Bistro'} · Table Management
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase tracking-wider">
                  Live Floor Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time dining room occupancy, table dwell monitoring, and synchronized KOT dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
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
              {occupiedTables} / {totalTables} tables occupied
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
            <div className="text-[10px] text-slate-500 mt-0.5">Unbilled active table total</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Dwell Time</div>
            <div className="text-xl font-extrabold text-purple-700 mt-1 font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>~34m</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Target turnover: 45 mins</div>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sections Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveSectionId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSectionId === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Sections ({tables.length})
          </button>
          {sections.map(sec => {
            const count = tables.filter(t => t.sectionId === sec.id).length;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSectionId === sec.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sec.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'vacant', label: 'Vacant 🟢' },
            { id: 'seated', label: 'Seated 🔵' },
            { id: 'ordered', label: 'Cooking 🟠' },
            { id: 'served', label: 'Served 🟣' },
            { id: 'billed', label: 'Billed 🟡' },
            { id: 'cleaning', label: 'Cleaning ⚪' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border ${
                statusFilter === st.id
                  ? 'bg-orange-50 text-orange-800 border-orange-300 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map(table => {
          const dwell = getDwellInfo(table);

          // Status Styles
          let statusStyle = 'bg-white border-slate-200 text-slate-900';
          let badgeStyle = 'bg-slate-100 text-slate-700';

          if (table.status === 'vacant') {
            statusStyle = 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400';
            badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          } else if (table.status === 'seated') {
            statusStyle = 'bg-blue-50/40 border-blue-200/80 hover:border-blue-400';
            badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200';
          } else if (table.status === 'ordered') {
            statusStyle = 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20 hover:border-amber-400';
            badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
          } else if (table.status === 'served') {
            statusStyle = 'bg-purple-50/40 border-purple-200/80 hover:border-purple-400';
            badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200';
          } else if (table.status === 'billed') {
            statusStyle = 'bg-yellow-50/50 border-yellow-300 hover:border-yellow-400';
            badgeStyle = 'bg-yellow-100 text-yellow-900 border-yellow-300';
          } else if (table.status === 'cleaning') {
            statusStyle = 'bg-slate-100/60 border-slate-300/80 hover:border-slate-400';
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
                    <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {table.tableNumber}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Table {table.tableNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity} Seats</span>
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
                    type="button"
                    onClick={() => setSeatingTable(table)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Seat Party</span>
                  </button>
                )}

                {table.status === 'cleaning' && (
                  <button
                    type="button"
                    onClick={() => handleResetCleaning(table.id)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mark Clean (Vacant)</span>
                  </button>
                )}

                {table.status !== 'vacant' && table.status !== 'cleaning' && (
                  <div className="w-full grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOrderingTable(table)}
                      className="py-1.5 px-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Open Captain Order Pad"
                    >
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Order</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintCheck(table)}
                      className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Print Guest Check"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      <span>Check</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettlingTable(table)}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Settle Bill & Free Table"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Settle</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Seat Table */}
      <SeatTableModal
        isOpen={Boolean(seatingTable)}
        table={seatingTable}
        onClose={() => setSeatingTable(null)}
        onSeat={handleSeatTable}
      />

      {/* MODAL 2: Captain Order Pad */}
      <CaptainOrderPadModal
        isOpen={Boolean(orderingTable)}
        table={orderingTable}
        menuItems={menuItems}
        kots={kots}
        orders={orders}
        onClose={() => setOrderingTable(null)}
        onFireKot={handleFireKot}
        onVoidItem={handleVoidItem}
        onOpenSettlement={() => {
          setSettlingTable(orderingTable);
          setOrderingTable(null);
        }}
        onOpenTransfer={() => {
          setTransferringTable(orderingTable);
        }}
        onPrintGuestCheck={async () => {
          if (orderingTable) {
            await handlePrintCheck(orderingTable);
          }
        }}
      />

      {/* MODAL 3: Settle Table Bill */}
      <TableSettlementModal
        isOpen={Boolean(settlingTable)}
        table={settlingTable}
        kots={kots}
        orders={orders}
        onClose={() => setSettlingTable(null)}
        onSettle={handleSettleBill}
      />

      {/* MODAL 4: Transfer Table */}
      <TableTransferModal
        isOpen={Boolean(transferringTable)}
        sourceTable={transferringTable}
        allTables={tables}
        onClose={() => setTransferringTable(null)}
        onTransfer={handleTransferTable}
      />
    </div>
  );
};
