import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

export const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, categories, suppliers, formatPrice, tenant } = useTenant();
  const { user } = useAuth();

  // Financial & Valuation Metrics
  const metrics = useMemo(() => {
    let totalRetailValue = 0;
    let totalCostCapital = 0;
    let totalUnits = 0;
    let healthyCount = 0;
    let lowCount = 0;
    let depletedCount = 0;

    products.forEach(p => {
      const qty = Math.max(0, p.stockQuantity);
      totalUnits += qty;
      totalRetailValue += p.sellingPrice * qty;
      totalCostCapital += (p.costPrice || 0) * qty;

      if (p.stockQuantity <= 0) {
        depletedCount++;
      } else if (p.stockQuantity <= p.minimumStock) {
        lowCount++;
      } else {
        healthyCount++;
      }
    });

    const grossProfit = totalRetailValue - totalCostCapital;
    const marginPct = totalRetailValue > 0
      ? ((grossProfit / totalRetailValue) * 100).toFixed(1)
      : '0.0';

    return {
      totalRetailValue,
      totalCostCapital,
      grossProfit,
      marginPct,
      totalUnits,
      healthyCount,
      lowCount,
      depletedCount,
      totalSkus: products.length
    };
  }, [products]);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const skus = catProducts.length;
      const units = catProducts.reduce((sum, p) => sum + Math.max(0, p.stockQuantity), 0);
      const retailVal = catProducts.reduce((sum, p) => sum + p.sellingPrice * Math.max(0, p.stockQuantity), 0);
      return {
        id: cat.id,
        name: cat.name,
        skus,
        units,
        retailVal
      };
    });
  }, [categories, products]);

  // Reorder Attention List
  const urgentReorders = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.minimumStock);
  }, [products]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader navigation={navigation} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Executive Summary Header Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerTitle}>Executive Store Report</Text>
              <Text style={styles.bannerSub}>
                {tenant.name} · Real-time Valuation & Margins
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Ledger</Text>
            </View>
          </View>
        </View>

        {/* Primary Valuation Cards (2x2 Grid) */}
        <Text style={styles.sectionTitle}>Inventory Capital & Valuation</Text>
        <View style={styles.metricsGrid}>
          {/* Retail Valuation */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>Retail Catalog Value</Text>
              <View style={[styles.iconPill, { backgroundColor: theme.colors.primaryTint }]}>
                <Icon name="store" size={14} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.metricValue}>{formatPrice(metrics.totalRetailValue)}</Text>
            <Text style={styles.metricCaption}>Selling value of {metrics.totalUnits} on-hand units</Text>
          </View>

          {/* Cost Capital */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>Capital Invested</Text>
              <View style={[styles.iconPill, { backgroundColor: '#F1F5F9' }]}>
                <Icon name="package" size={14} color={theme.colors.navy} />
              </View>
            </View>
            <Text style={styles.metricValue}>{formatPrice(metrics.totalCostCapital)}</Text>
            <Text style={styles.metricCaption}>Acquisition cost basis</Text>
          </View>

          {/* Projected Gross Profit */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>Gross Margin Potential</Text>
              <View style={[styles.iconPill, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="stock" size={14} color={theme.colors.success} />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.success }]}>
              {formatPrice(metrics.grossProfit)}
            </Text>
            <Text style={styles.metricCaption}>Net projected profit</Text>
          </View>

          {/* Average Markup % */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>Estimated Margin</Text>
              <View style={[styles.iconPill, { backgroundColor: '#EEF2FF' }]}>
                <Icon name="reports" size={14} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
              {metrics.marginPct}%
            </Text>
            <Text style={styles.metricCaption}>Blended catalog margin</Text>
          </View>
        </View>

        {/* Stock Health Breakdown */}
        <Text style={styles.sectionTitle}>Inventory Health Distribution</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={styles.healthLabelWrap}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.healthLabel}>Optimal / Healthy Stock</Text>
            </View>
            <Text style={styles.healthCount}>{metrics.healthyCount} SKUs</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${metrics.totalSkus > 0 ? (metrics.healthyCount / metrics.totalSkus) * 100 : 0}%`,
                  backgroundColor: theme.colors.success
                }
              ]}
            />
          </View>

          <View style={[styles.healthRow, { marginTop: 14 }]}>
            <View style={styles.healthLabelWrap}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.healthLabel}>Low Buffer Warning</Text>
            </View>
            <Text style={styles.healthCount}>{metrics.lowCount} SKUs</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${metrics.totalSkus > 0 ? (metrics.lowCount / metrics.totalSkus) * 100 : 0}%`,
                  backgroundColor: theme.colors.warning
                }
              ]}
            />
          </View>

          <View style={[styles.healthRow, { marginTop: 14 }]}>
            <View style={styles.healthLabelWrap}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.danger }]} />
              <Text style={styles.healthLabel}>Depleted / Out of Stock</Text>
            </View>
            <Text style={styles.healthCount}>{metrics.depletedCount} SKUs</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${metrics.totalSkus > 0 ? (metrics.depletedCount / metrics.totalSkus) * 100 : 0}%`,
                  backgroundColor: theme.colors.danger
                }
              ]}
            />
          </View>
        </View>

        {/* Category Valuation Breakdown */}
        <Text style={styles.sectionTitle}>Category Portfolio Breakdown</Text>
        <View style={styles.categoryCard}>
          {categoryStats.map((cat, index) => (
            <View
              key={cat.id}
              style={[
                styles.categoryRow,
                index < categoryStats.length - 1 && styles.categoryRowBorder
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryMeta}>
                  {cat.skus} active SKUs · {cat.units} total units
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.categoryVal}>{formatPrice(cat.retailVal)}</Text>
                <Text style={styles.categoryValSub}>Retail Value</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Urgent Reorder Recommendations */}
        {urgentReorders.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Reorder Attention Required</Text>
              <Badge
                label={`${urgentReorders.length} ITEMS`}
                variant="warning"
                size="sm"
              />
            </View>
            <View style={styles.reorderCard}>
              {urgentReorders.map((prod, index) => {
                const isOut = prod.stockQuantity <= 0;
                return (
                  <View
                    key={prod.id}
                    style={[
                      styles.reorderItem,
                      index < urgentReorders.length - 1 && styles.reorderItemBorder
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.reorderName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Badge
                          label={isOut ? 'DEPLETED' : 'LOW'}
                          variant={isOut ? 'danger' : 'warning'}
                          size="sm"
                        />
                      </View>
                      <Text style={styles.reorderMeta}>
                        On-hand: {prod.stockQuantity} {prod.unit} · Min Threshold: {prod.minimumStock}
                      </Text>
                    </View>

                    <Button
                      size="sm"
                      label="Reorder"
                      onPress={() => navigation.navigate('StockAdjustment', { product: prod })}
                      variant="outline"
                      style={styles.reorderBtn}
                      textStyle={styles.reorderBtnText}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Operational Audit Summary */}
        <Text style={styles.sectionTitle}>Operational Audit</Text>
        <View style={styles.auditCard}>
          <View style={styles.auditItem}>
            <Text style={styles.auditLabel}>Authorized Suppliers</Text>
            <Text style={styles.auditValue}>{suppliers.length} Active</Text>
          </View>
          <View style={styles.auditDivider} />
          <View style={styles.auditItem}>
            <Text style={styles.auditLabel}>Total SKU Registry</Text>
            <Text style={styles.auditValue}>{metrics.totalSkus} Lines</Text>
          </View>
          <View style={styles.auditDivider} />
          <View style={styles.auditItem}>
            <Text style={styles.auditLabel}>Auditor Role</Text>
            <Text style={styles.auditValue}>{user?.role === 'TENANT_OWNER' ? 'Store Owner' : 'Store Manager'}</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  banner: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  bannerSub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  liveBadge: {
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg
  },
  metricCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
    flex: 1,
    marginRight: 4
  },
  iconPill: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 2
  },
  metricCaption: {
    fontSize: 10,
    color: theme.colors.muted
  },
  healthCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  healthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  healthCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.body
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  categoryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  categoryMeta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  categoryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  categoryValSub: {
    fontSize: 10,
    color: theme.colors.muted
  },
  reorderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14
  },
  reorderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  reorderName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    flexShrink: 1
  },
  reorderMeta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 3
  },
  reorderBtn: {
    height: 32,
    minWidth: 76,
    paddingVertical: 0,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16
  },
  auditCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card
  },
  auditItem: {
    flex: 1,
    alignItems: 'center'
  },
  auditDivider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.border,
    alignSelf: 'center'
  },
  auditLabel: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  auditValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 4
  }
});
