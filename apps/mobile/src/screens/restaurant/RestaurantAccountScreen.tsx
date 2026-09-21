import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';

export const RestaurantAccountScreen: React.FC<{ navigation: any }> = () => {
  const { tenant } = useTenant();
  const { user, logout, loginAsPersona } = useAuth();
  const {
    sections,
    tables,
    menuItems,
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Platform Super Admin';
      case 'TENANT_OWNER':
        return 'Restaurant Owner';
      case 'MANAGER':
        return 'Floor Manager';
      case 'STAFF':
        return 'Restaurant Captain';
      default:
        return 'Dining Operator';
    }
  };

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header - Clean title with no TENANT_OWNER Account text */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Restaurant Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                label={getRoleLabel(user?.role)}
                variant={user?.role === 'SUPER_ADMIN' ? 'danger' : user?.role === 'TENANT_OWNER' ? 'primary' : 'muted'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Restaurant Information Card */}
        <Text style={styles.sectionHeading}>Restaurant Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dining Outlet</Text>
            <Text style={styles.infoVal}>{tenant.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Industry Category</Text>
            <Text style={styles.infoVal}>{(tenant as any).category || 'Fine Dining & Bistro'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoVal}>
              {tenant.settings?.currency || 'INR'} ({tenant.settings?.currencySymbol || '₹'})
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Operating Status</Text>
            <Badge label="Active Dining Floor" variant="success" size="sm" />
          </View>
        </View>

        {/* Dining Capacity & Configuration */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Subscription & Capacity</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={styles.infoVal}>{tenant.planName || 'Professional'} Plan</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dining Sections</Text>
            <Text style={styles.infoVal}>{sections.length} Active Sections</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dining Tables</Text>
            <Text style={styles.infoVal}>{tables.length} Tables Configured</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Menu Catalog Items</Text>
            <Text style={styles.infoVal}>{menuItems.length} Dishes</Text>
          </View>
        </View>

        {/* Shift Summary & Operational Metrics */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Shift Summary & Metrics</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Floor Occupancy</Text>
            <Text style={styles.infoVal}>{occupancyStats.occupancyRate}% ({occupancyStats.occupiedCount}/{occupancyStats.totalTables} Tables)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>KOTs Fired Today</Text>
            <Text style={styles.infoVal}>{kots.length} Kitchen Tickets</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Settled Checks</Text>
            <Text style={styles.infoVal}>{settledOrders.length} Closed Tables</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Today Dining Revenue</Text>
            <Text style={[styles.infoVal, { color: theme.colors.primary, fontWeight: '800' }]}>₹{todaySales}</Text>
          </View>
        </View>

        {/* Anti-Theft Void & Waste Register */}
        {wasteLogs.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Anti-Theft Void & Waste Log</Text>
            <View style={styles.card}>
              {wasteLogs.slice(0, 3).map((log, index) => (
                <View
                  key={log.id}
                  style={[
                    styles.infoRow,
                    index === Math.min(2, wasteLogs.length - 1) && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.logTitle}>{log.itemName} x{log.quantity}</Text>
                    <Text style={styles.logMeta}>Table {log.tableNumber} · {log.reason}</Text>
                    <Text style={styles.logAuth}>Auth: {log.authorizedBy}</Text>
                  </View>
                  <Text style={styles.logCost}>-₹{log.estimatedCost}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Table Transfer Lineage */}
        {tableAudits.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Table Transfer Lineage</Text>
            <View style={styles.card}>
              {tableAudits.slice(0, 3).map((audit, index) => (
                <View
                  key={audit.id}
                  style={[
                    styles.infoRow,
                    index === Math.min(2, tableAudits.length - 1) && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.logTitle}>Table {audit.sourceTable} to {audit.targetTable}</Text>
                    <Text style={styles.logMeta}>{audit.reason}</Text>
                    <Text style={styles.logAuth}>Approved: {audit.authorizedBy}</Text>
                  </View>
                  <Text style={styles.auditCount}>{audit.itemCount} Dishes</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* App Info & Diagnostics */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Application Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application Suite</Text>
            <Text style={styles.infoVal}>Restaurant Management</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoVal}>InfinityHub Mobile</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Data Synchronization</Text>
            <Text style={styles.infoVal}>Local & Offline Sync</Text>
          </View>
        </View>

        {/* Switch Persona for Testing / Demo */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Evaluation Roles</Text>
        <Text style={styles.sectionSub}>Select a role to test role-based permissions:</Text>
        <View style={styles.personaRow}>
          {DEMO_PERSONAS.slice(0, 3).map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.personaChip, user?.id === p.key && styles.personaChipActive]}
              onPress={() => loginAsPersona(p.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.personaChipText, user?.id === p.key && styles.personaChipTextActive]}>
                {p.roleLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Action */}
        <Button
          label="Sign Out"
          onPress={handleLogout}
          variant="danger"
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 130
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: theme.spacing.lg,
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
    fontWeight: '700',
    color: theme.colors.navy
  },
  userEmail: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 1
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 8
  },
  sectionSub: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: -4,
    marginBottom: 8
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
    ...theme.shadows.card
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.body
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  logMeta: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 1
  },
  logAuth: {
    fontSize: 10,
    color: theme.colors.muted,
    fontStyle: 'italic',
    marginTop: 1
  },
  logCost: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger
  },
  auditCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  personaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card
  },
  personaChipActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  personaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  personaChipTextActive: {
    color: '#FFFFFF'
  }
});
