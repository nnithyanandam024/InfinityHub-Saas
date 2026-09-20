/**
 * Calculates Indian GST breakdown for an item line.
 * Selling price is treated as GST inclusive (standard Indian retail practice).
 */
export function calculateItemGst(unitPrice, quantity, taxRate = 18, discountAmount = 0, isInterState = false) {
    const grossLineTotal = unitPrice * quantity;
    const netLineTotal = Math.max(0, grossLineTotal - discountAmount);
    // Back-calculate taxable value from inclusive price
    const taxableAmount = Math.round((netLineTotal / (1 + taxRate / 100)) * 100) / 100;
    const totalTax = Math.round((netLineTotal - taxableAmount) * 100) / 100;
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;
    if (isInterState) {
        igstRate = taxRate;
        igstAmount = totalTax;
    }
    else {
        cgstRate = taxRate / 2;
        cgstAmount = Math.round((totalTax / 2) * 100) / 100;
        sgstRate = taxRate / 2;
        sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100; // balance paise
    }
    return {
        taxableAmount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalTax,
        lineTotal: netLineTotal
    };
}
/**
 * Groups items by HSN Code to generate the statutory GST summary.
 */
export function buildHsnSummary(items, isInterState = false) {
    const summaryMap = {};
    for (const item of items) {
        const hsn = item.hsnCode || 'HSN-GENERAL';
        if (!summaryMap[hsn]) {
            summaryMap[hsn] = {
                hsnCode: hsn,
                taxableValue: 0,
                cgstRate: item.cgstRate || 0,
                cgstAmount: 0,
                sgstRate: item.sgstRate || 0,
                sgstAmount: 0,
                igstRate: item.igstRate || 0,
                igstAmount: 0,
                totalTax: 0
            };
        }
        summaryMap[hsn].taxableValue += item.taxableAmount;
        summaryMap[hsn].cgstAmount += item.cgstAmount;
        summaryMap[hsn].sgstAmount += item.sgstAmount;
        summaryMap[hsn].igstAmount += item.igstAmount;
        summaryMap[hsn].totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    }
    // Round values
    return Object.values(summaryMap).map(line => ({
        ...line,
        taxableValue: Math.round(line.taxableValue * 100) / 100,
        cgstAmount: Math.round(line.cgstAmount * 100) / 100,
        sgstAmount: Math.round(line.sgstAmount * 100) / 100,
        igstAmount: Math.round(line.igstAmount * 100) / 100,
        totalTax: Math.round(line.totalTax * 100) / 100
    }));
}
//# sourceMappingURL=mobileGstUtils.js.map