import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services/restaurantService';
import type { RestaurantKot, KotItemStatus } from '@infinityhub/types';
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Volume2,
  VolumeX,
  ChefHat
} from 'lucide-react';

export const KitchenDisplayPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [kots, setKots] = useState<RestaurantKot[]>([]);
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const loadKots = async () => {
    try {
      const data = await restaurantService.getKots(tenantId);
      setKots(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync kitchen tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKots();
    const interval = setInterval(loadKots, 6000); // 6s fast kitchen sync
    return () => clearInterval(interval);
  }, [tenantId]);

  // Toggle item status between cooking and ready
  const handleToggleItem = async (kotId: string, itemId: string, currentStatus: KotItemStatus) => {
    const nextStatus = currentStatus === 'ready' ? 'cooking' : 'ready';
    try {
      await restaurantService.updateKotItemStatus(tenantId, kotId, itemId, nextStatus);
      await loadKots();
    } catch (err: any) {
      showToast(err.message || 'Failed to update item status', 'error');
    }
  };

  // Bump whole ticket
  const handleBumpKot = async (kotId: string) => {
    try {
      await restaurantService.bumpKot(tenantId, kotId);
      showToast('KOT marked ready for pickup!', 'success');
      await loadKots();
    } catch (err: any) {
      showToast(err.message || 'Failed to bump KOT', 'error');
    }
  };

  // Filtered KOTs (Only show active or recently ready)
  const activeKots = useMemo(() => {
    return kots.filter(kot => {
      if (kot.status === 'voided') return false;
      if (stationFilter !== 'all') {
        const hasStationItems = kot.items.some(i => i.station === stationFilter);
        if (!hasStationItems) return false;
      }
      return true;
    });
  }, [kots, stationFilter]);

  const STATIONS: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Kitchen Stations' },
    { id: 'kitchen', label: 'Main Curries & Gravy' },
    { id: 'tandoor', label: 'Tandoor, Kebabs & Breads' },
    { id: 'bar', label: 'Bar & Mocktail Counter' },
    { id: 'dessert', label: 'Dessert Pantry' }
  ];

  const getElapsedTime = (firedAt: string) => {
    const mins = Math.floor((Date.now() - new Date(firedAt).getTime()) / (60 * 1000));
    return {
      minutes: Math.max(0, mins),
      isWarning: mins >= 10 && mins < 20,
      isOverdue: mins >= 20
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-xs font-semibold">Loading Kitchen Display System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KDS Header Bar */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-[18px] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight font-display">
                Kitchen Display System (KDS)
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Station dispatch, preparation timer alerts, and chef line bumping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span>Chime Sound</span>
          </button>

          <button
            onClick={loadKots}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Refresh KDS"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        {STATIONS.map(st => (
          <button
            key={st.id}
            onClick={() => setStationFilter(st.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              stationFilter === st.id
                ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* KOT Cards Grid */}
      {activeKots.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">All Kitchen Orders Cleared!</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            There are currently no pending tickets for this station. New orders from Captains will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {activeKots.map(kot => {
            const time = getElapsedTime(kot.firedAt);
            const isReady = kot.status === 'ready' || kot.status === 'served';

            // Timer color threshold
            let timerBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let cardBorder = 'border-slate-200';

            if (time.isOverdue) {
              timerBadge = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200 animate-pulse';
              cardBorder = 'border-rose-300 ring-2 ring-rose-100 shadow-md';
            } else if (time.isWarning) {
              timerBadge = 'bg-amber-50 text-amber-800 border-amber-300';
              cardBorder = 'border-amber-300 ring-1 ring-amber-100';
            }

            return (
              <div
                key={kot.id}
                className={`rounded-2xl bg-white border ${cardBorder} shadow-2xs flex flex-col justify-between overflow-hidden transition-all hover:shadow-md`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-sm shadow-xs font-mono">
                        {kot.tableNumber}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{kot.kotNumber}</span>
                          <span className="text-[10px] text-slate-500">· {kot.sectionName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Server: {kot.captainName}</div>
                      </div>
                    </div>

                    {/* Prep Elapsed Timer */}
                    <div className={`px-2 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1 ${timerBadge}`}>
                      <Clock className="w-3 h-3" />
                      <span>{time.minutes}m</span>
                      {time.isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                    </div>
                  </div>

                  {/* Ticket Items Checklist */}
                  <div className="p-3.5 space-y-2.5 divide-y divide-slate-100">
                    {kot.items.map(itm => {
                      const itemReady = itm.status === 'ready' || itm.status === 'served';
                      const isCancelled = itm.status === 'cancelled';

                      return (
                        <div
                          key={itm.id}
                          onClick={() => !isCancelled && handleToggleItem(kot.id, itm.id, itm.status)}
                          className={`pt-2.5 first:pt-0 flex items-start justify-between gap-3 cursor-pointer group select-none ${
                            isCancelled ? 'opacity-40 line-through' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <button
                              type="button"
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                itemReady
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {itemReady && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-extrabold ${itemReady ? 'text-slate-400' : 'text-slate-900'}`}>
                                  {itm.quantity}x
                                </span>
                                <span className={`text-xs font-bold ${itemReady ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {itm.name}
                                </span>
                              </div>

                              {itm.selectedModifiers && itm.selectedModifiers.length > 0 && (
                                <div className="text-[10px] text-amber-700 font-medium pl-5 mt-0.5">
                                  + {itm.selectedModifiers.map(m => m.optionName).join(', ')}
                                </div>
                              )}

                              {itm.specialNotes && (
                                <div className="text-[10px] text-orange-800 font-semibold italic pl-5 mt-0.5 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                  Note: {itm.specialNotes}
                                </div>
                              )}

                              {isCancelled && (
                                <div className="text-[10px] text-rose-600 font-bold pl-5">
                                  Voided: {itm.cancelledReason}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                            {itm.station}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Bottom Bump Action */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(kot.firedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleBumpKot(kot.id)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                      isReady
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isReady ? 'Ready for Pickup' : 'Bump Order (Ready)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
