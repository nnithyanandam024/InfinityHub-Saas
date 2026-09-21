import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTenant } from '../../context/TenantContext';
import { Product } from '@infinityhub/types';

export const StockScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { products, tenant } = useTenant();
  const [filter, setFilter] = useState<'all' | 'normal' | 'low' | 'out'>(route.params?.filter || 'all');

  const normalCount = products.filter(p => p.stockQuantity > p.minimumStock).length;
  const lowCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length;
  const outCount = products.filter(p => p.stockQuantity <= 0).length;

  const filtered = products.filter(p => {
    if (filter === 'normal') return p.stockQuantity > p.minimumStock;
    if (filter === 'low') return p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;
    if (filter === 'out') return p.stockQuantity <= 0;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader navigation={navigation} />

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: `All (${products.length})` },
          { key: 'normal', label: `In Stock (${normalCount})` },
          { key: 'low', label: `Low (${lowCount})` },
          { key: 'out', label: `Depleted (${outCount})` }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Product }) => {
          const imgUri = item.thumbnailPath || item.imagePath;
          const isOut = item.stockQuantity <= 0;
          const isLow = !isOut && item.stockQuantity <= item.minimumStock;

          return (
            <View style={styles.card}>
              <View style={styles.thumbWrap}>
                {imgUri ? (
                  <Image source={{ uri: imgUri }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={styles.fallbackThumb}>
                    <Text style={styles.fallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.metaText}>
                  SKU: {item.sku} · Min Buffer: {item.minimumStock} {item.unit}
                </Text>
                <View style={styles.statusRow}>
                  <Badge
                    label={isOut ? 'Depleted' : isLow ? 'Low Stock' : 'In Stock'}
                    variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                    size="sm"
                  />
                  <Text style={styles.stockQtyText}>
                    {item.stockQuantity} {item.unit} on-hand
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => navigation.navigate('StockAdjustment', { product: item })}
              >
                <Text style={styles.adjustBtnText}>Adjust</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="stock" size={32} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>No items matching filter</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    gap: 8
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  tabActive: {
    backgroundColor: theme.colors.primary
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  list: {
    padding: theme.spacing.lg,
    paddingBottom: 96
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 8,
    ...theme.shadows.card
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSubtle
  },
  thumb: {
    width: '100%',
    height: '100%'
  },
  fallbackThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  metaText: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 2
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  stockQtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.navy
  },
  adjustBtn: {
    backgroundColor: theme.colors.primaryTint,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    marginLeft: 8
  },
  adjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.navy,
    marginTop: 10
  }
});
