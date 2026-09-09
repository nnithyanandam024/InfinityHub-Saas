import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { Product, Category, Brand } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, LoadingSpinner } from '../../components/ui/EmptyState';
import { formatCurrency, getStockStatus } from '@infinityhub/ui';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Sliders,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Barcode as BarcodeIcon,
  Award,
  Layers,
  List,
  LayoutGrid
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StockAdjustModal } from './StockAdjustModal';
import { BarcodeGeneratorModal } from '../../components/inventory/BarcodeGeneratorModal';

export const ProductsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  // View mode: 'list' (table) vs 'grid' (cards)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('infinityhub_product_view_mode');
      return saved === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('infinityhub_product_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Modals
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const loadData = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const [prods, cats, brds] = await Promise.all([
        productService.getProducts(tenant.id),
        categoryService.getCategories(tenant.id),
        brandService.getBrands(tenant.id)
      ]);
      setProducts(prods);
      setCategories(cats);
      setBrands(brds);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  // Real-time synchronization listener (updates instantly when mobile modifies catalog/stock)
  useEffect(() => {
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  useEffect(() => {
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      setSelectedBrand(brandParam);
    }
  }, [searchParams]);

  const handleArchive = async (product: Product) => {
    if (!tenant) return;
    if (confirm(`Are you sure you want to archive "${product.name}"?`)) {
      try {
        await productService.archiveProduct(tenant.id, product.id);
        showToast(`Archived ${product.name}`, 'info');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to archive product', 'error');
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!tenant) return;
    if (confirm(`Permanently delete "${product.name}"? This removes the item and associated variants.`)) {
      try {
        await productService.deleteProduct(tenant.id, product.id);
        showToast(`Deleted "${product.name}" successfully`, 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete product', 'error');
      }
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search by name, SKU or barcode
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));

      // Category match
      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      // Brand match
      const matchBrand = selectedBrand === 'ALL' || p.brandId === selectedBrand;

      // Stock status match
      let matchStock = true;
      if (stockFilter === 'NORMAL') {
        matchStock = p.stockQuantity > p.minimumStock;
      } else if (stockFilter === 'LOW') {
        matchStock = p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;
      } else if (stockFilter === 'OUT') {
        matchStock = p.stockQuantity <= 0;
      }

      return matchQuery && matchCat && matchBrand && matchStock;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, stockFilter]);

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';

  if (isLoading) {
    return <LoadingSpinner text="Loading catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary-600" />
            Products & Inventory Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store catalog, manufacturer brands, variants, barcode generation, and stock thresholds.
          </p>
        </div>

        {hasPermission('inventory.products.create') ? (
          <div className="flex items-center gap-2">
            <Link to="/inventory/bundles">
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Bundles & Kits
              </Button>
            </Link>
            <Link to="/inventory/products/new">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Add Product restricted for your role
          </div>
        )}
      </div>

      {/* Filter Toolbar & View Switcher */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
              Catalog Items
            </span>
            <span className="text-xs text-slate-500">
              ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})
            </span>
            {(searchQuery || selectedCategory !== 'ALL' || selectedBrand !== 'ALL' || stockFilter !== 'ALL') && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Filters Active
              </span>
            )}
          </div>

          {/* List / Grid View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Switch to List (Table) view"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Switch to Grid (Card) view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4">
            <Input
              icon={Search}
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <Select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Brand Filter */}
          <div className="sm:col-span-3">
            <Select
              value={selectedBrand}
              onChange={e => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Brands ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Stock Level Filter */}
          <div className="sm:col-span-2">
            <Select
              value={stockFilter}
              onChange={e => {
                setStockFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="ALL">All Stock</option>
              <option value="NORMAL">In Stock</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Products Table Card */}
      <Card>
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No products found"
            description={
              searchQuery || selectedCategory !== 'ALL' || selectedBrand !== 'ALL' || stockFilter !== 'ALL'
                ? 'Try adjusting your search query or filters to find products.'
                : 'Start building your inventory catalog by adding your first product.'
            }
            actionLabel={hasPermission('inventory.products.create') ? 'Add Product' : undefined}
            onAction={hasPermission('inventory.products.create') ? () => navigate('/inventory/products/new') : undefined}
          />
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedProducts.map(product => {
              const stockStatus = getStockStatus(product.stockQuantity, product.minimumStock);
              const category = categories.find(c => c.id === product.categoryId);
              const brand = brands.find(b => b.id === product.brandId);
              const margin = product.sellingPrice > 0
                ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Photo Media Banner */}
                  <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800/80 overflow-hidden border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    {product.thumbnailPath || product.imagePath ? (
                      <img
                        src={product.thumbnailPath || product.imagePath}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const fb = parent.querySelector('.grid-card-fb');
                            if (fb) (fb as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}

                    {/* Fallback Graphic */}
                    <div
                      className={`grid-card-fb w-full h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 text-slate-400 ${
                        product.thumbnailPath || product.imagePath ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700/70 shadow-2xs border border-slate-200/70 dark:border-slate-600 flex items-center justify-center text-slate-400">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
                        {category?.name || product.categoryName || 'Catalog Item'}
                      </span>
                    </div>

                    {/* Floating Stock Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <Badge
                        variant={
                          stockStatus.status === 'normal'
                            ? 'success'
                            : stockStatus.status === 'low'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        className="shadow-xs backdrop-blur-xs font-semibold"
                      >
                        {stockStatus.label}
                      </Badge>
                    </div>

                    {/* Floating Feature Tags */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                      {product.hasVariants && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-600 text-white shadow-xs">
                          Variants
                        </span>
                      )}
                      {product.isBundle && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                          Bundle
                        </span>
                      )}
                      {product.trackingType && product.trackingType !== 'standard' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs capitalize">
                          {product.trackingType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <Link
                      to={`/inventory/products/${product.id}`}
                      className="font-bold text-sm text-[#0F172A] dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      {brand && <span className="font-medium text-slate-700 dark:text-slate-300">{brand.name}</span>}
                      {brand && <span>·</span>}
                      <span className="truncate">{category?.name || product.categoryName || 'General'}</span>
                    </div>
                  </div>

                  {/* Card Body: Pricing & Stock */}
                  <div className="p-4 py-3 space-y-3 flex-1 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Retail Price</span>
                        <span className="text-base font-extrabold text-[#0F172A] dark:text-white">
                          {formatCurrency(product.sellingPrice, currencySymbol)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Cost / Margin</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {formatCurrency(product.costPrice, currencySymbol)}
                          <span className="ml-1 text-[10px] text-emerald-600 font-bold">({margin}%)</span>
                        </span>
                      </div>
                    </div>

                    {/* SKU & Barcode */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700">
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate">SKU: {product.sku}</span>
                      {product.barcode && (
                        <span className="font-mono text-slate-400 text-[10px] shrink-0">#{product.barcode}</span>
                      )}
                    </div>

                    {/* Stock Level Meter */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Available Stock:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {product.stockQuantity} {product.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stockStatus.status === 'normal'
                              ? 'bg-emerald-500'
                              : stockStatus.status === 'low'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(8, (product.stockQuantity / Math.max(product.minimumStock * 2, 1)) * 100))}%`
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right mt-0.5">
                        Min threshold: {product.minimumStock} {product.unit}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Link to={`/inventory/products/${product.id}`}>
                        <button
                          type="button"
                          title="View Product Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>

                      <button
                        type="button"
                        title="Barcode Label Studio"
                        onClick={() => setBarcodeProduct(product)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <BarcodeIcon className="w-4 h-4" />
                      </button>

                      {hasPermission('inventory.stock.adjust') && (
                        <button
                          type="button"
                          title="Quick Stock Adjustment"
                          onClick={() => setAdjustingProduct(product)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {hasPermission('inventory.products.update') && (
                        <Link to={`/inventory/products/${product.id}/edit`}>
                          <button
                            type="button"
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                      )}

                      {hasPermission('inventory.products.delete') && (
                        <>
                          <button
                            type="button"
                            title="Archive Product"
                            onClick={() => handleArchive(product)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Product"
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Product Name & Brand</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Retail Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProducts.map(product => {
                  const stockStatus = getStockStatus(product.stockQuantity, product.minimumStock);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Product Thumbnail, Name & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* 44x44px Thumbnail Avatar */}
                          <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
                            {product.thumbnailPath || product.imagePath ? (
                              <img
                                src={product.thumbnailPath || product.imagePath}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-center"
                                onError={e => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    const fb = parent.querySelector('.list-thumb-fb');
                                    if (fb) (fb as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={`list-thumb-fb w-full h-full items-center justify-center text-slate-400 font-bold text-xs uppercase bg-slate-100 dark:bg-slate-800 ${
                                product.thumbnailPath || product.imagePath ? 'hidden' : 'flex'
                              }`}
                            >
                              {product.name.slice(0, 2)}
                            </div>
                          </div>

                          {/* Title & Brand */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/inventory/products/${product.id}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 block transition-colors truncate max-w-xs sm:max-w-md"
                              >
                                {product.name}
                              </Link>
                              {product.hasVariants && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                  Variants
                                </span>
                              )}
                              {product.isBundle && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  Bundle
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              {product.brandName && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
                                  <Award className="w-3 h-3" />
                                  {product.brandName}
                                </span>
                              )}
                              <span>· Unit: {product.unit}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{product.sku}</div>
                        {product.barcode && (
                          <div className="text-[10px] text-slate-400">{product.barcode}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {product.categoryName || 'Uncategorized'}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {product.stockQuantity} {product.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Min: {product.minimumStock}
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {formatCurrency(product.costPrice, currencySymbol)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(product.sellingPrice, currencySymbol)}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stockStatus.badgeClass}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Print Barcode Label"
                            onClick={() => setBarcodeProduct(product)}
                            className="p-1 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded transition-colors"
                          >
                            <BarcodeIcon className="w-4 h-4" />
                          </button>

                          <Link to={`/inventory/products/${product.id}`}>
                            <button
                              type="button"
                              title="View Details"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {hasPermission('inventory.stock.adjust') && (
                            <button
                              type="button"
                              title="Quick Stock Adjustment"
                              onClick={() => setAdjustingProduct(product)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('inventory.products.update') && (
                            <Link to={`/inventory/products/${product.id}/edit`}>
                              <button
                                type="button"
                                title="Edit Product"
                                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          {hasPermission('inventory.products.delete') && (
                            <>
                              <button
                                type="button"
                                title="Archive Product"
                                onClick={() => handleArchive(product)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Delete Product"
                                onClick={() => handleDeleteProduct(product)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(page * pageSize, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> products
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Stock Adjust Modal */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            loadData();
            setAdjustingProduct(null);
          }}
        />
      )}

      {/* Barcode Studio Modal */}
      <BarcodeGeneratorModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />
    </div>
  );
};
