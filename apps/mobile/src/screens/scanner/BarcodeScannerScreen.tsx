import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Animated,
  DeviceEventEmitter
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTenant } from '../../context/TenantContext';
import { Product } from '@infinityhub/types';

export const BarcodeScannerScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { products, formatPrice } = useTenant();
  const onScanCallback = route?.params?.onScan;
  const targetMode = route?.params?.target;

  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(products[0] || null);

  const lastScannedTime = useRef<number>(0);
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Request runtime camera permission on mount
  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Access Required',
            message: 'Camera permission is required to scan product barcodes in real time.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel'
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch {
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  }, []);

  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  // Animated laser scan line
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [laserAnim]);

  // Handle scanned barcode from live camera, quick chip, or manual lookup
  const handleCodeDetected = useCallback((rawCode: string) => {
    const now = Date.now();
    if (now - lastScannedTime.current < 1500) {
      return; // 1.5s debounce
    }
    lastScannedTime.current = now;

    const clean = rawCode.trim();
    if (!clean) return;

    setBarcodeInput(clean);
    const found = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.name.toLowerCase().includes(clean.toLowerCase())
    );

    if (found) {
      setMatchedProduct(found);

      // Emit global event for listeners (e.g. POS cart, NewProduct form)
      DeviceEventEmitter.emit('onBarcodeScanned', found.barcode || found.sku);

      if (typeof onScanCallback === 'function') {
        onScanCallback(found.barcode || found.sku);
      }

      if (targetMode || onScanCallback) {
        navigation.goBack();
      }
    } else {
      setMatchedProduct(null);

      // Emit code even if not found in catalog, so new product form can capture it
      DeviceEventEmitter.emit('onBarcodeScanned', clean);
      if (typeof onScanCallback === 'function') {
        onScanCallback(clean);
      }

      if (targetMode === 'new_product') {
        navigation.goBack();
      }
    }
  }, [products, targetMode, onScanCallback, navigation]);

  const handleManualSearch = (code: string) => {
    setBarcodeInput(code);
    const clean = code.trim().toLowerCase();
    if (!clean) {
      setMatchedProduct(null);
      return;
    }
    const found = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.sku.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );
    setMatchedProduct(found || null);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 180]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Navigation Header */}
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

          <Text style={styles.navHeaderTitle}>Live Barcode Scanner</Text>
          <View style={{ width: 48 }} />
        </View>
      ) : (
        <AppHeader navigation={navigation} title="Live Barcode Scanner" icon="barcode" hideScanner={true} />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scanner Viewfinder Card */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraFrame}>
            {hasPermission ? (
              <Camera
                style={styles.cameraView}
                cameraType={CameraType?.Back || 'back'}
                scanBarcode={isScanning}
                torchMode={isTorchOn ? 'on' : 'off'}
                showFrame={false}
                onReadCode={(event: any) => {
                  const code = event?.nativeEvent?.codeStringValue;
                  if (code) {
                    handleCodeDetected(code);
                  }
                }}
              />
            ) : (
              <View style={styles.cameraView} />
            )}

            {/* Target Viewfinder Overlays */}
            <View style={styles.targetOverlay} pointerEvents="none">
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated Laser Scanning Line */}
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: laserTranslateY }]
                  }
                ]}
              />
            </View>

            {/* Viewfinder Controls */}
            <View style={styles.cameraControlsRow}>
              <TouchableOpacity
                style={[styles.controlPill, isTorchOn && styles.controlPillActive]}
                onPress={() => setIsTorchOn(!isTorchOn)}
                activeOpacity={0.8}
              >
                <Icon name="tag" size={14} color={isTorchOn ? '#FFFFFF' : theme.colors.navy} />
                <Text style={[styles.controlText, isTorchOn && styles.controlTextActive]}>
                  {isTorchOn ? 'Torch On' : 'Torch Off'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlPill, !isScanning && styles.controlPillActive]}
                onPress={() => setIsScanning(!isScanning)}
                activeOpacity={0.8}
              >
                <Icon name="close" size={14} color={!isScanning ? '#FFFFFF' : theme.colors.navy} />
                <Text style={[styles.controlText, !isScanning && styles.controlTextActive]}>
                  {isScanning ? 'Scanning' : 'Paused'}
                </Text>
              </TouchableOpacity>
            </View>
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
              onChangeText={handleManualSearch}
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

        {/* Quick Test Barcode Simulation Chips */}
        <Text style={styles.label}>Quick Test Simulation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickBarcodes}>
          {products.slice(0, 5).map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.quickChip, matchedProduct?.id === p.id && styles.quickChipActive]}
              onPress={() => handleCodeDetected(p.barcode || p.sku)}
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
              {targetMode === 'pos' || onScanCallback ? (
                <Button
                  label="Add to Cart"
                  onPress={() => {
                    DeviceEventEmitter.emit('onBarcodeScanned', matchedProduct.barcode || matchedProduct.sku);
                    if (typeof onScanCallback === 'function') {
                      onScanCallback(matchedProduct.barcode || matchedProduct.sku);
                    }
                    navigation.goBack();
                  }}
                  variant="primary"
                  icon="cart"
                  style={{ flex: 1 }}
                />
              ) : targetMode === 'new_product' ? (
                <Button
                  label="Use Barcode"
                  onPress={() => {
                    DeviceEventEmitter.emit('onBarcodeScanned', matchedProduct.barcode || matchedProduct.sku);
                    navigation.goBack();
                  }}
                  variant="primary"
                  icon="check"
                  style={{ flex: 1 }}
                />
              ) : (
                <>
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
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noMatchCard}>
            <Text style={styles.noMatchText}>No product found matching code</Text>
            <Text style={styles.noMatchSub}>Scan a product barcode or tap a quick chip above.</Text>
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
    paddingBottom: 130
  },
  cameraCard: {
    backgroundColor: '#0F172A',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card
  },
  cameraFrame: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject
  },
  targetOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.colors.primary,
    borderWidth: 3
  },
  topLeft: { top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 },
  laserLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4
  },
  cameraControlsRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full
  },
  controlPillActive: {
    backgroundColor: theme.colors.primary
  },
  controlText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy
  },
  controlTextActive: {
    color: '#FFFFFF'
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
    borderBottomColor: theme.colors.border,
    marginBottom: 10
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.primary
  },
  resultBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  resultThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    overflow: 'hidden'
  },
  resultThumb: {
    width: '100%',
    height: '100%'
  },
  resultFallbackThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryTint
  },
  resultFallbackText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 2
  },
  resultMeta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginBottom: 4
  },
  resultPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary
  },
  resultStock: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body,
    marginTop: 2
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  noMatchCard: {
    padding: 20,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  noMatchText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  noMatchSub: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 4
  }
});
