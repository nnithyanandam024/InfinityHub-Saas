import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useTenant } from '../../context/TenantContext';
import { usePos } from '../../context/PosContext';
import { useApp } from '../../context/AppContext';
import { Product } from '@infinityhub/types';
import { MobileDiscountModal } from '../../components/pos/MobileDiscountModal';
import { MobilePaymentModal } from '../../components/pos/MobilePaymentModal';
import { MobileShiftModal } from '../../components/pos/MobileShiftModal';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyStateCard } from '../../components/common/EmptyStateCard';

export const PosTerminalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, categories, tenant } = useTenant();
  const {
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    appliedDiscount,
    setAppliedDiscount,
    selectedCustomer,
    setSelectedCustomer,
    currentShift,
    openShift,
    closeShift,
    checkout,
    totals,
    taxConfig
  } = usePos();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBarcodePress = () => {
    navigation.navigate('Scanner', {
      onScan: (scannedCode: string) => {
        const found = products.find(
          p => p.barcode === scannedCode || p.sku.toLowerCase() === scannedCode.toLowerCase()
        );
        if (found) {
          addToCart(found);
          Alert.alert('Item Added', `${found.name} added to cart.`);
        } else {
          Alert.alert('Barcode Not Found', `No product matches barcode: ${scannedCode}`);
        }
      }
    });
  };

  const handleCheckoutComplete = async (paymentData: any) => {
    const res = await checkout(paymentData);
    setIsCartOpen(false);
    navigation.navigate('PosReceipt', { invoice: res.invoice });
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const cartItem = cart.find(c => c.productId === item.id);
    const inCartQty = cartItem?.quantity || 0;
    const isLowStock = item.stockQuantity <= item.minimumStock;

    return (
      <TouchableOpacity
        style={[styles.productCard, inCartQty > 0 && styles.productCardInCart]}
        onPress={() => addToCart(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.productSku}>{item.sku}</Text>
          {isLowStock ? (
            <Badge label="Low Stock" variant="warning" size="sm" />
          ) : (
            <Text style={styles.stockText}>{item.stockQuantity} in stock</Text>
          )}
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Price (GST Incl.)</Text>
            <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
          </View>

          {inCartQty > 0 ? (
            <View style={styles.inCartBadge}>
              <Text style={styles.inCartText}>{inCartQty} in cart</Text>
            </View>
          ) : (
            <View style={styles.addBtnCircle}>
              <Icon name="plus" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Application Header */}
      <AppHeader
        navigation={navigation}
        title={taxConfig.tradeName || tenant.name}
        subtitleBadge={currentShift ? `Shift #${currentShift.id.slice(-4)} Active` : 'Shift Closed'}
        icon="cart"
        onBadgePress={() => setIsShiftModalOpen(true)}
        hideScanner={false}
        onAvatarPress={() => navigation.navigate('PosAccountTab')}
      />

      {/* Search Bar & Barcode Scanner Button */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={16} color={theme.colors.muted} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search SKU, Product Name or Barcode..."
            placeholderTextColor={theme.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
              <Icon name="close" size={14} color={theme.colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.barcodeScanBtn}
          onPress={handleBarcodePress}
          activeOpacity={0.8}
        >
          <Icon name="barcode" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Pills Slider */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catPill, selectedCategory === 'all' && styles.catPillActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.catPillText, selectedCategory === 'all' && styles.catPillTextActive]}>
              All Items
            </Text>
          </TouchableOpacity>

          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.catPillText, selectedCategory === c.id && styles.catPillTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyStateCard
            icon="search"
            title="No products found"
            subtitle={searchQuery ? `No products matching "${searchQuery}"` : "No catalog products available in this category."}
            actionLabel={searchQuery ? "Clear Search" : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
            style={{ marginVertical: 20 }}
          />
        }
      />

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <View style={styles.cartStickyBar}>
          <TouchableOpacity
            style={styles.cartInfoTouch}
            onPress={() => setIsCartOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.cartCountCircle}>
              <Text style={styles.cartCountText}>{totals.totalItemCount}</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cartStickyTotal}>₹{totals.grandTotal.toFixed(2)}</Text>
              <Text style={styles.cartStickyItems}>
                {cart.length} unique {cart.length === 1 ? 'item' : 'items'}
                {appliedDiscount ? ` (Disc ₹${totals.discountAmount.toFixed(0)})` : ''}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkoutQuickBtn}
            onPress={() => setIsPaymentModalOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Pay ₹{totals.grandTotal.toFixed(2)}</Text>
            <Icon name="chevronRight" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Full Slide-Up Cart Sheet */}
      <Modal visible={isCartOpen} transparent animationType="slide" onRequestClose={() => setIsCartOpen(false)}>
        <View style={styles.cartModalBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsCartOpen(false)} />
          <View style={styles.cartSheet}>
            {/* Sheet Header */}
            <View style={styles.cartSheetHeader}>
              <View>
                <Text style={styles.cartSheetTitle}>Current Order Ticket</Text>
                <Text style={styles.cartSheetSubtitle}>
                  {totals.totalItemCount} items | Taxable: ₹{totals.taxableAmount.toFixed(2)} | GST: ₹{(totals.cgstAmount + totals.sgstAmount).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCartOpen(false)} style={styles.closeRoundBtn}>
                <Icon name="close" size={16} color={theme.colors.body} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Row: Discount & Customer */}
            <View style={styles.ticketActionsRow}>
              <TouchableOpacity
                style={[styles.ticketActionChip, appliedDiscount && styles.ticketActionChipActive]}
                onPress={() => setIsDiscountModalOpen(true)}
              >
                <Icon name="tag" size={14} color={appliedDiscount ? theme.colors.primary : theme.colors.body} />
                <Text style={[styles.ticketActionText, appliedDiscount && styles.ticketActionTextActive]}>
                  {appliedDiscount
                    ? `Discount: ${appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `₹${appliedDiscount.value}`}`
                    : 'Add Discount'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ticketActionChip, selectedCustomer && styles.ticketActionChipActive]}
                onPress={() => {
                  setIsPaymentModalOpen(true);
                }}
              >
                <Icon name="user" size={14} color={selectedCustomer ? theme.colors.primary : theme.colors.body} />
                <Text style={[styles.ticketActionText, selectedCustomer && styles.ticketActionTextActive]} numberOfLines={1}>
                  {selectedCustomer ? selectedCustomer.name : 'Attach Customer'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearCartChip} onPress={clearCart}>
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Cart Items List */}
            <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.productId} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                    <Text style={styles.cartItemRate}>
                      ₹{item.unitPrice} × {item.quantity} = ₹{item.total.toFixed(2)}
                    </Text>
                    <Text style={styles.cartItemGst}>
                      HSN: {item.hsnCode} | GST: {item.taxRate}% (CGST {item.cgstRate}% + SGST {item.sgstRate}%)
                    </Text>
                  </View>

                  <View style={styles.cartItemStepper}>
                    <TouchableOpacity
                      style={styles.cartStepBtn}
                      onPress={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                    >
                      <Text style={styles.cartStepText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.cartQtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartStepBtn}
                      onPress={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                    >
                      <Text style={styles.cartStepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Summary Breakdown */}
            <View style={styles.summaryBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.bdLabel}>Subtotal (Inclusive):</Text>
                <Text style={styles.bdVal}>₹{totals.subtotal.toFixed(2)}</Text>
              </View>
              {appliedDiscount && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.bdLabel, { color: '#DC2626' }]}>Discount Savings:</Text>
                  <Text style={[styles.bdVal, { color: '#DC2626' }]}>- ₹{totals.discountAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.breakdownRow}>
                <Text style={styles.bdLabel}>Taxable Amount:</Text>
                <Text style={styles.bdVal}>₹{totals.taxableAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.bdLabel}>CGST (9%) + SGST (9%):</Text>
                <Text style={styles.bdVal}>₹{(totals.cgstAmount + totals.sgstAmount).toFixed(2)}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Net Amount Payable:</Text>
                <Text style={styles.grandTotalVal}>₹{totals.grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Sheet Footer Action */}
            <Button
              label={`Proceed to Payment (₹${totals.grandTotal.toFixed(2)})`}
              variant="primary"
              onPress={() => {
                setIsCartOpen(false);
                setIsPaymentModalOpen(true);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Discount Modal */}
      <MobileDiscountModal
        visible={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotal={totals.subtotal}
        currentDiscount={appliedDiscount}
        onApplyDiscount={setAppliedDiscount}
      />

      {/* Payment Modal */}
      <MobilePaymentModal
        visible={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onCompleteCheckout={handleCheckoutComplete}
      />

      {/* Shift Modal */}
      <MobileShiftModal
        visible={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        mode={currentShift ? 'close' : 'open'}
        currentShift={currentShift}
        onOpenShift={openShift}
        onCloseShift={closeShift}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitleCol: {
    flex: 1
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  shiftDotOpen: {
    backgroundColor: theme.colors.successText
  },
  shiftDotClosed: {
    backgroundColor: theme.colors.dangerText
  },
  shiftLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.body
  },
  gstinText: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    paddingHorizontal: 8,
    color: theme.colors.navy
  },
  barcodeScanBtn: {
    width: 44,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3
  },
  categoriesWrapper: {
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  catPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.body
  },
  catPillTextActive: {
    color: '#FFFFFF'
  },
  gridContent: {
    padding: 12,
    paddingBottom: 160
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 10
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'space-between',
    minHeight: 135
  },
  productCardInCart: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  productSku: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted
  },
  stockText: {
    fontSize: 10,
    color: theme.colors.muted
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    lineHeight: 18,
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  priceLabel: {
    fontSize: 9,
    color: theme.colors.muted
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.navy
  },
  addBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inCartBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  inCartText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  cartStickyBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 86,
    left: 14,
    right: 14,
    backgroundColor: theme.colors.navy,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  cartInfoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  cartCountCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartCountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  cartStickyTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  cartStickyItems: {
    fontSize: 10,
    color: '#94A3B8'
  },
  checkoutQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  cartModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end'
  },
  cartSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20
  },
  cartSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cartSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  cartSheetSubtitle: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeRoundBtn: {
    padding: 6,
    borderRadius: 100,
    backgroundColor: theme.colors.surfaceSubtle
  },
  ticketActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  ticketActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  ticketActionChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  ticketActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.body
  },
  ticketActionTextActive: {
    color: theme.colors.primary
  },
  clearCartChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2'
  },
  clearCartText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  cartItemsScroll: {
    maxHeight: 220,
    marginBottom: 12
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  cartItemInfo: {
    flex: 1
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  cartItemRate: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body,
    marginTop: 2
  },
  cartItemGst: {
    fontSize: 9,
    color: theme.colors.muted,
    marginTop: 1
  },
  cartItemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  cartStepBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartStepText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary
  },
  cartQtyVal: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy
  },
  summaryBreakdown: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  bdLabel: {
    fontSize: 11,
    color: theme.colors.body
  },
  bdVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 0
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary
  }
});
