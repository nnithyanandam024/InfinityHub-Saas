import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import { bundleService } from '../../services/bundleService';
import { Product, StockMovement, ProductVariant, ProductBundle } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime, getStockStatus } from '@infinityhub/ui';
import {
  ArrowLeft,
  Edit2,
  Sliders,
  Boxes,
  TrendingUp,
  History,
  Barcode as BarcodeIcon,
  Tag,
  IndianRupee,
  Layers,
  Printer,
  ShieldCheck,
  Award,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { StockAdjustModal } from './StockAdjustModal';
import { BarcodeGeneratorModal } from '../../components/inventory/BarcodeGeneratorModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [bundle, setBundle] = useState<ProductBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedVariantForBarcode, setSelectedVariantForBarcode] = useState<ProductVariant | null>(null);

  const loadProduct = async () => {
    if (!tenant || !id) return;
    setIsLoading(true);
    try {
      const [prod, movs, vars, bdl] = await Promise.all([
        productService.getProductById(tenant.id, id),
        stockService.getStockMovements(tenant.id, id),
        productService.getProductVariants(tenant.id, id),
        bundleService.getBundleByProductId(tenant.id, id)
      ]);
      setProduct(prod);
      setMovements(movs);
      setVariants(vars);
      setBundle(bdl);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [tenant?.id, id]);

  if (isLoading) {
    return <LoadingSpinner text="Loading product profile..." />;
  }

  if (!product) {
    return (
      <EmptyState
        title="Product Not Found"
        description="The requested product record does not exist in this tenant store."
        actionLabel="Back to Products"
        onAction={() => navigate('/inventory/products')}
      />
    );
  }

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';
  const stockStatus = getStockStatus(product.stockQuantity, product.minimumStock);
  const marginPercentage =
    product.sellingPrice > 0
      ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
      : '0';

  const openBarcodeStudio = (variant?: ProductVariant) => {
    setSelectedVariantForBarcode(variant || null);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {product.name}
            </h2>
            {product.brandName && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Award className="w-3 h-3" />
                {product.brandName}
              </span>
            )}
            <span
              className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${stockStatus.badgeClass}`}
            >
              {stockStatus.label}
            </span>
            {product.isBundle && (
              <Badge variant="primary">Bundle / Kit</Badge>
            )}
            {product.hasVariants && (
              <Badge variant="neutral">{variants.length} Variants</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            SKU: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{product.sku}</span> · Category:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{product.categoryName}</span>
            {product.internalCode && ` · Bin / Ref: ${product.internalCode}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openBarcodeStudio()}
            className="flex items-center gap-1.5"
          >
            <BarcodeIcon className="w-4 h-4" />
            Print Barcode
          </Button>

          {hasPermission('inventory.stock.adjust') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdjustModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              Adjust Stock
            </Button>
          )}

          {hasPermission('inventory.products.update') && (
            <Link to={`/inventory/products/${product.id}/edit`}>
              <Button size="sm" variant="primary" className="flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" />
                Edit Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Product Hero Visual Card */}
      {(product.imagePath || product.thumbnailPath) && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
            <div className="w-full sm:w-52 h-52 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
              <img
                src={product.imagePath || product.thumbnailPath}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                  {product.categoryName || 'Catalog Item'}
                </span>
                {product.brandName && (
                  <span className="text-xs font-semibold text-slate-500">
                    By {product.brandName}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                <span>SKU: <strong className="text-slate-800 dark:text-slate-200 font-mono">{product.sku}</strong></span>
                {product.barcode && (
                  <span>Barcode: <strong className="text-slate-800 dark:text-slate-200 font-mono">{product.barcode}</strong></span>
                )}
                <span>Unit: <strong className="text-slate-800 dark:text-slate-200">{product.unit}</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Current Stock
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {product.stockQuantity}{' '}
            <span className="text-xs font-normal text-slate-500">{product.unit}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Min threshold: {product.minimumStock} {product.unit}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Selling Price
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(product.sellingPrice, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {product.mrp ? `MRP: ${formatCurrency(product.mrp, currencySymbol)}` : 'Standard retail price'}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Purchase Cost
          </span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {formatCurrency(product.costPrice, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Wholesale buy cost
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Gross Margin
          </span>
          <div className="text-2xl font-bold text-primary-600">
            {marginPercentage}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Spread: {formatCurrency(product.sellingPrice - product.costPrice, currencySymbol)}
          </span>
        </Card>
      </div>

      {/* Variants Table if present */}
      {variants.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Product Variants & Options ({variants.length})
              </CardTitle>
              <CardDescription>
                Unique stock balances, SKUs, and barcodes per variant combination.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Variant Attributes</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Barcode</th>
                    <th className="py-2.5 px-4 text-right">Cost</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-center">Stock</th>
                    <th className="py-2.5 px-4 text-center">Labels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {variants.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' · ')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {v.sku}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {v.barcode || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(v.costPrice, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(v.sellingPrice, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {v.stockQuantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openBarcodeStudio(v)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          <Printer className="w-3 h-3" /> Label
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundle Breakdown if bundle */}
      {bundle && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-primary-600" />
              Bundle Components & Bill of Materials
            </CardTitle>
            <CardDescription>Items bundled together inside this master SKU</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Component Product</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Quantity</th>
                    <th className="py-2.5 px-4 text-right">Unit Cost</th>
                    <th className="py-2.5 px-4 text-right">Total Component Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bundle.components.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                        {c.componentProductName}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {c.sku}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-primary-600">
                        × {c.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {formatCurrency(c.unitCost, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(c.quantity * c.unitCost, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commercial & Inventory Policy Specifications Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commercial Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Commercial & Tax Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Maximum Retail Price (MRP)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.mrp ? formatCurrency(product.mrp, currencySymbol) : 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Wholesale / Trade Price</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.wholesalePrice ? formatCurrency(product.wholesalePrice, currencySymbol) : 'Standard Price'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">GST / Tax Rate</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.taxRate ? `${product.taxRate}%` : '0% (Exempt)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Default Catalog Discount</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.discount ? `${product.discount}%` : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Policy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Inventory Replenishment Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Tracking Method</span>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {product.trackingType ? `${product.trackingType} tracking` : 'Standard'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Reorder Trigger Point</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.reorderPoint ? `${product.reorderPoint} ${product.unit}` : `${product.minimumStock} ${product.unit}`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Standard Reorder Quantity</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.reorderQuantity ? `${product.reorderQuantity} ${product.unit}` : 'Variable'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Supplier Lead Time</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.leadTimeDays ? `${product.leadTimeDays} Days` : 'Immediate'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Audit Log */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Stock Movement Ledger (Single Source of Truth)
            </CardTitle>
            <CardDescription>
              Immutable audit history of opening registration, purchases, and manual adjustments
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {movements.length} recorded entries
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No stock movements recorded for this item yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-4">Movement Type</th>
                    <th className="py-2.5 px-4 text-center">Change</th>
                    <th className="py-2.5 px-4 text-center">Balance</th>
                    <th className="py-2.5 px-4">Reason / Reference</th>
                    <th className="py-2.5 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movements.map(mov => (
                    <tr key={mov.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {formatDateTime(mov.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            mov.quantityChange > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}{' '}
                          {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {mov.previousStock} → {mov.newStock}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{mov.reason || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{mov.performedByUserName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Adjust Modal */}
      {isAdjustModalOpen && (
        <StockAdjustModal
          product={product}
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          onSuccess={() => loadProduct()}
        />
      )}

      {/* Barcode Studio Modal */}
      <BarcodeGeneratorModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        product={product}
        variant={selectedVariantForBarcode}
      />
    </div>
  );
};
