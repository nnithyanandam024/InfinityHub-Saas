import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductBundle } from '@infinityhub/types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  PackageCheck,
  PackageOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

interface BundleAssembleModalProps {
  isOpen: boolean;
  mode: 'assemble' | 'disassemble';
  bundle: ProductBundle | null;
  parentProduct?: Product;
  allProducts: Product[];
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}

export const BundleAssembleModal: React.FC<BundleAssembleModalProps> = ({
  isOpen,
  mode,
  bundle,
  parentProduct,
  allProducts,
  onClose,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Map product stock by product ID for quick lookups
  const productStockMap = useMemo(() => {
    const map = new Map<string, { product: Product; stock: number }>();
    for (const p of allProducts) {
      map.set(p.id, { product: p, stock: p.stockQuantity ?? 0 });
    }
    return map;
  }, [allProducts]);

  // Compute maximum assemblable units from component stock
  const maxAssemblable = useMemo(() => {
    if (!bundle || bundle.components.length === 0) return 0;
    const limits = bundle.components.map(c => {
      const entry = productStockMap.get(c.componentProductId);
      const stock = entry ? entry.stock : 0;
      return c.quantity > 0 ? Math.floor(stock / c.quantity) : 0;
    });
    return Math.max(0, Math.min(...limits));
  }, [bundle, productStockMap]);

  // Max disassemblable is the on-hand stock of the parent bundle product
  const maxDisassemblable = useMemo(() => {
    return Math.max(0, parentProduct?.stockQuantity ?? 0);
  }, [parentProduct]);

  const maxAllowed = mode === 'assemble' ? maxAssemblable : maxDisassemblable;

  // Reset quantity and error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      if (mode === 'assemble') {
        setQuantity(maxAssemblable > 0 ? Math.min(1, maxAssemblable) : 1);
      } else {
        setQuantity(maxDisassemblable > 0 ? Math.min(1, maxDisassemblable) : 1);
      }
    }
  }, [isOpen, mode, maxAssemblable, maxDisassemblable]);

  if (!bundle) return null;

  const handleStep = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (maxAllowed > 0 && next > maxAllowed) return maxAllowed;
      return next;
    });
    setError(null);
  };

  const handleSetMax = () => {
    setQuantity(Math.max(1, maxAllowed));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Please enter a valid quantity of at least 1 unit');
      return;
    }

    if (mode === 'assemble' && quantity > maxAssemblable) {
      setError(`Insufficient component stock to assemble ${quantity} units (Maximum available: ${maxAssemblable})`);
      return;
    }

    if (mode === 'disassemble' && quantity > maxDisassemblable) {
      setError(`Cannot disassemble ${quantity} units: You only have ${maxDisassemblable} on-hand`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(quantity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please verify stock balances and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssemble = mode === 'assemble';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAssemble ? 'Assemble Finished Bundle' : 'Disassemble Bundle to Stock'}
      description={
        isAssemble
          ? 'Convert raw component products into finished sellable bundle inventory'
          : 'Break down finished kits back into original component products in inventory'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bundle Overview Header */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${isAssemble ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
              {isAssemble ? <PackageCheck className="w-5 h-5" /> : <PackageOpen className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {bundle.bundleProductName}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                SKU: {parentProduct?.sku || 'N/A'} • {bundle.components.length} BOM components
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Current Finished Stock: <strong className="text-slate-900 dark:text-white font-semibold">{parentProduct?.stockQuantity ?? 0} kits</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            {isAssemble ? (
              maxAssemblable > 0 ? (
                <Badge variant="success">
                  Can Assemble: {maxAssemblable} max
                </Badge>
              ) : (
                <Badge variant="danger">
                  0 Assemblable (Low Stock)
                </Badge>
              )
            ) : (
              <Badge variant={maxDisassemblable > 0 ? 'primary' : 'warning'}>
                On-Hand: {maxDisassemblable} kits
              </Badge>
            )}
          </div>
        </div>

        {/* Quantity Controller with Steppers and Quick Chips */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {isAssemble ? 'Quantity to Assemble' : 'Quantity to Disassemble'}
          </label>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={quantity <= 1 || isSubmitting}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max={maxAllowed > 0 ? maxAllowed : undefined}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 0 : val);
                  setError(null);
                }}
                className="w-20 py-2 text-center text-base font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={(maxAllowed > 0 && quantity >= maxAllowed) || isSubmitting}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 5, 10].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setQuantity(val);
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    quantity === val
                      ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  +{val}
                </button>
              ))}

              {maxAllowed > 0 && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Max ({maxAllowed})
                </button>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {isAssemble
              ? `Assembling ${quantity || 0} kit${quantity === 1 ? '' : 's'} will deduct components from inventory and increase finished kit stock.`
              : `Disassembling ${quantity || 0} kit${quantity === 1 ? '' : 's'} will reduce finished kit stock and restore components back into inventory.`}
          </p>
        </div>

        {/* Bill of Materials (BOM) Real-time Stock Impact Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Component Stock Mutation Preview
            </h5>
            <span className="text-[11px] text-slate-400">
              Impact based on {quantity || 0} unit(s)
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {bundle.components.map(c => {
              const entry = productStockMap.get(c.componentProductId);
              const currentStock = entry ? entry.stock : 0;
              const perUnit = c.quantity;
              const totalRequired = perUnit * (quantity || 0);
              const resultingStock = isAssemble
                ? currentStock - totalRequired
                : currentStock + totalRequired;
              const isShort = isAssemble && resultingStock < 0;

              return (
                <div
                  key={c.componentProductId}
                  className={`p-3 text-xs flex items-center justify-between gap-3 ${
                    isShort ? 'bg-rose-50/60 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isShort ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {c.componentProductName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Requires {perUnit} per kit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right font-mono">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-sans">
                        {isAssemble ? 'Deduction' : 'Restoration'}
                      </p>
                      <p className={`font-bold ${isAssemble ? 'text-amber-600' : 'text-blue-600'}`}>
                        {isAssemble ? `-${totalRequired}` : `+${totalRequired}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-sans">Available</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {currentStock}
                      </p>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

                    <div className="min-w-[60px]">
                      <p className="text-[10px] uppercase text-slate-400 font-sans">Resulting</p>
                      <p className={`font-bold ${isShort ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        {resultingStock}
                      </p>
                    </div>

                    <div>
                      {isShort ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Short by {Math.abs(resultingStock)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant={isAssemble ? 'primary' : 'outline'}
            disabled={
              isSubmitting ||
              !quantity ||
              quantity <= 0 ||
              (isAssemble && quantity > maxAssemblable) ||
              (!isAssemble && quantity > maxDisassemblable)
            }
            className={!isAssemble ? 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400' : ''}
          >
            {isSubmitting ? (
              isAssemble ? 'Assembling...' : 'Disassembling...'
            ) : isAssemble ? (
              `Assemble ${quantity || 0} Kit${quantity === 1 ? '' : 's'}`
            ) : (
              `Disassemble ${quantity || 0} Kit${quantity === 1 ? '' : 's'}`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
