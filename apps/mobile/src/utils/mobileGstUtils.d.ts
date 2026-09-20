import { PosOrderItem, HsnSummaryLine } from '@infinityhub/types';
export interface GstCalculationResult {
    taxableAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalTax: number;
    lineTotal: number;
}
/**
 * Calculates Indian GST breakdown for an item line.
 * Selling price is treated as GST inclusive (standard Indian retail practice).
 */
export declare function calculateItemGst(unitPrice: number, quantity: number, taxRate?: number, discountAmount?: number, isInterState?: boolean): GstCalculationResult;
/**
 * Groups items by HSN Code to generate the statutory GST summary.
 */
export declare function buildHsnSummary(items: PosOrderItem[], isInterState?: boolean): HsnSummaryLine[];
//# sourceMappingURL=mobileGstUtils.d.ts.map