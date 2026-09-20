import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { useApp } from '../../context/AppContext';
import { RestaurantTable, TableStatus } from '@infinityhub/types';
import { RestaurantQuickSeatModal } from '../../components/restaurant/RestaurantQuickSeatModal';
import { RestaurantSettlementModal } from '../../components/restaurant/RestaurantSettlementModal';
import { RestaurantManagerPinModal } from '../../components/restaurant/RestaurantManagerPinModal';
import { AppLauncherModal } from '../../components/modals/AppLauncherModal';

export const RestaurantTablesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { tenant } = useTenant();
  const {
    sections,
    tables,
    occupancyStats,
    setSelectedTableId,
    resetTableToVacant,
    transferTable
  } = useRestaurant();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [seatModalTable, setSeatModalTable] = useState<RestaurantTable | null>(null);
  const [settleModalTable, setSettleModalTable] = useState<RestaurantTable | null>(null);
  const [transferSourceTable, setTransferSourceTable] = useState<RestaurantTable | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState<boolean>(false);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchSec = selectedSectionId === 'all' || t.sectionId === selectedSectionId;
      const matchStat = selectedStatusFilter === 'all' || t.status === selectedStatusFilter;
      return matchSec && matchStat;
    });
  }, [tables, selectedSectionId, selectedStatusFilter]);

  // Handle table selection
  const handleTablePress = (table: RestaurantTable) => {
    if (table.status === 'vacant') {
      setSeatModalTable(table);
      return;
    }

    if (table.status === 'cleaning') {
      Alert.alert(
        'Table Cleaning',
        `Reset Table ${table.tableNumber} to Vacant for next dining guests?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Vacant',
            onPress: () => resetTableToVacant(table.id)
          }
        ]
      );
      return;
    }

    // Active table: select and switch to Order Pad tab
    setSelectedTableId(table.id);
    navigation.navigate('RestaurantOrderTab');
  };

  const handleSeatSuccess = (seatedTable: RestaurantTable) => {
    setSelectedTableId(seatedTable.id);
    navigation.navigate('RestaurantOrderTab');
  };

  // Status color helper
  const getStatusStyle = (status: TableStatus) => {
    switch (status) {
      case 'vacant':
        return {
          badgeBg: theme.colors.successBg,
          badgeText: theme.colors.successText,
          cardBorder: theme.colors.border,
          label: 'Vacant'
        };
      case 'seated':
        return {
          badgeBg: theme.colors.infoBg,
          badgeText: theme.colors.infoText,
          cardBorder: theme.colors.info,
          label: 'Seated'
        };
      case 'ordered':
        return {
          badgeBg: theme.colors.warningBg,
          badgeText: theme.colors.warningText,
          cardBorder: theme.colors.warning,
          label: 'Ordered'
        };
      case 'served':
        return {
          badgeBg: '#F3E8FF',
          badgeText: '#6B21A8',
          cardBorder: '#C084FC',
          label: 'Served'
        };
      case 'billed':
        return {
          badgeBg: theme.colors.dangerBg,
          badgeText: theme.colors.dangerText,
          cardBorder: theme.colors.danger,
          label: 'Billed'
        };
      case 'cleaning':
        return {
          badgeBg: theme.colors.surfaceSubtle,
          badgeText: theme.colors.body,
          cardBorder: theme.colors.border,
          label: 'Cleaning'
        };
      default:
        return {
          badgeBg: theme.colors.surfaceSubtle,
          badgeText: theme.colors.body,
          cardBorder: theme.colors.border,
          label: status
        };
    }
  };

  const renderTableCard = ({ item }: { item: RestaurantTable }) => {
    const statusMeta = getStatusStyle(item.status);
    const sectionName = sections.find(s => s.id === item.sectionId)?.name || 'Dining Area';

    return (
      <TouchableOpacity
        style={[
          styles.tableCard,
          { borderColor: statusMeta.cardBorder },
          item.status === 'vacant' && styles.tableCardVacant
        ]}
        onPress={() => handleTablePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tableNumberWrap}>
            <Text style={styles.tableNumber}>{item.tableNumber}</Text>
            <Text style={styles.sectionLabel} numberOfLines={1}>{sectionName}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusMeta.badgeBg }]}>
            <Text style={[styles.statusPillText, { color: statusMeta.badgeText }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Icon name="user" size={12} color={theme.colors.muted} />
            <Text style={styles.metaText}>
              {item.status !== 'vacant' && item.status !== 'cleaning'
                ? `${item.guestCount || item.capacity} Guests`
                : `${item.capacity} Seats`}
            </Text>
          </View>

          {item.captainName ? (
            <View style={styles.metaRow}>
              <Icon name="shield" size={12} color={theme.colors.muted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.captainName}
              </Text>
            </View>
          ) : null}

          {item.currentBillTotal !== undefined && item.currentBillTotal > 0 ? (
            <View style={styles.billTag}>
              <Text style={styles.billAmount}>₹{item.currentBillTotal}</Text>
            </View>
          ) : null}
        </View>

        {/* Quick Action Footer */}
        <View style={styles.cardFooter}>
          {item.status === 'vacant' ? (
            <Text style={styles.vacantActionText}>Tap to Seat Guests</Text>
          ) : item.status === 'cleaning' ? (
            <Text style={styles.cleaningActionText}>Tap to Vacate</Text>
          ) : (
            <View style={styles.activeActionsRow}>
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => {
                  setSelectedTableId(item.id);
                  navigation.navigate('RestaurantOrderTab');
                }}
              >
                <Text style={styles.cardActionText}>Order Pad</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cardActionBtn, styles.cardActionSettle]}
                onPress={() => setSettleModalTable(item)}
              >
                <Text style={styles.cardActionSettleText}>Settle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tenantName} numberOfLines={1}>
            {tenant?.name || 'Restaurant Workspace'}
          </Text>
          <Text style={styles.occupancyText}>
            Floor Occupancy: {occupancyStats.occupiedCount} / {occupancyStats.totalTables} Tables ({occupancyStats.occupancyRate}%)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.appSwitchBtn}
          onPress={() => setIsAppLauncherOpen(true)}
          activeOpacity={0.7}
        >
          <Icon name="appLauncher" size={16} color={theme.colors.navy} />
          <Text style={styles.appSwitchText}>Suites</Text>
        </TouchableOpacity>
      </View>

      {/* Sections Horizontal Pill Bar */}
      <View style={styles.filterScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedSectionId === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedSectionId('all')}
          >
            <Text style={[styles.filterPillText, selectedSectionId === 'all' && styles.filterPillTextActive]}>
              All Sections
            </Text>
          </TouchableOpacity>

          {sections.map(sec => (
            <TouchableOpacity
              key={sec.id}
              style={[styles.filterPill, selectedSectionId === sec.id && styles.filterPillActive]}
              onPress={() => setSelectedSectionId(sec.id)}
            >
              <Text style={[styles.filterPillText, selectedSectionId === sec.id && styles.filterPillTextActive]}>
                {sec.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter Horizontal Pills */}
      <View style={styles.statusFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'vacant', 'seated', 'ordered', 'served', 'billed', 'cleaning'] as const).map(st => (
            <TouchableOpacity
              key={st}
              style={[styles.statusTab, selectedStatusFilter === st && styles.statusTabActive]}
              onPress={() => setSelectedStatusFilter(st)}
            >
              <Text style={[styles.statusTabText, selectedStatusFilter === st && styles.statusTabTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tables Grid */}
      <FlatList
        data={filteredTables}
        keyExtractor={item => item.id}
        renderItem={renderTableCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="table" size={32} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>No Tables Found</Text>
            <Text style={styles.emptySubtitle}>No dining tables match the selected section and status filter.</Text>
          </View>
        }
      />

      {/* Quick Seat Modal */}
      <RestaurantQuickSeatModal
        visible={!!seatModalTable}
        table={seatModalTable}
        onClose={() => setSeatModalTable(null)}
        onSeatSuccess={handleSeatSuccess}
      />

      {/* Table Settlement Modal */}
      <RestaurantSettlementModal
        visible={!!settleModalTable}
        table={settleModalTable}
        onClose={() => setSettleModalTable(null)}
        onSettled={invoice => {
          navigation.navigate('RestaurantReceipt', { invoice });
        }}
      />

      {/* App Launcher Modal */}
      <AppLauncherModal
        visible={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  occupancyText: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
    fontWeight: '500'
  },
  appSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  appSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  filterScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8
  },
  statusFilterWrap: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  filterPillActive: {
    backgroundColor: theme.colors.navy
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  statusTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm
  },
  statusTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  statusTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted
  },
  statusTabTextActive: {
    color: theme.colors.navy
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 24
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md
  },
  tableCard: {
    flex: 0.485,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.card,
    borderWidth: 1.5,
    padding: theme.spacing.md,
    ...theme.shadows.card
  },
  tableCardVacant: {
    borderStyle: 'dashed'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  tableNumberWrap: {
    flex: 1,
    marginRight: 6
  },
  tableNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.navy
  },
  sectionLabel: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 1
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cardBody: {
    marginVertical: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 1
  },
  metaText: {
    fontSize: 11,
    color: theme.colors.body,
    fontWeight: '500'
  },
  billTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: theme.colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.xs
  },
  billAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  cardFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 6
  },
  vacantActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.successText,
    textAlign: 'center'
  },
  cleaningActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
    textAlign: 'center'
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 6
  },
  cardActionBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center'
  },
  cardActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.navy
  },
  cardActionSettle: {
    backgroundColor: theme.colors.primaryTint
  },
  cardActionSettleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 24
  }
});
