import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { Supplier, Product, PurchaseItem } from '@infinityhub/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/EmptyState';
import { formatCurrency } from '@infinityhub/ui';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, AlertCircle } from 'lucide-react';

interface PurchaseLineItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export const NewPurchasePage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!tenant) return;
    setIsLoading(true);
    Promise.all([
      supplierService.getSuppliers(tenant.id),
      productService.getProducts(tenant.id)
    ])
      .then(([sups, prods]) => {
        setSuppliers(sups);
        setProducts(prods);
        if (sups.length > 0) setSupplierId(sups[0].id);
        if (prods.length > 0) {
          setItems([
            {
              productId: prods[0].id,
              quantity: 10,
              unitCost: prods[0].costPrice
            }
          ]);
        }
      })
      .finally(() => setIsLoading(false));
  }, [tenant?.id]);

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems(prev => [
      ...prev,
      {
        productId: products[0].id,
        quantity: 1,
        unitCost: products[0].costPrice
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      showToast('Purchase order must have at least 1 item', 'error');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        updated[index] = {
          ...updated[index],
          productId: value,
          unitCost: prod?.costPrice || updated[index].unitCost
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
  const totalAmount = Math.max(0, subtotal - (discount || 0) + (tax || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;

    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (!invoiceNumber.trim()) {
      setFormError('Please provide an invoice/PO number');
      return;
    }
    if (items.length === 0) {
      setFormError('Add at least one product item');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    if (!selectedSupplier) {
      setFormError('Invalid supplier selected');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const purchaseItems: PurchaseItem[] = items.map((item, idx) => {
        const prod = products.find(p => p.id === item.productId)!;
        return {
          id: `p-item-${idx}-${Date.now()}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          totalCost: Number(item.quantity) * Number(item.unitCost)
        };
      });

      await purchaseService.createPurchase(
        tenant.id,
        {
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.companyName,
          invoiceNumber,
          purchaseDate,
          items: purchaseItems,
          subtotal,
          discount,
          tax,
          totalAmount,
          status: 'completed',
          notes
        },
        { id: user.id, name: user.name }
      );

      showToast(`Purchase order ${invoiceNumber} created! Inventory replenished.`, 'success');
      navigate('/inventory/purchases');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = tenant?.settings?.currencySymbol || '₹';

  if (isLoading) return <LoadingSpinner text="Preparing purchase order..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/inventory/purchases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchases
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Record Inward Purchase Order
            </CardTitle>
            <CardDescription>
              Inward stock receipt automatically updates on-hand inventory and logs audit movements.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* General Purchase Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Supplier / Vendor"
                required
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.name})
                  </option>
                ))}
              </Select>

              <Input
                label="Invoice / PO Number"
                required
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />

              <Input
                label="Purchase Date"
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
              />
            </div>

            {/* Products Line Items */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Line Items ({items.length})
                </h4>
                <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addItemRow}>
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((row, index) => {
                  const lineTotal = (row.quantity || 0) * (row.unitCost || 0);

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      {/* Product Selector */}
                      <div className="sm:col-span-5">
                        <Select
                          label={`Item #${index + 1}`}
                          value={row.productId}
                          onChange={e => updateItem(index, 'productId', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <Input
                          label="Qty"
                          type="number"
                          min="1"
                          required
                          value={row.quantity}
                          onChange={e => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="sm:col-span-2">
                        <Input
                          label="Unit Cost"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={row.unitCost}
                          onChange={e => updateItem(index, 'unitCost', Math.max(0, parseFloat(e.target.value) || 0))}
                        />
                      </div>

                      {/* Line Subtotal */}
                      <div className="sm:col-span-2 text-right flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {formatCurrency(lineTotal, currencySymbol)}
                        </span>
                      </div>

                      {/* Delete Row */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
              <div className="sm:col-span-7">
                <Input
                  label="Purchase Order Notes / Delivery Instructions"
                  placeholder="e.g., Goods received in good condition at main dock"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="sm:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal, currencySymbol)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Discount ({currencySymbol}):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Tax / Freight ({currencySymbol}):</span>
                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={e => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">{formatCurrency(totalAmount, currencySymbol)}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Link to="/inventory/purchases">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>

            <Button type="submit" size="sm" isLoading={isSubmitting} icon={Save}>
              Save Purchase & Update Stock
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
