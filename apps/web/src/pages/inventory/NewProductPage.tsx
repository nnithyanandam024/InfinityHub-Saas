import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@infinityhub/validation';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { Category, Brand, ProductVariant, TrackingType } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { UNITS_OF_MEASURE, TRACKING_TYPES } from '@infinityhub/constants';
import { formatCurrency } from '@infinityhub/ui';
import { ProductImageUploader } from '../../components/inventory/ProductImageUploader';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Barcode as BarcodeIcon,
  Tag,
  Layers,
  Plus,
  Trash2,
  HelpCircle,
  Percent,
  TrendingUp,
  ShieldCheck,
  Building2,
  Award
} from 'lucide-react';

interface VariantRow {
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

export const NewProductPage: React.FC = () => {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { hasFeature } = useEntitlements();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Brand modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');

  // Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [attributeName, setAttributeName] = useState('Size');
  const [attributeValues, setAttributeValues] = useState('Small, Medium, Large');
  const [variantsList, setVariantsList] = useState<VariantRow[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      internalCode: '',
      categoryId: '',
      brandId: '',
      subcategory: '',
      description: '',
      unit: 'pcs',
      costPrice: 0,
      sellingPrice: 0,
      mrp: 0,
      wholesalePrice: 0,
      taxRate: 0,
      discount: 0,
      minimumStock: 5,
      maximumStock: 100,
      reorderPoint: 10,
      reorderQuantity: 20,
      leadTimeDays: 3,
      openingStock: 0,
      trackingType: 'standard',
      hasVariants: false,
      status: 'active'
    }
  });

  const loadDependencies = async () => {
    if (!tenant) return;
    try {
      const [cats, brds] = await Promise.all([
        categoryService.getCategories(tenant.id),
        brandService.getBrands(tenant.id)
      ]);
      setCategories(cats);
      setBrands(brds);
      if (cats.length > 0 && !watch('categoryId')) {
        setValue('categoryId', cats[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load options', 'error');
    }
  };

  useEffect(() => {
    loadDependencies();
  }, [tenant?.id]);

  // SKU / Barcode generators
  const generateSku = () => {
    const name = watch('name')?.trim() || 'ITEM';
    const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    setValue('sku', `${prefix}-${random}`);
  };

  const generateBarcode = () => {
    const randomCode = '890' + Math.floor(100000000 + Math.random() * 900000000);
    setValue('barcode', randomCode);
  };

  // Quick brand create
  const handleQuickAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !quickBrandName.trim()) return;
    try {
      const created = await brandService.createBrand(tenant.id, {
        name: quickBrandName.trim(),
        status: 'active'
      });
      setBrands(prev => [created, ...prev]);
      setValue('brandId', created.id);
      setIsBrandModalOpen(false);
      setQuickBrandName('');
      showToast(`Brand "${created.name}" created!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create brand', 'error');
    }
  };

  // Generate variants from attribute values
  const generateVariantRows = () => {
    const baseName = watch('name')?.trim() || 'Product';
    const baseSku = watch('sku')?.trim() || 'SKU';
    const cost = watch('costPrice') || 0;
    const sell = watch('sellingPrice') || 0;
    const mrp = watch('mrp') || 0;

    const values = attributeValues
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      showToast('Please enter at least one option value', 'info');
      return;
    }

    const rows: VariantRow[] = values.map((val, idx) => {
      const optSlug = val.slice(0, 3).toUpperCase();
      return {
        name: `${baseName} - ${val}`,
        sku: `${baseSku}-${optSlug}`,
        barcode: '890' + Math.floor(100000000 + Math.random() * 900000000),
        costPrice: cost,
        sellingPrice: sell,
        mrp: mrp > 0 ? mrp : undefined,
        stockQuantity: 10,
        attributes: { [attributeName]: val }
      };
    });

    setVariantsList(rows);
    showToast(`Generated ${rows.length} variants based on "${attributeName}"`, 'success');
  };

  const updateVariantRow = (index: number, field: keyof VariantRow, value: any) => {
    setVariantsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeVariantRow = (index: number) => {
    setVariantsList(prev => prev.filter((_, i) => i !== index));
  };

  const cost = watch('costPrice') || 0;
  const sell = watch('sellingPrice') || 0;
  const mrpVal = watch('mrp') || 0;
  const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : '0';

  const onSubmit = async (data: ProductFormData) => {
    if (!tenant) return;
    setIsSubmitting(true);
    try {
      const brandObj = brands.find(b => b.id === data.brandId);

      const variantsPayload = hasVariants && variantsList.length > 0
        ? variantsList.map(v => ({
            sku: v.sku,
            barcode: v.barcode,
            attributes: v.attributes,
            costPrice: v.costPrice,
            sellingPrice: v.sellingPrice,
            mrp: v.mrp,
            stockQuantity: v.stockQuantity,
            status: 'active' as const
          }))
        : undefined;

      const totalStock = variantsPayload
        ? variantsPayload.reduce((sum, v) => sum + v.stockQuantity, 0)
        : (data.openingStock || 0);

      const created = await productService.createProduct(
        tenant.id,
        {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || '',
          internalCode: data.internalCode || undefined,
          categoryId: data.categoryId,
          brandId: data.brandId || undefined,
          brandName: brandObj?.name,
          subcategory: data.subcategory || undefined,
          description: data.description || undefined,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          mrp: data.mrp || undefined,
          wholesalePrice: data.wholesalePrice || undefined,
          taxRate: data.taxRate || undefined,
          discount: data.discount || undefined,
          minimumStock: data.minimumStock,
          maximumStock: data.maximumStock || undefined,
          reorderPoint: data.reorderPoint || undefined,
          reorderQuantity: data.reorderQuantity || undefined,
          leadTimeDays: data.leadTimeDays || undefined,
          stockQuantity: totalStock,
          unit: data.unit as any,
          trackingType: data.trackingType as any,
          hasVariants: hasVariants && variantsList.length > 0,
          status: data.status as any,
          imagePath: data.imagePath,
          thumbnailPath: data.thumbnailPath
        },
        variantsPayload
      );

      showToast(`Product "${created.name}" created successfully!`, 'success');
      navigate(`/inventory/products/${created.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/inventory/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products Catalog
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: General & Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-600" />
              General Information & Classification
            </CardTitle>
            <CardDescription>
              Basic product identity, categorization, and tracking identifiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Aashirvaad Superior Sharbati Whole Wheat Atta 5kg"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-rose-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>

              {/* Brand */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Manufacturer / Brand
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBrandModalOpen(true)}
                    className="text-[11px] font-semibold text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New Brand
                  </button>
                </div>
                <select
                  {...register('brandId')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None / Unbranded</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-[11px] font-semibold text-primary-600 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="AASH-ATTA-5KG"
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.sku && <p className="text-rose-500 text-xs mt-1">{errors.sku.message}</p>}
              </div>

              {/* Barcode */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    Barcode / EAN <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="text-[11px] font-semibold text-primary-600 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" /> Generate
                  </button>
                </div>
                <input
                  type="text"
                  {...register('barcode')}
                  placeholder="8901030382212"
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.barcode && <p className="text-rose-500 text-xs mt-1">{errors.barcode.message}</p>}
              </div>

              {/* Internal Code */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Internal Code / Bin Ref
                </label>
                <input
                  type="text"
                  {...register('internalCode')}
                  placeholder="BIN-A04-R2"
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Description / Product Overview
              </label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="Product characteristics, packaging specifics, or handling directions..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Visuals & Media */}
        <ProductImageUploader
          imagePath={watch('imagePath')}
          thumbnailPath={watch('thumbnailPath')}
          onChange={({ imagePath, thumbnailPath }) => {
            setValue('imagePath', imagePath);
            setValue('thumbnailPath', thumbnailPath);
          }}
          productName={watch('name')}
        />

        {/* Section 2: Pricing & Commercial Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Commercial Pricing & Tax Matrix
            </CardTitle>
            <CardDescription>
              Set purchase cost, retail pricing, MRP, wholesale rate, and GST tax percentages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Purchase Cost (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.costPrice && <p className="text-rose-500 text-xs mt-1">{errors.costPrice.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Retail Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('sellingPrice', { valueAsNumber: true })}
                  className="w-full text-sm font-bold text-emerald-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.sellingPrice && <p className="text-rose-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  MRP (Maximum Retail)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
                  placeholder="Optional"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Wholesale Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('wholesalePrice', { valueAsNumber: true })}
                  placeholder="Bulk rate"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  GST / Tax Rate (%)
                </label>
                <select
                  {...register('taxRate', { valueAsNumber: true })}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="0">0% (Tax Exempt / Nil)</option>
                  <option value="5">5% (Essential Goods)</option>
                  <option value="12">12% (Processed Goods)</option>
                  <option value="18">18% (Standard Rate)</option>
                  <option value="28">28% (Luxury / Aerated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Default Discount (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('discount', { valueAsNumber: true })}
                  placeholder="e.g. 5"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Profit Margin Indicator */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Estimated Gross Profit per Unit: <strong>{formatCurrency(Math.max(0, sell - cost))}</strong></span>
              </div>
              <Badge variant={parseFloat(margin) >= 20 ? 'success' : 'warning'}>
                {margin}% Margin
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Inventory Controls & Stock Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Inventory Policy & Reorder Rules
            </CardTitle>
            <CardDescription>
              Configure safety stock thresholds, tracking method (batch/serial), and replenishment triggers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Unit of Measure <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('unit')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {UNITS_OF_MEASURE.map(u => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Tracking Method
                </label>
                <select
                  {...register('trackingType')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="standard">Standard Inventory Count</option>
                  <option value="batch" disabled={!hasFeature('batches')}>
                    Batch / Lot & Expiry {!hasFeature('batches') ? '— (PRO Plan)' : ''}
                  </option>
                  <option value="serial" disabled={!hasFeature('serial_numbers')}>
                    Serial Number Tracking {!hasFeature('serial_numbers') ? '— (BIZ Plan)' : ''}
                  </option>
                </select>
                {!hasFeature('batches') && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Batch and Serial tracking are unlocked on Professional and Business plans.
                  </p>
                )}
              </div>

              {!hasVariants && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    {...register('openingStock', { valueAsNumber: true })}
                    className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Safety Minimum Stock <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('minimumStock', { valueAsNumber: true })}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  {...register('reorderPoint', { valueAsNumber: true })}
                  placeholder="Auto-trigger level"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  {...register('reorderQuantity', { valueAsNumber: true })}
                  placeholder="Batch order size"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  {...register('leadTimeDays', { valueAsNumber: true })}
                  placeholder="Days to arrive"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Multi-Attribute Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Product Variants & Options
                  {!hasFeature('variants') && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Professional Plan
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Does this item have multiple variants like sizes, colors, weights, or packaging options?
                </CardDescription>
              </div>
              <label className={`relative inline-flex items-center ${!hasFeature('variants') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={!hasFeature('variants')}
                  checked={hasVariants}
                  onChange={(e) => {
                    if (!hasFeature('variants')) {
                      showToast('Product variants require the Professional plan', 'info');
                      return;
                    }
                    setHasVariants(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </CardHeader>

          {hasVariants && (
            <CardContent className="space-y-4 pt-0">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Option Name
                    </label>
                    <input
                      type="text"
                      value={attributeName}
                      onChange={(e) => setAttributeName(e.target.value)}
                      placeholder="e.g. Size, Weight, Color"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Option Values (comma separated)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={attributeValues}
                        onChange={(e) => setAttributeValues(e.target.value)}
                        placeholder="e.g. 500g, 1kg, 5kg"
                        className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={generateVariantRows}
                        className="text-xs"
                      >
                        Generate Matrix
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {variantsList.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] text-slate-500">
                        <th className="pb-2 font-semibold">Variant Option</th>
                        <th className="pb-2 font-semibold">Variant SKU</th>
                        <th className="pb-2 font-semibold">Barcode</th>
                        <th className="pb-2 font-semibold text-right">Cost (₹)</th>
                        <th className="pb-2 font-semibold text-right">Price (₹)</th>
                        <th className="pb-2 font-semibold text-center">Stock</th>
                        <th className="pb-2 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {variantsList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                          <td className="py-2 pr-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {Object.entries(row.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                              className="w-28 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={row.barcode}
                              onChange={(e) => updateVariantRow(idx, 'barcode', e.target.value)}
                              className="w-28 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2 pr-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={row.costPrice}
                              onChange={(e) => updateVariantRow(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2 pr-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={row.sellingPrice}
                              onChange={(e) => updateVariantRow(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 text-xs font-bold text-emerald-600 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2 pr-2 text-center">
                            <input
                              type="number"
                              value={row.stockQuantity}
                              onChange={(e) => updateVariantRow(idx, 'stockQuantity', parseInt(e.target.value) || 0)}
                              className="w-16 text-xs text-center font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariantRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving Product...' : 'Save & Publish Product'}
          </Button>
        </div>
      </form>

      {/* Quick Add Brand Modal */}
      <Modal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        title="Quick Add Brand"
        maxWidth="sm"
      >
        <form onSubmit={handleQuickAddBrand} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Britannia, Tata Consumer"
              value={quickBrandName}
              onChange={(e) => setQuickBrandName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBrandModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Brand
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
