export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'damage'
  | 'correction'
  | 'stocktake'
  | 'transfer_in'
  | 'transfer_out'
  | 'bundle_assembly'
  | 'bundle_disassembly';

export type StockStatus = 'normal' | 'low' | 'out';

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  warehouseId?: string;
  warehouseName?: string;
  batchNumber?: string;
  serialNumbers?: string[];
  reason?: string;
  referenceId?: string; // e.g. purchase invoice, transfer id, stocktake id
  performedByUserId: string;
  performedByUserName: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string;
  adjustmentType: 'increase' | 'decrease' | 'damage' | 'correction';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedByUserId: string;
  performedByUserName: string;
  createdAt: string;
}

// ==========================================================
// MULTI-WAREHOUSE & LOCATION TYPES
// ==========================================================
export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  tenantId: string;
  warehouseId: string;
  code: string; // e.g. "BIN-A1", "RACK-04"
  name: string;
  description?: string;
}

export interface StockBalance {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

// ==========================================================
// STOCK TRANSFERS
// ==========================================================
export type TransferStatus = 'draft' | 'requested' | 'approved' | 'in_transit' | 'received' | 'cancelled';

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: TransferStatus;
  items: StockTransferItem[];
  notes?: string;
  createdByUserId: string;
  createdByUserName: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================================
// BATCHES & SHELF-LIFE EXPIRY
// ==========================================================
export interface Batch {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  warehouseId?: string;
  manufacturedAt?: string;
  expiryAt?: string;
  quantity: number;
  initialQuantity: number;
  status: 'active' | 'expired' | 'depleted';
  createdAt: string;
  updatedAt: string;
}

// ==========================================================
// SERIAL NUMBER TRACKING
// ==========================================================
export type SerialStatus = 'in_stock' | 'allocated' | 'sold' | 'defective';

export interface SerialNumber {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  serialNumber: string;
  status: SerialStatus;
  warehouseId?: string;
  purchaseReference?: string;
  assignedCustomer?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================================
// STOCKTAKE & CYCLE COUNTING
// ==========================================================
export type StocktakeStatus = 'in_progress' | 'reconciled' | 'cancelled';

export interface StocktakeItem {
  id: string;
  sessionId: string;
  productId: string;
  productName: string;
  sku: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number; // countedQuantity - systemQuantity
  unitCost: number;
}

export interface StocktakeSession {
  id: string;
  tenantId: string;
  sessionNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: StocktakeStatus;
  notes?: string;
  items: StocktakeItem[];
  initiatedByUserId: string;
  initiatedByUserName: string;
  reconciledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================================
// REORDER AUTOMATION & SUGGESTIONS
// ==========================================================
export interface ReorderRule {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  minStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  autoGeneratePO: boolean;
}

export interface PurchaseSuggestion {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  supplierId?: string;
  supplierName?: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
}

// ==========================================================
// INVENTORY INTELLIGENCE & FORECASTING
// ==========================================================
export interface DeadStockItem {
  productId: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  costPrice: number;
  capitalLocked: number;
  daysWithoutMovement: number;
}

export interface DemandTrend {
  productId: string;
  productName: string;
  sku: string;
  unitsSoldLast30Days: number;
  dailyVelocity: number;
  daysOfSupplyRemaining: number;
  stockoutRiskLevel: 'critical' | 'moderate' | 'healthy';
}

export interface ForecastingReport {
  tenantId: string;
  generatedAt: string;
  summary: {
    totalSkus: number;
    stockoutRiskCount: number;
    deadStockCount: number;
    totalCapitalLocked: number;
  };
  deadStock: DeadStockItem[];
  demandVelocity: DemandTrend[];
}

// ==========================================================
// PURCHASES & RECEIPTS
// ==========================================================
export type PurchaseStatus = 'completed' | 'pending' | 'cancelled';

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: PurchaseStatus;
  notes?: string;
  createdAt: string;
}
