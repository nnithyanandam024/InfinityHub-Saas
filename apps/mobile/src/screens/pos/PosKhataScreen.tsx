import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyStateCard } from '../../components/common/EmptyStateCard';
import { usePos } from '../../context/PosContext';
import { PosCustomer } from '@infinityhub/types';
import { MobileKhataPaymentModal } from '../../components/pos/MobileKhataPaymentModal';

export const PosKhataScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { customers, recordCustomerPayment } = usePos();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<PosCustomer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  const totalOutstandingDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customers]);

  const renderCustomerCard = ({ item }: { item: PosCustomer }) => {
    const hasDebt = item.currentBalance > 0;
    const utilizationPct = Math.min(100, Math.round((item.currentBalance / item.creditLimit) * 100));
    const initials = item.name.slice(0, 2).toUpperCase();

    return (
      <View style={styles.customerCard}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerPhone}>{item.phone}</Text>
            {item.gstin ? (
              <Text style={styles.customerGstin}>GSTIN: {item.gstin}</Text>
            ) : null}
          </View>

          <View style={styles.balanceBadgeCol}>
            <Text style={styles.balanceLabel}>Outstanding</Text>
            <Text style={[styles.balanceAmount, hasDebt ? styles.debtText : styles.clearText]}>
              ₹{item.currentBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Credit Limit Meter */}
        <View style={styles.limitMeterSection}>
          <View style={styles.meterHeader}>
            <Text style={styles.meterLabel}>Credit Limit Utilization</Text>
            <Text style={styles.meterVal}>{utilizationPct}% of ₹{item.creditLimit}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${utilizationPct}%` },
                utilizationPct > 80 ? styles.fillRed : utilizationPct > 50 ? styles.fillAmber : styles.fillBlue
              ]}
            />
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.cardActions}>
          <Button
            size="sm"
            variant="outline"
            label="Collect Payment"
            icon="wallet"
            onPress={() => setSelectedCustomerForPayment(item)}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Application Header */}
      <AppHeader
        navigation={navigation}
        title="Customer Khata"
        subtitleBadge={`${customers.length} Credit Accounts`}
        icon="wallet"
        hideScanner
        onAvatarPress={() => navigation.navigate('PosAccountTab')}
      />

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={renderCustomerCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Outstanding Summary Banner */}
            <View style={styles.bannerCard}>
              <Text style={styles.bannerSubhead}>TOTAL MARKET CREDIT OUTSTANDING</Text>
              <View style={styles.bannerMainRow}>
                <Text style={styles.bannerAmount}>₹{totalOutstandingDue.toFixed(2)}</Text>
                <Badge label={`${customers.length} Accounts`} variant="warning" size="sm" />
              </View>
              <Text style={styles.bannerMeta}>
                Uncollected store customer ledger credit balance
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Icon name="search" size={16} color={theme.colors.muted} style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customer by name or phone..."
                placeholderTextColor={theme.colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
                  <Icon name="close" size={14} color={theme.colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Active Customer Accounts</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyStateCard
            icon="wallet"
            title="No credit accounts found"
            subtitle={searchQuery ? `No customer found matching "${searchQuery}"` : "Customer credit balances will be listed here."}
            actionLabel={searchQuery ? "Clear Search" : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        }
      />

      {/* Khata Payment Modal */}
      <MobileKhataPaymentModal
        visible={!!selectedCustomerForPayment}
        customer={selectedCustomerForPayment}
        onClose={() => setSelectedCustomerForPayment(null)}
        onRecordPayment={recordCustomerPayment}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerSection: {
    marginBottom: 6
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    ...theme.shadows.card
  },
  bannerSubhead: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  bannerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4
  },
  bannerAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.dangerText,
    letterSpacing: -0.5
  },
  bannerMeta: {
    fontSize: 11,
    color: theme.colors.muted
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  avatarPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    paddingHorizontal: 8,
    color: theme.colors.navy
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  customerPhone: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 2
  },
  customerGstin: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 2
  },
  balanceBadgeCol: {
    alignItems: 'flex-end'
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.muted
  },
  balanceAmount: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2
  },
  debtText: {
    color: '#DC2626'
  },
  clearText: {
    color: '#059669'
  },
  limitMeterSection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  meterLabel: {
    fontSize: 10,
    color: theme.colors.muted
  },
  meterVal: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 3
  },
  fillBlue: {
    backgroundColor: theme.colors.primary
  },
  fillAmber: {
    backgroundColor: '#F59E0B'
  },
  fillRed: {
    backgroundColor: '#DC2626'
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    marginTop: 4
  },
  recordPaymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryTint,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight
  },
  recordPaymentText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  }
});
