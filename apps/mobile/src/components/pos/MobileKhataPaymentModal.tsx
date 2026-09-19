import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { PosCustomer } from '@infinityhub/types';

interface MobileKhataPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  customer: PosCustomer | null;
  onRecordPayment: (
    customerId: string,
    amount: number,
    paymentMethod?: string,
    reference?: string
  ) => Promise<void>;
}

export const MobileKhataPaymentModal: React.FC<MobileKhataPaymentModalProps> = ({
  visible,
  onClose,
  customer,
  onRecordPayment
}) => {
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      setAmountInput(String(customer.currentBalance));
      setPaymentMethod('cash');
      setReference('');
    }
  }, [customer, visible]);

  if (!customer) return null;

  const currentDebt = customer.currentBalance;
  const payAmount = parseFloat(amountInput) || 0;
  const remainingDebt = Math.max(0, currentDebt - payAmount);

  const handleSubmit = async () => {
    if (payAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a payment amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordPayment(customer.id, payAmount, paymentMethod, reference);
      Alert.alert(
        'Payment Recorded',
        `Successfully received ₹${payAmount} from ${customer.name}. Remaining Khata balance is ₹${remainingDebt}.`
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record payment');
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Collect Khata Repayment</Text>
              <Text style={styles.subtitle}>{customer.name} ({customer.phone})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          {/* Current Debt Card */}
          <View style={styles.debtCard}>
            <Text style={styles.debtLabel}>Total Outstanding Due</Text>
            <Text style={styles.debtAmount}>₹{currentDebt.toFixed(2)}</Text>
          </View>

          {/* Method Selector */}
          <View style={styles.toggleRow}>
            {(['cash', 'upi', 'bank'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, paymentMethod === m && styles.toggleBtnActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.toggleText, paymentMethod === m && styles.toggleTextActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Field with Quick Full Settle */}
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Repayment Amount Received</Text>
            <TouchableOpacity onPress={() => setAmountInput(String(currentDebt))}>
              <Text style={styles.settleFullText}>Pay Full (₹{currentDebt})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 1000"
              placeholderTextColor={theme.colors.muted}
              value={amountInput}
              onChangeText={setAmountInput}
            />
          </View>

          {/* Remaining Balance Preview */}
          <View style={styles.remainingBox}>
            <Text style={styles.remainingLabel}>Remaining Balance After Payment:</Text>
            <Text style={styles.remainingVal}>₹{remainingDebt.toFixed(2)}</Text>
          </View>

          {/* Reference Field */}
          <View style={[styles.inputContainer, { height: 48, marginTop: 4 }]}>
            <TextInput
              style={styles.input}
              placeholder="Optional: UPI UTR or Bank Receipt No."
              placeholderTextColor={theme.colors.muted}
              value={reference}
              onChangeText={setReference}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label={isSubmitting ? 'Recording Payment...' : `Record Payment of ₹${payAmount.toFixed(2)}`}
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || payAmount <= 0}
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
  debtCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14
  },
  debtLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B'
  },
  debtAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 2
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  settleFullText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy
  },
  remainingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 10,
    marginBottom: 10
  },
  remainingLabel: {
    fontSize: 11,
    color: theme.colors.body
  },
  remainingVal: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  actions: {
    paddingTop: 8
  }
});
