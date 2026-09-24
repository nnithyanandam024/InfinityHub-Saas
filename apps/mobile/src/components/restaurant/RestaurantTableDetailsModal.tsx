import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { RestaurantTable, TableStatus } from '@infinityhub/types';
import { useRestaurant } from '../../context/RestaurantContext';

interface RestaurantTableDetailsModalProps {
  visible: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onOrder: (table: RestaurantTable) => void;
  onSettle: (table: RestaurantTable) => void;
  onVacate?: (table: RestaurantTable) => void;
}

export const RestaurantTableDetailsModal: React.FC<RestaurantTableDetailsModalProps> = ({
  visible,
  table,
  onClose,
  onOrder,
  onSettle,
  onVacate
}) => {
  const { sections, orders, kots } = useRestaurant();

  const sectionName = useMemo(() => {
    if (!table) return 'Dining Area';
    return sections.find(s => s.id === table.sectionId)?.name || 'Dining Area';
  }, [sections, table]);

  // Find active order or all KOTs for this table
  const tableOrder = useMemo(() => {
    if (!table) return null;
    return orders.find(o => (table.activeOrderId && o.id === table.activeOrderId) || (o.tableId === table.id && o.orderStatus !== 'settled')) || null;
  }, [orders, table]);

  const tableKots = useMemo(() => {
    if (!table) return [];
    if (tableOrder && tableOrder.kots && tableOrder.kots.length > 0) {
      return tableOrder.kots;
    }
    return kots.filter(k => k.tableId === table.id || (table.activeKotIds && table.activeKotIds.includes(k.id)));
  }, [table, tableOrder, kots]);

  // Aggregate itemized dishes
  const orderedDishes = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      station: string;
      status: string;
      specialNotes?: string;
      kotNumber: string;
    }> = [];

    for (const kot of tableKots) {
      for (const itm of kot.items) {
        items.push({
          id: `${kot.id}-${itm.id}`,
          name: itm.name,
          quantity: itm.quantity,
          unitPrice: itm.unitPrice,
          total: itm.unitPrice * itm.quantity,
          station: itm.station,
          status: itm.status,
          specialNotes: itm.specialNotes,
          kotNumber: kot.kotNumber
        });
      }
    }
    return items;
  }, [tableKots]);

  // Bill totals
  const subtotal = useMemo(() => {
    if (orderedDishes.length > 0) {
      return orderedDishes.reduce((sum, d) => d.status !== 'cancelled' ? sum + d.total : sum, 0);
    }
    return table?.currentBillTotal || 0;
  }, [orderedDishes, table]);

  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const grandTotal = Math.round(subtotal + cgst + sgst);

  if (!table) return null;

  const getStatusBadgeVariant = (status: TableStatus): 'success' | 'warning' | 'danger' | 'primary' | 'muted' | 'outline' | 'info' => {
    switch (status) {
      case 'seated':
        return 'primary';
      case 'ordered':
        return 'warning';
      case 'served':
        return 'info';
      case 'billed':
        return 'danger';
      case 'vacant':
        return 'success';
      default:
        return 'muted';
    }
  };

  const getItemStatusStyle = (status: string) => {
    switch (status) {
      case 'served':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Served' };
      case 'ready':
        return { bg: '#E0E7FF', text: '#3730A3', label: 'Ready' };
      case 'cooking':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Cooking' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Voided' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'Pending' };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* Top Indicator Handle */}
          <View style={styles.handle} />

          {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Table {table.tableNumber}</Text>
                  <Badge
                    label={table.status.toUpperCase()}
                    variant={getStatusBadgeVariant(table.status)}
                    size="sm"
                  />
                </View>
                <Text style={styles.subtitle}>{sectionName}</Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={18} color={theme.colors.body} />
              </TouchableOpacity>
            </View>

            {/* Quick Meta Row */}
            <View style={styles.metaCard}>
              <View style={styles.metaItem}>
                <Icon name="user" size={13} color={theme.colors.muted} />
                <Text style={styles.metaLabel}>Guests:</Text>
                <Text style={styles.metaValue}>{table.guestCount || table.capacity} People</Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Icon name="shield" size={13} color={theme.colors.muted} />
                <Text style={styles.metaLabel}>Captain:</Text>
                <Text style={styles.metaValue}>{table.captainName || 'Staff'}</Text>
              </View>

              {tableKots.length > 0 ? (
                <>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Icon name="receipt" size={13} color={theme.colors.muted} />
                    <Text style={styles.metaLabel}>KOTs:</Text>
                    <Text style={styles.metaValue}>{tableKots.length} Fired</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Ordered Dishes List */}
            <View style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.sectionHeading}>Items Ordered on Table</Text>
                <Text style={styles.itemCountTag}>{orderedDishes.length} Items</Text>
              </View>

              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {orderedDishes.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Icon name="dish" size={32} color={theme.colors.muted} />
                    <Text style={styles.emptyTitle}>No Dishes Ordered Yet</Text>
                    <Text style={styles.emptySub}>
                      This table is currently seated. Tap "Order / Add Items" below to take the guest order.
                    </Text>
                  </View>
                ) : (
                  orderedDishes.map(d => {
                    const statusMeta = getItemStatusStyle(d.status);
                    return (
                      <View key={d.id} style={styles.dishRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={styles.dishNameRow}>
                            <Text style={[styles.dishName, d.status === 'cancelled' && styles.dishCancelled]}>
                              {d.name}
                            </Text>
                            <View style={[styles.statusTag, { backgroundColor: statusMeta.bg }]}>
                              <Text style={[styles.statusTagText, { color: statusMeta.text }]}>
                                {statusMeta.label}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.dishSubRow}>
                            <Text style={styles.dishQtyPrice}>
                              {d.quantity} x ₹{d.unitPrice}
                            </Text>
                            <Text style={styles.dishMetaDot}>·</Text>
                            <Text style={styles.dishKotBadge}>{d.kotNumber}</Text>
                            <Text style={styles.dishMetaDot}>·</Text>
                            <Text style={styles.dishStationText}>{d.station.toUpperCase()}</Text>
                          </View>

                          {d.specialNotes ? (
                            <Text style={styles.notesText}>Note: {d.specialNotes}</Text>
                          ) : null}
                        </View>

                        <Text style={[styles.dishTotal, d.status === 'cancelled' && styles.dishCancelled]}>
                          {d.status === 'cancelled' ? 'Void' : `₹${d.total}`}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {/* Bill Summary */}
            {subtotal > 0 ? (
              <View style={styles.billCard}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Food Subtotal</Text>
                  <Text style={styles.billVal}>₹{subtotal}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>GST (CGST 2.5% + SGST 2.5%)</Text>
                  <Text style={styles.billVal}>₹{(cgst + sgst).toFixed(2)}</Text>
                </View>
                <View style={[styles.billRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Current Bill Total</Text>
                  <Text style={styles.grandTotalVal}>₹{grandTotal}</Text>
                </View>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.footerActions}>
              <Button
                label="Add Items / Order"
                variant="primary"
                icon="utensils"
                onPress={() => {
                  onClose();
                  onOrder(table);
                }}
                style={{ flex: 1.3, marginRight: 8 }}
              />

              {subtotal > 0 ? (
                <Button
                  label="Settle Bill"
                  variant="outline"
                  icon="receipt"
                  onPress={() => {
                    onClose();
                    onSettle(table);
                  }}
                  style={{ flex: 1, backgroundColor: '#FFFFFF', marginRight: 8 }}
                />
              ) : null}

              {table.status === 'cleaning' || table.status === 'billed' ? (
                <Button
                  label="Vacate"
                  variant="outline"
                  icon="table"
                  onPress={() => {
                    onClose();
                    if (onVacate) onVacate(table);
                  }}
                  style={{ minWidth: 80, backgroundColor: '#FFFFFF', marginRight: 8 }}
                />
              ) : null}

              <Button
                label="Close"
                variant="ghost"
                onPress={onClose}
                style={{ minWidth: 60 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end'
  },
  backdropTouch: {
    flex: 1
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    width: '100%'
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.navy
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaLabel: {
    fontSize: 11,
    color: theme.colors.muted
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8
  },
  listContainer: {
    marginBottom: 10
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  itemCountTag: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted
  },
  scrollList: {
    maxHeight: 230
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle
  },
  dishNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  dishName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  },
  dishCancelled: {
    textDecorationLine: 'line-through',
    color: theme.colors.muted
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: theme.radii.xs
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  dishSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4
  },
  dishQtyPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  dishMetaDot: {
    fontSize: 11,
    color: theme.colors.muted
  },
  dishKotBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary
  },
  dishStationText: {
    fontSize: 10,
    color: theme.colors.muted
  },
  notesText: {
    fontSize: 11,
    color: theme.colors.warningText,
    fontStyle: 'italic',
    marginTop: 2
  },
  dishTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy,
    marginTop: 8
  },
  emptySub: {
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20
  },
  billCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  billLabel: {
    fontSize: 11,
    color: theme.colors.body
  },
  billVal: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.navy
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 4,
    paddingTop: 6
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy
  },
  grandTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});
