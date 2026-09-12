import {
  Product,
  Category,
  Brand,
  Supplier,
  Purchase,
  StockMovement,
  Tenant,
  PosOrder,
  Invoice,
  RegisterShift,
  CashDrawerMovement,
  PosCustomer,
  CustomerCreditTransaction,
  PosReturn
} from '@infinityhub/types';

export interface TenantDataPayload {
  tenant: Tenant;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
}

export interface SyncEvent<T = any> {
  type:
    | 'product:created'
    | 'product:updated'
    | 'product:deleted'
    | 'category:created'
    | 'category:updated'
    | 'category:deleted'
    | 'supplier:created'
    | 'supplier:updated'
    | 'supplier:deleted'
    | 'purchase:created'
    | 'purchase:deleted'
    | 'stock:adjusted'
    | 'pos:order_created'
    | 'pos:shift_opened'
    | 'pos:shift_closed'
    | 'pos:drawer_moved'
    | 'pos:return_created'
    | 'pos:invoice_voided'
    | 'tenant:updated';
  domain: 'inventory' | 'pos' | 'restaurant' | 'employee' | 'tenant';
  tenantId: string;
  action: 'create' | 'update' | 'delete' | 'adjust' | 'checkout' | 'open_shift' | 'close_shift' | 'drawer_movement' | 'return' | 'void';
  entityId?: string;
  data?: T;
  timestamp: string;
}

// Smart default base URL resolution
let customBaseUrl: string | null = null;

export function setApiBaseUrl(url: string) {
  customBaseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (customBaseUrl) return customBaseUrl;

  const g = globalThis as any;
  // In browser environment
  if (typeof g.window !== 'undefined' && g.window.location) {
    const isDev = g.window.location.port === '3000' || g.window.location.port === '5173';
    return isDev ? 'http://localhost:4000' : g.window.location.origin;
  }

  // In React Native / mobile environment:
  // Android emulator routes host machine loopback through 10.0.2.2
  // For iOS simulator or web preview, localhost:4000
  return 'http://10.0.2.2:4000';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.message) errMsg = parsed.message;
    } catch {
      if (errText) errMsg = errText;
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const apiClient = {
  setBaseUrl: setApiBaseUrl,
  getBaseUrl: getApiBaseUrl,

  // ============================================================
  // INVENTORY DOMAIN (Retail & Store Catalog Operations)
  // ============================================================
  inventory: {
    async getStoreData(tenantId: string): Promise<TenantDataPayload> {
      return request<TenantDataPayload>(`/api/v1/inventory/data?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async getProducts(tenantId: string): Promise<Product[]> {
      return request<Product[]>(`/api/v1/inventory/products?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async createProduct(tenantId: string, product: Partial<Product>): Promise<Product> {
      return request<Product>('/api/v1/inventory/products', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...product })
      });
    },

    async updateProduct(tenantId: string, productId: string, updates: Partial<Product>): Promise<Product> {
      return request<Product>(`/api/v1/inventory/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body: JSON.stringify({ tenantId, ...updates })
      });
    },

    async deleteProduct(tenantId: string, productId: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/v1/inventory/products/${encodeURIComponent(productId)}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE'
      });
    },

    async getCategories(tenantId: string): Promise<Category[]> {
      return request<Category[]>(`/api/v1/inventory/categories?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async createCategory(tenantId: string, data: { name: string; description?: string }): Promise<Category> {
      return request<Category>('/api/v1/inventory/categories', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...data })
      });
    },

    async updateCategory(tenantId: string, categoryId: string, updates: Partial<Category>): Promise<Category> {
      return request<Category>(`/api/v1/inventory/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PUT',
        body: JSON.stringify({ tenantId, ...updates })
      });
    },

    async deleteCategory(tenantId: string, categoryId: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/v1/inventory/categories/${encodeURIComponent(categoryId)}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE'
      });
    },

    async getSuppliers(tenantId: string): Promise<Supplier[]> {
      return request<Supplier[]>(`/api/v1/inventory/suppliers?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async createSupplier(tenantId: string, data: Partial<Supplier>): Promise<Supplier> {
      return request<Supplier>('/api/v1/inventory/suppliers', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...data })
      });
    },

    async updateSupplier(tenantId: string, supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
      return request<Supplier>(`/api/v1/inventory/suppliers/${encodeURIComponent(supplierId)}`, {
        method: 'PUT',
        body: JSON.stringify({ tenantId, ...updates })
      });
    },

    async deleteSupplier(tenantId: string, supplierId: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/v1/inventory/suppliers/${encodeURIComponent(supplierId)}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE'
      });
    },

    async getPurchases(tenantId: string): Promise<Purchase[]> {
      return request<Purchase[]>(`/api/v1/inventory/purchases?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async createPurchase(tenantId: string, data: Partial<Purchase>): Promise<Purchase> {
      return request<Purchase>('/api/v1/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...data })
      });
    },

    async deletePurchase(tenantId: string, purchaseId: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/v1/inventory/purchases/${encodeURIComponent(purchaseId)}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE'
      });
    },

    async adjustStock(
      tenantId: string,
      productId: string,
      newStock: number,
      reason: string
    ): Promise<{ product: Product; movement: StockMovement }> {
      return request<{ product: Product; movement: StockMovement }>('/api/v1/inventory/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({ tenantId, productId, newStock, reason })
      });
    },

    async getStockMovements(tenantId: string): Promise<StockMovement[]> {
      return request<StockMovement[]>(`/api/v1/inventory/stock/movements?tenantId=${encodeURIComponent(tenantId)}`);
    }
  },

  // ============================================================
  // POS DOMAIN (India Retail Billing, Shifts, Invoices & GST)
  // ============================================================
  pos: {
    async getInitData(tenantId: string): Promise<{
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
    }> {
      return request(`/api/v1/pos/init?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async getCurrentShift(tenantId: string): Promise<{ shift: RegisterShift | null }> {
      return request<{ shift: RegisterShift | null }>(`/api/v1/pos/shifts/current?tenantId=${encodeURIComponent(tenantId)}`);
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
    ): Promise<{ shift: RegisterShift }> {
      return request<{ shift: RegisterShift }>('/api/v1/pos/shifts/open', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
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
      return request<{ shift: RegisterShift; movement: CashDrawerMovement }>('/api/v1/pos/shifts/movement', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
    },

    async closeShift(
      tenantId: string,
      payload: {
        shiftId: string;
        actualCashCounted: number;
        closedBy?: string;
        notes?: string;
      }
    ): Promise<{ shift: RegisterShift }> {
      return request<{ shift: RegisterShift }>('/api/v1/pos/shifts/close', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
    },

    async getShifts(tenantId: string): Promise<RegisterShift[]> {
      return request<RegisterShift[]>(`/api/v1/pos/shifts?tenantId=${encodeURIComponent(tenantId)}`);
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
      return request<{ order: PosOrder; invoice: Invoice }>('/api/v1/pos/checkout', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
    },

    async getInvoices(tenantId: string, search?: string): Promise<Invoice[]> {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      return request<Invoice[]>(`/api/v1/pos/invoices?tenantId=${encodeURIComponent(tenantId)}${q}`);
    },

    async getInvoiceById(tenantId: string, id: string): Promise<Invoice> {
      return request<Invoice>(`/api/v1/pos/invoices/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`);
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
      return request<{ creditNoteNumber: string; posReturn: PosReturn }>(`/api/v1/pos/invoices/${encodeURIComponent(invoiceId)}/return`, {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
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
      return request<{ success: boolean; invoiceNumber: string }>(`/api/v1/pos/invoices/${encodeURIComponent(invoiceId)}/void`, {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
    },

    async getCustomers(tenantId: string): Promise<PosCustomer[]> {
      return request<PosCustomer[]>(`/api/v1/pos/customers?tenantId=${encodeURIComponent(tenantId)}`);
    },

    async createCustomer(tenantId: string, payload: Partial<PosCustomer>): Promise<PosCustomer> {
      return request<PosCustomer>('/api/v1/pos/customers', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
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
      return request<{ customer: PosCustomer; transaction: CustomerCreditTransaction }>(`/api/v1/pos/customers/${encodeURIComponent(customerId)}/payment`, {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...payload })
      });
    }
  },

  // ============================================================
  // RESTAURANT DOMAIN (Bistro & Kitchen - Ready for Upcoming Apps)
  // ============================================================
  restaurant: {
    async getActiveTables(_tenantId: string) {
      return [];
    },
    async getKitchenOrders(_tenantId: string) {
      return [];
    }
  },

  // ============================================================
  // EMPLOYEE DOMAIN (Staff & HR - Ready for Upcoming Apps)
  // ============================================================
  employee: {
    async getShifts(_tenantId: string) {
      return [];
    }
  },

  // ============================================================
  // REAL-TIME SYNCHRONIZATION ENGINE (SSE / Long-Poll Fallback)
  // ============================================================
  subscribeToTenantSync(
    tenantId: string,
    onEvent: (event: SyncEvent) => void
  ): () => void {
    const base = getApiBaseUrl();
    const url = `${base}/api/v1/sync/events?tenantId=${encodeURIComponent(tenantId)}`;

    // If browser supports EventSource
    const g = globalThis as any;
    if (typeof g.EventSource !== 'undefined') {
      let eventSource: any = null;
      try {
        eventSource = new g.EventSource(url);
        eventSource.onmessage = (e: any) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(parsed);
          } catch {
            // ignore heartbeat
          }
        };
        eventSource.onerror = () => {
          // Reconnects automatically in EventSource
        };
      } catch (err) {
        console.warn('Failed to initialize EventSource, using fallback', err);
      }

      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    }

    // Fallback polling for environments without native EventSource (e.g. basic React Native)
    let isSubscribed = true;
    let lastTimestamp = new Date().toISOString();

    const poll = async () => {
      if (!isSubscribed) return;
      try {
        const events = await request<SyncEvent[]>(
          `/api/v1/sync/poll?tenantId=${encodeURIComponent(tenantId)}&since=${encodeURIComponent(lastTimestamp)}`
        );
        if (Array.isArray(events) && events.length > 0) {
          lastTimestamp = events[events.length - 1].timestamp;
          events.forEach(onEvent);
        }
      } catch {
        // network retry
      }
      if (isSubscribed) {
        setTimeout(poll, 2500);
      }
    };

    const timer = setTimeout(poll, 1500);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }
};
