/**
 * Converts a numeric amount into Indian Currency Words (Rupees ... Only)
 */
const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
];
const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];
function convertTwoDigits(n) {
    if (n < 20)
        return ones[n];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return `${tens[ten]}${one ? ' ' + ones[one] : ''}`.trim();
}
function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
        res += `${ones[hundred]} Hundred`;
    }
    if (remainder > 0) {
        res += `${res ? ' and ' : ''}${convertTwoDigits(remainder)}`;
    }
    return res.trim();
}
export function numberToIndianWords(amount) {
    if (isNaN(amount) || amount === 0)
        return 'Rupees Zero Only';
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const rupees = Math.floor(absAmount);
    const paise = Math.round((absAmount - rupees) * 100);
    let remaining = rupees;
    const parts = [];
    // Crores (1,00,00,000)
    if (remaining >= 10000000) {
        const cr = Math.floor(remaining / 10000000);
        parts.push(`${convertTwoDigits(cr)} Crore`);
        remaining %= 10000000;
    }
    // Lakhs (1,00,000)
    if (remaining >= 100000) {
        const lk = Math.floor(remaining / 100000);
        parts.push(`${convertTwoDigits(lk)} Lakh`);
        remaining %= 100000;
    }
    // Thousands (1,000)
    if (remaining >= 1000) {
        const th = Math.floor(remaining / 1000);
        parts.push(`${convertTwoDigits(th)} Thousand`);
        remaining %= 1000;
    }
    // Hundreds & Below
    if (remaining > 0) {
        parts.push(convertThreeDigits(remaining));
    }
    let words = `Rupees ${parts.join(' ')}`.trim();
    if (paise > 0) {
        words += ` and ${convertTwoDigits(paise)} Paise`;
    }
    words += ' Only';
    return isNegative ? `Minus ${words}` : words;
}
//# sourceMappingURL=mobileNumberToWords.js.map