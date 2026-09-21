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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.storeAvatar}>
          <Icon name="utensils" size={22} color="#FFFFFF" />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.storeName}>{tenant?.name || 'Gourmet Bistro'}</Text>
          <Text style={styles.userRole}>Staff User: {user?.name || 'Rajesh'} ({user?.role || 'CAPTAIN'})</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Restaurant KPIs */}
        <Text style={styles.sectionTitle}>Shift Summary & Metrics</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Occupancy</Text>
            <Text style={styles.kpiValue}>{occupancyStats.occupancyRate}%</Text>
            <Text style={styles.kpiSub}>{occupancyStats.occupiedCount} / {occupancyStats.totalTables} Tables</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>KOTs Fired</Text>
            <Text style={styles.kpiValue}>{kots.length}</Text>
            <Text style={styles.kpiSub}>Line tickets today</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Settled Checks</Text>
            <Text style={styles.kpiValue}>{settledOrders.length}</Text>
            <Text style={styles.kpiSub}>Closed dining tables</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Today Revenue</Text>
            <Text style={[styles.kpiValue, { color: theme.colors.primary }]}>₹{todaySales}</Text>
            <Text style={styles.kpiSub}>Gross dining collection</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  userRole: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 32
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.navy,
    marginVertical: 2
  },
  kpiSub: {
    fontSize: 10,
    color: theme.colors.body
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
