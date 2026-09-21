import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { AppHeader } from '../../components/layout/AppHeader';
import { QuickStockBottomSheet } from '../../components/modals/QuickStockBottomSheet';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { canEditProducts } from '../../utils/permissions';
import { Product } from '@infinityhub/types';

export const ProductListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, categories, formatPrice, updateProductStock } = useTenant();
  const { user } = useAuth();
  const isEditor = canEditProducts(user?.role);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOW' | 'DEPLETED' | string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Quick Stock Bottom Sheet
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Filter Counts
  const counts = useMemo(() => {
    let low = 0;
    let depleted = 0;
    products.forEach(p => {
      if (p.stockQuantity <= 0) depleted++;
      else if (p.stockQuantity <= p.minimumStock) low++;
    });
    return {
      all: products.length,
      low,
      depleted
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));

      let matchesFilter = true;
      if (activeFilter === 'ALL') {
        matchesFilter = true;
      } else if (activeFilter === 'LOW') {
        matchesFilter = p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;
      } else if (activeFilter === 'DEPLETED') {
        matchesFilter = p.stockQuantity <= 0;
      } else {
        // category id filter
        matchesFilter = p.categoryId === activeFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, search, activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleOpenSheet = (product: Product) => {
    setSheetProduct(product);
    setIsSheetVisible(true);
  };

  const handleInlineStep = (product: Product, delta: number, e: any) => {
    e.stopPropagation();
    const newStock = Math.max(0, product.stockQuantity + delta);
    updateProductStock(
      product.id,
      newStock,
      delta > 0 ? 'Quick +1 increment' : 'Quick -1 decrement'
    );
  };

  // Render Status Badge
  const renderStockBadge = (stock: number, min: number) => {
    if (stock <= 0) return <Badge label="Out of Stock" variant="danger" size="sm" />;
    if (stock <= min) return <Badge label="Low Stock" variant="warning" size="sm" />;
    return <Badge label="In Stock" variant="success" size="sm" />;
  };

  // 1. Modern List Item (Zomato / District Style Dense Card)
  const renderListItem = ({ item }: { item: Product }) => {
    const imgUri = item.thumbnailPath || item.imagePath;
    const isOut = item.stockQuantity <= 0;
    const isLow = !isOut && item.stockQuantity <= item.minimumStock;

    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.82}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        {/* Product Thumbnail with subtle corner badge */}
        <View style={styles.listThumbWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.listThumb} resizeMode="cover" />
          ) : (
            <View style={styles.listFallbackThumb}>
              <Text style={styles.listFallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          {isOut && (
            <View style={styles.thumbAlertDot} />
          )}
        </View>

        {/* Center Product Details */}
        <View style={styles.listCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.listName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.listSku} numberOfLines={1}>
            {item.brandName ? `${item.brandName} · ` : ''}SKU: {item.sku}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.listPrice}>{formatPrice(item.sellingPrice)}</Text>
            <View style={styles.stockStatusWrap}>
              {renderStockBadge(item.stockQuantity, item.minimumStock)}
            </View>
          </View>
        </View>

        {/* Right: Inline Stepper (Zomato / Blinkit Style) */}
        <View style={styles.listRight}>
          <View style={styles.inlineStepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, item.stockQuantity <= 0 && styles.stepperBtnDisabled]}
              onPress={e => handleInlineStep(item, -1, e)}
              disabled={item.stockQuantity <= 0}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon
                name="minus"
                size={12}
                color={item.stockQuantity <= 0 ? theme.colors.muted : theme.colors.navy}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperCountWrap}
              onPress={() => handleOpenSheet(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperCountText}>{item.stockQuantity}</Text>
              <Text style={styles.stepperUnitText}>{item.unit}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={e => handleInlineStep(item, +1, e)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="plus" size={12} color={theme.colors.navy} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.quickSheetTrigger}
            onPress={() => handleOpenSheet(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickSheetText}>More Options</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // 2. Modern Grid Item (District Visual Card)
  const renderGridItem = ({ item }: { item: Product }) => {
    const imgUri = item.thumbnailPath || item.imagePath;
    const isOut = item.stockQuantity <= 0;
    const isLow = !isOut && item.stockQuantity <= item.minimumStock;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.gridImageWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.gridImage} resizeMode="cover" />
          ) : (
            <View style={styles.gridFallback}>
              <Text style={styles.gridFallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.floatingBadgeWrap}>
            <Badge
              label={isOut ? 'Out of Stock' : isLow ? 'Low Stock' : `${item.stockQuantity} in stock`}
              variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
              size="sm"
            />
          </View>
        </View>

        <View style={styles.gridBody}>
          <Text style={styles.gridBrand} numberOfLines={1}>
            {item.brandName || item.categoryName || 'Product'}
          </Text>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>{formatPrice(item.sellingPrice)}</Text>
          </View>

          {/* Grid Inline Stepper */}
          <View style={styles.gridStepperRow}>
            <View style={styles.gridInlineStepper}>
              <TouchableOpacity
                style={[styles.gridStepBtn, item.stockQuantity <= 0 && styles.stepperBtnDisabled]}
                onPress={e => handleInlineStep(item, -1, e)}
                disabled={item.stockQuantity <= 0}
                activeOpacity={0.7}
              >
                <Icon
                  name="minus"
                  size={12}
                  color={item.stockQuantity <= 0 ? theme.colors.muted : theme.colors.navy}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCountBtn}
                onPress={() => handleOpenSheet(item)}
              >
                <Text style={styles.gridCountText}>{item.stockQuantity}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridStepBtn}
                onPress={e => handleInlineStep(item, +1, e)}
                activeOpacity={0.7}
              >
                <Icon name="plus" size={12} color={theme.colors.navy} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.gridAdjustPill}
              onPress={() => handleOpenSheet(item)}
            >
              <Icon name="stock" size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader navigation={navigation} />

      {/* Top Search & View Switcher Bar */}
      <View style={styles.topToolbar}>
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, SKU, barcode..."
            onScanPress={() => navigation.navigate('Scanner')}
          />
        </View>

        {/* List / Grid Segmented Toggle */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <Icon
              name="list"
              size={15}
              color={viewMode === 'list' ? theme.colors.primary : theme.colors.muted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.7}
          >
            <Icon
              name="grid"
              size={15}
              color={viewMode === 'grid' ? theme.colors.primary : theme.colors.muted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sticky Horizontal Category & Status Rail (District Style) */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {/* All Filter Chip */}
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'ALL' && styles.chipActive]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeFilter === 'ALL' && styles.chipTextActive]}>
              All
            </Text>
            <View style={[styles.chipBadge, activeFilter === 'ALL' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, activeFilter === 'ALL' && styles.chipBadgeTextActive]}>
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Low Stock Filter Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipWarning,
              activeFilter === 'LOW' && styles.chipWarningActive
            ]}
            onPress={() => setActiveFilter('LOW')}
            activeOpacity={0.8}
          >
            <View style={[styles.dotIndicator, { backgroundColor: theme.colors.warning }]} />
            <Text style={[styles.chipText, activeFilter === 'LOW' && styles.chipTextActive]}>
              Low Stock
            </Text>
            <View style={[styles.chipBadge, activeFilter === 'LOW' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, activeFilter === 'LOW' && styles.chipBadgeTextActive]}>
                {counts.low}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Depleted Filter Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipDanger,
              activeFilter === 'DEPLETED' && styles.chipDangerActive
            ]}
            onPress={() => setActiveFilter('DEPLETED')}
            activeOpacity={0.8}
          >
            <View style={[styles.dotIndicator, { backgroundColor: theme.colors.danger }]} />
            <Text style={[styles.chipText, activeFilter === 'DEPLETED' && styles.chipTextActive]}>
              Depleted
            </Text>
            <View style={[styles.chipBadge, activeFilter === 'DEPLETED' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, activeFilter === 'DEPLETED' && styles.chipBadgeTextActive]}>
                {counts.depleted}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Categories */}
          {categories.map(c => {
            const count = products.filter(p => p.categoryId === c.id).length;
            const isSelected = activeFilter === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setActiveFilter(c.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {c.name}
                </Text>
                <View style={[styles.chipBadge, isSelected && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, isSelected && styles.chipBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List / Grid */}
      <FlatList
        key={viewMode}
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package" size={36} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search keywords or filter tab.</Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearch('');
                setActiveFilter('ALL');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Product Button for Editors */}
      {isEditor && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NewProduct')}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Product</Text>
        </TouchableOpacity>
      )}

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
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 6,
    gap: 8
  },
  searchWrap: {
    flex: 1
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.card,
    height: 44,
    padding: 3,
    ...theme.shadows.subtle
  },
  toggleBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primaryTint
  },
  categoryBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle
  },
  chipActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  chipWarning: {
    borderColor: '#FDE68A'
  },
  chipWarningActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706'
  },
  chipDanger: {
    borderColor: '#FECACA'
  },
  chipDangerActive: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.body
  },
  chipBadgeTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 130
  },
  // List Item Styles
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 10,
    ...theme.shadows.card
  },
  listThumbWrap: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle,
    position: 'relative'
  },
  listThumb: {
    width: '100%',
    height: '100%'
  },
  listFallbackThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.muted
  },
  thumbAlertDot: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  listCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy
  },
  listSku: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  listPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  stockStatusWrap: {
    alignSelf: 'flex-start'
  },
  listRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  inlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 2
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle
  },
  stepperBtnDisabled: {
    opacity: 0.35
  },
  stepperCountWrap: {
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  stepperCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy
  },
  stepperUnitText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: -2
  },
  quickSheetTrigger: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 4
  },
  quickSheetText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary
  },
  // Grid Styles
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card
  },
  gridImageWrap: {
    width: '100%',
    height: 124,
    backgroundColor: theme.colors.surfaceSubtle,
    position: 'relative'
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  gridFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.muted
  },
  floatingBadgeWrap: {
    position: 'absolute',
    top: 6,
    right: 6
  },
  gridBody: {
    padding: 10
  },
  gridBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase'
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy,
    marginTop: 2,
    minHeight: 34
  },
  gridPriceRow: {
    marginTop: 4,
    marginBottom: 8
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  gridStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4
  },
  gridInlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 2,
    flex: 1
  },
  gridStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridCountBtn: {
    flex: 1,
    alignItems: 'center'
  },
  gridCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.navy
  },
  gridAdjustPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 10
  },
  emptyDesc: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 4
  },
  resetFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryTint
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.full,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    ...theme.shadows.hover
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
