import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTenant } from '../../context/TenantContext';
import { Product } from '@infinityhub/types';

export const BarcodeScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, formatPrice } = useTenant();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(products[0] || null);

  const handleSearch = (code: string) => {
    setBarcodeInput(code);
    const clean = code.trim().toLowerCase();
    if (!clean) {
      setMatchedProduct(null);
      return;
    }
    const found = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase().includes(clean)) ||
        p.sku.toLowerCase().includes(clean) ||
        p.name.toLowerCase().includes(clean)
    );
    setMatchedProduct(found || null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {navigation?.canGoBack?.() ? (
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name="chevronRight"
              size={18}
              color={theme.colors.navy}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navHeaderTitle}>Barcode Scanner</Text>
          <View style={{ width: 48 }} />
        </View>
      ) : (
        <AppHeader navigation={navigation} />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scanner Viewfinder Simulation Box */}
        <View style={styles.viewfinderCard}>
          <View style={styles.viewfinderBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.scanLine} />
            <Icon name="barcode" size={48} color={theme.colors.primary} />
            <Text style={styles.viewfinderText}>Align Barcode Within Frame</Text>
          </View>
        </View>

        {/* Manual Barcode / SKU Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Barcode / SKU Lookup</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter barcode or SKU number..."
              placeholderTextColor={theme.colors.muted}
              value={barcodeInput}
              onChangeText={handleSearch}
              keyboardType="default"
              autoCapitalize="none"
            />
            {barcodeInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setBarcodeInput('');
                  setMatchedProduct(null);
                }}
                style={styles.clearBtn}
              >
                <Icon name="close" size={14} color={theme.colors.body} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Test Barcode Pills */}
        <Text style={styles.label}>Quick Test Scan Simulation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickBarcodes}>
          {products.slice(0, 4).map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.quickChip, matchedProduct?.id === p.id && styles.quickChipActive]}
              onPress={() => handleSearch(p.barcode || p.sku)}
            >
              <Text style={[styles.quickChipText, matchedProduct?.id === p.id && styles.quickChipTextActive]}>
                {p.name.slice(0, 16)}...
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Scan Result Card */}
        {matchedProduct ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultBadgeText}>MATCH FOUND</Text>
              <Badge
                label={matchedProduct.stockQuantity > 0 ? 'In Stock' : 'Depleted'}
                variant={matchedProduct.stockQuantity > 0 ? 'success' : 'danger'}
                size="sm"
              />
            </View>

            <View style={styles.resultBody}>
              <View style={styles.resultThumbWrap}>
                {matchedProduct.thumbnailPath || matchedProduct.imagePath ? (
                  <Image
                    source={{ uri: matchedProduct.thumbnailPath || matchedProduct.imagePath }}
                    style={styles.resultThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.resultFallbackThumb}>
                    <Text style={styles.resultFallbackText}>
                      {matchedProduct.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.resultName}>{matchedProduct.name}</Text>
                <Text style={styles.resultMeta}>
                  SKU: {matchedProduct.sku} · Barcode: {matchedProduct.barcode || 'N/A'}
                </Text>
                <Text style={styles.resultPrice}>{formatPrice(matchedProduct.sellingPrice)}</Text>
                <Text style={styles.resultStock}>
                  On-hand: {matchedProduct.stockQuantity} {matchedProduct.unit}
                </Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <Button
                label="Adjust Stock"
                onPress={() => navigation.navigate('StockAdjustment', { product: matchedProduct })}
                variant="primary"
                icon="stock"
                style={{ flex: 1 }}
              />
              <Button
                label="Details"
                onPress={() => navigation.navigate('ProductDetail', { product: matchedProduct })}
                variant="outline"
                style={{ width: 90 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noMatchCard}>
            <Text style={styles.noMatchText}>No product found matching code</Text>
            <Text style={styles.noMatchSub}>Check barcode number or tap a simulation chip above.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.navy
  },
  navHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  viewfinderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card
  },
  viewfinderBox: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: theme.colors.primary,
    borderWidth: 3
  },
  topLeft: { top: 10, left: 10, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 10, right: 10, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 10, left: 10, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 10, right: 10, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: theme.colors.danger,
    opacity: 0.8
  },
  viewfinderText: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 10,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: theme.spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy,
    marginBottom: 6
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 44
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.navy
  },
  clearBtn: {
    padding: 4
  },
  quickBarcodes: {
    gap: 8,
    marginBottom: theme.spacing.lg
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  quickChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  quickChipTextActive: {
    color: '#FFFFFF'
  },
  resultCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    ...theme.shadows.card
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle,
    marginBottom: 10
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5
  },
  resultBody: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultThumbWrap: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle
  },
  resultThumb: {
    width: '100%',
    height: '100%'
  },
  resultFallbackThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.muted
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy
  },
  resultMeta: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 1
  },
  resultPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 2
  },
  resultStock: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 1
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle
  },
  noMatchCard: {
    padding: 24,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  noMatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  noMatchSub: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 3
  }
});
