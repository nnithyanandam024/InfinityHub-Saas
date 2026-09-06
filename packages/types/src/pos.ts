export type PosPaymentMethod = 'cash' | 'upi' | 'card' | 'split' | 'credit_khata';

export type PosPaymentStatus = 'paid' | 'partial' | 'pending' | 'refunded';

export type PosOrderStatus = 'completed' | 'voided' | 'returned';

export interface PosPaymentRecord {
  method: PosPaymentMethod;
  amount: number;
  referenceId?: string; // UTR for UPI, Auth code for Card
  upiId?: string;
  cardLast4?: string;
  notes?: string;
}

export interface PosOrderItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  hsnCode?: string;
  unitPrice: number;
  mrp?: number;
  quantity: number;
  unit: string;
  discountPercent: number;
  discountAmount: number;
  taxRate: number; // e.g. 5, 12, 18, 28
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  taxableAmount: number;
  total: number;
}

export interface PosOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerStateCode?: string;
  items: PosOrderItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundingAdjustment: number;
  grandTotal: number;
  tenderedAmount: number;
  changeDue: number;
  payments: PosPaymentRecord[];
  paymentStatus: PosPaymentStatus;
  orderStatus: PosOrderStatus;
  upiQrString?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HsnSummaryLine {
  hsnCode: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  tenantAddress: string;
  tenantGstin: string;
  tenantPan?: string;
  tenantState: string;
  tenantStateCode: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerStateCode?: string;
  invoiceDate: string;
  isInterState: boolean;
  items: PosOrderItem[];
  hsnSummary: HsnSummaryLine[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundingAdjustment: number;
  grandTotal: number;
  grandTotalInWords: string;
  payments: PosPaymentRecord[];
  qrPayload: string;
  createdAt: string;
}

export interface RegisterShift {
  id: string;
  tenantId: string;
  registerId: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  startingFloat: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditKhataSales: number;
  cashIn: number;
  cashOut: number;
  expectedCashInDrawer: number;
  actualCashCounted?: number;
  cashVariance?: number;
  totalTransactions: number;
  voidCount: number;
  noSaleDrawerPopCount: number;
  notes?: string;
  closedBy?: string;
}

export type DrawerMovementType =
  | 'float_in'
  | 'cash_in'
  | 'cash_out'
  | 'drawer_pop_no_sale'
  | 'sale_cash'
  | 'refund_cash';

export interface CashDrawerMovement {
  id: string;
  shiftId: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  type: DrawerMovementType;
  amount: number;
  reason: string;
  managerApprovedBy?: string;
  timestamp: string;
}

export interface PosCustomer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  stateCode?: string;
  creditLimit: number;
  currentBalance: number; // outstanding khata debt
  totalPurchases: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreditTransaction {
  id: string;
  customerId: string;
  tenantId: string;
  invoiceId?: string;
  type: 'credit_sale' | 'payment_received' | 'credit_note';
  amount: number;
  balanceAfter: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface PosReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  refundAmount: number;
  reason: string;
}

export interface PosReturn {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  creditNoteNumber: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  managerApprovedBy?: string;
  returnedItems: PosReturnItem[];
  totalRefundAmount: number;
  refundMethod: 'cash' | 'upi' | 'store_credit';
  createdAt: string;
}

export interface PosAuditLog {
  id: string;
  tenantId: string;
  cashierId: string;
  cashierName: string;
  action: 'line_item_void' | 'ticket_void' | 'price_override' | 'manual_discount' | 'drawer_pop' | 'shift_close';
  entityId?: string;
  managerApprovedBy?: string;
  reason?: string;
  details?: Record<string, any>;
  timestamp: string;
}
