import React, { useState, useId } from 'react';
import { Product } from '@infinityhub/types';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { stockService } from '../../services/stockService';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface StockAdjustModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'damage' | 'correction'>('increase');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate simulated preview of new stock
  const currentStock = product.stockQuantity;
  let simulatedNewStock = currentStock;

  if (adjustmentType === 'increase') {
    simulatedNewStock = currentStock + (Number(quantity) || 0);
  } else if (adjustmentType === 'decrease' || adjustmentType === 'damage') {
    simulatedNewStock = Math.max(0, currentStock - (Number(quantity) || 0));
  } else if (adjustmentType === 'correction') {
    simulatedNewStock = Math.max(0, Number(quantity) || 0);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;

    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a specific reason (min 3 chars)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await stockService.adjustStock(tenant.id, product.id, {
        adjustmentType,
        quantity: Number(quantity),
        reason: reason.trim(),
        userId: user.id,
        userName: user.name
      });

      showToast(`Stock updated for ${product.name}: ${currentStock} → ${simulatedNewStock}`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      description={`Update stock quantity and record an audit log for ${product.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Details Brief */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-900 block">{product.name}</span>
            <span className="text-slate-500">SKU: {product.sku} · Unit: {product.unit}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Current Stock</span>
            <span className="font-bold text-sm text-slate-900">{product.stockQuantity} {product.unit}</span>
          </div>
        </div>

        {/* Adjustment Type */}
        <Select
          label="Adjustment Type"
          value={adjustmentType}
          onChange={e => setAdjustmentType(e.target.value as any)}
          options={[
            { value: 'increase', label: 'Manual Increase (Found stock / returns)' },
            { value: 'decrease', label: 'Manual Decrease (Loss / shrinkage)' },
            { value: 'damage', label: 'Damaged / Expired Product' },
            { value: 'correction', label: 'Exact Audit Correction (Set exact physical count)' }
          ]}
        />

        {/* Quantity */}
        <Input
          label={adjustmentType === 'correction' ? 'Exact Count Counted on Shelf' : 'Adjustment Quantity'}
          type="number"
          min={1}
          required
          value={quantity}
          onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
          helperText={
            adjustmentType === 'correction'
              ? 'Enter the exact real number counted during physical inventory check'
              : `Number of units to ${adjustmentType === 'increase' ? 'add to' : 'deduct from'} inventory`
          }
        />

        {/* Reason */}
        <Input
          label="Reason / Notes"
          type="text"
          required
          placeholder="e.g., Physical shelf count, carton damaged in transit..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />

        {/* Live Stock Transition Preview */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Before</span>
            <span className="text-lg font-bold text-slate-700">{currentStock} {product.unit}</span>
          </div>

          <div className="flex items-center gap-1 text-blue-600">
            <span className="text-xs font-semibold">
              {adjustmentType === 'increase' ? `+${quantity}` : adjustmentType === 'correction' ? 'set to' : `-${quantity}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Resulting Stock</span>
            <span className="text-lg font-bold text-blue-700">{simulatedNewStock} {product.unit}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
