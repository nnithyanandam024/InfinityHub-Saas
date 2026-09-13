import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useTenant } from '../../context/TenantContext';
import { Product } from '@infinityhub/types';

const REASON_PRESETS = [
  'Received Supplier Purchase',
  'Physical Count Correction',
  'Damaged / Defective Stock',
  'Customer Return / Restock'
];

export const StockAdjustmentScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { updateProductStock } = useTenant();
  const product: Product = route.params?.product;

  const [type, setType] = useState<'increase' | 'decrease'>('increase');
  const [qty, setQty] = useState('5');
  const [reason, setReason] = useState(REASON_PRESETS[0]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>No product selected for adjustment</Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const current = product.stockQuantity;
  const num = parseInt(qty) || 0;
  const simulated = type === 'increase' ? current + num : Math.max(0, current - num);

  const applyDelta = (delta: number) => {
    if (delta > 0) {
      setType('increase');
      setQty(String(delta));
    } else {
      setType('decrease');
      setQty(String(Math.abs(delta)));
    }
  };

  const handleSave = () => {
    if (num <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity greater than zero');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please select or enter an audit reason');
      return;
    }

    updateProductStock(product.id, simulated, reason);
    Alert.alert(
      'Stock Adjusted',
      `${product.name} stock updated to ${simulated} ${product.unit}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevronRight" size={16} color={theme.colors.navy} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adjust Stock Level</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Brief */}
        <View style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.skuText}>SKU: {product.sku}</Text>
          <View style={styles.stockStatusRow}>
            <Text style={styles.stockStatusLabel}>Current On-Hand Stock:</Text>
            <Text style={styles.stockStatusVal}>{current} {product.unit}</Text>
          </View>
        </View>

        {/* Direction Toggle: Increase vs Decrease */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'increase' && styles.toggleBtnActiveAdd]}
            onPress={() => setType('increase')}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={14} color={type === 'increase' ? '#FFFFFF' : theme.colors.body} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, type === 'increase' && styles.toggleTextActive]}>
              Add Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, type === 'decrease' && styles.toggleBtnActiveDeduct]}
            onPress={() => setType('decrease')}
            activeOpacity={0.8}
          >
            <Icon name="minus" size={14} color={type === 'decrease' ? '#FFFFFF' : theme.colors.body} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, type === 'decrease' && styles.toggleTextActive]}>
              Deduct Stock
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stepper Buttons */}
        <Text style={styles.label}>Quick Quantity Steppers</Text>
        <View style={styles.stepperRow}>
          {[1, 5, 10, 25, 50].map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.stepperChip, qty === String(val) && styles.stepperChipActive]}
              onPress={() => setQty(String(val))}
            >
              <Text style={[styles.stepperText, qty === String(val) && styles.stepperTextActive]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity to {type === 'increase' ? 'Add' : 'Deduct'}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={qty}
            onChangeText={setQty}
            placeholder="0"
          />
        </View>

        {/* Live Calculation Preview */}
        <View style={styles.calcCard}>
          <Text style={styles.calcTitle}>Stock Calculation Preview</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Current Stock</Text>
            <Text style={styles.calcVal}>{current} {product.unit}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Adjustment</Text>
            <Text style={[styles.calcVal, type === 'increase' ? styles.textAdd : styles.textDeduct]}>
              {type === 'increase' ? `+${num}` : `-${num}`} {product.unit}
            </Text>
          </View>
          <View style={[styles.calcRow, styles.calcTotalRow]}>
            <Text style={styles.calcTotalLabel}>New Resulting Stock</Text>
            <Text style={styles.calcTotalVal}>{simulated} {product.unit}</Text>
          </View>
        </View>

        {/* Reason Presets */}
        <Text style={styles.label}>Audit Note / Movement Reason</Text>
        <View style={styles.reasonList}>
          {REASON_PRESETS.map((r, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={`Confirm & Update Stock to ${simulated} ${product.unit}`}
          onPress={handleSave}
          variant="primary"
          size="lg"
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  productCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy
  },
  skuText: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 2
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle
  },
  stockStatusLabel: {
    fontSize: 12,
    color: theme.colors.body
  },
  stockStatusVal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  toggleBtnActiveAdd: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success
  },
  toggleBtnActiveDeduct: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.body
  },
  toggleTextActive: {
    color: '#FFFFFF'
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy,
    marginBottom: 6
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md
  },
  stepperChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    alignItems: 'center'
  },
  stepperChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  stepperTextActive: {
    color: theme.colors.primary
  },
  inputGroup: {
    marginBottom: theme.spacing.md
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  calcCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    padding: 12,
    marginBottom: theme.spacing.md
  },
  calcTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 8
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  calcLabel: {
    fontSize: 12,
    color: theme.colors.body
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  textAdd: { color: theme.colors.success },
  textDeduct: { color: theme.colors.danger },
  calcTotalRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  calcTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  calcTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary
  },
  reasonList: {
    gap: 6
  },
  reasonChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    padding: 10
  },
  reasonChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  reasonText: {
    fontSize: 12,
    color: theme.colors.body
  },
  reasonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  notFoundText: {
    fontSize: 14,
    color: theme.colors.body,
    marginBottom: 12
  }
});
