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
import { Invoice } from '@infinityhub/types';
import { MobileSalesReturnModal } from '../../components/pos/MobileSalesReturnModal';

export const PosInvoicesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { invoices } = usePos();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState<Invoice | null>(null);

  const totalCollections = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.customerPhone?.toLowerCase().includes(q)
      );
    });
  }, [invoices, searchQuery]);

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const payment = item.payments?.[0];
    const isCredit = payment?.method === 'credit_khata';

    return (
      <View style={styles.invoiceCard}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              {new Date(item.invoiceDate).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </Text>
          </View>

          <View style={styles.badgeCol}>
            <Badge
              label={isCredit ? 'KHATA DEBT' : 'PAID'}
              variant={isCredit ? 'warning' : 'success'}
              size="sm"
            />
            <Text style={styles.paymentMethodText}>
              via {payment ? payment.method.toUpperCase().replace('_', ' ') : 'CASH'}
            </Text>
          </View>
        </View>

        {/* Customer & Items Details */}
        <View style={styles.detailsRow}>
          <View style={styles.customerInfo}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.customerName}>
              {item.customerName || 'Walk-in Retail Customer'}
            </Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            )}
          </View>

          <View style={styles.totalInfo}>
            <Text style={styles.detailLabel}>Invoice Total</Text>
            <Text style={styles.grandTotal}>₹{item.grandTotal.toFixed(2)}</Text>
            <Text style={styles.itemsCount}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {/* Tax Breakdown Mini Bar */}
        <View style={styles.taxMiniBar}>
          <Text style={styles.taxMiniText}>
            Taxable: ₹{item.taxableAmount.toFixed(2)} | CGST: ₹{item.totalCgst.toFixed(2)} | SGST: ₹{item.totalSgst.toFixed(2)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <Button
            size="sm"
            variant="outline"
            label="View Receipt"
            icon="receipt"
            onPress={() => navigation.navigate('PosReceipt', { invoice: item })}
            style={{ flex: 1, marginRight: 8 }}
          />

          <Button
            size="sm"
            variant="outline"
            label="Sales Return"
            onPress={() => setSelectedInvoiceForReturn(item)}
            style={{ minWidth: 100 }}
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
        title="Invoices & Register"
        subtitleBadge={`${invoices.length} Bills Recorded`}
        icon="receipt"
        hideScanner
        onAvatarPress={() => navigation.navigate('PosAccountTab')}
      />

      {/* Invoices List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={item => item.id}
        renderItem={renderInvoiceCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Summary Performance Banner */}
            <View style={styles.bannerCard}>
              <Text style={styles.bannerSubhead}>TOTAL REGISTER PERFORMANCE</Text>
              <View style={styles.bannerMainRow}>
                <Text style={styles.bannerTotal}>₹{totalCollections.toFixed(2)}</Text>
                <Badge label={`${invoices.length} Bills`} variant="primary" size="sm" />
              </View>
              <Text style={styles.bannerMeta}>
                Rule 46 CGST Compliant Digital Sales Register
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
              <Icon name="search" size={16} color={theme.colors.muted} style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Invoice #, Customer or Phone..."
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

            <Text style={styles.sectionTitle}>Recent Invoices</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyStateCard
            icon="receipt"
            title="No invoices found"
            subtitle={searchQuery ? `No invoices match "${searchQuery}"` : "Completed retail checkout orders will appear here in the sales register."}
            actionLabel={searchQuery ? "Clear Search" : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        }
      />

      {/* Sales Return Modal */}
      <MobileSalesReturnModal
        visible={!!selectedInvoiceForReturn}
        invoice={selectedInvoiceForReturn}
        onClose={() => setSelectedInvoiceForReturn(null)}
        onSuccess={() => {}}
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
  bannerTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.navy,
    letterSpacing: -0.5
  },
  bannerMeta: {
    fontSize: 11,
    color: theme.colors.muted
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8
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
    paddingBottom: 32,
    gap: 12
  },
  invoiceCard: {
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  invoiceDate: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.body
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  customerInfo: {
    flex: 1
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.muted
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 1
  },
  customerPhone: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1
  },
  totalInfo: {
    alignItems: 'flex-end'
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
    marginTop: 1
  },
  itemsCount: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1
  },
  taxMiniBar: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10
  },
  taxMiniText: {
    fontSize: 10,
    color: theme.colors.body,
    textAlign: 'center'
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10
  },
  viewReceiptBtn: {
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
  viewReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  returnBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  returnBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy,
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4
  }
});
