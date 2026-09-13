import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTenant } from '../../context/TenantContext';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';

export const ProfileScreen: React.FC<{ navigation: any }> = () => {
  const { tenant, products } = useTenant();
  const { user, logout, loginAsPersona } = useAuth();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Platform Super Admin';
      case 'TENANT_OWNER':
        return 'Store Owner';
      case 'MANAGER':
        return 'Store Manager';
      case 'STAFF':
        return 'Retail Staff';
      default:
        return 'Store Operator';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Store Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.userName}>{user?.name || 'Store Operator'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'operator@kumarstores.in'}</Text>
            <View style={{ marginTop: 6 }}>
              <Badge
                label={getRoleLabel(user?.role)}
                variant={user?.role === 'SUPER_ADMIN' ? 'danger' : user?.role === 'TENANT_OWNER' ? 'primary' : 'muted'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Store Information Card */}
        <Text style={styles.sectionHeading}>Store Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name</Text>
            <Text style={styles.infoVal}>{tenant.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Industry Category</Text>
            <Text style={styles.infoVal}>{(tenant as any).category || 'Mobile & Electronics Retail'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Store Currency</Text>
            <Text style={styles.infoVal}>
              {tenant.settings?.currency || 'INR'} ({tenant.settings?.currencySymbol || '₹'})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Operating Status</Text>
            <Badge label="Active Store" variant="success" size="sm" />
          </View>
        </View>

        {/* Plan Quotas & Limits */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Subscription & Capacity</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={styles.infoVal}>{tenant.planName || 'Starter'} Plan</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catalog Items</Text>
            <Text style={styles.infoVal}>{products.length} Active SKUs</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse Locations</Text>
            <Text style={styles.infoVal}>1 Location (Main Store)</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Multi-User Seats</Text>
            <Text style={styles.infoVal}>5 Team Seats</Text>
          </View>
        </View>

        {/* App Info & Diagnostics */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Application Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application Suite</Text>
            <Text style={styles.infoVal}>Inventory Management</Text>
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
    paddingBottom: 40
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
  personaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  personaChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingVertical: 9,
    alignItems: 'center'
  },
  personaChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  personaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  personaChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700'
  }
});
