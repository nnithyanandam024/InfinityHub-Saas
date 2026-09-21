import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  Category,
  PosOrderItem,
  PosOrder,
  Invoice,
  RegisterShift,
  PosCustomer,
  PosPaymentRecord,
  PosReturn
} from '@infinityhub/types';
import { apiClient } from '@infinityhub/api-client';
import { useTenant } from './TenantContext';
import { useAuth } from './AuthContext';
import { calculateItemGst, buildHsnSummary } from '../utils/mobileGstUtils';
import { numberToIndianWords } from '../utils/mobileNumberToWords';
import { generateUpiIntentUri } from '../utils/mobileUpiQr';

export interface PosTaxConfig {
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  legalName: string;
  tradeName: string;
  address: string;
  phone: string;
  upiId: string;
  currency: string;
  currencySymbol: string;
}

export interface AppliedDiscount {
  type: 'percent' | 'flat';
  value: number;
}

interface PosContextType {
  cart: PosOrderItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  appliedDiscount: AppliedDiscount | null;
  setAppliedDiscount: (discount: AppliedDiscount | null) => void;
  selectedCustomer: PosCustomer | null;
  setSelectedCustomer: (customer: PosCustomer | null) => void;
  currentShift: RegisterShift | null;
  invoices: Invoice[];
  customers: PosCustomer[];
  taxConfig: PosTaxConfig;
  isLoading: boolean;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    rawTotal: number;
    grandTotal: number;
    roundingAdjustment: number;
    totalItemCount: number;
  };
  openShift: (startingFloat: number, notes?: string) => Promise<RegisterShift>;
  recordDrawerMovement: (
    type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale',
    amount: number,
    reason: string
  ) => Promise<void>;
  closeShift: (actualCashCounted: number, notes?: string) => Promise<RegisterShift>;
  checkout: (paymentData: {
    payments: PosPaymentRecord[];
    tenderedAmount?: number;
    changeDue?: number;
    notes?: string;
  }) => Promise<{ order: PosOrder; invoice: Invoice }>;
  processReturn: (
    invoiceId: string,
    payload: {
      returnedItems: any[];
      refundMethod?: 'cash' | 'upi' | 'store_credit';
      cashierName?: string;
    }
  ) => Promise<{ creditNoteNumber: string; posReturn: PosReturn }>;
  recordCustomerPayment: (
    customerId: string,
    amount: number,
    paymentMethod?: string,
    reference?: string
  ) => Promise<void>;
  refreshPosData: () => Promise<void>;
}

const DEFAULT_TAX_CONFIG: PosTaxConfig = {
  gstin: '33AABCK1234F1Z5',
  pan: 'AABCK1234F',
  state: 'Tamil Nadu',
  stateCode: '33',
  legalName: 'Kumar Enterprises Retail Pvt Ltd',
  tradeName: 'Kumar Supermarket & Departmental Stores',
  address: '142, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
  phone: '+91 98421 55678',
  upiId: 'kumarsupermarket@okaxis',
  currency: 'INR',
  currencySymbol: '₹'
};

const PosContext = createContext<PosContextType | undefined>(undefined);

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-1001',
    orderId: 'ord-1001',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    tenantAddress: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    tenantGstin: '33AABCK1234F1Z5',
    tenantState: 'Tamil Nadu',
    tenantStateCode: '33',
    customerName: 'Ramesh Kumar',
    customerPhone: '+91 98430 11223',
    invoiceDate: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isInterState: false,
    items: [
      {
        productId: 'prod-city-1',
        productName: 'Bosch GSB 500W Professional Impact Drill',
        sku: 'DRL-500W',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 2899,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 2456.78,
        cgstAmount: 221.11,
        sgstAmount: 221.11,
        total: 2899
      },
      {
        productId: 'prod-city-2',
        productName: 'Stanley 5M Steel Measuring Tape (Auto-Lock)',
        sku: 'TAP-5M',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 299,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 253.39,
        cgstAmount: 22.81,
        sgstAmount: 22.81,
        total: 299
      }
    ],
    hsnSummary: [],
    subtotal: 3198,
    totalDiscount: 0,
    taxableAmount: 2710.17,
    totalCgst: 243.92,
    totalSgst: 243.92,
    totalIgst: 0,
    totalTax: 487.83,
    roundingAdjustment: 0,
    grandTotal: 3198,
    grandTotalInWords: 'Three Thousand One Hundred Ninety-Eight Rupees Only',
    payments: [{ method: 'upi', amount: 3198, referenceId: 'UPI/98430/1122' }],
    qrPayload: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-1002',
    orderId: 'ord-1002',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    tenantAddress: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    tenantGstin: '33AABCK1234F1Z5',
    tenantState: 'Tamil Nadu',
    tenantStateCode: '33',
    customerName: 'Priya Sundaram',
    customerPhone: '+91 94432 99887',
    invoiceDate: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    isInterState: false,
    items: [
      {
        productId: 'prod-city-4',
        productName: 'Philips 9W Cool Daylight LED Bulb B22 Base',
        sku: 'LED-9W',
        unit: 'pcs',
        quantity: 4,
        unitPrice: 120,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 406.78,
        cgstAmount: 36.61,
        sgstAmount: 36.61,
        total: 480
      },
      {
        productId: 'prod-city-7',
        productName: 'Anchor Roma 16A 3-Pin Modular Switch & Socket Combo',
        sku: 'SW-ROM-16A',
        unit: 'pcs',
        quantity: 2,
        unitPrice: 220,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 372.88,
        cgstAmount: 33.56,
        sgstAmount: 33.56,
        total: 440
      }
    ],
    hsnSummary: [],
    subtotal: 920,
    totalDiscount: 0,
    taxableAmount: 779.66,
    totalCgst: 70.17,
    totalSgst: 70.17,
    totalIgst: 0,
    totalTax: 140.34,
    roundingAdjustment: 0,
    grandTotal: 920,
    grandTotalInWords: 'Nine Hundred Twenty Rupees Only',
    payments: [{ method: 'cash', amount: 920 }],
    qrPayload: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString()
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2026-1003',
    orderId: 'ord-1003',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    tenantAddress: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    tenantGstin: '33AABCK1234F1Z5',
    tenantState: 'Tamil Nadu',
    tenantStateCode: '33',
    customerName: 'Murugan Textiles',
    customerPhone: '+91 98940 44556',
    invoiceDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isInterState: false,
    items: [
      {
        productId: 'prod-city-5',
        productName: 'Asian Paints Apex Weatherproof Emulsion White 4L',
        sku: 'PNT-APX-4L',
        unit: 'pack',
        quantity: 2,
        unitPrice: 1350,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 2288.14,
        cgstAmount: 205.93,
        sgstAmount: 205.93,
        total: 2700
      },
      {
        productId: 'prod-city-6',
        productName: 'Fevicol SH Synthetic Resin Wood Adhesive 1kg',
        sku: 'ADH-SH-1K',
        unit: 'pack',
        quantity: 3,
        unitPrice: 290,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 737.29,
        cgstAmount: 66.36,
        sgstAmount: 66.36,
        total: 870
      }
    ],
    hsnSummary: [],
    subtotal: 3570,
    totalDiscount: 0,
    taxableAmount: 3025.42,
    totalCgst: 272.29,
    totalSgst: 272.29,
    totalIgst: 0,
    totalTax: 544.58,
    roundingAdjustment: 0,
    grandTotal: 3570,
    grandTotalInWords: 'Three Thousand Five Hundred Seventy Rupees Only',
    payments: [{ method: 'card', amount: 3570, referenceId: 'CARD-AUTH-8821' }],
    qrPayload: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'INV-2026-1004',
    orderId: 'ord-1004',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    tenantAddress: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    tenantGstin: '33AABCK1234F1Z5',
    tenantState: 'Tamil Nadu',
    tenantStateCode: '33',
    customerName: 'Karthik Raja',
    customerPhone: '+91 97890 33445',
    invoiceDate: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isInterState: false,
    items: [
      {
        productId: 'prod-city-3',
        productName: 'Taparia 8-Piece Magnetic Screwdriver Set',
        sku: 'SCR-8PC',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 480,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 406.78,
        cgstAmount: 36.61,
        sgstAmount: 36.61,
        total: 480
      },
      {
        productId: 'prod-city-8',
        productName: 'WD-40 Multi-Use Rust Remover & Lubricant Spray 400ml',
        sku: 'WD40-400ML',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 390,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 330.51,
        cgstAmount: 29.75,
        sgstAmount: 29.75,
        total: 390
      }
    ],
    hsnSummary: [],
    subtotal: 870,
    totalDiscount: 0,
    taxableAmount: 737.29,
    totalCgst: 66.36,
    totalSgst: 66.36,
    totalIgst: 0,
    totalTax: 132.71,
    roundingAdjustment: 0,
    grandTotal: 870,
    grandTotalInWords: 'Eight Hundred Seventy Rupees Only',
    payments: [{ method: 'credit_khata', amount: 870 }],
    qrPayload: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'inv-1005',
    invoiceNumber: 'INV-2026-1005',
    orderId: 'ord-1005',
    tenantId: 'tenant-city-retail',
    tenantName: 'City Retail Hardware',
    tenantAddress: '104 L.B. Shastri Road, Industrial Area, Coimbatore',
    tenantGstin: '33AABCK1234F1Z5',
    tenantState: 'Tamil Nadu',
    tenantStateCode: '33',
    customerName: 'Walk-in Customer',
    customerPhone: '+91 99401 55667',
    invoiceDate: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    isInterState: false,
    items: [
      {
        productId: 'prod-city-9',
        productName: 'Schneider Electric Acti9 32A Double Pole MCB',
        sku: 'MCB-DP-32A',
        unit: 'pcs',
        quantity: 2,
        unitPrice: 690,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        igstAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 1169.49,
        cgstAmount: 105.25,
        sgstAmount: 105.25,
        total: 1380
      }
    ],
    hsnSummary: [],
    subtotal: 1380,
    totalDiscount: 0,
    taxableAmount: 1169.49,
    totalCgst: 105.25,
    totalSgst: 105.25,
    totalIgst: 0,
    totalTax: 210.51,
    roundingAdjustment: 0,
    grandTotal: 1380,
    grandTotalInWords: 'One Thousand Three Hundred Eighty Rupees Only',
    payments: [{ method: 'cash', amount: 1380 }],
    qrPayload: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  const [cart, setCart] = useState<PosOrderItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [currentShift, setCurrentShift] = useState<RegisterShift | null>({
    id: 'shift-mobile-active',
    tenantId: tenant?.id || 'tenant-city-retail',
    registerId: 'REG-01',
    cashierId: user?.id || 'usr-mobile-cashier',
    cashierName: user?.name || 'Mobile Cashier',
    startTime: new Date(Date.now() - 1000 * 60 * 195).toISOString(),
    status: 'open',
    startingFloat: 2000,
    cashSales: 4850,
    upiSales: 3200,
    cardSales: 1400,
    creditKhataSales: 870,
    cashIn: 0,
    cashOut: 0,
    expectedCashInDrawer: 6850,
    totalTransactions: 7,
    voidCount: 0,
    noSaleDrawerPopCount: 0
  });
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [customers, setCustomers] = useState<PosCustomer[]>([
    {
      id: 'cust-1',
      tenantId: tenant?.id || 'tenant-city-retail',
      name: 'Ramesh Kumar',
      phone: '+91 98430 11223',
      currentBalance: 1450,
      totalPurchases: 18500,
      creditLimit: 5000,
      gstin: '33AABCR1234F1Z1',
      stateCode: '33',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-2',
      tenantId: tenant?.id || 'tenant-city-retail',
      name: 'Priya Sundaram',
      phone: '+91 94432 99887',
      currentBalance: 3200,
      totalPurchases: 9400,
      creditLimit: 8000,
      stateCode: '33',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-3',
      tenantId: tenant?.id || 'tenant-city-retail',
      name: 'Murugan Textiles',
      phone: '+91 98940 44556',
      currentBalance: 0,
      totalPurchases: 42000,
      creditLimit: 15000,
      gstin: '33AABCM9988E1Z9',
      stateCode: '33',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-4',
      tenantId: tenant?.id || 'tenant-city-retail',
      name: 'Karthik Raja',
      phone: '+91 97890 33445',
      currentBalance: 870,
      totalPurchases: 14200,
      creditLimit: 10000,
      stateCode: '33',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  const [taxConfig, setTaxConfig] = useState<PosTaxConfig>(DEFAULT_TAX_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tenantId = tenant?.id || 'tenant-city-retail';

  // Load Initial POS Data
  const loadPosData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.pos.getInitData(tenantId);
      if (data) {
        if (data.currentShift) setCurrentShift(data.currentShift);
        if (data.recentInvoices && data.recentInvoices.length > 0) {
          setInvoices(data.recentInvoices);
        } else {
          setInvoices(MOCK_INVOICES);
        }
        if (data.customers && data.customers.length > 0) {
          setCustomers(data.customers);
        }
        if (data.taxConfig) setTaxConfig(data.taxConfig);
      }
    } catch {
      // Fallback offline mock shift and customer state if API is offline
      setCurrentShift({
        id: 'shift-mobile-active',
        tenantId,
        registerId: 'REG-01',
        cashierId: user?.id || 'usr-mobile-cashier',
        cashierName: user?.name || 'Mobile Cashier',
        startTime: new Date(Date.now() - 1000 * 60 * 195).toISOString(),
        status: 'open',
        startingFloat: 2000,
        cashSales: 4850,
        upiSales: 3200,
        cardSales: 1400,
        creditKhataSales: 870,
        cashIn: 0,
        cashOut: 0,
        expectedCashInDrawer: 6850,
        totalTransactions: 7,
        voidCount: 0,
        noSaleDrawerPopCount: 0
      });
      setInvoices(MOCK_INVOICES);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, user]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  // Add Item to Cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id);
      const taxRate = 18; // Default GST rate
      const unitPrice = product.sellingPrice || 100;

      if (existingIdx !== -1) {
        const item = prev[existingIdx];
        const newQty = item.quantity + quantity;
        const gst = calculateItemGst(unitPrice, newQty, taxRate, 0);

        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          taxableAmount: gst.taxableAmount,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          total: gst.lineTotal
        };
        return updated;
      }

      const gst = calculateItemGst(unitPrice, quantity, taxRate, 0);
      const newItem: PosOrderItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        hsnCode: (product as any).hsnCode || '0902',
        unitPrice,
        mrp: product.costPrice ? product.costPrice * 1.3 : unitPrice,
        quantity,
        unit: product.unit || 'pcs',
        discountPercent: 0,
        discountAmount: 0,
        taxRate,
        cgstRate: gst.cgstRate,
        cgstAmount: gst.cgstAmount,
        sgstRate: gst.sgstRate,
        sgstAmount: gst.sgstAmount,
        igstRate: 0,
        igstAmount: 0,
        taxableAmount: gst.taxableAmount,
        total: gst.lineTotal
      };

      return [...prev, newItem];
    });
  }, []);

  // Update Cart Item Quantity
  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) {
        return prev.filter(item => item.productId !== productId);
      }
      return prev.map(item => {
        if (item.productId !== productId) return item;
        const gst = calculateItemGst(item.unitPrice, quantity, item.taxRate, item.discountAmount);
        return {
          ...item,
          quantity,
          taxableAmount: gst.taxableAmount,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          total: gst.lineTotal
        };
      });
    });
  }, []);

  // Remove From Cart
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  // Clear Cart
  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
    setSelectedCustomer(null);
  }, []);

  // Calculate Totals
  const totals = useMemo(() => {
    const rawSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    let discountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percent') {
        discountAmount = Math.round((rawSubtotal * (appliedDiscount.value / 100)) * 100) / 100;
      } else {
        discountAmount = Math.min(rawSubtotal, appliedDiscount.value);
      }
    }

    const netSubtotal = Math.max(0, rawSubtotal - discountAmount);
    // Back-calculate 18% standard tax
    const taxableAmount = Math.round((netSubtotal / 1.18) * 100) / 100;
    const totalTax = Math.round((netSubtotal - taxableAmount) * 100) / 100;
    const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
    const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

    const rawTotal = taxableAmount + cgstAmount + sgstAmount;
    const grandTotal = Math.round(rawTotal);
    const roundingAdjustment = Math.round((grandTotal - rawTotal) * 100) / 100;

    return {
      subtotal: rawSubtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      rawTotal,
      grandTotal,
      roundingAdjustment,
      totalItemCount
    };
  }, [cart, appliedDiscount]);

  // Open Shift
  const openShift = async (startingFloat: number, notes?: string): Promise<RegisterShift> => {
    try {
      const res = await apiClient.pos.openShift(tenantId, {
        registerId: 'REG-MOBILE-01',
        cashierId: user?.id || 'usr-mobile',
        cashierName: user?.name || 'Mobile Cashier',
        startingFloat,
        notes
      });
      setCurrentShift(res.shift);
      return res.shift;
    } catch {
      const mockShift: RegisterShift = {
        id: `shift-${Date.now()}`,
        tenantId,
        registerId: 'REG-MOBILE-01',
        cashierId: user?.id || 'usr-mobile',
        cashierName: user?.name || 'Mobile Cashier',
        startTime: new Date().toISOString(),
        status: 'open',
        startingFloat,
        cashSales: 0,
        upiSales: 0,
        cardSales: 0,
        creditKhataSales: 0,
        cashIn: 0,
        cashOut: 0,
        expectedCashInDrawer: startingFloat,
        totalTransactions: 0,
        voidCount: 0,
        noSaleDrawerPopCount: 0,
        notes
      };
      setCurrentShift(mockShift);
      return mockShift;
    }
  };

  // Cash Drawer Movement
  const recordDrawerMovement = async (
    type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale',
    amount: number,
    reason: string
  ): Promise<void> => {
    try {
      const res = await apiClient.pos.recordDrawerMovement(tenantId, {
        shiftId: currentShift?.id || 'shift-mobile-active',
        cashierId: user?.id || 'usr-mobile',
        cashierName: user?.name || 'Mobile Cashier',
        type,
        amount,
        reason
      });
      if (res && res.shift) setCurrentShift(res.shift);
    } catch {
      if (currentShift) {
        setCurrentShift({
          ...currentShift,
          cashIn: type === 'cash_in' ? currentShift.cashIn + amount : currentShift.cashIn,
          cashOut: type === 'cash_out' ? currentShift.cashOut + amount : currentShift.cashOut,
          expectedCashInDrawer:
            type === 'cash_in'
              ? currentShift.expectedCashInDrawer + amount
              : type === 'cash_out'
              ? currentShift.expectedCashInDrawer - amount
              : currentShift.expectedCashInDrawer
        });
      }
    }
  };

  // Close Shift (Z-Report)
  const closeShift = async (actualCashCounted: number, notes?: string): Promise<RegisterShift> => {
    try {
      const res = await apiClient.pos.closeShift(tenantId, {
        shiftId: currentShift?.id || 'shift-mobile-active',
        actualCashCounted,
        closedBy: user?.name || 'Mobile Cashier',
        notes
      });
      setCurrentShift(null);
      return res.shift;
    } catch {
      const expected = currentShift?.expectedCashInDrawer || 0;
      const closedShift: RegisterShift = {
        ...(currentShift as RegisterShift),
        endTime: new Date().toISOString(),
        status: 'closed',
        actualCashCounted,
        cashVariance: actualCashCounted - expected,
        notes
      };
      setCurrentShift(null);
      return closedShift;
    }
  };

  // Complete Checkout
  const checkout = async (paymentData: {
    payments: PosPaymentRecord[];
    tenderedAmount?: number;
    changeDue?: number;
    notes?: string;
  }): Promise<{ order: PosOrder; invoice: Invoice }> => {
    const payload = {
      cashierId: user?.id || 'usr-mobile',
      cashierName: user?.name || 'Mobile Cashier',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      customerGstin: selectedCustomer?.gstin,
      customerStateCode: selectedCustomer?.stateCode || '33',
      items: cart,
      payments: paymentData.payments,
      tenderedAmount: paymentData.tenderedAmount,
      changeDue: paymentData.changeDue,
      notes: paymentData.notes
    };

    try {
      const res = await apiClient.pos.checkout(tenantId, payload);
      setInvoices(prev => [res.invoice, ...prev]);
      clearCart();
      loadPosData();
      return res;
    } catch {
      // Offline fallback invoice generation
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `ord-${Date.now()}`;
      const now = new Date().toISOString();

      const hsnSummary = buildHsnSummary(cart);
      const grandTotalInWords = numberToIndianWords(totals.grandTotal);
      const upiQrString = generateUpiIntentUri(
        taxConfig.upiId,
        taxConfig.tradeName,
        totals.grandTotal,
        invoiceNumber
      );

      const newOrder: PosOrder = {
        id: orderId,
        orderNumber: `ORD-${Date.now()}`,
        invoiceNumber,
        tenantId,
        cashierId: user?.id || 'usr-mobile',
        cashierName: user?.name || 'Mobile Cashier',
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        customerGstin: selectedCustomer?.gstin,
        items: cart,
        subtotal: totals.subtotal,
        totalDiscount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        totalCgst: totals.cgstAmount,
        totalSgst: totals.sgstAmount,
        totalIgst: 0,
        totalTax: totals.cgstAmount + totals.sgstAmount,
        roundingAdjustment: totals.roundingAdjustment,
        grandTotal: totals.grandTotal,
        tenderedAmount: paymentData.tenderedAmount || totals.grandTotal,
        changeDue: paymentData.changeDue || 0,
        payments: paymentData.payments,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        upiQrString,
        notes: paymentData.notes,
        createdAt: now,
        updatedAt: now
      };

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        orderId,
        tenantId,
        tenantName: taxConfig.tradeName,
        tenantAddress: taxConfig.address,
        tenantGstin: taxConfig.gstin,
        tenantPan: taxConfig.pan,
        tenantState: taxConfig.state,
        tenantStateCode: taxConfig.stateCode,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        customerGstin: selectedCustomer?.gstin,
        invoiceDate: now,
        isInterState: false,
        items: cart,
        hsnSummary,
        subtotal: totals.subtotal,
        totalDiscount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        totalCgst: totals.cgstAmount,
        totalSgst: totals.sgstAmount,
        totalIgst: 0,
        totalTax: totals.cgstAmount + totals.sgstAmount,
        roundingAdjustment: totals.roundingAdjustment,
        grandTotal: totals.grandTotal,
        grandTotalInWords,
        payments: paymentData.payments,
        qrPayload: upiQrString,
        createdAt: now
      };

      // If charged to Khata, update customer balance locally
      if (selectedCustomer) {
        const khataPayment = paymentData.payments.find(p => p.method === 'credit_khata');
        if (khataPayment) {
          setCustomers(prev =>
            prev.map(c =>
              c.id === selectedCustomer.id
                ? { ...c, currentBalance: c.currentBalance + khataPayment.amount }
                : c
            )
          );
        }
      }

      setInvoices(prev => [newInvoice, ...prev]);
      clearCart();
      return { order: newOrder, invoice: newInvoice };
    }
  };

  // Sales Return
  const processReturn = async (
    invoiceId: string,
    payload: {
      returnedItems: any[];
      refundMethod?: 'cash' | 'upi' | 'store_credit';
      cashierName?: string;
    }
  ): Promise<{ creditNoteNumber: string; posReturn: PosReturn }> => {
    return apiClient.pos.processReturn(tenantId, invoiceId, payload);
  };

  // Record Customer Repayment
  const recordCustomerPayment = async (
    customerId: string,
    amount: number,
    paymentMethod: string = 'cash',
    reference?: string
  ): Promise<void> => {
    try {
      await apiClient.pos.recordCustomerPayment(tenantId, customerId, {
        amount,
        paymentMethod,
        reference
      });
      loadPosData();
    } catch {
      setCustomers(prev =>
        prev.map(c =>
          c.id === customerId
            ? { ...c, currentBalance: Math.max(0, c.currentBalance - amount) }
            : c
        )
      );
    }
  };

  return (
    <PosContext.Provider
      value={{
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        appliedDiscount,
        setAppliedDiscount,
        selectedCustomer,
        setSelectedCustomer,
        currentShift,
        invoices,
        customers,
        taxConfig,
        isLoading,
        totals,
        openShift,
        recordDrawerMovement,
        closeShift,
        checkout,
        processReturn,
        recordCustomerPayment,
        refreshPosData: loadPosData
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = (): PosContextType => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
