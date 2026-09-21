import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  RestaurantSection,
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantKot,
  RestaurantKotItem,
  RestaurantOrder,
  RestaurantWasteLog,
  TableTransferAudit,
  KotItemStatus,
  Invoice
} from '@infinityhub/types';
import { useTenant } from './TenantContext';
import { useAuth } from './AuthContext';
import { INITIAL_TENANTS_MAP } from '../../../web/src/data/initialData';

export interface DraftOrderItem {
  menuItem: RestaurantMenuItem;
  quantity: number;
  notes?: string;
}

interface RestaurantContextType {
  sections: RestaurantSection[];
  tables: RestaurantTable[];
  menuItems: RestaurantMenuItem[];
  kots: RestaurantKot[];
  orders: RestaurantOrder[];
  wasteLogs: RestaurantWasteLog[];
  tableAudits: TableTransferAudit[];
  selectedTableId: string | null;
  selectedTable: RestaurantTable | null;
  currentDraftItems: DraftOrderItem[];
  activeOrder: RestaurantOrder | null;
  isLoading: boolean;
  occupancyStats: {
    totalTables: number;
    occupiedCount: number;
    vacantCount: number;
    occupancyRate: number;
  };
  setSelectedTableId: (id: string | null) => void;
  seatTable: (tableId: string, guestCount: number, captainName: string) => Promise<RestaurantTable>;
  addToDraftOrder: (menuItem: RestaurantMenuItem, quantity?: number, notes?: string) => void;
  updateDraftItemQuantity: (menuItemId: string, quantity: number) => void;
  updateDraftItemNotes: (menuItemId: string, notes: string) => void;
  removeDraftItem: (menuItemId: string) => void;
  clearDraftOrder: () => void;
  fireKot: (tableId: string, captainName?: string) => Promise<RestaurantKot>;
  updateKotItemStatus: (kotId: string, itemId: string, status: KotItemStatus) => Promise<RestaurantKot>;
  bumpKot: (kotId: string) => Promise<RestaurantKot>;
  voidKotItem: (
    kotId: string,
    itemId: string,
    reason: string,
    pin: string,
    authorizedBy?: string
  ) => Promise<{ kot: RestaurantKot; wasteLog: RestaurantWasteLog }>;
  transferTable: (
    sourceTableId: string,
    targetTableId: string,
    reason: string,
    pin: string,
    transferredBy?: string
  ) => Promise<TableTransferAudit>;
  toggleMenuItemAvailability: (menuItemId: string) => Promise<RestaurantMenuItem>;
  settleTableBill: (
    tableId: string,
    payload: {
      payments: Array<{ method: 'cash' | 'upi' | 'card'; amount: number; reference?: string }>;
      customerName?: string;
      customerPhone?: string;
      discountAmount?: number;
      serviceChargePercentage?: number;
    }
  ) => Promise<{ order: RestaurantOrder; invoice: Invoice }>;
  resetTableToVacant: (tableId: string) => Promise<RestaurantTable>;
  refreshRestaurantData: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const tenantId = tenant?.id || 'tenant-xyz-restaurant';

  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [kots, setKots] = useState<RestaurantKot[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [wasteLogs, setWasteLogs] = useState<RestaurantWasteLog[]>([]);
  const [tableAudits, setTableAudits] = useState<TableTransferAudit[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentDraftItems, setCurrentDraftItems] = useState<DraftOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize restaurant data
  const loadTenantData = useCallback(() => {
    setIsLoading(true);
    try {
      const tenantSeed = INITIAL_TENANTS_MAP[tenantId] || INITIAL_TENANTS_MAP['tenant-xyz-restaurant'];
      
      const loadedSections: RestaurantSection[] = tenantSeed.restaurantSections && tenantSeed.restaurantSections.length > 0
        ? tenantSeed.restaurantSections
        : [
            { id: 'sec-main', name: 'Main Dining Hall', description: 'Central AC dining area', sortOrder: 1 },
            { id: 'sec-terrace', name: 'Terrace Garden', description: 'Open-air balcony and lawn seating', sortOrder: 2 },
            { id: 'sec-bar', name: 'Bar & Lounge', description: 'High-top bar stools and cocktail lounge', sortOrder: 3 }
          ];

      const loadedTables: RestaurantTable[] = tenantSeed.restaurantTables && tenantSeed.restaurantTables.length > 0
        ? tenantSeed.restaurantTables
        : [
            { id: 'tbl-01', sectionId: loadedSections[0].id, tableNumber: 'T-01', capacity: 2, status: 'vacant', shape: 'square' },
            { id: 'tbl-02', sectionId: loadedSections[0].id, tableNumber: 'T-02', capacity: 4, status: 'vacant', shape: 'square' },
            { id: 'tbl-03', sectionId: loadedSections[0].id, tableNumber: 'T-03', capacity: 4, status: 'vacant', shape: 'square' },
            { id: 'tbl-04', sectionId: loadedSections[0].id, tableNumber: 'T-04', capacity: 6, status: 'vacant', shape: 'rectangle' },
            { id: 'tbl-05', sectionId: loadedSections[1]?.id || loadedSections[0].id, tableNumber: 'T-05', capacity: 4, status: 'vacant', shape: 'round' },
            { id: 'tbl-06', sectionId: loadedSections[1]?.id || loadedSections[0].id, tableNumber: 'T-06', capacity: 4, status: 'vacant', shape: 'round' }
          ];

      const loadedMenu: RestaurantMenuItem[] = tenantSeed.restaurantMenuItems && tenantSeed.restaurantMenuItems.length > 0
        ? tenantSeed.restaurantMenuItems
        : [
            { id: 'itm-01', name: 'Paneer Butter Masala', code: 'PBM-01', categoryId: 'cat-mains', categoryName: 'Mains', price: 340, taxRate: 5, prepTimeMinutes: 15, station: 'kitchen', dietary: 'veg', description: 'Rich cottage cheese in tomato cashew gravy', isAvailable: true },
            { id: 'itm-02', name: 'Dum Mutton Biryani', code: 'DMB-02', categoryId: 'cat-mains', categoryName: 'Mains', price: 480, taxRate: 5, prepTimeMinutes: 20, station: 'kitchen', dietary: 'non_veg', description: 'Hyderabadi spiced slow-cooked basmati rice', isAvailable: true },
            { id: 'itm-03', name: 'Garlic Butter Naan', code: 'GBN-03', categoryId: 'cat-breads', categoryName: 'Breads', price: 75, taxRate: 5, prepTimeMinutes: 8, station: 'tandoor', dietary: 'veg', description: 'Clay oven flatbread infused with fresh garlic', isAvailable: true },
            { id: 'itm-04', name: 'Tandoori Murgh Full', code: 'TMF-04', categoryId: 'cat-starters', categoryName: 'Starters', price: 520, taxRate: 5, prepTimeMinutes: 25, station: 'tandoor', dietary: 'non_veg', description: 'Whole roasted chicken marinated in yogurt and spices', isAvailable: true },
            { id: 'itm-05', name: 'Fresh Lime Soda', code: 'FLS-05', categoryId: 'cat-bev', categoryName: 'Beverages', price: 90, taxRate: 5, prepTimeMinutes: 5, station: 'bar', dietary: 'veg', description: 'Sweet or salted carbonated lime cooler', isAvailable: true },
            { id: 'itm-06', name: 'Gulab Jamun with Rabri', code: 'GJR-06', categoryId: 'cat-dessert', categoryName: 'Desserts', price: 150, taxRate: 5, prepTimeMinutes: 5, station: 'dessert', dietary: 'veg', description: 'Warm khoya dumplings topped with thickened milk', isAvailable: true }
          ];

      const loadedKots: RestaurantKot[] = tenantSeed.restaurantKots || [];
      let loadedOrders: RestaurantOrder[] = (tenantSeed.restaurantOrders || []).map(o => ({
        ...o,
        kots: o.kots && o.kots.length > 0 ? o.kots : loadedKots.filter(k => k.orderId === o.id || (o.tableId && k.tableId === o.tableId))
      }));

      // Ensure every seated/ordered/billed table has an associated order record
      for (const t of loadedTables) {
        if (t.status !== 'vacant' && t.status !== 'cleaning') {
          const existing = loadedOrders.find(o => o.id === t.activeOrderId || o.tableId === t.id);
          if (!existing) {
            const tableKots = loadedKots.filter(k => k.tableId === t.id || (t.activeKotIds && t.activeKotIds.includes(k.id)));
            const subtotal = tableKots.reduce((sum, kot) =>
              sum + kot.items.reduce((ksum, itm) => itm.status !== 'cancelled' ? ksum + (itm.unitPrice * itm.quantity) : ksum, 0),
              0
            ) || t.currentBillTotal || 0;
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;
            const grandTotal = Math.round(subtotal + cgst + sgst);
            loadedOrders.push({
              id: t.activeOrderId || `ord-${t.id}`,
              orderNumber: `ORD-${t.tableNumber}`,
              orderType: 'dine_in',
              tableId: t.id,
              tableNumber: t.tableNumber,
              sectionName: loadedSections.find(s => s.id === t.sectionId)?.name || 'Main Dining',
              guestCount: t.guestCount || t.capacity || 2,
              captainName: t.captainName || 'Staff Captain',
              kots: tableKots,
              subtotal,
              discount: 0,
              serviceCharge: 0,
              cgst,
              sgst,
              roundOff: 0,
              grandTotal,
              payments: [],
              orderStatus: t.status === 'billed' ? 'billed' : 'open',
              billPrintedCount: 0,
              reprintHistory: [],
              createdAt: t.seatedAt || new Date().toISOString()
            });
          }
        }
      }

      setSections(loadedSections);
      setTables(loadedTables);
      setMenuItems(loadedMenu);
      setKots(loadedKots);
      setOrders(loadedOrders);
      setWasteLogs(tenantSeed.restaurantWasteLogs || []);
      setTableAudits(tenantSeed.restaurantTableAudits || []);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  // Selected table entity
  const selectedTable = useMemo(() => {
    return tables.find(t => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  // Active order for selected table
  const activeOrder = useMemo(() => {
    if (!selectedTable) return null;
    const found = orders.find(o => (selectedTable.activeOrderId && o.id === selectedTable.activeOrderId) || (o.tableId === selectedTable.id && o.orderStatus !== 'settled'));
    if (found) {
      const orderKots = found.kots && found.kots.length > 0 ? found.kots : kots.filter(k => k.orderId === found.id || k.tableId === selectedTable.id);
      return { ...found, kots: orderKots };
    }

    if (selectedTable.status !== 'vacant' && selectedTable.status !== 'cleaning') {
      const tableKots = kots.filter(k => k.tableId === selectedTable.id || (selectedTable.activeKotIds && selectedTable.activeKotIds.includes(k.id)));
      const subtotal = tableKots.reduce((sum, kot) =>
        sum + kot.items.reduce((ksum, itm) => itm.status !== 'cancelled' ? ksum + (itm.unitPrice * itm.quantity) : ksum, 0),
        0
      ) || selectedTable.currentBillTotal || 0;
      const cgst = subtotal * 0.025;
      const sgst = subtotal * 0.025;
      const grandTotal = Math.round(subtotal + cgst + sgst);
      return {
        id: selectedTable.activeOrderId || `ord-${selectedTable.id}`,
        orderNumber: `ORD-${selectedTable.tableNumber}`,
        orderType: 'dine_in' as const,
        tableId: selectedTable.id,
        tableNumber: selectedTable.tableNumber,
        sectionName: sections.find(s => s.id === selectedTable.sectionId)?.name || 'Main Dining',
        guestCount: selectedTable.guestCount || selectedTable.capacity || 2,
        captainName: selectedTable.captainName || 'Staff Captain',
        kots: tableKots,
        subtotal,
        discount: 0,
        serviceCharge: 0,
        cgst,
        sgst,
        roundOff: 0,
        grandTotal,
        payments: [],
        orderStatus: selectedTable.status === 'billed' ? ('billed' as const) : ('open' as const),
        billPrintedCount: 0,
        reprintHistory: [],
        createdAt: selectedTable.seatedAt || new Date().toISOString()
      };
    }
    return null;
  }, [orders, selectedTable, kots, sections]);

  // Occupancy KPIs
  const occupancyStats = useMemo(() => {
    const totalTables = tables.length;
    const occupiedCount = tables.filter(t => t.status !== 'vacant' && t.status !== 'cleaning').length;
    const vacantCount = tables.filter(t => t.status === 'vacant').length;
    const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;
    return { totalTables, occupiedCount, vacantCount, occupancyRate };
  }, [tables]);

  // Seat a vacant table
  const seatTable = useCallback(async (
    tableId: string,
    guestCount: number,
    captainName: string
  ): Promise<RestaurantTable> => {
    const target = tables.find(t => t.id === tableId);
    if (!target) throw new Error('Table not found');

    const orderId = `ord-${Date.now()}`;
    const section = sections.find(s => s.id === target.sectionId);

    const newOrder: RestaurantOrder = {
      id: orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
      orderType: 'dine_in',
      tableId: target.id,
      tableNumber: target.tableNumber,
      sectionName: section?.name || 'Main Dining',
      guestCount,
      captainName: captainName || user?.name || 'Captain',
      kots: [],
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      cgst: 0,
      sgst: 0,
      roundOff: 0,
      grandTotal: 0,
      payments: [],
      orderStatus: 'open',
      billPrintedCount: 0,
      reprintHistory: [],
      createdAt: new Date().toISOString()
    };

    const updatedTable: RestaurantTable = {
      ...target,
      status: 'seated',
      guestCount,
      captainName: newOrder.captainName,
      seatedAt: new Date().toISOString(),
      activeOrderId: orderId,
      activeKotIds: [],
      currentBillTotal: 0
    };

    setTables(prev => prev.map(t => (t.id === tableId ? updatedTable : t)));
    setOrders(prev => [newOrder, ...prev]);
    setSelectedTableId(tableId);

    return updatedTable;
  }, [tables, sections, user]);

  // Draft Order Pad Mutations
  const addToDraftOrder = useCallback((
    menuItem: RestaurantMenuItem,
    quantity = 1,
    notes?: string
  ) => {
    setCurrentDraftItems(prev => {
      const idx = prev.findIndex(i => i.menuItem.id === menuItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
          notes: notes !== undefined ? notes : next[idx].notes
        };
        return next;
      }
      return [...prev, { menuItem, quantity, notes }];
    });
  }, []);

  const updateDraftItemQuantity = useCallback((menuItemId: string, quantity: number) => {
    setCurrentDraftItems(prev => {
      if (quantity <= 0) {
        return prev.filter(i => i.menuItem.id !== menuItemId);
      }
      return prev.map(i => (i.menuItem.id === menuItemId ? { ...i, quantity } : i));
    });
  }, []);

  const updateDraftItemNotes = useCallback((menuItemId: string, notes: string) => {
    setCurrentDraftItems(prev =>
      prev.map(i => (i.menuItem.id === menuItemId ? { ...i, notes } : i))
    );
  }, []);

  const removeDraftItem = useCallback((menuItemId: string) => {
    setCurrentDraftItems(prev => prev.filter(i => i.menuItem.id !== menuItemId));
  }, []);

  const clearDraftOrder = useCallback(() => {
    setCurrentDraftItems([]);
  }, []);

  // Fire KOT (dispatches draft items to kitchen line)
  const fireKot = useCallback(async (
    tableId: string,
    captainName?: string
  ): Promise<RestaurantKot> => {
    const table = tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');
    if (currentDraftItems.length === 0) throw new Error('No items selected in Captain Order Pad');

    let order = orders.find(o => o.id === table.activeOrderId);
    const assignedCaptain = captainName || table.captainName || user?.name || 'Captain';

    if (!order) {
      const orderId = `ord-${Date.now()}`;
      const section = sections.find(s => s.id === table.sectionId);
      order = {
        id: orderId,
        orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
        orderType: 'dine_in',
        tableId: table.id,
        tableNumber: table.tableNumber,
        guestCount: table.guestCount || 2,
        captainName: assignedCaptain,
        kots: [],
        subtotal: 0,
        discount: 0,
        serviceCharge: 0,
        cgst: 0,
        sgst: 0,
        roundOff: 0,
        grandTotal: 0,
        payments: [],
        orderStatus: 'open',
        billPrintedCount: 0,
        reprintHistory: [],
        createdAt: new Date().toISOString()
      };
      setOrders(prev => [order!, ...prev]);
    }

    const kotSeq = (kots.length + 1).toString().padStart(3, '0');
    const kotId = `kot-${Date.now()}`;
    const section = sections.find(s => s.id === table.sectionId);

    const kotItems: RestaurantKotItem[] = currentDraftItems.map((draft, idx) => ({
      id: `ki-${Date.now()}-${idx}`,
      menuItemId: draft.menuItem.id,
      name: draft.menuItem.name,
      quantity: draft.quantity,
      unitPrice: draft.menuItem.price,
      specialNotes: draft.notes,
      station: draft.menuItem.station || 'kitchen',
      status: 'cooking'
    }));

    const newKot: RestaurantKot = {
      id: kotId,
      kotNumber: `KOT-${kotSeq}`,
      orderId: order.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      sectionName: section?.name || 'Main Dining',
      station: kotItems[0]?.station || 'kitchen',
      captainName: assignedCaptain,
      status: 'fired',
      items: kotItems,
      firedAt: new Date().toISOString()
    };

    // Calculate totals with 5% food GST
    const allKots = [...order.kots, newKot];
    let subtotal = 0;
    for (const k of allKots) {
      for (const itm of k.items) {
        if (itm.status !== 'cancelled') {
          subtotal += itm.unitPrice * itm.quantity;
        }
      }
    }
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const grandTotal = Math.round(subtotal + cgst + sgst);

    const updatedOrder: RestaurantOrder = {
      ...order,
      kots: allKots,
      subtotal,
      cgst,
      sgst,
      grandTotal
    };

    const updatedTable: RestaurantTable = {
      ...table,
      status: 'ordered',
      lastKotAt: new Date().toISOString(),
      currentBillTotal: grandTotal,
      activeKotIds: [...(table.activeKotIds || []), kotId]
    };

    setKots(prev => [newKot, ...prev]);
    setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
    setTables(prev => prev.map(t => (t.id === updatedTable.id ? updatedTable : t)));
    setCurrentDraftItems([]);

    return newKot;
  }, [tables, orders, kots, sections, currentDraftItems, user]);

  // Update KDS item status
  const updateKotItemStatus = useCallback(async (
    kotId: string,
    itemId: string,
    status: KotItemStatus
  ): Promise<RestaurantKot> => {
    let updatedKot: RestaurantKot | null = null;

    setKots(prev =>
      prev.map(k => {
        if (k.id !== kotId) return k;
        const nextItems = k.items.map(itm => (itm.id === itemId ? { ...itm, status } : itm));
        const allReady = nextItems.every(i => i.status === 'ready' || i.status === 'served' || i.status === 'cancelled');
        const nextStatus = allReady ? 'ready' : k.status;
        updatedKot = { ...k, items: nextItems, status: nextStatus };
        return updatedKot;
      })
    );

    if (status === 'served') {
      const kot = kots.find(k => k.id === kotId);
      if (kot) {
        setTables(prev =>
          prev.map(t => (t.id === kot.tableId ? { ...t, status: 'served' } : t))
        );
      }
    }

    if (!updatedKot) throw new Error('KOT not found');
    return updatedKot;
  }, [kots]);

  // Bump all items in KOT to ready
  const bumpKot = useCallback(async (kotId: string): Promise<RestaurantKot> => {
    let bumpedKot: RestaurantKot | null = null;

    setKots(prev =>
      prev.map(k => {
        if (k.id !== kotId) return k;
        const nextItems = k.items.map(i => ({
          ...i,
          status: i.status === 'cooking' || i.status === 'pending' ? ('ready' as KotItemStatus) : i.status
        }));
        bumpedKot = { ...k, status: 'ready', items: nextItems };
        return bumpedKot;
      })
    );

    if (!bumpedKot) throw new Error('KOT not found');
    return bumpedKot;
  }, []);

  // Manager PIN Void with Kitchen Waste Registration
  const voidKotItem = useCallback(async (
    kotId: string,
    itemId: string,
    reason: string,
    pin: string,
    authorizedBy = 'Manager Vikram'
  ): Promise<{ kot: RestaurantKot; wasteLog: RestaurantWasteLog }> => {
    if (pin !== '1234') {
      throw new Error('Invalid Manager PIN. Void authorization rejected.');
    }

    const kot = kots.find(k => k.id === kotId);
    if (!kot) throw new Error('KOT not found');

    const itm = kot.items.find(i => i.id === itemId);
    if (!itm) throw new Error('Item not found in KOT');

    const estimatedCost = Number((itm.unitPrice * 0.35 * itm.quantity).toFixed(2));

    const wasteLog: RestaurantWasteLog = {
      id: `wst-${Date.now()}`,
      date: new Date().toISOString(),
      kotId: kot.kotNumber,
      tableNumber: kot.tableNumber,
      itemName: itm.name,
      quantity: itm.quantity,
      unit: 'portion',
      estimatedCost,
      reason: `Void KOT Item: ${reason}`,
      authorizedBy,
      status: 'approved'
    };

    const updatedKot: RestaurantKot = {
      ...kot,
      items: kot.items.map(i =>
        i.id === itemId
          ? { ...i, status: 'cancelled', cancelledReason: reason, cancelledAt: new Date().toISOString() }
          : i
      )
    };

    setKots(prev => prev.map(k => (k.id === kotId ? updatedKot : k)));
    setWasteLogs(prev => [wasteLog, ...prev]);

    // Recalculate order running total
    const order = orders.find(o => o.id === kot.orderId);
    if (order) {
      const refreshedKots = order.kots.map(k => (k.id === kotId ? updatedKot : k));
      let subtotal = 0;
      for (const k of refreshedKots) {
        for (const i of k.items) {
          if (i.status !== 'cancelled') {
            subtotal += i.unitPrice * i.quantity;
          }
        }
      }
      const cgst = subtotal * 0.025;
      const sgst = subtotal * 0.025;
      const grandTotal = Math.round(subtotal + cgst + sgst);

      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, kots: refreshedKots, subtotal, cgst, sgst, grandTotal } : o))
      );

      setTables(prev =>
        prev.map(t => (t.id === kot.tableId ? { ...t, currentBillTotal: grandTotal } : t))
      );
    }

    return { kot: updatedKot, wasteLog };
  }, [kots, orders]);

  // Transfer Table with Manager PIN
  const transferTable = useCallback(async (
    sourceTableId: string,
    targetTableId: string,
    reason: string,
    pin: string,
    transferredBy = 'Captain'
  ): Promise<TableTransferAudit> => {
    if (pin !== '1234') {
      throw new Error('Invalid Manager PIN. Table transfer rejected.');
    }

    const source = tables.find(t => t.id === sourceTableId);
    const target = tables.find(t => t.id === targetTableId);

    if (!source || !target) throw new Error('Source or Target table not found');
    if (target.status !== 'vacant') {
      throw new Error(`Target table ${target.tableNumber} is already occupied (${target.status})`);
    }

    const order = orders.find(o => o.id === source.activeOrderId);

    const audit: TableTransferAudit = {
      id: `xfer-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceTable: source.tableNumber,
      targetTable: target.tableNumber,
      transferredBy,
      authorizedBy: 'Manager Vikram',
      reason,
      itemCount: order?.kots.reduce((acc, k) => acc + k.items.length, 0) || 0
    };

    const updatedSource: RestaurantTable = {
      ...source,
      status: 'vacant',
      activeOrderId: undefined,
      activeKotIds: [],
      guestCount: undefined,
      seatedAt: undefined,
      lastKotAt: undefined,
      currentBillTotal: 0
    };

    const updatedTarget: RestaurantTable = {
      ...target,
      status: source.status,
      activeOrderId: source.activeOrderId,
      activeKotIds: source.activeKotIds,
      guestCount: source.guestCount,
      seatedAt: source.seatedAt,
      lastKotAt: source.lastKotAt,
      currentBillTotal: source.currentBillTotal,
      assignedCaptain: source.assignedCaptain,
      captainName: source.captainName
    };

    setTables(prev =>
      prev.map(t => {
        if (t.id === sourceTableId) return updatedSource;
        if (t.id === targetTableId) return updatedTarget;
        return t;
      })
    );

    if (order) {
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, tableId: target.id, tableNumber: target.tableNumber } : o))
      );
    }

    setTableAudits(prev => [audit, ...prev]);
    setSelectedTableId(target.id);

    return audit;
  }, [tables, orders]);

  // Toggle dish availability (In Stock <-> 86-ed)
  const toggleMenuItemAvailability = useCallback(async (
    menuItemId: string
  ): Promise<RestaurantMenuItem> => {
    let updated: RestaurantMenuItem | null = null;
    setMenuItems(prev =>
      prev.map(m => {
        if (m.id !== menuItemId) return m;
        updated = { ...m, isAvailable: !m.isAvailable };
        return updated;
      })
    );
    if (!updated) throw new Error('Menu item not found');
    return updated;
  }, []);

  // Settle table bill & generate invoice
  const settleTableBill = useCallback(async (
    tableId: string,
    payload: {
      payments: Array<{ method: 'cash' | 'upi' | 'card'; amount: number; reference?: string }>;
      customerName?: string;
      customerPhone?: string;
      discountAmount?: number;
      serviceChargePercentage?: number;
    }
  ): Promise<{ order: RestaurantOrder; invoice: Invoice }> => {
    const table = tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    let order = orders.find(o => (table.activeOrderId && o.id === table.activeOrderId) || (o.tableId === table.id && o.orderStatus !== 'settled'));
    if (!order) {
      const tableKots = kots.filter(k => k.tableId === table.id || (table.activeKotIds && table.activeKotIds.includes(k.id)));
      const baseSubtotal = tableKots.reduce((sum, kot) =>
        sum + kot.items.reduce((ksum, itm) => itm.status !== 'cancelled' ? ksum + (itm.unitPrice * itm.quantity) : ksum, 0),
        0
      ) || table.currentBillTotal || 0;
      const cgstVal = baseSubtotal * 0.025;
      const sgstVal = baseSubtotal * 0.025;
      order = {
        id: table.activeOrderId || `ord-${table.id}-${Date.now()}`,
        orderNumber: `ORD-${table.tableNumber}`,
        orderType: 'dine_in',
        tableId: table.id,
        tableNumber: table.tableNumber,
        sectionName: sections.find(s => s.id === table.sectionId)?.name || 'Main Dining',
        guestCount: table.guestCount || table.capacity || 2,
        captainName: table.captainName || 'Staff Captain',
        kots: tableKots,
        subtotal: baseSubtotal,
        discount: 0,
        serviceCharge: 0,
        cgst: cgstVal,
        sgst: sgstVal,
        roundOff: 0,
        grandTotal: Math.round(baseSubtotal + cgstVal + sgstVal),
        payments: [],
        orderStatus: 'open',
        billPrintedCount: 0,
        reprintHistory: [],
        createdAt: table.seatedAt || new Date().toISOString()
      };
    }

    let subtotal = 0;
    if (order.kots && order.kots.length > 0) {
      for (const k of order.kots) {
        for (const itm of k.items) {
          if (itm.status !== 'cancelled') {
            subtotal += itm.unitPrice * itm.quantity;
          }
        }
      }
    }
    if (subtotal === 0) {
      subtotal = order.subtotal || table.currentBillTotal || 0;
    }

    const discount = payload.discountAmount || 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const serviceCharge = payload.serviceChargePercentage ? taxableSubtotal * (payload.serviceChargePercentage / 100) : 0;
    const cgst = taxableSubtotal * 0.025;
    const sgst = taxableSubtotal * 0.025;
    const exactTotal = taxableSubtotal + serviceCharge + cgst + sgst;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Number((grandTotal - exactTotal).toFixed(2));

    const settledOrder: RestaurantOrder = {
      ...order,
      subtotal,
      discount,
      serviceCharge,
      cgst,
      sgst,
      roundOff,
      grandTotal,
      payments: payload.payments,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      orderStatus: 'settled',
      settledAt: new Date().toISOString()
    };

    let invoiceItems: any[] = (order.kots || []).flatMap(k =>
      k.items
        .filter(i => i.status !== 'cancelled')
        .map(i => {
          const itemTaxable = i.unitPrice * i.quantity;
          const itemCgst = itemTaxable * 0.025;
          const itemSgst = itemTaxable * 0.025;
          return {
            productId: i.menuItemId,
            productName: i.name,
            sku: i.menuItemId,
            hsnCode: '996331',
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            unit: 'portion',
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 5,
            cgstRate: 2.5,
            cgstAmount: itemCgst,
            sgstRate: 2.5,
            sgstAmount: itemSgst,
            igstRate: 0,
            igstAmount: 0,
            taxableAmount: itemTaxable,
            total: itemTaxable + itemCgst + itemSgst
          };
        })
    );

    if (invoiceItems.length === 0) {
      const itemTaxable = subtotal;
      const itemCgst = itemTaxable * 0.025;
      const itemSgst = itemTaxable * 0.025;
      invoiceItems = [
        {
          productId: 'item-dining',
          productName: `Dining Charges (Table ${table.tableNumber})`,
          sku: 'DINE-01',
          hsnCode: '996331',
          unitPrice: subtotal,
          quantity: 1,
          unit: 'portion',
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 5,
          cgstRate: 2.5,
          cgstAmount: itemCgst,
          sgstRate: 2.5,
          sgstAmount: itemSgst,
          igstRate: 0,
          igstAmount: 0,
          taxableAmount: itemTaxable,
          total: itemTaxable + itemCgst + itemSgst
        }
      ];
    }

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      orderId: settledOrder.id,
      tenantId,
      tenantName: tenant?.name || 'InfinityHub Restaurant',
      tenantAddress: 'Gourmet Dining Road',
      tenantGstin: '33AABCK1234F1Z5',
      tenantState: 'Tamil Nadu',
      tenantStateCode: '33',
      customerName: payload.customerName || 'Walk-in Dining Guest',
      customerPhone: payload.customerPhone || '',
      invoiceDate: new Date().toISOString(),
      isInterState: false,
      items: invoiceItems,
      hsnSummary: [],
      subtotal,
      totalDiscount: discount,
      taxableAmount: taxableSubtotal,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: 0,
      totalTax: cgst + sgst,
      roundingAdjustment: roundOff,
      grandTotal,
      grandTotalInWords: `${grandTotal} Rupees Only`,
      payments: payload.payments.map((p, pIdx) => ({
        id: `pay-${Date.now()}-${pIdx}`,
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        recordedAt: new Date().toISOString()
      })),
      qrPayload: '',
      createdAt: new Date().toISOString()
    };

    const updatedTable: RestaurantTable = {
      ...table,
      status: 'vacant',
      activeOrderId: undefined,
      activeKotIds: [],
      currentBillTotal: 0,
      guestCount: undefined,
      captainName: undefined,
      seatedAt: undefined,
      lastKotAt: undefined
    };

    setOrders(prev => {
      const exists = prev.some(o => o.id === settledOrder.id);
      return exists ? prev.map(o => (o.id === settledOrder.id ? settledOrder : o)) : [settledOrder, ...prev];
    });
    setTables(prev => prev.map(t => (t.id === tableId ? updatedTable : t)));

    return { order: settledOrder, invoice };
  }, [tables, orders, kots, sections, tenant, tenantId]);

  // Reset cleaning table to vacant
  const resetTableToVacant = useCallback(async (tableId: string): Promise<RestaurantTable> => {
    const table = tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const updatedTable: RestaurantTable = {
      ...table,
      status: 'vacant',
      guestCount: undefined,
      seatedAt: undefined,
      lastKotAt: undefined,
      currentBillTotal: 0,
      activeOrderId: undefined,
      activeKotIds: []
    };

    setTables(prev => prev.map(t => (t.id === tableId ? updatedTable : t)));
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
    return updatedTable;
  }, [tables, selectedTableId]);

  return (
    <RestaurantContext.Provider
      value={{
        sections,
        tables,
        menuItems,
        kots,
        orders,
        wasteLogs,
        tableAudits,
        selectedTableId,
        selectedTable,
        currentDraftItems,
        activeOrder,
        isLoading,
        occupancyStats,
        setSelectedTableId,
        seatTable,
        addToDraftOrder,
        updateDraftItemQuantity,
        updateDraftItemNotes,
        removeDraftItem,
        clearDraftOrder,
        fireKot,
        updateKotItemStatus,
        bumpKot,
        voidKotItem,
        transferTable,
        toggleMenuItemAvailability,
        settleTableBill,
        resetTableToVacant,
        refreshRestaurantData: loadTenantData
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
