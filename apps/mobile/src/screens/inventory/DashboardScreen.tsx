import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/layout/AppHeader';
import { QuickStockBottomSheet } from '../../components/modals/QuickStockBottomSheet';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { canEditProducts } from '../../utils/permissions';
import { Product } from '@infinityhub/types';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { tenant, products, suppliers, stockMovements, formatPrice } = useTenant();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const isEditor = canEditProducts(user?.role);
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock);
  const outOfStock = products.filter(p => p.stockQuantity <= 0);
  const healthyCount = products.filter(p => p.stockQuantity > p.minimumStock).length;

  const healthPct = products.length > 0
    ? Math.round((healthyCount / products.length) * 100)
    : 100;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Operator';

  const getTimeGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const openQuickSheet = (prod: Product) => {
    setSheetProduct(prod);
    setIsSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Live Store Pulse Hero Banner (Zomato / District Style) */}
        <View style={styles.pulseCard}>
          <View style={styles.pulseTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeGreeting}>{getTimeGreeting()}, {firstName}</Text>
              <Text style={styles.storeHeadline} numberOfLines={1}>
                {tenant.name}
              </Text>
            </View>
            <View style={styles.liveIndicatorPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveIndicatorText}>Live Store</Text>
            </View>
          </View>

          {/* Health Gauge Progress Bar */}
          <View style={styles.healthGaugeWrap}>
            <View style={styles.healthGaugeHeader}>
              <Text style={styles.healthGaugeLabel}>Store Stock Health</Text>
              <Text style={styles.healthGaugeValue}>{healthPct}% Optimal</Text>
            </View>
            <View style={styles.healthTrack}>
              <View
                style={[
                  styles.healthFill,
                  {
                    width: `${healthPct}%`,
                    backgroundColor: healthPct >= 80 ? theme.colors.success : healthPct >= 50 ? theme.colors.warning : theme.colors.danger
                  }
                ]}
              />
            </View>
            <Text style={styles.healthSub}>
              {healthyCount} of {products.length} SKUs operating with sufficient buffer
            </Text>
          </View>
        </View>

        {/* 4 Modern Elevated KPI Stat Tiles */}
        <View style={styles.kpiGrid}>
          {/* Total SKUs */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiBlue]}
            onPress={() => navigation.navigate('InventoryTab', { screen: 'ProductList' })}
            activeOpacity={0.75}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Catalog SKUs</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: theme.colors.primaryTint }]}>
                <Icon name="package" size={13} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.kpiValue}>{products.length}</Text>
            <Text style={styles.kpiHint}>Active products</Text>
          </TouchableOpacity>

          {/* Low Buffer Warning */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiAmber]}
            onPress={() => navigation.navigate('StockTab', { screen: 'StockOverview', params: { filter: 'low' } })}
            activeOpacity={0.75}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Low Buffer</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="alert" size={13} color={theme.colors.warning} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#B45309' }]}>{lowStock.length}</Text>
            <Text style={styles.kpiHint}>Below minimum</Text>
          </TouchableOpacity>

          {/* Depleted Stock */}
          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiRose]}
            onPress={() => navigation.navigate('StockTab', { screen: 'StockOverview', params: { filter: 'out' } })}
            activeOpacity={0.75}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Depleted</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="alert" size={13} color={theme.colors.danger} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.danger }]}>{outOfStock.length}</Text>
            <Text style={styles.kpiHint}>Needs reorder</Text>
          </TouchableOpacity>

          {/* Suppliers */}
          <View style={[styles.kpiCard, styles.kpiGreen]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Suppliers</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="store" size={13} color={theme.colors.success} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.success }]}>{suppliers.length}</Text>
            <Text style={styles.kpiHint}>Active vendors</Text>
          </View>
        </View>

        {/* Tactile Quick Actions (3 balanced cards) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operations Quick Actions</Text>
          <View style={styles.actionRow}>
            {isEditor && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('InventoryTab', { screen: 'NewProduct' })}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryTint }]}>
                  <Icon name="plus" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.actionText}>Add Product</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.infoBg }]}>
                <Icon name="barcode" size={18} color={theme.colors.info} />
              </View>
              <Text style={styles.actionText}>Scan Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('StockTab')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warningBg }]}>
                <Icon name="stock" size={18} color={theme.colors.warning} />
              </View>
              <Text style={styles.actionText}>Stock Count</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fast-Movers Horizontal Carousel (District Style) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Catalog Highlights</Text>
            <TouchableOpacity onPress={() => navigation.navigate('InventoryTab')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
            {products.slice(0, 5).map(prod => {
              const imgUri = prod.thumbnailPath || prod.imagePath;
              const isOut = prod.stockQuantity <= 0;
              const isLow = !isOut && prod.stockQuantity <= prod.minimumStock;

              return (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.carouselCard}
                  onPress={() => openQuickSheet(prod)}
                  activeOpacity={0.8}
                >
                  <View style={styles.carouselThumbWrap}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.carouselThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.carouselFallback}>
                        <Text style={styles.carouselFallbackText}>{prod.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.carouselBadgeWrap}>
                      <Badge
                        label={isOut ? 'Depleted' : isLow ? 'Low' : `${prod.stockQuantity} pcs`}
                        variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                        size="sm"
                      />
                    </View>
                  </View>

                  <View style={styles.carouselInfo}>
                    <Text style={styles.carouselTitle} numberOfLines={1}>
                      {prod.name}
                    </Text>
                    <Text style={styles.carouselPrice}>{formatPrice(prod.sellingPrice)}</Text>
                  </View>

                  <View style={styles.carouselAdjustBtn}>
                    <Text style={styles.carouselAdjustText}>Quick Adjust</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Items Needing Attention */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Attention Required</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StockTab')}>
              <Text style={styles.viewAllText}>Full Audit</Text>
            </TouchableOpacity>
          </View>

          {lowStock.concat(outOfStock).length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="check" size={24} color={theme.colors.success} />
              <Text style={styles.emptyTitle}>All stock levels are optimal</Text>
              <Text style={styles.emptySubtitle}>All catalog items are currently above minimum threshold.</Text>
            </View>
          ) : (
            lowStock.concat(outOfStock).slice(0, 3).map(item => {
              const imgUri = item.thumbnailPath || item.imagePath;
              const isOut = item.stockQuantity <= 0;
              return (
                <View key={item.id} style={styles.alertCard}>
                  <View style={styles.alertThumbWrap}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.alertThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.fallbackThumb}>
                        <Text style={styles.fallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                    <Text style={styles.alertName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.alertMeta}>
                      Stock: {item.stockQuantity} {item.unit} · Min Buffer: {item.minimumStock}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.adjustSmallBtn}
                    onPress={() => openQuickSheet(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.adjustSmallText}>Adjust</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Stock Movement Ledger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Stock Activity</Text>
          {stockMovements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="clock" size={24} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No recent stock activity</Text>
              <Text style={styles.emptySubtitle}>
                Inventory adjustments, receipts, and transfers will show here.
              </Text>
            </View>
          ) : (
            <View style={styles.ledgerCard}>
              {stockMovements.slice(0, 4).map((mov, index) => {
                const isPos = mov.quantityChange > 0;
                return (
                  <View
                    key={mov.id}
                    style={[
                      styles.movementRow,
                      index < Math.min(stockMovements.length, 4) - 1 && styles.movementRowBorder
                    ]}
                  >
                    <View style={[styles.movementIconPill, { backgroundColor: isPos ? '#ECFDF5' : '#EFF6FF' }]}>
                      <Icon
                        name={isPos ? 'plus' : 'minus'}
                        size={12}
                        color={isPos ? theme.colors.success : theme.colors.primary}
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.movProduct} numberOfLines={1}>{mov.productName}</Text>
                      <Text style={styles.movReason}>{mov.reason || mov.type}</Text>
                    </View>

                    <Text style={[styles.movQty, isPos ? styles.movQtyPos : styles.movQtyNeg]}>
                      {isPos ? `+${mov.quantityChange}` : mov.quantityChange}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Zomato-Style Quick Stock Bottom Sheet */}
      <QuickStockBottomSheet
        visible={isSheetVisible}
        product={sheetProduct}
        onClose={() => setIsSheetVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 130
  },
  pulseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card
  },
  pulseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  timeGreeting: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  storeHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.navy,
    marginTop: 2
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46'
  },
  healthGaugeWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle
  },
  healthGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  healthGaugeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  healthGaugeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  healthTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden'
  },
  healthFill: {
    height: '100%',
    borderRadius: 3
  },
  healthSub: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 6
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg
  },
  kpiCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    ...theme.shadows.card
  },
  kpiBlue: {},
  kpiAmber: {},
  kpiRose: {},
  kpiGreen: {},
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted
  },
  kpiIconPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 2
  },
  kpiHint: {
    fontSize: 10,
    color: theme.colors.muted
  },
  section: {
    marginBottom: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy,
    textAlign: 'center'
  },
  // Carousel Styles
  carouselContainer: {
    gap: 10,
    paddingRight: theme.spacing.lg
  },
  carouselCard: {
    width: 140,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 8,
    ...theme.shadows.card
  },
  carouselThumbWrap: {
    width: '100%',
    height: 95,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle,
    position: 'relative'
  },
  carouselThumb: {
    width: '100%',
    height: '100%'
  },
  carouselFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  carouselFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.muted
  },
  carouselBadgeWrap: {
    position: 'absolute',
    bottom: 4,
    left: 4
  },
  carouselInfo: {
    marginTop: 8,
    paddingHorizontal: 2
  },
  carouselTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  carouselPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    marginTop: 2
  },
  carouselAdjustBtn: {
    marginTop: 8,
    paddingVertical: 5,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    alignItems: 'center'
  },
  carouselAdjustText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary
  },
  // Attention Feed Styles
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.card
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
    textAlign: 'center'
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 8,
    ...theme.shadows.card
  },
  alertThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle
  },
  alertThumb: {
    width: '100%',
    height: '100%'
  },
  fallbackThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted
  },
  alertName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  alertMeta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  adjustSmallBtn: {
    backgroundColor: theme.colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight
  },
  adjustSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary
  },
  // Ledger Styles
  ledgerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card
  },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  movementRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  movementIconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  movProduct: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  movReason: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1
  },
  movQty: {
    fontSize: 13,
    fontWeight: '800'
  },
  movQtyPos: {
    color: theme.colors.success
  },
  movQtyNeg: {
    color: theme.colors.primary
  }
});
