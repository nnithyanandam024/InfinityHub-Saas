export type ProductStatus = 'active' | 'inactive' | 'archived' | 'draft' | 'discontinued';

export type UnitOfMeasure = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'pack' | 'box' | 'meter';

export type TrackingType = 'standard' | 'batch' | 'serial';

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  productCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  productCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address?: string;
  taxNumber?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>; // e.g. { size: 'Large', color: 'Navy' }
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  stockQuantity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface BundleItem {
  componentProductId: string;
  componentProductName: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export interface ProductBundle {
  id: string;
  tenantId: string;
  bundleProductId: string;
  bundleProductName: string;
  components: BundleItem[];
  assemblyInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversion {
  id: string;
  tenantId: string;
  fromUnit: string;
  toUnit: string;
  multiplier: number; // e.g. 1 box = 12 pcs -> multiplier = 12
  description?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode: string;
  internalCode?: string;
  hsnCode?: string;
  brandId?: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  subcategory?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  wholesalePrice?: number;
  taxRate?: number;
  discount?: number;
  stockQuantity: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  preferredSupplierId?: string;
  unit: UnitOfMeasure;
  imagePath?: string;
  thumbnailPath?: string;
  images?: ProductImage[];
  hasVariants?: boolean;
  isBundle?: boolean;
  trackingType?: TrackingType;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  storagePath: string; // main 1200px WebP
  thumbnailPath?: string; // thumbnail 300px WebP
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
}
