import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { usePos } from '../../context/PosContext';
import { MobileKhataPaymentModal } from '../../components/pos/MobileKhataPaymentModal';
export const PosKhataScreen = ({ navigation }) => {
    const { customers, recordCustomerPayment } = usePos();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const q = searchQuery.toLowerCase();
            return (!searchQuery ||
                c.name.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q) ||
                c.gstin?.toLowerCase().includes(q));
        });
    }, [customers, searchQuery]);
    const totalOutstandingDue = useMemo(() => {
        return customers.reduce((sum, c) => sum + c.currentBalance, 0);
    }, [customers]);
    const renderCustomerCard = ({ item }) => {
        const hasDebt = item.currentBalance > 0;
        const utilizationPct = Math.min(100, Math.round((item.currentBalance / item.creditLimit) * 100));
        return (<View style={styles.customerCard}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerPhone}>{item.phone}</Text>
            {item.gstin && (<Text style={styles.customerGstin}>GSTIN: {item.gstin}</Text>)}
          </View>

          <View style={styles.balanceBadgeCol}>
            <Text style={styles.balanceLabel}>Outstanding Khata</Text>
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
            <View style={[
                styles.fill,
                { width: `${utilizationPct}%` },
                utilizationPct > 80 ? styles.fillRed : utilizationPct > 50 ? styles.fillAmber : styles.fillBlue
            ]}/>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.recordPaymentBtn} onPress={() => setSelectedCustomerForPayment(item)}>
            <Icon name="wallet" size={14} color={theme.colors.primary}/>
            <Text style={styles.recordPaymentText}>Record Repayment</Text>
          </TouchableOpacity>
        </View>
      </View>);
    };
    return (<SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Customer Khata (Credit Ledger)</Text>
          <Text style={styles.headerSubtitle}>
            Credit customers, payment collection & balance tracking
          </Text>
        </View>
      </View>

      {/* Outstanding Summary Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryBannerLabel}>Total Market Credit Outstanding</Text>
          <Text style={styles.summaryBannerAmount}>₹{totalOutstandingDue.toFixed(2)}</Text>
        </View>
        <View style={styles.customerCountBadge}>
          <Text style={styles.customerCountText}>{customers.length} Accounts</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={theme.colors.muted} style={{ marginLeft: 10 }}/>
        <TextInput style={styles.searchInput} placeholder="Search customer by name or phone..." placeholderTextColor={theme.colors.muted} value={searchQuery} onChangeText={setSearchQuery}/>
        {searchQuery.length > 0 && (<TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
            <Icon name="close" size={14} color={theme.colors.muted}/>
          </TouchableOpacity>)}
      </View>

      {/* Customer List */}
      <FlatList data={filteredCustomers} keyExtractor={item => item.id} renderItem={renderCustomerCard} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}/>

      {/* Khata Payment Modal */}
      <MobileKhataPaymentModal visible={!!selectedCustomerForPayment} customer={selectedCustomerForPayment} onClose={() => setSelectedCustomerForPayment(null)} onRecordPayment={recordCustomerPayment}/>
    </SafeAreaView>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.navy
    },
    headerSubtitle: {
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 2
    },
    summaryBanner: {
        backgroundColor: theme.colors.navy,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    summaryBannerLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600'
    },
    summaryBannerAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 2
    },
    customerCountBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8
    },
    customerCountText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    searchInput: {
        flex: 1,
        height: 42,
        fontSize: 13,
        paddingHorizontal: 8,
        color: theme.colors.navy
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
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
//# sourceMappingURL=PosKhataScreen.js.map