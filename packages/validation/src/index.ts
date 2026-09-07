import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const brandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(80),
  description: z.string().max(300).optional().default(''),
  website: z.string().max(200).optional().default(''),
  status: z.enum(['active', 'inactive']).default('active')
});

export type BrandFormData = z.infer<typeof brandSchema>;

export const productVariantSchema = z.object({
  sku: z.string().min(1, 'Variant SKU is required'),
  barcode: z.string().optional().default(''),
  attributes: z.record(z.string()),
  costPrice: z.coerce.number().min(0, 'Cost price must be 0 or greater'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be 0 or greater'),
  mrp: z.coerce.number().min(0).optional().default(0),
  stockQuantity: z.coerce.number().int().min(0, 'Initial stock cannot be negative').default(0),
  status: z.enum(['active', 'inactive']).default('active')
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

export const bundleItemSchema = z.object({
  componentProductId: z.string().min(1, 'Select component product'),
  componentProductName: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0)
});

export const bundleSchema = z.object({
  bundleProductId: z.string().min(1, 'Select parent bundle product'),
  bundleProductName: z.string().min(1, 'Bundle product name is required'),
  components: z.array(bundleItemSchema).min(1, 'Bundle must include at least one component SKU'),
  assemblyInstructions: z.string().optional().default('')
});

export type BundleFormData = z.infer<typeof bundleSchema>;

export const unitConversionSchema = z.object({
  fromUnit: z.string().min(1, 'Source unit required'),
  toUnit: z.string().min(1, 'Target unit required'),
  multiplier: z.coerce.number().positive('Multiplier must be greater than zero'),
  description: z.string().optional().default('')
});

export type UnitConversionFormData = z.infer<typeof unitConversionSchema>;

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(150, 'Name cannot exceed 150 characters'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU cannot exceed 50 characters'),
  barcode: z.string().max(50, 'Barcode cannot exceed 50 characters').optional().default(''),
  internalCode: z.string().max(50).optional().default(''),
  brandId: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Please select a category'),
  subcategory: z.string().max(100).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  unit: z.enum(['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'meter'], {
    errorMap: () => ({ message: 'Please select a valid unit of measure' })
  }),
  costPrice: z.coerce.number().min(0, 'Cost price must be 0 or greater'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be 0 or greater'),
  mrp: z.coerce.number().min(0).optional().default(0),
  wholesalePrice: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).max(100).optional().default(5),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  minimumStock: z.coerce.number().int('Must be a whole number').min(0, 'Minimum stock cannot be negative'),
  maximumStock: z.coerce.number().int().min(0).optional().default(1000),
  reorderPoint: z.coerce.number().int().min(0).optional().default(10),
  reorderQuantity: z.coerce.number().int().min(0).optional().default(50),
  leadTimeDays: z.coerce.number().int().min(0).optional().default(3),
  preferredSupplierId: z.string().optional().default(''),
  openingStock: z.coerce.number().int('Must be a whole number').min(0, 'Opening stock cannot be negative').optional().default(0),
  hasVariants: z.boolean().optional().default(false),
  isBundle: z.boolean().optional().default(false),
  trackingType: z.enum(['standard', 'batch', 'serial']).optional().default('standard'),
  status: z.enum(['active', 'inactive', 'archived', 'draft', 'discontinued']).default('active'),
  imagePath: z.string().optional(),
  thumbnailPath: z.string().optional()
}).refine(data => data.sellingPrice >= data.costPrice, {
  message: 'Selling price is typically greater than or equal to cost price',
  path: ['sellingPrice']
});

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(80),
  description: z.string().max(300).optional().default(''),
  status: z.enum(['active', 'inactive']).default('active')
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const supplierSchema = z.object({
  name: z.string().min(2, 'Contact person name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  phone: z.string().min(7, 'Phone number must have at least 7 digits').max(20),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().optional().default(''),
  taxNumber: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).default('active')
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  productName: z.string().min(1),
  sku: z.string(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be 0 or greater'),
  totalCost: z.coerce.number().min(0)
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier'),
  invoiceNumber: z.string().min(2, 'Invoice/PO number is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(purchaseItemSchema).min(1, 'Purchase order must have at least one product item'),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().optional().default('')
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Please select a product to adjust'),
  warehouseId: z.string().optional(),
  adjustmentType: z.enum(['increase', 'decrease', 'damage', 'correction'], {
    errorMap: () => ({ message: 'Please select an adjustment type' })
  }),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'Please provide a clear reason for the adjustment (min 3 characters)')
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

// ==========================================================
// WAREHOUSE & LOCATION SCHEMAS
// ==========================================================
export const warehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Warehouse code must be at least 2 characters').max(20),
  address: z.string().max(250).optional().default(''),
  isDefault: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive']).default('active')
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;

export const warehouseLocationSchema = z.object({
  code: z.string().min(1, 'Location code required (e.g. BIN-A01)'),
  name: z.string().min(1, 'Location label required'),
  description: z.string().optional().default('')
});

export type WarehouseLocationFormData = z.infer<typeof warehouseLocationSchema>;

// ==========================================================
// STOCK TRANSFER SCHEMAS
// ==========================================================
export const stockTransferItemSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  productName: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.coerce.number().int().min(1, 'Transfer quantity must be at least 1')
});

export const stockTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Select origin warehouse'),
  destinationWarehouseId: z.string().min(1, 'Select destination warehouse'),
  notes: z.string().max(300).optional().default(''),
  items: z.array(stockTransferItemSchema).min(1, 'Transfer must include at least one product item')
}).refine(data => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: 'Source and destination warehouses cannot be the same',
  path: ['destinationWarehouseId']
});

export type StockTransferFormData = z.infer<typeof stockTransferSchema>;

// ==========================================================
// BATCHES & SHELF-LIFE SCHEMAS
// ==========================================================
export const batchSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  batchNumber: z.string().min(2, 'Batch/Lot number is required').max(50),
  warehouseId: z.string().optional(),
  manufacturedAt: z.string().optional(),
  expiryAt: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().int().min(1, 'Batch initial quantity must be at least 1')
});

export type BatchFormData = z.infer<typeof batchSchema>;

// ==========================================================
// SERIAL NUMBER SCHEMAS
// ==========================================================
export const serialNumberSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  serialNumber: z.string().min(3, 'Serial number must be at least 3 characters').max(60),
  warehouseId: z.string().optional(),
  purchaseReference: z.string().optional()
});

export type SerialNumberFormData = z.infer<typeof serialNumberSchema>;

// ==========================================================
// STOCKTAKE & AUDIT SCHEMAS
// ==========================================================
export const stocktakeItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().min(1),
  systemQuantity: z.coerce.number().int(),
  countedQuantity: z.coerce.number().int().min(0, 'Counted quantity cannot be negative'),
  unitCost: z.coerce.number().min(0)
});

export const stocktakeSessionSchema = z.object({
  warehouseId: z.string().min(1, 'Select warehouse facility for stocktake'),
  notes: z.string().max(300).optional().default(''),
  items: z.array(stocktakeItemSchema)
});

export type StocktakeSessionFormData = z.infer<typeof stocktakeSessionSchema>;

// ==========================================================
// REORDER AUTOMATION SCHEMAS
// ==========================================================
export const reorderRuleSchema = z.object({
  productId: z.string().min(1, 'Select product for reorder rule'),
  minStock: z.coerce.number().int().min(0),
  reorderPoint: z.coerce.number().int().min(1, 'Reorder trigger point must be at least 1'),
  reorderQuantity: z.coerce.number().int().min(1, 'Reorder quantity must be at least 1'),
  preferredSupplierId: z.string().optional().default(''),
  autoGeneratePO: z.boolean().default(true)
});

export type ReorderRuleFormData = z.infer<typeof reorderRuleSchema>;

// ==========================================================
// BULK IMPORT SCHEMA
// ==========================================================
export const bulkImportRowSchema = z.object({
  name: z.string().min(1, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  barcode: z.string().optional().default(''),
  category: z.string().min(1, 'Category name required'),
  brand: z.string().optional().default(''),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional().default(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().default('pcs'),
  minimumStock: z.coerce.number().int().min(0).default(5)
});

export type BulkImportRowData = z.infer<typeof bulkImportRowSchema>;

