import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/layout/AppHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

export const RestaurantAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const {
    occupancyStats,
    kots,
    orders,
    wasteLogs,
    tableAudits
  } = useRestaurant();

  const settledOrders = orders.filter(o => o.orderStatus === 'settled');
  const todaySales = settledOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'CP';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of InfinityHub Restaurant Ops?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Application Header */}
      <AppHeader
        navigation={navigation}
        title={tenant?.name || 'Restaurant Workspace'}
        subtitleBadge={`${user?.role || 'Staff'} Account`}
        icon="utensils"
        hideScanner
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.userName}>{user?.name || 'Staff Captain'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'captain@restaurant.in'}</Text>
            <View style={{ marginTop: 6 }}>
              <Badge
                label={user?.role === 'SUPER_ADMIN' ? 'Platform Admin' : user?.role === 'MANAGER' ? 'Floor Manager' : 'Restaurant Captain'}
                variant={user?.role === 'SUPER_ADMIN' ? 'danger' : 'primary'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Restaurant KPIs */}
        <Text style={styles.sectionTitle}>Shift Summary & Metrics</Text>
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Occupancy"
            value={`${occupancyStats.occupancyRate}%`}
            subtext={`${occupancyStats.occupiedCount} / ${occupancyStats.totalTables} Tables`}
            icon="table"
            variant="primary"
          />
          <KpiCard
            label="KOTs Fired"
            value={kots.length}
            subtext="Line tickets today"
            icon="chefHat"
            variant="primary"
          />
          <KpiCard
            label="Settled Checks"
            value={settledOrders.length}
            subtext="Closed dining tables"
            icon="receipt"
            variant="success"
          />
          <KpiCard
            label="Today Revenue"
            value={`₹${todaySales}`}
            subtext="Gross dining collection"
            icon="cash"
            variant="primary"
          />
        </View>

        {/* Anti-Theft Void & Waste Register */}
        <Text style={styles.sectionTitle}>Anti-Theft Void & Waste Log</Text>
        <View style={styles.card}>
          {wasteLogs.length === 0 ? (
            <Text style={styles.emptyLogText}>No voided items or waste recorded in current shift.</Text>
          ) : (
            wasteLogs.slice(0, 5).map(log => (
              <View key={log.id} style={styles.logItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>{log.itemName} x{log.quantity}</Text>
                  <Text style={styles.logMeta}>Table {log.tableNumber} · Reason: {log.reason}</Text>
                  <Text style={styles.logAuth}>Authorized By: {log.authorizedBy}</Text>
                </View>
                <Text style={styles.logCost}>-₹{log.estimatedCost}</Text>
              </View>
            ))
          )}
        </View>

        {/* Table Transfer Audit Ledger */}
        <Text style={styles.sectionTitle}>Table Transfer Lineage</Text>
        <View style={styles.card}>
          {tableAudits.length === 0 ? (
            <Text style={styles.emptyLogText}>No table transfers executed in this shift.</Text>
          ) : (
            tableAudits.slice(0, 5).map(audit => (
              <View key={audit.id} style={styles.logItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>Table {audit.sourceTable} to {audit.targetTable}</Text>
                  <Text style={styles.logMeta}>{audit.reason}</Text>
                  <Text style={styles.logAuth}>Approved: {audit.authorizedBy} · Captain: {audit.transferredBy}</Text>
                </View>
                <Text style={styles.auditCount}>{audit.itemCount} Dishes</Text>
              </View>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionRowBtn, styles.logoutBtn]}
            onPress={handleLogout}
          >
            <View style={styles.actionRowLeft}>
              <Icon name="close" size={18} color={theme.colors.danger} />
              <Text style={[styles.actionRowText, { color: theme.colors.danger }]}>Sign Out Workspace</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.card
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryTint,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  userEmail: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  emptyLogText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontStyle: 'italic',
    paddingVertical: 8
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  logMeta: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 2
  },
  logAuth: {
    fontSize: 10,
    color: theme.colors.muted,
    fontStyle: 'italic'
  },
  logCost: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger
  },
  auditCount: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary
  },
  actionSection: {
    marginTop: 24,
    gap: 10
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.navy
  },
  logoutBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5'
  }
});
