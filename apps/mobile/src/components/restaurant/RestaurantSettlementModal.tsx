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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxHeight: '90%' }}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Bill Settlement · Table {table.tableNumber}</Text>
                <Text style={styles.subtitle}>Captain: {table.captainName || 'Rajesh'} · Order {order.orderNumber}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={16} color={theme.colors.body} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Items Preview */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Itemized Order Summary</Text>
                {order.kots && order.kots.length > 0 ? (
                  order.kots.map(kot => (
                    <View key={kot.id} style={styles.kotSection}>
                      <Text style={styles.kotHeader}>{kot.kotNumber} · Station: {kot.station.toUpperCase()}</Text>
                      {kot.items.map(item => (
                        <View key={item.id} style={styles.itemRow}>
                          <View style={{ flex: 1 }}>
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

              {/* Tax Breakdown */}
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

              {/* Tender specific inputs */}
              {paymentMethod === 'cash' ? (
                <View style={styles.cashContainer}>
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

              {/* Customer Info (Optional) */}
              <View style={styles.customerSection}>
                <Text style={styles.sectionHeading}>Customer Details (Optional)</Text>
                <View style={styles.row}>
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

            {/* Actions */}
            <View style={styles.footer}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={isSubmitting ? 'Settling...' : `Settle ₹${calculations.grandTotal}`}
                variant="primary"
                onPress={handleSettle}
                disabled={isSubmitting || isCashShort}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    padding: theme.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : theme.spacing.xl,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.navy
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 8,
    textTransform: 'uppercase'
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
    fontWeight: '500'
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
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
    padding: theme.spacing.md,
    marginBottom: 14
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
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
    paddingTop: 8
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.body,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
    marginBottom: 12
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
    paddingVertical: 8,
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
    color: theme.colors.body
  },
  changeDueAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.successText
  },
  customerSection: {
    marginBottom: 16
  },
  row: {
    flexDirection: 'row'
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10
  }
});
