import React from 'react';
import { Product, PosOrderItem, PosOrder, Invoice, RegisterShift, PosCustomer, PosPaymentRecord, PosReturn } from '@infinityhub/types';
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
    recordDrawerMovement: (type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale', amount: number, reason: string) => Promise<void>;
    closeShift: (actualCashCounted: number, notes?: string) => Promise<RegisterShift>;
    checkout: (paymentData: {
        payments: PosPaymentRecord[];
        tenderedAmount?: number;
        changeDue?: number;
        notes?: string;
    }) => Promise<{
        order: PosOrder;
        invoice: Invoice;
    }>;
    processReturn: (invoiceId: string, payload: {
        returnedItems: any[];
        refundMethod?: 'cash' | 'upi' | 'store_credit';
        cashierName?: string;
    }) => Promise<{
        creditNoteNumber: string;
        posReturn: PosReturn;
    }>;
    recordCustomerPayment: (customerId: string, amount: number, paymentMethod?: string, reference?: string) => Promise<void>;
    refreshPosData: () => Promise<void>;
}
export declare const PosProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const usePos: () => PosContextType;
export {};
//# sourceMappingURL=PosContext.d.ts.map