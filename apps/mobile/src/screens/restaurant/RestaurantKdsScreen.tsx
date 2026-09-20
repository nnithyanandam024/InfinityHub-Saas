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
  Alert
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantKot, KitchenStation, KotItemStatus } from '@infinityhub/types';

export const RestaurantKdsScreen: React.FC<{ navigation: any }> = () => {
  const { kots, updateKotItemStatus, bumpKot } = useRestaurant();
  const [selectedStation, setSelectedStation] = useState<string>('all');

  const stations: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Stations' },
    { id: 'kitchen', label: 'Curry & Rice' },
    { id: 'tandoor', label: 'Tandoor & Breads' },
    { id: 'bar', label: 'Bar & Drinks' },
    { id: 'dessert', label: 'Dessert Pantry' }
  ];

  // Active KOT tickets
  const filteredKots = useMemo(() => {
    return kots.filter(k => {
      if (k.status === 'voided') return false;
      const matchStation = selectedStation === 'all' || k.station === selectedStation;
      const hasActiveItems = k.items.some(i => i.status !== 'served' && i.status !== 'cancelled');
      return matchStation && hasActiveItems;
    });
  }, [kots, selectedStation]);

  const handleBumpItem = async (kotId: string, itemId: string, currentStatus: KotItemStatus) => {
    const nextStatus: KotItemStatus = currentStatus === 'cooking' || currentStatus === 'pending'
      ? 'ready'
      : 'served';

    try {
      await updateKotItemStatus(kotId, itemId, nextStatus);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update item status.');
    }
  };

  const handleBumpAll = async (kotId: string) => {
    try {
      await bumpKot(kotId);
    } catch (err: any) {
      Alert.alert('Bump Failed', err.message || 'Could not bump KOT ticket.');
    }
  };

  const renderKotCard = ({ item }: { item: RestaurantKot }) => {
    return (
      <View style={styles.kotCard}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.kotNumber}>{item.kotNumber}</Text>
              <View style={styles.tableBadge}>
                <Text style={styles.tableBadgeText}>Table {item.tableNumber}</Text>
              </View>
            </View>
            <Text style={styles.sectionText}>{item.sectionName} · {item.captainName}</Text>
          </View>

          <View style={styles.stationBadge}>
            <Text style={styles.stationBadgeText}>{item.station.toUpperCase()}</Text>
          </View>
        </View>

        {/* Item Lines */}
        <View style={styles.itemsList}>
          {item.items.map(dish => (
            <View key={dish.id} style={styles.dishRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.dishNameRow}>
                  <Text style={[styles.dishQuantity, dish.status === 'ready' && styles.statusReadyText]}>
                    {dish.quantity}x
                  </Text>
                  <Text style={[styles.dishName, dish.status === 'cancelled' && styles.dishCancelled]}>
                    {dish.name}
                  </Text>
                </View>

                {dish.specialNotes ? (
                  <View style={styles.notesTag}>
                    <Text style={styles.notesTagText}>Note: {dish.specialNotes}</Text>
                  </View>
                ) : null}
              </View>

              {dish.status !== 'cancelled' && dish.status !== 'served' ? (
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    dish.status === 'ready' ? styles.statusBtnReady : styles.statusBtnCooking
                  ]}
                  onPress={() => handleBumpItem(item.id, dish.id, dish.status)}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      dish.status === 'ready' ? styles.statusBtnReadyText : styles.statusBtnCookingText
                    ]}
                  >
                    {dish.status === 'cooking' ? 'Mark Ready' : 'Serve'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.dishCompletedText}>
                  {dish.status === 'cancelled' ? 'Voided' : 'Served'}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Card Footer Bump All Button */}
        <View style={styles.ticketFooter}>
          <TouchableOpacity
            style={styles.bumpAllBtn}
            onPress={() => handleBumpAll(item.id)}
          >
            <Icon name="check" size={14} color="#FFFFFF" />
            <Text style={styles.bumpAllText}>Bump Entire Ticket Ready</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kitchen Display System</Text>
          <Text style={styles.subtitle}>Real-time line orders & station bump bar</Text>
        </View>

        <View style={styles.activePill}>
          <Text style={styles.activePillText}>{filteredKots.length} Active Tickets</Text>
        </View>
      </View>

      {/* Station Selector Bar */}
      <View style={styles.stationScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationScroll}>
          {stations.map(st => (
            <TouchableOpacity
              key={st.id}
              style={[styles.stationPill, selectedStation === st.id && styles.stationPillActive]}
              onPress={() => setSelectedStation(st.id)}
            >
              <Text style={[styles.stationPillText, selectedStation === st.id && styles.stationPillTextActive]}>
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* KOT Cards List */}
      <FlatList
        data={filteredKots}
        keyExtractor={item => item.id}
        renderItem={renderKotCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="chefHat" size={36} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>Kitchen Line Clear</Text>
            <Text style={styles.emptySubtitle}>All dispatched orders have been cooked and served.</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.navy
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.warningBg
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.warningText
  },
  stationScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8
  },
  stationScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  stationPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  stationPillActive: {
    backgroundColor: theme.colors.navy
  },
  stationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  stationPillTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 24
  },
  kotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: 12,
    ...theme.shadows.card
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
    marginBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  kotNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  tableBadge: {
    backgroundColor: theme.colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.xs
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary
  },
  sectionText: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  stationBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.radii.xs
  },
  stationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.body
  },
  itemsList: {
    gap: 8
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background
  },
  dishNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dishQuantity: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  statusReadyText: {
    color: theme.colors.successText
  },
  dishName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  dishCancelled: {
    textDecorationLine: 'line-through',
    color: theme.colors.muted
  },
  notesTag: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2
  },
  notesTagText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600'
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.xs
  },
  statusBtnCooking: {
    backgroundColor: theme.colors.warningBg,
    borderWidth: 1,
    borderColor: theme.colors.warning
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusBtnCookingText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.warningText
  },
  statusBtnReady: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success
  },
  statusBtnReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.successText
  },
  dishCompletedText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted
  },
  ticketFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8
  },
  bumpAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.navy,
    paddingVertical: 8,
    borderRadius: theme.radii.sm
  },
  bumpAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 10
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 24
  }
});
