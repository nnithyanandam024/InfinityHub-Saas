import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { posService, PosInitResponse } from '../../services/posService';
import { PaymentModal, PaymentMethodType } from '../../components/pos/PaymentModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { ManagerPinModal } from '../../components/pos/ManagerPinModal';
import { DiscountModal } from '../../components/pos/DiscountModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Percent,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import type { Product, Category, Invoice, RegisterShift, PosCustomer, PosOrderItem } from '@infinityhub/types';

interface CartItem extends PosOrderItem {
  product: Product;
}

export const PosTerminalPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  // Core Data
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentShift, setCurrentShift] = useState<RegisterShift | null>(null);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [taxConfig, setTaxConfig] = useState<any>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [heldOrders, setHeldOrders] = useState<Array<{ id: string; timestamp: string; cart: CartItem[]; customer: PosCustomer | null }>>([]);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  // Shift Open Dialog
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [startingFloatInput, setStartingFloatInput] = useState('2000');

  // Manager PIN Security Guard
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<{
    description: string;
    action: (data: { pin: string; managerName: string; reason: string }) => void;
  } | null>(null);

  // Quick discount modal state
  const [activeDiscountItem, setActiveDiscountItem] = useState<CartItem | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState('5');

  // Load Terminal Data
  const loadTerminalData = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const data = await posService.getInitData(tenant.id);
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setCurrentShift(data.currentShift);
      setCustomers(data.customers || []);
      setTaxConfig(data.taxConfig);
    } catch (err) {
      console.error('Failed to load POS init data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerminalData();

    // Listen for Real-Time Sync Events (e.g. stock adjustments or remote checkouts)
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.type === 'stock:adjusted' || detail.domain === 'pos') {
        posService.getInitData(tenant?.id || '').then(d => {
          setProducts(d.products || []);
          setCurrentShift(d.currentShift);
        });
      }
    };
    window.addEventListener('infinityhub:sync', handleSync);
    return () => window.removeEventListener('infinityhub:sync', handleSync);
  }, [tenant?.id]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      } else if (e.key === 'Escape') {
        if (isPaymentModalOpen || isReceiptModalOpen || isPinModalOpen) return;
        if (cart.length > 0) {
          if (confirm('Clear current active cart?')) {
            setCart([]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isPaymentModalOpen, isReceiptModalOpen, isPinModalOpen]);

  // Add Item to Cart (Handles Barcode Scanner Input)
  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`Item "${product.name}" is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const taxRate = product.taxRate !== undefined ? product.taxRate : 18;
      const hsnCode = product.hsnCode || '8504';
      const unitPrice = product.sellingPrice;
      const mrp = product.mrp || unitPrice;

      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Cannot add more than on-hand stock (${product.stockQuantity})`);
          return prev;
        }
        const updatedQty = existing.quantity + 1;
        const netPrice = existing.unitPrice - (existing.unitPrice * existing.discountPercent) / 100;
        const total = Math.round(netPrice * updatedQty * 100) / 100;
        const taxable = Math.round((total / (1 + taxRate / 100)) * 100) / 100;
        const tax = total - taxable;

        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: updatedQty,
                taxableAmount: taxable,
                cgstAmount: tax / 2,
                sgstAmount: tax / 2,
                total
              }
            : item
        );
      }

      const netPrice = unitPrice;
      const total = netPrice;
      const taxable = Math.round((total / (1 + taxRate / 100)) * 100) / 100;
      const tax = total - taxable;

      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        hsnCode,
        unitPrice,
        mrp,
        quantity: 1,
        unit: product.unit || 'pcs',
        discountPercent: 0,
        discountAmount: 0,
        taxRate,
        cgstRate: taxRate / 2,
        cgstAmount: tax / 2,
        sgstRate: taxRate / 2,
        sgstAmount: tax / 2,
        igstRate: 0,
        igstAmount: 0,
        taxableAmount: taxable,
        total,
        product
      };
      return [...prev, newItem];
    });
  };

  // Barcode Scanner Form Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Look for exact barcode match first
    const matched = products.find(
      p => p.barcode?.toLowerCase() === searchQuery.trim().toLowerCase() ||
           p.sku?.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setSearchQuery('');
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stockQuantity) {
              alert(`Maximum available stock is ${item.product.stockQuantity}`);
              return item;
            }
            const netPrice = item.unitPrice - (item.unitPrice * item.discountPercent) / 100;
            const total = Math.round(netPrice * newQty * 100) / 100;
            const taxable = Math.round((total / (1 + item.taxRate / 100)) * 100) / 100;
            const tax = total - taxable;
            return {
              ...item,
              quantity: newQty,
              taxableAmount: taxable,
              cgstAmount: tax / 2,
              sgstAmount: tax / 2,
              total
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (item: CartItem) => {
    // If cashier role, require manager approval for line void
    if (user?.role === 'STAFF') {
      setPendingPinAction({
        description: `Line item void: Remove ${item.productName} (₹${item.total}) from ticket`,
        action: () => {
          setCart(prev => prev.filter(i => i.productId !== item.productId));
        }
      });
      setIsPinModalOpen(true);
    } else {
      setCart(prev => prev.filter(i => i.productId !== item.productId));
    }
  };

  const handleApplyDiscount = (item: CartItem, percent: number) => {
    // Over 10% requires manager PIN
    if (percent > 10 && user?.role === 'STAFF') {
      setPendingPinAction({
        description: `Apply ${percent}% discount on ${item.productName}`,
        action: () => {
          applyDiscountLogic(item.productId, percent);
        }
      });
      setIsPinModalOpen(true);
    } else {
      applyDiscountLogic(item.productId, percent);
    }
  };

  const applyDiscountLogic = (productId: string, percent: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const discountAmt = (item.unitPrice * percent) / 100;
          const netPrice = item.unitPrice - discountAmt;
          const total = Math.round(netPrice * item.quantity * 100) / 100;
          const taxable = Math.round((total / (1 + item.taxRate / 100)) * 100) / 100;
          const tax = total - taxable;
          return {
            ...item,
            discountPercent: percent,
            discountAmount: discountAmt * item.quantity,
            taxableAmount: taxable,
            cgstAmount: tax / 2,
            sgstAmount: tax / 2,
            total
          };
        }
        return item;
      })
    );
  };

  // Hold / Park Bill
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const holdId = `HOLD-${Date.now().toString().slice(-4)}`;
    setHeldOrders(prev => [
      ...prev,
      { id: holdId, timestamp: new Date().toLocaleTimeString(), cart, customer: selectedCustomer }
    ]);
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleResumeOrder = (held: typeof heldOrders[0]) => {
    if (cart.length > 0) {
      if (!confirm('Current cart will be replaced by the parked bill. Continue?')) return;
    }
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setHeldOrders(prev => prev.filter(h => h.id !== held.id));
  };

  // Open Shift
  const handleOpenShift = async () => {
    if (!tenant) return;
    try {
      const shift = await posService.openShift(tenant.id, {
        startingFloat: Number(startingFloatInput) || 0,
        cashierId: user?.id || 'usr-1',
        cashierName: user?.name || 'Cashier',
        registerId: 'REG-01'
      });
      setCurrentShift(shift);
      setIsOpenShiftModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to open shift');
    }
  };

  // Complete Checkout
  const handleCompleteCheckout = async (paymentData: {
    method: PaymentMethodType;
    payments: any[];
    tenderedAmount: number;
    changeDue: number;
  }) => {
    if (!tenant) return;
    try {
      const payload = {
        cashierId: user?.id || 'usr-1',
        cashierName: user?.name || 'Cashier',
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        customerGstin: selectedCustomer?.gstin,
        customerStateCode: selectedCustomer?.stateCode || '33',
        items: cart,
        payments: paymentData.payments,
        tenderedAmount: paymentData.tenderedAmount,
        changeDue: paymentData.changeDue
      };

      const result = await posService.checkout(tenant.id, payload);
      setCurrentInvoice(result.invoice);
      setIsPaymentModalOpen(false);
      setCart([]);
      setSelectedCustomer(null);
      setIsReceiptModalOpen(true);
      loadTerminalData();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxableAmount = cart.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCgst = cart.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgst = cart.reduce((sum, item) => sum + item.sgstAmount, 0);
  const rawTotal = taxableAmount + totalCgst + totalSgst;
  const grandTotal = Math.round(rawTotal);
  const roundingAdj = Math.round((grandTotal - rawTotal) * 100) / 100;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-4 lg:-m-8">
      {/* SHIFT BANNER: Prompt to Open Shift if Not Active */}
      {!currentShift && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Cash register shift is currently closed. Open a register shift with starting cash float to record sales.</span>
          </div>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-amber-950 text-white font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Open Register Shift
          </button>
        </div>
      )}

      {/* MAIN TWO-PANE POS SCREEN */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT AREA (65%): Catalog, Search, Categories, Product Grid */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden">
          {/* Top Bar: Search / Barcode and Held Tickets */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Scan Barcode (Handheld) or Search Product by Name/SKU [Press F1]"
                className="w-full pl-11 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
              />
            </form>

            {heldOrders.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                  Parked: {heldOrders.length}
                </span>
                {heldOrders.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleResumeOrder(h)}
                    className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg shadow-2xs"
                  >
                    Resume {h.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.productId === product.id);
                const isOutOfStock = product.stockQuantity <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-100/60 border-slate-200 opacity-60'
                        : inCart
                        ? 'bg-blue-50/50 border-blue-300 shadow-xs hover:border-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2 relative">
                        {product.imagePath ? (
                          <img
                            src={product.imagePath}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Barcode className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                        {/* Live Stock Badge */}
                        <span
                          className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs ${
                            product.stockQuantity <= 0
                              ? 'bg-rose-600 text-white'
                              : product.stockQuantity <= 5
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900/80 text-white backdrop-blur-xs'
                          }`}
                        >
                          {product.stockQuantity <= 0 ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                        </span>
                        {inCart && (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            {inCart.quantity} in cart
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                        <span>SKU: {product.sku}</span>
                        {product.hsnCode && <span>· HSN: {product.hsnCode}</span>}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 font-display">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {product.mrp && product.mrp > product.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through ml-1.5">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {product.taxRate || 18}% GST
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT AREA (35%): Sticky Cart & Checkout Summary */}
        <div className="w-[380px] lg:w-[420px] bg-white flex flex-col shrink-0 shadow-lg z-10">
          {/* Cart Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Active Order Ticket</h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleHoldOrder}
                  title="Park / Hold Bill"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCart([])}
                  title="Clear Cart (Esc)"
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Customer Assignment Strip */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCustomer?.id || ''}
                onChange={e => {
                  const cust = customers.find(c => c.id === e.target.value) || null;
                  setSelectedCustomer(cust);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="">Walk-in Retail Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — Khata: ₹{c.currentBalance}
                  </option>
                ))}
              </select>
            </div>
            {selectedCustomer && (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Khata Active
              </span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Cart is Empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scan a barcode or tap products from catalog to start billing
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.productId}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {item.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        HSN: {item.hsnCode} · GST: {item.taxRate}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ₹{item.unitPrice} / {item.unit}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper and Line Discount */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDiscountItem(item)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          item.discountPercent > 0
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.discountPercent > 0 ? `${item.discountPercent}% Disc` : '% Disc'}
                      </button>

                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Summary & Checkout Trigger */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discounts Applied:</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Taxable Value:</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>CGST (Intra-state):</span>
                <span>₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>SGST (Intra-state):</span>
                <span>₹{totalSgst.toFixed(2)}</span>
              </div>
              {roundingAdj !== 0 && (
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Round Off:</span>
                  <span>{roundingAdj > 0 ? `+₹${roundingAdj}` : `-₹${Math.abs(roundingAdj)}`}</span>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">Grand Total (GST Incl.)</span>
              <span className="text-2xl font-black text-slate-900 font-display">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                if (cart.length === 0) return;
                setIsPaymentModalOpen(true);
              }}
              disabled={cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Pay & Charge [F8] · ₹{grandTotal.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        totalAmount={grandTotal}
        customer={selectedCustomer}
        upiId={taxConfig?.upiId}
        storeName={tenant?.name}
        onClose={() => setIsPaymentModalOpen(false)}
        onComplete={handleCompleteCheckout}
      />

      {/* Tax Invoice Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        invoice={currentInvoice}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Manager PIN Security Guard Modal */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        actionDescription={pendingPinAction?.description || 'Manager Authorization'}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingPinAction(null);
        }}
        onAuthorize={data => {
          if (pendingPinAction) {
            pendingPinAction.action(data);
          }
        }}
      />

      {/* Open Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Open Daily Register Shift
            </h3>
            <p className="text-xs text-slate-500">
              Enter the starting physical cash float placed in the register drawer.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Starting Cash Float (₹)
              </label>
              <input
                type="number"
                value={startingFloatInput}
                onChange={e => setStartingFloatInput(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white"
              >
                Start Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Item Discount Modal */}
      {activeDiscountItem && (
        <DiscountModal
          isOpen={Boolean(activeDiscountItem)}
          onClose={() => setActiveDiscountItem(null)}
          itemName={activeDiscountItem.productName}
          itemUnitPrice={activeDiscountItem.unitPrice}
          itemQuantity={activeDiscountItem.quantity}
          currentDiscountPercent={activeDiscountItem.discountPercent}
          onApplyDiscount={(percent) => {
            handleApplyDiscount(activeDiscountItem, percent);
          }}
        />
      )}
    </div>
  );
};
