export interface StockSummaryReport {
  totalProducts: number;
  totalStockQuantity: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  normalStockCount: number;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  deficit: number;
  unit: string;
  unitCost: number;
}

export interface PurchaseSummaryReport {
  totalPurchasesCount: number;
  totalAmountSpent: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    purchaseCount: number;
    totalSpend: number;
  }>;
}
