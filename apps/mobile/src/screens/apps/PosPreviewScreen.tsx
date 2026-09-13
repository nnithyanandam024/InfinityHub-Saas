import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useTenant } from '../../context/TenantContext';
import { useApp } from '../../context/AppContext';
import { Product } from '@infinityhub/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosPreviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, tenant, formatPrice } = useTenant();
  const { switchApp } = useApp();

  const [cart, setCart] = useState<CartItem[]>(
    products.slice(0, 2).map(p => ({ product: p, quantity: 1 }))
  );

  const addItem = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === productId);
      if (idx === -1) return prev;
      if (prev[idx].quantity > 1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
        return next;
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before checking out');
      return;
    }
    Alert.alert(
      'Transaction Complete',
      `Payment of ${formatPrice(total)} processed successfully for ${tenant.name}. Receipt #INV-${Math.floor(1000 + Math.random() * 9000)} generated.`,
      [
        {
          text: 'New Sale',
          onPress: () => setCart([])
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            switchApp('inventory');
            navigation.goBack();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevronRight" size={16} color={theme.colors.navy} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Billing & POS Register</Text>
          <Text style={styles.headerSub}>{tenant.name}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Item Picker */}
        <Text style={styles.sectionTitle}>Tap to Add Items to Bill</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemPickerRow}>
          {products.slice(0, 6).map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.itemPill}
              onPress={() => addItem(p)}
              activeOpacity={0.75}
            >
              <Text style={styles.itemPillName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.itemPillPrice}>{formatPrice(p.sellingPrice)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current Cart Ledger */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Active Order Items</Text>
        <View style={styles.cartCard}>
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>No items added to current bill</Text>
            </View>
          ) : (
            cart.map(item => (
              <View key={item.product.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.cartItemRate}>
                    {formatPrice(item.product.sellingPrice)} each
                  </Text>
                </View>

                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeItem(item.product.id)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => addItem(item.product)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cartItemTotal}>
                  {formatPrice(item.product.sellingPrice * item.quantity)}
                </Text>
              </View>
            ))
          )}

          {/* Bill Summary */}
          {cart.length > 0 && (
            <View style={styles.billSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST / Sales Tax (5%)</Text>
                <Text style={styles.summaryVal}>{formatPrice(tax)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalVal}>{formatPrice(total)}</Text>
              </View>
            </View>
          )}
        </View>

        <Button
          label={`Charge ${formatPrice(total)}`}
          onPress={handleCheckout}
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
  titleWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy
  },
  headerSub: {
    fontSize: 11,
    color: theme.colors.body
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 8
  },
  itemPickerRow: {
    gap: 8,
    paddingBottom: 4
  },
  itemPill: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 110,
    ...theme.shadows.card
  },
  itemPillName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  itemPillPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4
  },
  cartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    ...theme.shadows.card
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  cartItemRate: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    minWidth: 16,
    textAlign: 'center'
  },
  cartItemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    minWidth: 60,
    textAlign: 'right'
  },
  emptyCart: {
    padding: 24,
    alignItems: 'center'
  },
  emptyCartText: {
    fontSize: 12,
    color: theme.colors.muted
  },
  billSummary: {
    marginTop: 12,
    paddingTop: 8
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
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  summaryTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary
  }
});
