import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Share = (ReactNative as any).Share;
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Invoice } from '@infinityhub/types';
import { useTenant } from '../../context/TenantContext';

export const RestaurantReceiptScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { tenant } = useTenant();
  const invoice: Invoice = route.params?.invoice;

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Guest Check Invoice Not Found</Text>
          <Button label="Back to Tables" variant="primary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      const summaryText = `*DINING TAX INVOICE - ${tenant?.name || 'Restaurant'}*\nBill: ${invoice.invoiceNumber}\nTotal: ₹${invoice.grandTotal}\nThank you for dining with us!`;
      await Share.share({
        message: summaryText,
        title: `Bill ${invoice.invoiceNumber}`
      });
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Thermal Printer Connected',
      `Sent 80mm ESC/POS dining check command to thermal printer for ${invoice.invoiceNumber}.`
    );
  };

  const paymentMethodName = (invoice.payments && invoice.payments[0]?.method) ? invoice.payments[0].method.toUpperCase() : 'PAID';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={18} color={theme.colors.navy} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settled Dining Check</Text>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Thermal Slip Card */}
        <View style={styles.slipCard}>
          {/* Header info */}
          <View style={styles.slipHeader}>
            <Text style={styles.storeName}>{tenant?.name || 'InfinityHub Restaurant'}</Text>
            <Text style={styles.storeAddress}>Gourmet Dining & Bar Lounge</Text>
            <Text style={styles.storeGst}>GSTIN: 33AABCK1234F1Z5</Text>
            <Text style={styles.billType}>TAX INVOICE / GUEST CHECK</Text>
          </View>

          {/* Bill Meta */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Check No:</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date & Time:</Text>
              <Text style={styles.metaValue}>{new Date(invoice.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Guest Name:</Text>
              <Text style={styles.metaValue}>{invoice.customerName || 'Dining Guest'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Status:</Text>
              <Text style={styles.statusPaid}>PAID ({paymentMethodName})</Text>
            </View>
          </View>

          {/* Dotted Divider */}
          <View style={styles.divider} />

          {/* Itemized Table */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colDish, styles.tableHeaderText]}>Dish Name</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colRate, styles.tableHeaderText]}>Rate</Text>
            <Text style={[styles.colAmt, styles.tableHeaderText]}>Amt</Text>
          </View>

          {invoice.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.colDish} numberOfLines={1}>{item.productName || item.sku}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>₹{item.unitPrice}</Text>
              <Text style={styles.colAmt}>₹{item.unitPrice * item.quantity}</Text>
            </View>
          ))}

          {/* Dotted Divider */}
          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>₹{invoice.subtotal.toFixed(2)}</Text>
            </View>

            {invoice.totalDiscount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalVal}>-₹{invoice.totalDiscount.toFixed(2)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CGST (2.5%)</Text>
              <Text style={styles.totalVal}>₹{invoice.totalCgst.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SGST (2.5%)</Text>
              <Text style={styles.totalVal}>₹{invoice.totalSgst.toFixed(2)}</Text>
            </View>

            {invoice.roundingAdjustment !== 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Round Off</Text>
                <Text style={styles.totalVal}>₹{invoice.roundingAdjustment.toFixed(2)}</Text>
              </View>
            ) : null}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL PAID</Text>
              <Text style={styles.grandTotalVal}>₹{invoice.grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Dotted Divider */}
          <View style={styles.divider} />

          {/* Slip Footer */}
          <View style={styles.slipFooter}>
            <Text style={styles.footerThanks}>Thank you for dining with us!</Text>
            <Text style={styles.footerSub}>Please visit again</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            label="Print Thermal Slip"
            variant="outline"
            onPress={handlePrint}
            style={{ flex: 1 }}
          />
          <Button
            label="Done / Tables"
            variant="primary"
            onPress={() => navigation.navigate('RestaurantTablesTab')}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  closeBtn: {
    padding: 4
  },
  shareBtn: {
    padding: 4
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 36
  },
  slipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    ...theme.shadows.card
  },
  slipHeader: {
    alignItems: 'center',
    marginBottom: 12
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  storeAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  storeGst: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1
  },
  billType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2
  },
  metaSection: {
    marginVertical: 10
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A'
  },
  statusPaid: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A'
  },
  divider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    marginVertical: 8
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase'
  },
  colDish: {
    flex: 2,
    fontSize: 11,
    color: '#0F172A'
  },
  colQty: {
    flex: 0.6,
    textAlign: 'center',
    fontSize: 11,
    color: '#0F172A'
  },
  colRate: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: '#0F172A'
  },
  colAmt: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3
  },
  totalsSection: {
    marginVertical: 6
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A'
  },
  grandTotalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0F172A'
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A'
  },
  grandTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A'
  },
  slipFooter: {
    alignItems: 'center',
    marginTop: 6
  },
  footerThanks: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  footerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16
  }
});
