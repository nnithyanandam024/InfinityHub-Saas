import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
const KeyboardAvoidingView = (ReactNative as any).KeyboardAvoidingView;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { AppliedDiscount } from '../../context/PosContext';

interface MobileDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscount: AppliedDiscount | null;
  onApplyDiscount: (discount: AppliedDiscount | null) => void;
}

export const MobileDiscountModal: React.FC<MobileDiscountModalProps> = ({
  visible,
  onClose,
  subtotal,
  currentDiscount,
  onApplyDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (currentDiscount) {
      setDiscountType(currentDiscount.type);
      setInputValue(String(currentDiscount.value));
    } else {
      setDiscountType('percent');
      setInputValue('');
    }
  }, [currentDiscount, visible]);

  const numVal = parseFloat(inputValue) || 0;

  // Compute calculated discount
  let computedDiscount = 0;
  if (discountType === 'percent') {
    computedDiscount = Math.round((subtotal * (Math.min(100, numVal) / 100)) * 100) / 100;
  } else {
    computedDiscount = Math.min(subtotal, numVal);
  }
  const newTotal = Math.max(0, subtotal - computedDiscount);
  const isSupervisorRequired = discountType === 'percent' ? numVal > 20 : computedDiscount > subtotal * 0.2;

  const handlePreset = (val: number) => {
    setInputValue(String(val));
  };

  const handleApply = () => {
    if (numVal <= 0) {
      onApplyDiscount(null);
    } else {
      onApplyDiscount({
        type: discountType,
        value: discountType === 'percent' ? Math.min(100, numVal) : Math.min(subtotal, numVal)
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onApplyDiscount(null);
    onClose();
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
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="tag" size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Apply Order Discount</Text>
                <Text style={styles.subtitle}>Order subtotal: ₹{subtotal.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          {/* Type Segmented Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, discountType === 'percent' && styles.toggleBtnActive]}
              onPress={() => setDiscountType('percent')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, discountType === 'percent' && styles.toggleTextActive]}>
                Percentage (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, discountType === 'flat' && styles.toggleBtnActive]}
              onPress={() => setDiscountType('flat')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, discountType === 'flat' && styles.toggleTextActive]}>
                Flat Rupee (₹)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset Chips */}
          <View style={styles.presetRow}>
            {(discountType === 'percent' ? [5, 10, 15, 20] : [50, 100, 200, 500]).map(val => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, numVal === val && styles.chipActive]}
                onPress={() => handlePreset(val)}
              >
                <Text style={[styles.chipText, numVal === val && styles.chipTextActive]}>
                  {discountType === 'percent' ? `${val}%` : `₹${val}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>
              {discountType === 'percent' ? '%' : '₹'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={discountType === 'percent' ? 'Enter percentage (e.g. 10)' : 'Enter rupee amount'}
              placeholderTextColor={theme.colors.muted}
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
          </View>

          {/* Supervisor Warning */}
          {isSupervisorRequired && (
            <View style={styles.warningBox}>
              <Icon name="alert" size={15} color="#D97706" />
              <Text style={styles.warningText}>
                Discounts &gt; 20% require store manager supervisory authorization.
              </Text>
            </View>
          )}

          {/* Calculation Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Savings:</Text>
              <Text style={styles.summarySavings}>- ₹{computedDiscount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 6 }]}>
              <Text style={styles.summaryTotalLabel}>Payable Total:</Text>
              <Text style={styles.summaryTotalValue}>₹{newTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {currentDiscount && (
              <Button
                label="Remove"
                variant="outline"
                onPress={handleRemove}
                style={styles.removeBtn}
              />
            )}
            <Button
              label="Apply Discount"
              variant="primary"
              onPress={handleApply}
              style={{ flex: 1 }}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
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
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center'
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  chipTextActive: {
    color: theme.colors.primary
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600'
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.body
  },
  summarySavings: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626'
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  removeBtn: {
    flex: 0.4,
    borderColor: '#EF4444'
  }
});
