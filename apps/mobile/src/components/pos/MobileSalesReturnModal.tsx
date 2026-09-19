import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
const KeyboardAvoidingView = (ReactNative as any).KeyboardAvoidingView;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Invoice, PosReturn } from '@infinityhub/types';
import { usePos } from '../../context/PosContext';

interface MobileSalesReturnModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: (creditNoteNumber: string) => void;
}

export const MobileSalesReturnModal: React.FC<MobileSalesReturnModalProps> = ({
  visible,
  onClose,
  invoice,
  onSuccess
}) => {
  const { processReturn } = usePos();

  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'upi' | 'store_credit'>('cash');
  const [reason, setReason] = useState<string>('Defective / Damaged');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!invoice) return null;

  const handleQtyChange = (productId: string, delta: number, maxQty: number) => {
    const current = returnQtys[productId] || 0;
    const next = Math.max(0, Math.min(maxQty, current + delta));
    setReturnQtys(prev => ({ ...prev, [productId]: next }));
  };

  // Compute total refund
  let totalRefund = 0;
  const returnedItems: any[] = [];
  invoice.items.forEach(item => {
    const qty = returnQtys[item.productId] || 0;
    if (qty > 0) {
      const refundAmt = Math.round((item.unitPrice * qty) * 100) / 100;
      totalRefund += refundAmt;
      returnedItems.push({
        productId: item.productId,
        productName: item.productName,
        quantity: qty,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        refundAmount: refundAmt,
        reason
      });
    }
  });

  const handleSubmit = async () => {
    if (returnedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item quantity to return.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await processReturn(invoice.id, {
        returnedItems,
        refundMethod,
        cashierName: 'Mobile Cashier'
      });
      Alert.alert(
        'Sales Return Processed',
        `Credit note ${result.creditNoteNumber} issued for ₹${totalRefund.toFixed(2)}. Inventory stock has been restored.`
      );
      onSuccess(result.creditNoteNumber);
      onClose();
    } catch (err: any) {
      Alert.alert('Return Error', err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Process Sales Return</Text>
              <Text style={styles.subtitle}>Invoice: {invoice.invoiceNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Items to Return</Text>
            <View style={styles.itemList}>
              {invoice.items.map(item => {
                const qty = returnQtys[item.productId] || 0;
                return (
                  <View key={item.productId} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemMeta}>
                        Bought: {item.quantity} | Rate: ₹{item.unitPrice}
                      </Text>
                    </View>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleQtyChange(item.productId, -1, item.quantity)}
                      >
                        <Text style={styles.stepText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyDisplay}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleQtyChange(item.productId, 1, item.quantity)}
                      >
                        <Text style={styles.stepText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Refund Tender */}
            <Text style={styles.sectionTitle}>Refund Method</Text>
            <View style={styles.toggleRow}>
              {(['cash', 'upi', 'store_credit'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.toggleBtn, refundMethod === m && styles.toggleBtnActive]}
                  onPress={() => setRefundMethod(m)}
                >
                  <Text style={[styles.toggleText, refundMethod === m && styles.toggleTextActive]}>
                    {m === 'store_credit' ? 'CREDIT' : m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Return Reason */}
            <Text style={styles.sectionTitle}>Return Reason</Text>
            <View style={styles.reasonRow}>
              {['Defective / Damaged', 'Wrong Item', 'Customer Choice', 'Expired'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, reason === r && styles.chipActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Card */}
          <View style={styles.footerCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Refund Payable:</Text>
              <Text style={styles.totalAmount}>₹{totalRefund.toFixed(2)}</Text>
            </View>
            <Button
              label={isSubmitting ? 'Issuing Credit Note...' : `Issue Return & Refund ₹${totalRefund.toFixed(2)}`}
              variant="danger"
              onPress={handleSubmit}
              disabled={isSubmitting || totalRefund <= 0}
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end'
  },
  backdropTouch: {
    flex: 1
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  title: {
    ...theme.typography.bodyBold,
    fontSize: 16
  },
  subtitle: {
    ...theme.typography.caption,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 100,
    backgroundColor: theme.colors.surfaceSubtle
  },
  content: {
    maxHeight: 340
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 10,
    marginBottom: 8
  },
  itemList: {
    gap: 8
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  itemMeta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary
  },
  qtyDisplay: {
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 3,
    marginBottom: 10
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted
  },
  toggleTextActive: {
    color: theme.colors.primary
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  chipActive: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FEF2F2'
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  chipTextActive: {
    color: theme.colors.danger
  },
  footerCard: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626'
  }
});
