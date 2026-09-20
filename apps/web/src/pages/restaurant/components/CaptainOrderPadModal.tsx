import React, { useState, useMemo } from 'react';
import {
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantKot,
  RestaurantOrder,
  SelectedModifier
} from '@infinityhub/types';
import {
  X,
  Search,
  Flame,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  Printer,
  CreditCard,
  ArrowRightLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Check,
  AlertTriangle
} from 'lucide-react';

interface PendingOrderItem {
  tempId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  station: 'kitchen' | 'tandoor' | 'bar' | 'dessert' | 'pantry';
  selectedModifiers: SelectedModifier[];
  specialNotes?: string;
}

interface CaptainOrderPadModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  menuItems: RestaurantMenuItem[];
  kots: RestaurantKot[];
  orders: RestaurantOrder[];
  onClose: () => void;
  onFireKot: (
    tableId: string,
    items: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      station: 'kitchen' | 'tandoor' | 'bar' | 'dessert' | 'pantry';
      selectedModifiers?: any[];
      specialNotes?: string;
    }>,
    captainName: string
  ) => Promise<void>;
  onVoidItem: (kotId: string, itemId: string, reason: string, managerPin: string) => Promise<void>;
  onOpenSettlement: () => void;
  onOpenTransfer: () => void;
  onPrintGuestCheck: () => Promise<void>;
}

export const CaptainOrderPadModal: React.FC<CaptainOrderPadModalProps> = ({
  isOpen,
  table,
  menuItems,
  kots,
  orders,
  onClose,
  onFireKot,
  onVoidItem,
  onOpenSettlement,
  onOpenTransfer,
  onPrintGuestCheck
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingItems, setPendingItems] = useState<PendingOrderItem[]>([]);
  const [isFiring, setIsFiring] = useState(false);

  // Modifier customization state
  const [customizingItem, setCustomizingItem] = useState<RestaurantMenuItem | null>(null);
  const [selectedMods, setSelectedMods] = useState<SelectedModifier[]>([]);
  const [itemNote, setItemNote] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);

  // Void item state
  const [voidingTarget, setVoidingTarget] = useState<{ kotId: string; itemId: string; name: string } | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Guest changed mind');
  const [managerPin, setManagerPin] = useState<string>('');
  const [voidError, setVoidError] = useState<string>('');
  const [isVoiding, setIsVoiding] = useState(false);

  if (!isOpen || !table) return null;

  const activeOrder = orders.find(o => o.id === table.activeOrderId);
  const tableKots = kots.filter(k => k.tableId === table.id && k.status !== 'voided');

  // Categories list
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    menuItems.forEach(item => {
      if (item.categoryId && item.categoryName) {
        map.set(item.categoryId, item.categoryName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [menuItems]);

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (dietaryFilter === 'veg' && item.dietary !== 'veg' && item.dietary !== 'vegan') return false;
      if (dietaryFilter === 'non_veg' && item.dietary !== 'non_veg' && item.dietary !== 'egg') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Handle clicking a menu item
  const handleItemClick = (item: RestaurantMenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setCustomizingItem(item);
      setSelectedMods([]);
      setItemNote('');
      setItemQty(1);
    } else {
      // Add directly
      addPendingItem(item, [], '', 1);
    }
  };

  const addPendingItem = (
    item: RestaurantMenuItem,
    mods: SelectedModifier[],
    note: string,
    qty: number
  ) => {
    const extraPrice = mods.reduce((sum, m) => sum + m.extraPrice, 0);
    const effectivePrice = item.price + extraPrice;

    setPendingItems(prev => [
      ...prev,
      {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        menuItemId: item.id,
        name: item.name,
        quantity: qty,
        unitPrice: effectivePrice,
        station: item.station,
        selectedModifiers: mods,
        specialNotes: note
      }
    ]);
  };

  const updatePendingQty = (tempId: string, delta: number) => {
    setPendingItems(prev =>
      prev
        .map(i => {
          if (i.tempId === tempId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as PendingOrderItem[]
    );
  };

  const handleFireKot = async () => {
    if (pendingItems.length === 0) return;
    setIsFiring(true);
    try {
      await onFireKot(
        table.id,
        pendingItems.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          station: i.station,
          selectedModifiers: i.selectedModifiers,
          specialNotes: i.specialNotes
        })),
        table.assignedCaptain || 'Captain Suresh'
      );
      setPendingItems([]);
    } finally {
      setIsFiring(false);
    }
  };

  const handleFireAndSettle = async () => {
    if (pendingItems.length > 0) {
      setIsFiring(true);
      try {
        await onFireKot(
          table.id,
          pendingItems.map(i => ({
            menuItemId: i.menuItemId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            station: i.station,
            selectedModifiers: i.selectedModifiers,
            specialNotes: i.specialNotes
          })),
          table.assignedCaptain || 'Captain Suresh'
        );
        setPendingItems([]);
      } finally {
        setIsFiring(false);
      }
    }
    onOpenSettlement();
  };

  const executeVoidItem = async () => {
    if (!voidingTarget) return;
    setVoidError('');
    setIsVoiding(true);
    try {
      await onVoidItem(voidingTarget.kotId, voidingTarget.itemId, voidReason, managerPin);
      setVoidingTarget(null);
      setManagerPin('');
    } catch (err: any) {
      setVoidError(err.message || 'Authorization failed. Check manager PIN.');
    } finally {
      setIsVoiding(false);
    }
  };

  // Running totals
  const firedSubtotal = tableKots.reduce((sum, kot) => {
    return (
      sum +
      kot.items.reduce((kSum, itm) => {
        if (itm.status === 'cancelled') return kSum;
        const modTotal = (itm.selectedModifiers || []).reduce((acc: number, m: any) => acc + (m.extraPrice || 0), 0);
        return kSum + (itm.unitPrice + modTotal) * itm.quantity;
      }, 0)
    );
  }, 0);

  const pendingSubtotal = pendingItems.reduce((sum, itm) => sum + itm.unitPrice * itm.quantity, 0);
  const totalSubtotal = firedSubtotal + pendingSubtotal;
  const estimatedTax = totalSubtotal * 0.05;
  const estimatedGrandTotal = Math.round(totalSubtotal + estimatedTax);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                {table.tableNumber}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white">Table {table.tableNumber}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    table.status === 'ordered' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    table.status === 'served' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    table.status === 'billed' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {table.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {table.guestCount || 2} Guests · {table.assignedCaptain || 'Captain Suresh'} · Order #{activeOrder?.orderNumber || 'Pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {table.status !== 'vacant' && (
              <>
                <button
                  type="button"
                  onClick={onOpenTransfer}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>Transfer Table</span>
                </button>

                <button
                  type="button"
                  onClick={onPrintGuestCheck}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Check</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenSettlement}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle Bill</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Split: Menu (Left) vs Active Order Ticket (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Menu Browser */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50/50">
            {/* Search & Dietary Filters */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search dishes or code (PBM, DMB)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden transition-all"
                />
              </div>

              {/* Dietary Filter Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    dietaryFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietaryFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    dietaryFilter === 'veg'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Pure Veg</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('non_veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    dietaryFilter === 'non_veg'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Items ({menuItems.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
              {filteredMenu.map(item => {
                const isVeg = item.dietary === 'veg' || item.dietary === 'vegan';
                const hasModifiers = Boolean(item.modifierGroups && item.modifierGroups.length > 0);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-3.5 h-3.5 border flex items-center justify-center rounded-xs shrink-0 ${
                              isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            ></span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-orange-600">
                          ₹{item.price}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 leading-tight">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.prepTimeMinutes}m · {item.station}
                      </span>
                      {hasModifiers && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-bold border border-orange-200">
                          Options+
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active Order Ticket */}
          <div className="w-96 flex flex-col bg-white overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Table Ticket
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {tableKots.length} KOT(s) active
              </span>
            </div>

            {/* Ticket Items Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* SECTION A: Already Fired KOTs */}
              {tableKots.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Fired Kitchen Orders</span>
                    <span className="text-emerald-600 font-bold">In Kitchen</span>
                  </div>

                  {tableKots.map(kot => (
                    <div
                      key={kot.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px]">
                        <span className="font-bold text-slate-900">{kot.kotNumber}</span>
                        <span className="text-slate-500">{new Date(kot.firedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="space-y-1.5">
                        {kot.items.map(itm => (
                          <div
                            key={itm.id}
                            className={`flex items-start justify-between gap-2 text-xs ${
                              itm.status === 'cancelled' ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{itm.quantity}x</span>
                                <span className="font-medium">{itm.name}</span>
                              </div>
                              {itm.specialNotes && (
                                <p className="text-[10px] text-amber-700 italic pl-5">Note: {itm.specialNotes}</p>
                              )}
                              {itm.cancelledReason && (
                                <p className="text-[10px] text-rose-600 font-bold pl-5">Voided: {itm.cancelledReason}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700">₹{itm.unitPrice * itm.quantity}</span>
                              {itm.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  title="Void item (Manager PIN required)"
                                  onClick={() => setVoidingTarget({ kotId: kot.id, itemId: itm.id, name: itm.name })}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION B: Pending New Items (Not yet fired) */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 flex items-center justify-between pt-2">
                  <span>New Items (Ready to Fire)</span>
                  <span className="font-bold">{pendingItems.length} item(s)</span>
                </div>

                {pendingItems.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Click dishes from the menu on the left to add items to this order.
                  </div>
                ) : (
                  pendingItems.map(item => (
                    <div
                      key={item.tempId}
                      className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.selectedModifiers.length > 0 && (
                          <div className="text-[10px] text-slate-500">
                            {item.selectedModifiers.map(m => m.optionName).join(', ')}
                          </div>
                        )}
                        {item.specialNotes && (
                          <div className="text-[10px] text-amber-800 italic">Note: {item.specialNotes}</div>
                        )}
                        <div className="text-xs font-extrabold text-orange-700 mt-1">
                          ₹{item.unitPrice * item.quantity}
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updatePendingQty(item.tempId, -1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1 text-xs font-bold text-slate-900 min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updatePendingQty(item.tempId, 1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ticket Footer & Grand Total */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{totalSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Restaurant GST (5%)</span>
                  <span>₹{estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Est. Grand Total</span>
                  <span className="text-orange-600">₹{estimatedGrandTotal}</span>
                </div>
              </div>

              {/* Order Actions: Send KOT vs Direct Settle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pendingItems.length === 0 || isFiring}
                  onClick={handleFireKot}
                  className="py-3 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>{isFiring ? 'Sending...' : `Send KOT (${pendingItems.length})`}</span>
                </button>

                <button
                  type="button"
                  disabled={(pendingItems.length === 0 && tableKots.length === 0) || isFiring}
                  onClick={handleFireAndSettle}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Save order and immediately open settlement modal for payment"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Charge & Settle</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Modifier Customizer */}
        {customizingItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{customizingItem.name}</h3>
                  <p className="text-xs text-slate-500">₹{customizingItem.price} base price</p>
                </div>
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modifiers groups */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {customizingItem.modifierGroups?.map(group => (
                  <div key={group.id} className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {group.name} {group.minSelect > 0 && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {group.options.map(opt => {
                        const isSelected = selectedMods.some(
                          m => m.groupId === group.id && m.optionId === opt.id
                        );

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (group.maxSelect === 1) {
                                setSelectedMods(prev => [
                                  ...prev.filter(m => m.groupId !== group.id),
                                  {
                                    groupId: group.id,
                                    groupName: group.name,
                                    optionId: opt.id,
                                    optionName: opt.name,
                                    extraPrice: opt.extraPrice
                                  }
                                ]);
                              } else {
                                if (isSelected) {
                                  setSelectedMods(prev =>
                                    prev.filter(m => !(m.groupId === group.id && m.optionId === opt.id))
                                  );
                                } else {
                                  setSelectedMods(prev => [
                                    ...prev,
                                    {
                                      groupId: group.id,
                                      groupName: group.name,
                                      optionId: opt.id,
                                      optionName: opt.name,
                                      extraPrice: opt.extraPrice
                                    }
                                  ]);
                                }
                              }
                            }}
                            className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-orange-50 border-orange-500 text-orange-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt.name}</span>
                            {opt.extraPrice > 0 && (
                              <span className="text-[10px] text-orange-600 font-bold">+₹{opt.extraPrice}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Special Kitchen Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Kitchen Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Less spicy, crisp naan, sauce on side"
                    value={itemNote}
                    onChange={e => setItemNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Confirm */}
              <button
                type="button"
                onClick={() => {
                  addPendingItem(customizingItem, selectedMods, itemNote, itemQty);
                  setCustomizingItem(null);
                }}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Add Customized Item
              </button>
            </div>
          </div>
        )}

        {/* MODAL: Anti-Theft Void Item Confirmation (Manager PIN Required) */}
        {voidingTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Void KOT Item Guard</h3>
                  <p className="text-[11px] text-slate-500">{voidingTarget.name}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                ⚠️ Canceled dishes are permanently logged into the <strong>Kitchen Spoilage & Waste Ledger</strong> to prevent unauthorized cash pocketing.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
                <select
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden"
                >
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Overcooked / Burnt in kitchen">Overcooked / Burnt in kitchen</option>
                  <option value="Accidental duplicate KOT">Accidental duplicate KOT</option>
                  <option value="Kitchen out of stock">Kitchen out of stock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Security PIN (Demo: 1234)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter 4-digit PIN"
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-rose-500 outline-hidden"
                />
              </div>

              {voidError && (
                <p className="text-xs text-rose-600 font-medium">{voidError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingTarget(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={!managerPin || isVoiding}
                  onClick={executeVoidItem}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
                >
                  {isVoiding ? 'Authorizing...' : 'Authorize Void'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
