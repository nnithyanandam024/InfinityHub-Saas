import React, { useState } from 'react';
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

interface MobileDrawerMovementModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordMovement: (
    type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale',
    amount: number,
    reason: string
  ) => Promise<void>;
}

export const MobileDrawerMovementModal: React.FC<MobileDrawerMovementModalProps> = ({
  visible,
  onClose,
  onRecordMovement
}) => {
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [amountInput, setAmountInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const amount = parseFloat(amountInput) || 0;

  const handleReasonPreset = (preset: string) => {
    setReason(preset);
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than zero.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please enter or select a reason for the drawer cash movement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordMovement(movementType, amount, reason);
      Alert.alert('Recorded', `Recorded ${movementType === 'cash_in' ? 'Cash In' : 'Cash Out'} of ₹${amount}.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record movement');
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
              <Text style={styles.title}>Record Drawer Movement</Text>
              <Text style={styles.subtitle}>Log cash drops, petty cash or top-ups</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, movementType === 'cash_in' && styles.toggleBtnActive]}
              onPress={() => setMovementType('cash_in')}
            >
              <Text style={[styles.toggleText, movementType === 'cash_in' && styles.toggleTextActive]}>
                + Cash In (Paid-In)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, movementType === 'cash_out' && styles.toggleBtnActive]}
              onPress={() => setMovementType('cash_out')}
            >
              <Text style={[styles.toggleText, movementType === 'cash_out' && styles.toggleTextActive]}>
                - Cash Out (Paid-Out)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Text style={styles.inputLabel}>Cash Amount (₹)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 500"
              placeholderTextColor={theme.colors.muted}
              value={amountInput}
              onChangeText={setAmountInput}
              autoFocus
            />
          </View>

          {/* Preset Reasons */}
          <Text style={styles.inputLabel}>Select Reason</Text>
          <View style={styles.presetGrid}>
            {(movementType === 'cash_in'
              ? ['Cash Float Top-up', 'Denomination Change', 'Owner Deposit']
              : ['Petty Cash Expense', 'Safe Drop / Bank Deposit', 'Vendor Cash Advance', 'Tea & Snacks']
            ).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.presetChip, reason === p && styles.presetChipActive]}
                onPress={() => handleReasonPreset(p)}
              >
                <Text style={[styles.presetChipText, reason === p && styles.presetChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Reason Field */}
          <View style={[styles.inputContainer, { height: 48, marginTop: 4 }]}>
            <TextInput
              style={styles.input}
              placeholder="Or type custom reason..."
              placeholderTextColor={theme.colors.muted}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label={isSubmitting ? 'Recording...' : `Confirm ${movementType === 'cash_in' ? 'Cash In' : 'Cash Out'}`}
              variant={movementType === 'cash_in' ? 'primary' : 'danger'}
              onPress={handleSubmit}
              disabled={isSubmitting}
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
    marginBottom: 16
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12
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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  presetChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  presetChipTextActive: {
    color: theme.colors.primary
  },
  actions: {
    paddingTop: 8
  }
});
