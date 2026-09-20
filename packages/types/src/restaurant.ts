export type TableStatus = 'vacant' | 'seated' | 'ordered' | 'served' | 'billed' | 'cleaning';

export type DietaryType = 'veg' | 'non_veg' | 'vegan' | 'egg';

export type KitchenStation = 'kitchen' | 'tandoor' | 'bar' | 'dessert' | 'pantry';

export type KotItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';

export type KotStatus = 'fired' | 'preparing' | 'ready' | 'served' | 'voided';

export type RestaurantOrderStatus = 'open' | 'billed' | 'settled' | 'voided';

export interface RestaurantSection {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface RestaurantTable {
  id: string;
  sectionId: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  shape?: 'square' | 'round' | 'rectangle';
  activeOrderId?: string;
  activeKotIds?: string[];
  guestCount?: number;
  seatedAt?: string;
  lastKotAt?: string;
  currentBillTotal?: number;
  assignedCaptain?: string;
  captainName?: string;
}

export interface RestaurantModifierOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface RestaurantModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: RestaurantModifierOption[];
}

export interface RestaurantMenuItem {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName: string;
  price: number;
  taxRate: number; // 5% food GST, or State VAT for alcohol
  prepTimeMinutes: number;
  station: KitchenStation;
  dietary: DietaryType;
  description?: string;
  imagePath?: string;
  isAvailable: boolean;
  modifierGroups?: RestaurantModifierGroup[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface RestaurantKotItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedModifiers?: SelectedModifier[];
  specialNotes?: string;
  station: KitchenStation;
  status: KotItemStatus;
  cancelledReason?: string;
  cancelledAt?: string;
}

export interface RestaurantKot {
  id: string;
  kotNumber: string;
  orderId: string;
  tableId: string;
  tableNumber: string;
  sectionName: string;
  station: KitchenStation;
  captainName: string;
  status: KotStatus;
  items: RestaurantKotItem[];
  firedAt: string;
  readyAt?: string;
  servedAt?: string;
  voidReason?: string;
  voidApprovedBy?: string;
}

export interface RestaurantOrderReprint {
  timestamp: string;
  reprintedBy: string;
  reason?: string;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableId?: string;
  tableNumber?: string;
  sectionName?: string;
  guestCount: number;
  captainName: string;
  customerName?: string;
  customerPhone?: string;
  kots: RestaurantKot[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  grandTotal: number;
  payments: Array<{
    method: 'cash' | 'upi' | 'card' | 'credit_khata' | 'split';
    amount: number;
    reference?: string;
  }>;
  orderStatus: RestaurantOrderStatus;
  billPrintedCount: number;
  lastBilledAt?: string;
  reprintHistory: RestaurantOrderReprint[];
  createdAt: string;
  settledAt?: string;
}

export interface RecipeIngredient {
  rawMaterialProductId: string;
  rawMaterialName: string;
  quantityNeeded: number;
  unit: string;
  unitCost: number;
}

export interface RestaurantRecipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  portionSize: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
  sellingPrice: number;
  marginPercentage: number;
  notes?: string;
}

export interface RestaurantWasteLog {
  id: string;
  date: string;
  kotId?: string;
  tableNumber?: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  reason: string;
  authorizedBy: string;
  status: 'approved' | 'investigating';
}

export interface TableTransferAudit {
  id: string;
  timestamp: string;
  sourceTable: string;
  targetTable: string;
  transferredBy: string;
  authorizedBy: string;
  reason: string;
  itemCount: number;
}
