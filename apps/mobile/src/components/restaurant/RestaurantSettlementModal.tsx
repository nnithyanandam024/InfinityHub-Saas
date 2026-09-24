import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
const KeyboardAvoidingView = (ReactNative as any).KeyboardAvoidingView;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { RestaurantTable, Invoice } from '@infinityhub/types';
import { useRestaurant } from '../../context/RestaurantContext';

interface RestaurantSettlementModalProps {
  visible: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onSettled: (invoice: Invoice) => void;
}

export const RestaurantSettlementModal: React.FC<RestaurantSettlementModalProps> = ({
  visible,
  table,
  onClose,
  onSettled
}) => {
  const { settleTableBill, orders, kots, sections } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active order for table
  const order = useMemo(() => {
    if (!table) return null;
    const found = orders.find(o => (table.activeOrderId && o.id === table.activeOrderId) || (o.tableId === table.id && o.orderStatus !== 'settled'));
    if (found) {
      const orderKots = found.kots && found.kots.length > 0 ? found.kots : kots.filter(k => k.orderId === found.id || k.tableId === table.id);
      return { ...found, kots: orderKots };
    }

    // Resilient fallback order synthesis if table has active status or bill
    if (table.status !== 'vacant' && table.status !== 'cleaning') {
      const tableKots = kots.filter(k => k.tableId === table.id || (table.activeKotIds && table.activeKotIds.includes(k.id)));
      const baseTotal = tableKots.reduce((sum, kot) =>
        sum + kot.items.reduce((ksum, itm) => itm.status !== 'cancelled' ? ksum + (itm.unitPrice * itm.quantity) : ksum, 0),
        0
      ) || table.currentBillTotal || 0;
      const cgst = baseTotal * 0.025;
      const sgst = baseTotal * 0.025;
      return {
        id: table.activeOrderId || `ord-${table.id}`,
        orderNumber: `ORD-${table.tableNumber}`,
        orderType: 'dine_in' as const,
        tableId: table.id,
        tableNumber: table.tableNumber,
        sectionName: sections.find(s => s.id === table.sectionId)?.name || 'Main Dining',
        guestCount: table.guestCount || table.capacity || 2,
        captainName: table.captainName || 'Staff Captain',
        kots: tableKots,
        subtotal: baseTotal,
        discount: 0,
        serviceCharge: 0,
        cgst,
        sgst,
        roundOff: 0,
        grandTotal: Math.round(baseTotal + cgst + sgst),
        payments: [],
        orderStatus: 'open' as const,
        billPrintedCount: 0,
        reprintHistory: [],
        createdAt: table.seatedAt || new Date().toISOString()
      };
    }
    return null;
  }, [orders, table, kots, sections]);

  // Compute live breakdown
  const calculations = useMemo(() => {
    let subtotal = 0;
    if (order && order.kots && order.kots.length > 0) {
      for (const k of order.kots) {
        for (const item of k.items) {
          if (item.status !== 'cancelled') {
            subtotal += item.unitPrice * item.quantity;
          }
        }
      }
    }
    if (subtotal === 0 && order) {
      subtotal = order.subtotal || table?.currentBillTotal || 0;
    }
    const discount = Math.max(0, parseFloat(discountInput) || 0);
    const taxable = Math.max(0, subtotal - discount);
    const cgst = taxable * 0.025;
    const sgst = taxable * 0.025;
    const exactTotal = taxable + cgst + sgst;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Number((grandTotal - exactTotal).toFixed(2));

    return { subtotal, discount, taxable, cgst, sgst, roundOff, grandTotal };
  }, [order, discountInput, table]);

  useEffect(() => {
    if (visible && calculations.grandTotal > 0) {
      setTenderedInput(String(calculations.grandTotal));
      setDiscountInput('0');
      setCustomerName('');
      setCustomerPhone('');
      setIsSubmitting(false);
    }
  }, [visible, calculations.grandTotal]);

  if (!table || !order) return null;

  const tenderedAmount = parseFloat(tenderedInput) || 0;
  const changeDue = Math.max(0, tenderedAmount - calculations.grandTotal);
  const isCashShort = paymentMethod === 'cash' && tenderedAmount < calculations.grandTotal;

  const handleSettle = async () => {
    if (isCashShort) {
      Alert.alert('Insufficient Tendered Amount', 'Tendered cash must be greater than or equal to total amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await settleTableBill(table.id, {
        payments: [{ method: paymentMethod, amount: calculations.grandTotal }],
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discountAmount: calculations.discount
      });
      onSettled(res.invoice);
      onClose();
    } catch (err: any) {
      Alert.alert('Settlement Failed', err.message || 'Could not complete bill settlement.');
      setIsSubmitting(false);
    }
  };

  const handleQuickCash = (amount: number | 'exact') => {
    if (amount === 'exact') {
      setTenderedInput(String(calculations.grandTotal));
    } else {
      setTenderedInput(String(amount));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Top Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Bill Settlement · Table {table.tableNumber}</Text>
              <Text style={styles.subtitle}>
                Captain: {table.captainName || 'Staff'} · Order {order.orderNumber}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Order Items Summary Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Itemized Order Summary</Text>
                {order.kots && order.kots.length > 0 ? (
                  <Text style={styles.cardBadgeText}>
                    {order.kots.reduce((acc, k) => acc + k.items.length, 0)} Items
                  </Text>
                ) : null}
              </View>

              {order.kots && order.kots.length > 0 ? (
                order.kots.map(kot => (
                  <View key={kot.id} style={styles.kotSection}>
                    <Text style={styles.kotHeader}>{kot.kotNumber} · Station: {kot.station.toUpperCase()}</Text>
                    {kot.items.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.itemName, item.status === 'cancelled' && styles.itemCancelled]}>
                            {item.name} x{item.quantity}
                          </Text>
                          {item.status === 'cancelled' ? (
                            <Text style={styles.cancelReason}>Voided: {item.cancelledReason}</Text>
                          ) : null}
                        </View>
                        <Text style={[styles.itemPrice, item.status === 'cancelled' && styles.itemCancelled]}>
                          {item.status === 'cancelled' ? 'Void' : `₹${item.unitPrice * item.quantity}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Dining Charges (Table {table.tableNumber})</Text>
                  <Text style={styles.itemPrice}>₹{calculations.subtotal}</Text>
                </View>
              )}
            </View>

            {/* Bill Breakdown Card */}
            <View style={styles.breakdownCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Food Subtotal</Text>
                <Text style={styles.summaryValue}>₹{calculations.subtotal}</Text>
              </View>

              {calculations.discount > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.successText }]}>Discount Applied</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.successText }]}>-₹{calculations.discount}</Text>
                </View>
              ) : null}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST (2.5%)</Text>
                <Text style={styles.summaryValue}>₹{calculations.cgst.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST (2.5%)</Text>
                <Text style={styles.summaryValue}>₹{calculations.sgst.toFixed(2)}</Text>
              </View>

              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{calculations.grandTotal}</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionHeading}>Payment Tender</Text>
            <View style={styles.tabsRow}>
              {(['cash', 'upi', 'card'] as const).map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.tabBtn, paymentMethod === method && styles.tabBtnActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Icon
                    name={method === 'cash' ? 'cash' : method === 'upi' ? 'wallet' : 'receipt'}
                    size={16}
                    color={paymentMethod === method ? '#FFFFFF' : theme.colors.body}
                  />
                  <Text style={[styles.tabText, paymentMethod === method && styles.tabTextActive]}>
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cash Tender Details */}
            {paymentMethod === 'cash' ? (
              <View style={styles.cashContainer}>
                <View style={styles.quickDenomsRow}>
                  <TouchableOpacity
                    style={styles.quickChip}
                    onPress={() => handleQuickCash('exact')}
                  >
                    <Text style={styles.quickChipText}>Exact ₹{calculations.grandTotal}</Text>
                  </TouchableOpacity>
                  {[500, 1000, 2000].map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.quickChip}
                      onPress={() => handleQuickCash(amt)}
                    >
                      <Text style={styles.quickChipText}>₹{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tendered Cash (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={tenderedInput}
                    onChangeText={setTenderedInput}
                    placeholder="Enter received cash"
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>

                <View style={styles.changeDueRow}>
                  <Text style={styles.changeDueLabel}>Change Due to Customer:</Text>
                  <Text style={[styles.changeDueAmount, isCashShort && { color: theme.colors.danger }]}>
                    {isCashShort ? 'Short Amount' : `₹${changeDue}`}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Customer Details (Optional) */}
            <View style={styles.customerSection}>
              <Text style={styles.sectionHeading}>Customer Details (Optional)</Text>
              <View style={styles.customerRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Customer Name"
                  placeholderTextColor={theme.colors.muted}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Phone (SMS Receipt)"
                  placeholderTextColor={theme.colors.muted}
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Footer Docked at Bottom */}
          <View style={styles.footer}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              label={isSubmitting ? 'Settling...' : `Settle ₹${calculations.grandTotal}`}
              variant="primary"
              onPress={handleSettle}
              disabled={isSubmitting || isCashShort}
              style={styles.settleBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  backdropTouch: {
    flex: 1
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
    width: '100%'
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.navy
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollArea: {
    flexGrow: 0
  },
  scrollContent: {
    paddingBottom: 8
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    marginBottom: 10
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted
  },
  kotSection: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6
  },
  kotHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: 4
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2
  },
  itemName: {
    fontSize: 13,
    color: theme.colors.navy,
    fontWeight: '600'
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  itemCancelled: {
    textDecorationLine: 'line-through',
    color: theme.colors.muted
  },
  cancelReason: {
    fontSize: 10,
    color: theme.colors.danger,
    fontStyle: 'italic'
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    padding: 12,
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.body
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 6,
    paddingTop: 8,
    alignItems: 'center'
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF'
  },
  tabBtnActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.body
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  cashContainer: {
    marginBottom: 10
  },
  quickDenomsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy
  },
  inputGroup: {
    marginBottom: 6
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: theme.colors.navy,
    backgroundColor: '#FFFFFF'
  },
  changeDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  changeDueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  changeDueAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.successText
  },
  customerSection: {
    marginBottom: 8
  },
  customerRow: {
    flexDirection: 'row'
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 4
  },
  cancelBtn: {
    flex: 1
  },
  settleBtn: {
    flex: 1.8
  }
});
