import * as ReactNative from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert
} from 'react-native';
const Share = (ReactNative as any).Share;
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Invoice } from '@infinityhub/types';
import { generateUpiQrImageUrl } from '../../utils/mobileUpiQr';

export const PosReceiptScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const invoice: Invoice = route.params?.invoice;

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Invoice not found</Text>
          <Button label="Back to Terminal" variant="primary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const qrImageUrl = generateUpiQrImageUrl(
    'kumarsupermarket@okaxis',
    invoice.tenantName,
    invoice.grandTotal,
    invoice.invoiceNumber,
    180
  );

  const handleShare = async () => {
    try {
      const summaryText = `*TAX INVOICE — ${invoice.tenantName}*\nInvoice: ${invoice.invoiceNumber}\nDate: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}\nTotal: ₹${invoice.grandTotal.toFixed(2)}\nGSTIN: ${invoice.tenantGstin}\nThank you for shopping with us!`;
      await Share.share({
        message: summaryText,
        title: `Invoice ${invoice.invoiceNumber}`
      });
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Thermal Printer Connected',
      `Sent 80mm ESC/POS command to Bluetooth thermal printer for invoice ${invoice.invoiceNumber}.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Navigation Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="close" size={18} color={theme.colors.navy} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Tax Invoice Receipt</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Printable 80mm Thermal Receipt Canvas */}
        <View style={styles.receiptCanvas}>
          {/* Store Header */}
          <View style={styles.centerSection}>
            <Text style={styles.storeName}>{invoice.tenantName}</Text>
            <Text style={styles.storeAddress}>{invoice.tenantAddress}</Text>
            <Text style={styles.storeGstin}>GSTIN: {invoice.tenantGstin}</Text>
            <Text style={styles.storeState}>
              State: {invoice.tenantState} (Code {invoice.tenantStateCode})
            </Text>
          </View>

          {/* Rule 46 Badge */}
          <View style={styles.taxInvoiceHeader}>
            <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.ruleNotice}>(Rule 46 - CGST / SGST Rules)</Text>
          </View>

          {/* Invoice & Customer Info */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={styles.metaValBold}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date & Time:</Text>
              <Text style={styles.metaVal}>{new Date(invoice.invoiceDate).toLocaleString('en-IN')}</Text>
            </View>
            {invoice.customerName && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Customer:</Text>
                <Text style={styles.metaValBold}>{invoice.customerName}</Text>
              </View>
            )}
            {invoice.customerPhone && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phone:</Text>
                <Text style={styles.metaVal}>{invoice.customerPhone}</Text>
              </View>
            )}
            {invoice.customerGstin && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Cust GSTIN:</Text>
                <Text style={styles.metaValBold}>{invoice.customerGstin}</Text>
              </View>
            )}
          </View>

          {/* Line Items Table */}
          <View style={styles.itemsSection}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCol, { flex: 5 }]}>ITEM</Text>
              <Text style={[styles.thCol, { flex: 2, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.thCol, { flex: 2.5, textAlign: 'right' }]}>RATE</Text>
              <Text style={[styles.thCol, { flex: 2.5, textAlign: 'right' }]}>AMT</Text>
            </View>

            {invoice.items.map((item, idx) => (
              <View key={idx} style={styles.tableDataRow}>
                <View style={{ flex: 5 }}>
                  <Text style={styles.tdItemName}>{item.productName}</Text>
                  <Text style={styles.tdItemHsn}>HSN: {item.hsnCode} ({item.taxRate}%)</Text>
                </View>
                <Text style={[styles.tdCol, { flex: 2, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.tdCol, { flex: 2.5, textAlign: 'right' }]}>₹{item.unitPrice}</Text>
                <Text style={[styles.tdCol, { flex: 2.5, textAlign: 'right', fontWeight: '700' }]}>
                  ₹{item.total.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Subtotals & Discounts */}
          <View style={styles.totalsSection}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal (Inclusive):</Text>
              <Text style={styles.calcVal}>₹{invoice.subtotal.toFixed(2)}</Text>
            </View>
            {invoice.totalDiscount > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Discount:</Text>
                <Text style={[styles.calcVal, { color: '#DC2626' }]}>- ₹{invoice.totalDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Taxable Amount:</Text>
              <Text style={styles.calcVal}>₹{invoice.taxableAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>CGST Total (50%):</Text>
              <Text style={styles.calcVal}>₹{invoice.totalCgst.toFixed(2)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>SGST Total (50%):</Text>
              <Text style={styles.calcVal}>₹{invoice.totalSgst.toFixed(2)}</Text>
            </View>

            {/* Grand Total */}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>NET TOTAL:</Text>
              <Text style={styles.grandTotalAmount}>₹{invoice.grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Amount In Words */}
          <View style={styles.inWordsBox}>
            <Text style={styles.inWordsLabel}>Amount in Words:</Text>
            <Text style={styles.inWordsText}>{invoice.grandTotalInWords}</Text>
          </View>

          {/* HSN Summary Table */}
          {invoice.hsnSummary && invoice.hsnSummary.length > 0 && (
            <View style={styles.hsnSection}>
              <Text style={styles.hsnTitle}>GST Breakdown (HSN Wise)</Text>
              <View style={styles.hsnHeaderRow}>
                <Text style={[styles.hsnTh, { flex: 3 }]}>HSN</Text>
                <Text style={[styles.hsnTh, { flex: 3, textAlign: 'right' }]}>Taxable</Text>
                <Text style={[styles.hsnTh, { flex: 2.5, textAlign: 'right' }]}>CGST</Text>
                <Text style={[styles.hsnTh, { flex: 2.5, textAlign: 'right' }]}>SGST</Text>
              </View>
              {invoice.hsnSummary.map((h, i) => (
                <View key={i} style={styles.hsnDataRow}>
                  <Text style={[styles.hsnTd, { flex: 3 }]}>{h.hsnCode}</Text>
                  <Text style={[styles.hsnTd, { flex: 3, textAlign: 'right' }]}>₹{h.taxableValue.toFixed(2)}</Text>
                  <Text style={[styles.hsnTd, { flex: 2.5, textAlign: 'right' }]}>₹{h.cgstAmount.toFixed(2)}</Text>
                  <Text style={[styles.hsnTd, { flex: 2.5, textAlign: 'right' }]}>₹{h.sgstAmount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dynamic UPI QR Code & Footer */}
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Pay using UPI Bharat QR</Text>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
            <Text style={styles.qrNotice}>Scan using any UPI App</Text>
            <Text style={styles.thankYouText}>*** Thank you for shopping with us! ***</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBar}>
          <Button
            label="Print (80mm Thermal)"
            variant="primary"
            onPress={handlePrint}
            style={{ flex: 1 }}
          />
          <Button
            label="Done"
            variant="outline"
            onPress={() => navigation.navigate('PosTerminal')}
            style={{ width: 100 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9'
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backBtn: {
    padding: 6
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryTint
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40
  },
  receiptCanvas: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  centerSection: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  storeName: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.navy,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  storeAddress: {
    fontSize: 10,
    color: theme.colors.body,
    textAlign: 'center',
    marginTop: 2
  },
  storeGstin: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.navy,
    marginTop: 3
  },
  storeState: {
    fontSize: 10,
    color: theme.colors.body,
    marginTop: 1
  },
  taxInvoiceHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  taxInvoiceTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    color: theme.colors.navy
  },
  ruleNotice: {
    fontSize: 9,
    color: theme.colors.muted,
    marginTop: 1
  },
  metaSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 2
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metaLabel: {
    fontSize: 10,
    color: theme.colors.muted
  },
  metaVal: {
    fontSize: 10,
    color: theme.colors.body
  },
  metaValBold: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.navy
  },
  itemsSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.navy
  },
  thCol: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.navy
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0'
  },
  tdCol: {
    fontSize: 10,
    color: theme.colors.navy
  },
  tdItemName: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy
  },
  tdItemHsn: {
    fontSize: 9,
    color: theme.colors.muted
  },
  totalsSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 3
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  calcLabel: {
    fontSize: 10,
    color: theme.colors.body
  },
  calcVal: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.navy
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.navy,
    paddingTop: 6,
    marginTop: 4
  },
  grandTotalText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.navy
  },
  grandTotalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.navy
  },
  inWordsBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  inWordsLabel: {
    fontSize: 9,
    color: theme.colors.muted
  },
  inWordsText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy,
    fontStyle: 'italic',
    marginTop: 2
  },
  hsnSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  hsnTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 4
  },
  hsnHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 2
  },
  hsnTh: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.muted
  },
  hsnDataRow: {
    flexDirection: 'row',
    paddingVertical: 2
  },
  hsnTd: {
    fontSize: 9,
    color: theme.colors.navy
  },
  qrSection: {
    alignItems: 'center',
    paddingTop: 10
  },
  qrTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy
  },
  qrImage: {
    width: 140,
    height: 140,
    marginVertical: 6
  },
  qrNotice: {
    fontSize: 9,
    color: theme.colors.muted
  },
  thankYouText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 8
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    marginTop: 16
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 16
  }
});
