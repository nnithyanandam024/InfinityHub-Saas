import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@infinityhub/validation';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { Category, Brand, Product, ProductVariant } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { UNITS_OF_MEASURE, PRODUCT_STATUSES } from '@infinityhub/constants';
import { formatCurrency } from '@infinityhub/ui';
import { ProductImageUploader } from '../../components/inventory/ProductImageUploader';
import {
  ArrowLeft,
  Save,
  Tag,
  TrendingUp,
  ShieldCheck,
  Layers,
  Sparkles,
  Trash2,
  Plus
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

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const { hasPermission } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<VariantRow[]>([]);

  const handleDelete = async () => {
    if (!tenant || !product) return;
    if (confirm(`Permanently delete "${product.name}"? This removes the item and associated variants.`)) {
      setIsDeleting(true);
      try {
        await productService.deleteProduct(tenant.id, product.id);
        showToast(`Deleted "${product.name}" successfully`, 'success');
        navigate('/inventory/products');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete product', 'error');
        setIsDeleting(false);
      }
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema)
  });

  useEffect(() => {
    if (!tenant || !id) return;
    setIsLoading(true);

    Promise.all([
      productService.getProductById(tenant.id, id),
      categoryService.getCategories(tenant.id),
      brandService.getBrands(tenant.id),
      productService.getProductVariants(tenant.id, id)
    ])
      .then(([prod, cats, brds, vars]) => {
        setProduct(prod);
        setCategories(cats);
        setBrands(brds);

        if (prod) {
          setValue('name', prod.name);
          setValue('sku', prod.sku);
          setValue('barcode', prod.barcode || '');
          setValue('internalCode', prod.internalCode || '');
          setValue('categoryId', prod.categoryId);
          setValue('brandId', prod.brandId || '');
          setValue('subcategory', prod.subcategory || '');
          setValue('description', prod.description || '');
          setValue('unit', prod.unit as any);
          setValue('costPrice', prod.costPrice);
          setValue('sellingPrice', prod.sellingPrice);
          setValue('mrp', prod.mrp || 0);
          setValue('wholesalePrice', prod.wholesalePrice || 0);
          setValue('taxRate', prod.taxRate || 0);
          setValue('discount', prod.discount || 0);
          setValue('minimumStock', prod.minimumStock);
          setValue('maximumStock', prod.maximumStock || 100);
          setValue('reorderPoint', prod.reorderPoint || 10);
          setValue('reorderQuantity', prod.reorderQuantity || 20);
          setValue('leadTimeDays', prod.leadTimeDays || 3);
          setValue('trackingType', (prod.trackingType || 'standard') as any);
          setValue('status', prod.status as any);
          setValue('imagePath', prod.imagePath || '');
          setValue('thumbnailPath', prod.thumbnailPath || '');

          if (vars && vars.length > 0) {
            setHasVariants(true);
            setVariantsList(
              vars.map(v => ({
                name: Object.values(v.attributes).join(' / '),
                sku: v.sku,
                barcode: v.barcode || '',
                costPrice: v.costPrice,
                sellingPrice: v.sellingPrice,
                mrp: v.mrp,
                stockQuantity: v.stockQuantity,
                attributes: v.attributes
              }))
            );
          } else {
            setHasVariants(!!prod.hasVariants);
          }
        }
      })
      .catch(err => {
        showToast(err.message || 'Failed to load product', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [tenant?.id, id, setValue]);

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
  const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : '0';

  const onSubmit = async (data: ProductFormData) => {
    if (!tenant || !id) return;
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

      await productService.updateProduct(
        tenant.id,
        id,
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
          unit: data.unit as any,
          trackingType: data.trackingType as any,
          status: data.status as any,
          imagePath: data.imagePath,
          thumbnailPath: data.thumbnailPath
        },
        variantsPayload
      );

      showToast('Product updated successfully!', 'success');
      navigate(`/inventory/products/${id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading product for editing..." />;
  if (!product) return <EmptyState title="Product Not Found" description="Could not locate product record" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/inventory/products/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel and Back to Product Details
        </Link>

        {hasPermission('inventory.products.delete') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            icon={Trash2}
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Product
          </Button>
        )}
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
              Edit core master product details and brand linkage.
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
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Manufacturer / Brand
                </label>
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
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('sku')}
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Barcode / EAN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('barcode')}
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(PRODUCT_STATUSES).map(([statusKey, info]) => (
                    <option key={statusKey} value={statusKey}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                {...register('description')}
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
              Commercial Pricing & Tax Rates
            </CardTitle>
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
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  MRP (Maximum Retail)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
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
                  <option value="0">0% (Nil / Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
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
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Gross Profit Margin:
              </span>
              <Badge variant={parseFloat(margin) >= 20 ? 'success' : 'warning'}>
                {margin}% Margin
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Inventory Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Inventory Safety & Reorder Triggers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Unit of Measure
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
                  Safety Stock <span className="text-rose-500">*</span>
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
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants List if present */}
        {hasVariants && variantsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Configured Product Variants ({variantsList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {variantsList.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">
                          {Object.entries(row.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                            className="w-28 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={(e) => updateVariantRow(idx, 'barcode', e.target.value)}
                            className="w-28 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={row.costPrice}
                            onChange={(e) => updateVariantRow(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={row.sellingPrice}
                            onChange={(e) => updateVariantRow(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-xs font-bold text-emerald-600 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            value={row.stockQuantity}
                            onChange={(e) => updateVariantRow(idx, 'stockQuantity', parseInt(e.target.value) || 0)}
                            className="w-16 text-xs text-center font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/inventory/products/${id}`)}
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
            {isSubmitting ? 'Saving Changes...' : 'Save Product Updates'}
          </Button>
        </div>
      </form>
    </div>
  );
};
