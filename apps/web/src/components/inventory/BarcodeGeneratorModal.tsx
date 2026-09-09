import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Product, ProductVariant } from '@infinityhub/types';
import { Printer, Copy, Check, Barcode as BarcodeIcon, Tag, Sparkles } from 'lucide-react';
import { formatCurrency } from '@infinityhub/ui';

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variant?: ProductVariant | null;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  product,
  variant
}) => {
  const [copied, setCopied] = useState(false);
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'shelftag'>('standard');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeMrp, setIncludeMrp] = useState(true);

  if (!product) return null;

  const barcodeValue = variant?.barcode || product.barcode || product.sku;
  const displayName = variant ? `${product.name} (${Object.values(variant.attributes).join(' / ')})` : product.name;
  const displaySku = variant?.sku || product.sku;
  const displayPrice = variant?.sellingPrice ?? product.sellingPrice;
  const displayMrp = variant?.mrp ?? product.mrp;

  const handleCopy = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pseudo Code128 pattern generator for authentic rendering
  const generateBarcodePattern = (code: string) => {
    const bars: { width: number; isSpace: boolean }[] = [];
    const hash = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    // Standard start pattern
    bars.push({ width: 2, isSpace: false }, { width: 1, isSpace: true }, { width: 1, isSpace: false }, { width: 2, isSpace: true });
    
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const w1 = (charCode % 3) + 1;
      const w2 = ((charCode >> 1) % 2) + 1;
      const w3 = ((charCode >> 2) % 3) + 1;
      const w4 = ((charCode + hash) % 2) + 1;
      bars.push(
        { width: w1, isSpace: false },
        { width: w2, isSpace: true },
        { width: w3, isSpace: false },
        { width: w4, isSpace: true }
      );
    }
    // Standard stop pattern
    bars.push({ width: 2, isSpace: false }, { width: 3, isSpace: true }, { width: 2, isSpace: false });
    return bars;
  };

  const barcodeBars = generateBarcodePattern(barcodeValue);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode Label Studio"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Label Format
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="standard">Standard (50mm × 30mm)</option>
              <option value="compact">Compact (40mm × 20mm)</option>
              <option value="shelftag">Retail Shelf Tag (70mm × 35mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Print Copies
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={copiesCount}
              onChange={(e) => setCopiesCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Display Fields
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                Price
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMrp}
                  onChange={(e) => setIncludeMrp(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                MRP
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Thermal Label Preview
          </span>

          <div
            id="printable-label"
            className={`bg-white text-slate-900 p-4 rounded-lg shadow-md border border-slate-300 flex flex-col justify-between select-none ${
              labelSize === 'compact'
                ? 'w-64 h-32'
                : labelSize === 'shelftag'
                ? 'w-96 h-48'
                : 'w-80 h-40'
            }`}
          >
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start">
                <p className="font-bold text-xs truncate max-w-[200px]" title={displayName}>
                  {displayName}
                </p>
                {product.brandName && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {product.brandName}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono">SKU: {displaySku}</p>
            </div>

            {/* Visual Barcode Vector */}
            <div className="flex flex-col items-center justify-center my-1.5">
              <svg
                height={labelSize === 'compact' ? '30' : '45'}
                className="w-full max-w-[240px]"
                viewBox={`0 0 ${barcodeBars.reduce((acc, b) => acc + b.width, 0)} 50`}
                preserveAspectRatio="none"
              >
                {(() => {
                  let currentX = 0;
                  return barcodeBars.map((bar, i) => {
                    const x = currentX;
                    currentX += bar.width;
                    if (bar.isSpace) return null;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y="0"
                        width={bar.width}
                        height="50"
                        fill="#000"
                      />
                    );
                  });
                })()}
              </svg>
              <p className="font-mono text-[11px] tracking-widest text-slate-700 mt-1 font-bold">
                {barcodeValue}
              </p>
            </div>

            {/* Footer Pricing */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-xs">
              {includePrice && (
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-slate-500 uppercase">Our Price</span>
                  <span className="font-extrabold text-sm text-emerald-700">
                    {formatCurrency(displayPrice)}
                  </span>
                </div>
              )}
              {includeMrp && displayMrp && (
                <div className="text-[10px] text-slate-400">
                  <span>MRP: </span>
                  <span className="line-through">{formatCurrency(displayMrp)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Barcode Copied!' : 'Copy Number'}
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print {copiesCount > 1 ? `${copiesCount} Labels` : 'Label'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
