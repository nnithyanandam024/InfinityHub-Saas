import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { canViewCosts, canAdjustStock, canEditProducts } from '../../utils/permissions';
import { Product } from '@infinityhub/types';

export const ProductDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { products, updateProduct, deleteProduct, formatPrice, currencySymbol } = useTenant();
  const { user } = useAuth();
  const initialProduct: Product | undefined = route.params?.product;

  const currentProduct = products.find(p => p.id === initialProduct?.id) || initialProduct;

  const canSeeCosts = canViewCosts(user?.role);
  const canAdjust = canAdjustStock(user?.role);
  const canEdit = canEditProducts(user?.role);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editReorderQty, setEditReorderQty] = useState('');

  if (!currentProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Product record not found</Text>
          <Button label="Back to Catalog" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const isOut = currentProduct.stockQuantity <= 0;
  const isLow = !isOut && currentProduct.stockQuantity <= currentProduct.minimumStock;
  const marginPct =
    currentProduct.sellingPrice > 0 && currentProduct.costPrice
      ? (((currentProduct.sellingPrice - currentProduct.costPrice) / currentProduct.sellingPrice) * 100).toFixed(1)
      : '0.0';
  const imgUri = currentProduct.imagePath || currentProduct.thumbnailPath;

  const handleOpenEdit = () => {
    setEditName(currentProduct.name);
    setEditSellingPrice(currentProduct.sellingPrice.toString());
    setEditCostPrice(currentProduct.costPrice?.toString() || '0');
    setEditMinStock(currentProduct.minimumStock.toString());
    setEditReorderQty(currentProduct.reorderQuantity !== undefined ? currentProduct.reorderQuantity.toString() : '0');
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    const sp = parseFloat(editSellingPrice);
    const cp = parseFloat(editCostPrice);
    const minS = parseInt(editMinStock, 10);
    const reorderQ = parseInt(editReorderQty, 10);

    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Product name cannot be empty.');
      return;
    }
    if (isNaN(sp) || sp < 0) {
      Alert.alert('Validation Error', 'Please enter a valid selling price.');
      return;
    }

    updateProduct(currentProduct.id, {
      name: editName.trim(),
      sellingPrice: sp,
      costPrice: isNaN(cp) ? currentProduct.costPrice : cp,
      minimumStock: isNaN(minS) ? currentProduct.minimumStock : minS,
      reorderQuantity: isNaN(reorderQ) ? currentProduct.reorderQuantity : reorderQ
    });

    setIsEditModalVisible(false);
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${currentProduct.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(currentProduct.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevronRight" size={16} color={theme.colors.navy} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
        {canEdit ? (
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={handleOpenEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editHeaderText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Photo Banner */}
        <View style={styles.heroContainer}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>{currentProduct.name.slice(0, 2).toUpperCase()}</Text>
              <Text style={styles.heroFallbackSub}>No photo available</Text>
            </View>
          )}

          <View style={styles.heroFloatingBadge}>
            <Badge
              label={isOut ? 'Depleted' : isLow ? 'Low Stock' : 'In Stock'}
              variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
            />
          </View>
        </View>

        {/* Identity Section */}
        <View style={styles.card}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryBadge}>{currentProduct.categoryName || 'General'}</Text>
            {currentProduct.brandName && <Text style={styles.brandText}>Brand: {currentProduct.brandName}</Text>}
          </View>

          <Text style={styles.productName}>{currentProduct.name}</Text>
          <Text style={styles.skuText}>SKU: {currentProduct.sku}</Text>

          {/* Pricing & Financials */}
          <View style={styles.pricingGrid}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>{formatPrice(currentProduct.sellingPrice)}</Text>
              <Text style={styles.priceUnit}>Per {currentProduct.unit}</Text>
            </View>

            {canSeeCosts ? (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Cost Price</Text>
                <Text style={styles.priceValue}>{formatPrice(currentProduct.costPrice)}</Text>
                <Text style={styles.marginText}>Margin: {marginPct}%</Text>
              </View>
            ) : (
              <View style={[styles.priceBox, styles.restrictedBox]}>
                <Text style={styles.priceLabel}>Cost & Margin</Text>
                <Text style={styles.restrictedText}>Staff View: Cost Hidden</Text>
                <Text style={styles.restrictedSub}>Requires Manager role</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stock Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Stock Levels & Location</Text>
          <View style={styles.stockRow}>
            <View style={styles.stockCol}>
              <Text style={styles.stockColLabel}>On-Hand Stock</Text>
              <Text style={[styles.stockColVal, isOut ? styles.textDanger : isLow ? styles.textWarning : styles.textSuccess]}>
                {currentProduct.stockQuantity} {currentProduct.unit}
              </Text>
            </View>
            <View style={styles.stockCol}>
              <Text style={styles.stockColLabel}>Minimum Buffer</Text>
              <Text style={styles.stockColVal}>{currentProduct.minimumStock} {currentProduct.unit}</Text>
            </View>
            <View style={styles.stockCol}>
              <Text style={styles.stockColLabel}>Reorder Qty</Text>
              <Text style={styles.stockColVal}>{currentProduct.reorderQuantity ?? 0} {currentProduct.unit}</Text>
            </View>
          </View>

          {/* Visual Stock Level Bar */}
          <View style={styles.stockBarTrack}>
            <View
              style={[
                styles.stockBarFill,
                {
                  width: `${Math.min(100, Math.max(8, (currentProduct.stockQuantity / (currentProduct.minimumStock * 3 || 1)) * 100))}%`,
                  backgroundColor: isOut ? theme.colors.danger : isLow ? theme.colors.warning : theme.colors.success
                }
              ]}
            />
          </View>

          <View style={styles.locationRow}>
            <Icon name="store" size={13} color={theme.colors.muted} />
            <Text style={styles.locationText}>Location: Main Store Floor · Shelf B-04</Text>
          </View>
        </View>

        {/* Barcode & Identifiers */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Barcode & Identifiers</Text>
          <View style={styles.barcodeVisual}>
            <Icon name="barcode" size={32} color={theme.colors.navy} />
            <Text style={styles.barcodeCode}>{currentProduct.barcode || 'NO-BARCODE'}</Text>
          </View>
        </View>

        {/* Product Management Actions */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Product Actions</Text>

          {canAdjust && (
            <Button
              label="Adjust Stock Quantity"
              onPress={() => navigation.navigate('StockAdjustment', { product: currentProduct })}
              variant="primary"
              icon="stock"
              style={{ marginBottom: 10 }}
            />
          )}

          {canEdit && (
            <>
              <Button
                label="Edit Details & Pricing"
                onPress={handleOpenEdit}
                variant="outline"
                style={{ marginBottom: 10 }}
              />
              <Button
                label="Delete Product"
                onPress={handleDeleteProduct}
                variant="danger"
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Edit Product Modal Sheet */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsEditModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalSheetContainer}>
                <View style={styles.modalHandleContainer}>
                  <View style={styles.modalHandle} />
                </View>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Product</Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setIsEditModalVisible(false)}
                  >
                    <Icon name="close" size={16} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Product Name"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Selling Price ({currencySymbol})</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editSellingPrice}
                        onChangeText={setEditSellingPrice}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>

                    {canSeeCosts && (
                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Cost Price ({currencySymbol})</Text>
                        <TextInput
                          style={styles.textInput}
                          value={editCostPrice}
                          onChangeText={setEditCostPrice}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={theme.colors.muted}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Min Buffer Stock</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editMinStock}
                        onChangeText={setEditMinStock}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Reorder Quantity</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editReorderQty}
                        onChangeText={setEditReorderQty}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.modalActionButtons}>
                    <Button
                      label="Cancel"
                      onPress={() => setIsEditModalVisible(false)}
                      variant="outline"
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <Button
                      label="Save Changes"
                      onPress={handleSaveEdit}
                      variant="primary"
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  editHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primaryTint
  },
  editHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 130
  },
  heroContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroFallbackText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.muted
  },
  heroFallbackSub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 4
  },
  heroFloatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase'
  },
  brandText: {
    fontSize: 11,
    color: theme.colors.body
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.navy
  },
  skuText: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 2,
    marginBottom: 12
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle
  },
  priceBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    padding: 10
  },
  restrictedBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed'
  },
  priceLabel: {
    fontSize: 11,
    color: theme.colors.body
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy,
    marginVertical: 2
  },
  priceUnit: {
    fontSize: 10,
    color: theme.colors.muted
  },
  marginText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success
  },
  restrictedText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: 4
  },
  restrictedSub: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 2
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 10
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stockCol: {
    alignItems: 'center'
  },
  stockColLabel: {
    fontSize: 11,
    color: theme.colors.body
  },
  stockColVal: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 2
  },
  textSuccess: { color: theme.colors.success },
  textWarning: { color: theme.colors.warning },
  textDanger: { color: theme.colors.danger },
  barcodeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    padding: 12,
    gap: 12
  },
  barcodeCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: theme.colors.navy,
    letterSpacing: 1.5
  },
  stockBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  locationText: {
    fontSize: 11,
    color: theme.colors.body
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  modalSheetContainer: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    maxHeight: '85%',
    ...theme.shadows.sheet
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  modalScrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24
  },
  inputGroup: {
    marginBottom: 14
  },
  inputRow: {
    flexDirection: 'row'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body,
    marginBottom: 6
  },
  textInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.navy
  },
  modalActionButtons: {
    flexDirection: 'row',
    marginTop: 12
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  notFoundText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.navy,
    marginBottom: 12
  }
});
