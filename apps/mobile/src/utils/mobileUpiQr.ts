/**
 * Indian UPI Bharat QR Payload & QR Image Generator
 */
export function generateUpiIntentUri(
  upiId: string,
  merchantName: string,
  amount: number,
  invoiceNumber: string
): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(merchantName.trim());
  const cleanRef = encodeURIComponent(invoiceNumber);
  const formattedAmount = amount.toFixed(2);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanRef}`;
}

export function generateUpiQrImageUrl(
  upiId: string,
  merchantName: string,
  amount: number,
  invoiceNumber: string,
  size: number = 220
): string {
  const intentUri = generateUpiIntentUri(upiId, merchantName, amount, invoiceNumber);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(intentUri)}&margin=10`;
}
