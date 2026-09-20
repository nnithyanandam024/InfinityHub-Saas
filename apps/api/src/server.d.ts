import type { Product, Category, Supplier, Purchase, StockMovement, Tenant, PosOrder, Invoice, RegisterShift, CashDrawerMovement, PosCustomer, CustomerCreditTransaction, PosReturn, PosAuditLog } from '@infinityhub/types';
export interface TenantData {
    tenant: Tenant;
    users?: any[];
    brands?: any[];
    categories: Category[];
    suppliers: Supplier[];
    products: Product[];
    variants?: any[];
    bundles?: any[];
    purchases: Purchase[];
    stockMovements: StockMovement[];
    posOrders?: PosOrder[];
    invoices?: Invoice[];
    shifts?: RegisterShift[];
    cashMovements?: CashDrawerMovement[];
    posCustomers?: PosCustomer[];
    creditTransactions?: CustomerCreditTransaction[];
    posAuditLogs?: PosAuditLog[];
    posReturns?: PosReturn[];
}
export interface ServerSyncEvent {
    type: string;
    domain: string;
    tenantId: string;
    action: string;
    entityId?: string;
    data?: any;
    timestamp: string;
}
//# sourceMappingURL=server.d.ts.map