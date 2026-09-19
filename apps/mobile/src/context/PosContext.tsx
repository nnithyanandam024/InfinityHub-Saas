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

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  const [cart, setCart] = useState<PosOrderItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [currentShift, setCurrentShift] = useState<RegisterShift | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [taxConfig, setTaxConfig] = useState<PosTaxConfig>(DEFAULT_TAX_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tenantId = tenant?.id || 'tenant-kumar-stores';

  // Load Initial POS Data
  const loadPosData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.pos.getInitData(tenantId);
      if (data) {
        if (data.currentShift) setCurrentShift(data.currentShift);
        if (data.recentInvoices) setInvoices(data.recentInvoices);
        if (data.customers) setCustomers(data.customers);
        if (data.taxConfig) setTaxConfig(data.taxConfig);
      }
    } catch {
      // Fallback offline mock shift and customer state if API is offline
      setCurrentShift({
        id: 'shift-mobile-active',
        tenantId,
        registerId: 'REG-MOBILE-01',
        cashierId: user?.id || 'usr-mobile-cashier',
        cashierName: user?.name || 'Mobile Cashier',
        startTime: new Date().toISOString(),
        status: 'open',
        startingFloat: 1500,
        cashSales: 3450,
        upiSales: 2180,
        cardSales: 950,
        creditKhataSales: 800,
        cashIn: 0,
        cashOut: 0,
        expectedCashInDrawer: 4950,
        totalTransactions: 6,
        voidCount: 0,
        noSaleDrawerPopCount: 0
      });

      setCustomers([
        {
          id: 'cust-1',
          tenantId,
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
          tenantId,
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
          tenantId,
          name: 'Murugan Textiles',
          phone: '+91 98940 44556',
          currentBalance: 0,
          totalPurchases: 42000,
          creditLimit: 15000,
          gstin: '33AABCM9988E1Z9',
          stateCode: '33',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
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
