import { apiClient } from '@infinityhub/api-client';
import type {
  PosOrder,
  Invoice,
  RegisterShift,
  CashDrawerMovement,
  PosCustomer,
  CustomerCreditTransaction,
  PosReturn,
  Product,
  Category
} from '@infinityhub/types';

export interface PosInitResponse {
  products: Product[];
  categories: Category[];
  currentShift: RegisterShift | null;
  recentInvoices: Invoice[];
  customers: PosCustomer[];
  taxConfig: {
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
  };
}

export const posService = {
  async getInitData(tenantId: string): Promise<PosInitResponse> {
    return apiClient.pos.getInitData(tenantId);
  },

  async getCurrentShift(tenantId: string): Promise<RegisterShift | null> {
    const res = await apiClient.pos.getCurrentShift(tenantId);
    return res.shift;
  },

  async openShift(
    tenantId: string,
    payload: {
      registerId?: string;
      cashierId?: string;
      cashierName?: string;
      startingFloat: number;
      notes?: string;
    }
  ): Promise<RegisterShift> {
    const res = await apiClient.pos.openShift(tenantId, payload);
    return res.shift;
  },

  async recordDrawerMovement(
    tenantId: string,
    payload: {
      shiftId: string;
      cashierId?: string;
      cashierName?: string;
      type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale';
      amount: number;
      reason: string;
      managerApprovedBy?: string;
    }
  ): Promise<{ shift: RegisterShift; movement: CashDrawerMovement }> {
    return apiClient.pos.recordDrawerMovement(tenantId, payload);
  },

  async closeShift(
    tenantId: string,
    payload: {
      shiftId: string;
      actualCashCounted: number;
      closedBy?: string;
      notes?: string;
    }
  ): Promise<RegisterShift> {
    const res = await apiClient.pos.closeShift(tenantId, payload);
    return res.shift;
  },

  async getShifts(tenantId: string): Promise<RegisterShift[]> {
    return apiClient.pos.getShifts(tenantId);
  },

  async checkout(
    tenantId: string,
    payload: {
      cashierId?: string;
      cashierName?: string;
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      customerGstin?: string;
      customerStateCode?: string;
      items: any[];
      payments: any[];
      tenderedAmount?: number;
      changeDue?: number;
      notes?: string;
    }
  ): Promise<{ order: PosOrder; invoice: Invoice }> {
    return apiClient.pos.checkout(tenantId, payload);
  },

  async getInvoices(tenantId: string, search?: string): Promise<Invoice[]> {
    return apiClient.pos.getInvoices(tenantId, search);
  },

  async getInvoiceById(tenantId: string, id: string): Promise<Invoice> {
    return apiClient.pos.getInvoiceById(tenantId, id);
  },

  async processReturn(
    tenantId: string,
    invoiceId: string,
    payload: {
      returnedItems: any[];
      refundMethod?: 'cash' | 'upi' | 'store_credit';
      managerApprovedBy?: string;
      cashierId?: string;
      cashierName?: string;
    }
  ): Promise<{ creditNoteNumber: string; posReturn: PosReturn }> {
    return apiClient.pos.processReturn(tenantId, invoiceId, payload);
  },

  async voidInvoice(
    tenantId: string,
    invoiceId: string,
    payload: {
      managerPin?: string;
      managerApprovedBy?: string;
      reason?: string;
      cashierId?: string;
      cashierName?: string;
    }
  ): Promise<{ success: boolean; invoiceNumber: string }> {
    return apiClient.pos.voidInvoice(tenantId, invoiceId, payload);
  },

  async getCustomers(tenantId: string): Promise<PosCustomer[]> {
    return apiClient.pos.getCustomers(tenantId);
  },

  async createCustomer(tenantId: string, payload: Partial<PosCustomer>): Promise<PosCustomer> {
    return apiClient.pos.createCustomer(tenantId, payload);
  },

  async recordCustomerPayment(
    tenantId: string,
    customerId: string,
    payload: {
      amount: number;
      paymentMethod?: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<{ customer: PosCustomer; transaction: CustomerCreditTransaction }> {
    return apiClient.pos.recordCustomerPayment(tenantId, customerId, payload);
  }
};
