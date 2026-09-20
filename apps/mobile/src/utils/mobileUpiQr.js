/**
 * Indian UPI Bharat QR Payload & QR Image Generator
 */
export function generateUpiIntentUri(upiId, merchantName, amount, invoiceNumber) {
    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(merchantName.trim());
    const cleanRef = encodeURIComponent(invoiceNumber);
    const formattedAmount = amount.toFixed(2);
    return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanRef}`;
}
export function generateUpiQrImageUrl(upiId, merchantName, amount, invoiceNumber, size = 220) {
    const intentUri = generateUpiIntentUri(upiId, merchantName, amount, invoiceNumber);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(intentUri)}&margin=10`;
}
//# sourceMappingURL=mobileUpiQr.js.map