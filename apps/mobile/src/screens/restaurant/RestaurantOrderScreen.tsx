import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantMenuItem, RestaurantTable } from '@infinityhub/types';
import { RestaurantSettlementModal } from '../../components/restaurant/RestaurantSettlementModal';
import { RestaurantManagerPinModal } from '../../components/restaurant/RestaurantManagerPinModal';

export const RestaurantOrderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    tables,
    menuItems,
    selectedTableId,
    selectedTable,
    setSelectedTableId,
    currentDraftItems,
    addToDraftOrder,
    updateDraftItemQuantity,
    updateDraftItemNotes,
    removeDraftItem,
    clearDraftOrder,
    fireKot,
    voidKotItem,
    activeOrder
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState<boolean>(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState<boolean>(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState<boolean>(false);
  const [voidTarget, setVoidTarget] = useState<{ kotId: string; itemId: string; name: string } | null>(null);
  const [isFiring, setIsFiring] = useState<boolean>(false);

  // Active occupied tables for table switcher
  const activeTables = useMemo(() => {
    return tables.filter(t => t.status !== 'vacant');
  }, [tables]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(m => m.categoryName || 'General'));
    return ['all', ...Array.from(cats)];
  }, [menuItems]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategory === 'all' || (item.categoryName || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Draft totals
  const draftItemCount = currentDraftItems.reduce((acc, i) => acc + i.quantity, 0);
  const draftSubtotal = currentDraftItems.reduce((acc, i) => acc + i.menuItem.price * i.quantity, 0);

  // Handle Fire KOT
  const handleFireKot = async () => {
    if (!selectedTable) {
      Alert.alert('No Table Selected', 'Please select a dining table before firing KOT.');
      return;
    }
    if (currentDraftItems.length === 0) {
      Alert.alert('Empty Order Pad', 'Please add items to order pad first.');
      return;
    }

    setIsFiring(true);
    try {
      const kot = await fireKot(selectedTable.id);
      setIsOrderDrawerOpen(false);
      Alert.alert('KOT Dispatched', `${kot.kotNumber} sent to kitchen line display.`);
    } catch (err: any) {
      Alert.alert('KOT Error', err.message || 'Failed to dispatch KOT.');
    } finally {
      setIsFiring(false);
    }
  };

  // Handle Void Item Authorization
  const handleAuthorizedVoid = async (pin: string, reason: string, managerName: string) => {
    if (!voidTarget) return;
    await voidKotItem(voidTarget.kotId, voidTarget.itemId, reason, pin, managerName);
    Alert.alert('Item Voided', `${voidTarget.name} has been cancelled and logged in waste register.`);
    setVoidTarget(null);
  };

  const renderDishItem = ({ item }: { item: RestaurantMenuItem }) => {
    const draftItem = currentDraftItems.find(i => i.menuItem.id === item.id);
    const inDraftQty = draftItem?.quantity || 0;
    const isOutOfStock = !item.isAvailable;

    return (
      <View style={[styles.dishCard, isOutOfStock && styles.dishCardDisabled]}>
        <View style={styles.dishHeader}>
          {/* Dietary Indicator */}
          <View
            style={[
              styles.dietaryDot,
              {
                borderColor:
                  item.dietary === 'veg'
                    ? theme.colors.successText
                    : item.dietary === 'non_veg'
                    ? theme.colors.dangerText
                    : theme.colors.warningText
              }
            ]}
          >
            <View
              style={[
                styles.dietaryInner,
                {
                  backgroundColor:
                    item.dietary === 'veg'
                      ? theme.colors.successText
                      : item.dietary === 'non_veg'
                      ? theme.colors.dangerText
                      : theme.colors.warningText
                }
              ]}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={styles.dishTitleRow}>
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.dishPrice}>₹{item.price}</Text>
            </View>

            <View style={styles.dishMetaRow}>
              <Text style={styles.dishCode}>{item.code}</Text>
              <Text style={styles.dishMetaDot}>·</Text>
              <Text style={styles.dishStation}>{item.station.toUpperCase()}</Text>
              <Text style={styles.dishMetaDot}>·</Text>
              <Text style={styles.dishTime}>{item.prepTimeMinutes} mins</Text>
            </View>

            {item.description ? (
              <Text style={styles.dishDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Stepper or Add Button */}
        <View style={styles.dishActions}>
          {isOutOfStock ? (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>86-ed Out of Stock</Text>
            </View>
          ) : inDraftQty > 0 ? (
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateDraftItemQuantity(item.id, inDraftQty - 1)}
              >
                <Icon name="minus" size={14} color={theme.colors.navy} />
              </TouchableOpacity>

              <Text style={styles.stepperCount}>{inDraftQty}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateDraftItemQuantity(item.id, inDraftQty + 1)}
              >
                <Icon name="plus" size={14} color={theme.colors.navy} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addToDraftOrder(item, 1)}
            >
              <Icon name="plus" size={12} color="#FFFFFF" />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cooking Notes for items in draft */}
        {inDraftQty > 0 ? (
          <View style={styles.notesWrap}>
            <TextInput
              style={styles.notesInput}
              value={draftItem?.notes || ''}
              onChangeText={text => updateDraftItemNotes(item.id, text)}
              placeholder="Cooking note: e.g. less spicy, no onion"
              placeholderTextColor={theme.colors.muted}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Active Table Context Banner */}
      <View style={styles.tableContextBar}>
        {selectedTable ? (
          <View style={styles.contextInfo}>
            <View style={styles.contextRow}>
              <Text style={styles.contextTable}>Table {selectedTable.tableNumber}</Text>
              <View style={styles.contextStatusPill}>
                <Text style={styles.contextStatusText}>{selectedTable.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.contextSub}>
              {selectedTable.guestCount || selectedTable.capacity} Guests · Captain: {selectedTable.captainName || 'Rajesh'}
            </Text>
          </View>
        ) : (
          <View style={styles.contextInfo}>
            <Text style={styles.contextTable}>No Table Selected</Text>
            <Text style={styles.contextSub}>Select an occupied dining table to take order</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.switchTableBtn}
          onPress={() => setIsTablePickerOpen(true)}
        >
          <Text style={styles.switchTableText}>Switch Table</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarWrap}>
        <Icon name="search" size={16} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search dish or code (e.g. Biryani, PBM-01)..."
          placeholderTextColor={theme.colors.muted}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Horizontal Bar */}
      <View style={styles.categoriesWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                {cat === 'all' ? 'All Dishes' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dishes Catalog List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={item => item.id}
        renderItem={renderDishItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="utensils" size={32} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>No Dishes Found</Text>
            <Text style={styles.emptySubtitle}>No menu items match your search or filter.</Text>
          </View>
        }
      />

      {/* Floating Bottom Order Summary Bar */}
      {selectedTable && (draftItemCount > 0 || (activeOrder && activeOrder.kots.length > 0)) ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.drawerTrigger}
            onPress={() => setIsOrderDrawerOpen(true)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.drawerTitle}>
                {draftItemCount > 0
                  ? `${draftItemCount} New Draft Items (₹${draftSubtotal})`
                  : `Table Total: ₹${activeOrder?.grandTotal || 0}`}
              </Text>
              <Text style={styles.drawerSub}>Tap to review KOTs and cooking instructions</Text>
            </View>
            <Icon name="chevronDown" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.bottomActionsRow}>
            {draftItemCount > 0 ? (
              <Button
                label={isFiring ? 'Dispatching...' : 'Fire KOT to Kitchen'}
                variant="primary"
                onPress={handleFireKot}
                disabled={isFiring}
                style={{ flex: 1.6 }}
              />
            ) : null}

            <Button
              label="Settle Bill"
              variant="outline"
              onPress={() => setIsSettlementOpen(true)}
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            />
          </View>
        </View>
      ) : null}

      {/* Order Review Modal / Drawer */}
      <Modal
        visible={isOrderDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOrderDrawerOpen(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsOrderDrawerOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxHeight: '85%' }}>
            <View style={styles.drawerSheet}>
              <View style={styles.drawerHeader}>
                <View>
                  <Text style={styles.drawerHeading}>Order Review · Table {selectedTable?.tableNumber}</Text>
                  <Text style={styles.drawerSubtext}>Review new draft items and fired KOT tickets</Text>
                </View>
                <TouchableOpacity onPress={() => setIsOrderDrawerOpen(false)} style={styles.closeBtn}>
                  <Icon name="close" size={16} color={theme.colors.body} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: theme.spacing.lg }}>
                {/* Draft Items */}
                <Text style={styles.sheetSectionTitle}>New Items (Not Yet Fired)</Text>
                {currentDraftItems.length === 0 ? (
                  <Text style={styles.noItemsText}>No new draft items in order pad.</Text>
                ) : (
                  currentDraftItems.map(draft => (
                    <View key={draft.menuItem.id} style={styles.drawerItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.drawerItemName}>{draft.menuItem.name}</Text>
                        <Text style={styles.drawerItemPrice}>₹{draft.menuItem.price} each</Text>
                        {draft.notes ? (
                          <Text style={styles.drawerItemNote}>Note: {draft.notes}</Text>
                        ) : null}
                      </View>

                      <View style={styles.stepperWrapSmall}>
                        <TouchableOpacity
                          style={styles.stepperBtnSmall}
                          onPress={() => updateDraftItemQuantity(draft.menuItem.id, draft.quantity - 1)}
                        >
                          <Icon name="minus" size={12} color={theme.colors.navy} />
                        </TouchableOpacity>
                        <Text style={styles.stepperCountSmall}>{draft.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtnSmall}
                          onPress={() => updateDraftItemQuantity(draft.menuItem.id, draft.quantity + 1)}
                        >
                          <Icon name="plus" size={12} color={theme.colors.navy} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* Already Fired KOTs */}
                {activeOrder && activeOrder.kots.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.sheetSectionTitle}>Fired KOTs on Table</Text>
                    {activeOrder.kots.map(kot => (
                      <View key={kot.id} style={styles.kotCard}>
                        <View style={styles.kotCardHeader}>
                          <Text style={styles.kotCardNumber}>{kot.kotNumber}</Text>
                          <Text style={styles.kotCardStation}>{kot.station.toUpperCase()}</Text>
                          <View style={styles.kotCardStatus}>
                            <Text style={styles.kotCardStatusText}>{kot.status.toUpperCase()}</Text>
                          </View>
                        </View>

                        {kot.items.map(item => (
                          <View key={item.id} style={styles.kotItemRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.kotItemName, item.status === 'cancelled' && styles.itemCancelled]}>
                                {item.name} x{item.quantity} (₹{item.unitPrice * item.quantity})
                              </Text>
                              {item.status === 'cancelled' ? (
                                <Text style={styles.cancelText}>Voided: {item.cancelledReason}</Text>
                              ) : null}
                            </View>

                            {item.status !== 'cancelled' ? (
                              <TouchableOpacity
                                style={styles.voidBtn}
                                onPress={() => {
                                  setVoidTarget({ kotId: kot.id, itemId: item.id, name: item.name });
                                }}
                              >
                                <Text style={styles.voidBtnText}>Void</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>

              {/* Drawer Footer Actions */}
              <View style={styles.drawerFooter}>
                {draftItemCount > 0 ? (
                  <Button
                    label={isFiring ? 'Dispatching...' : 'Fire KOT to Kitchen'}
                    variant="primary"
                    onPress={handleFireKot}
                    disabled={isFiring}
                    style={{ flex: 1 }}
                  />
                ) : null}
                <Button
                  label="Close"
                  variant="outline"
                  onPress={() => setIsOrderDrawerOpen(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Table Picker Modal */}
      <Modal
        visible={isTablePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTablePickerOpen(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsTablePickerOpen(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Active Table</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {activeTables.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.pickerItem, selectedTableId === t.id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedTableId(t.id);
                    setIsTablePickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerTableNumber}>Table {t.tableNumber}</Text>
                    <Text style={styles.pickerTableMeta}>{t.guestCount || t.capacity} Guests · Captain {t.captainName || 'Rajesh'}</Text>
                  </View>
                  <Text style={styles.pickerStatus}>{t.status.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settle Bill Modal */}
      <RestaurantSettlementModal
        visible={isSettlementOpen}
        table={selectedTable}
        onClose={() => setIsSettlementOpen(false)}
        onSettled={invoice => {
          setIsSettlementOpen(false);
          navigation.navigate('RestaurantReceipt', { invoice });
        }}
      />

      {/* Manager PIN Void Modal */}
      <RestaurantManagerPinModal
        visible={!!voidTarget}
        actionTitle={`Void Item: ${voidTarget?.name || ''}`}
        actionDescription="Enter 4-digit Manager PIN to void dish and register in kitchen waste register."
        onClose={() => setVoidTarget(null)}
        onAuthorized={handleAuthorizedVoid}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tableContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  contextInfo: {
    flex: 1
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  contextTable: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  contextStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.primaryTint
  },
  contextStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary
  },
  contextSub: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  switchTableBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  switchTableText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.lg,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.navy,
    padding: 0
  },
  categoriesWrap: {
    backgroundColor: theme.colors.background,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  categoryPillActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  categoryPillTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 110
  },
  dishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: 10,
    ...theme.shadows.card
  },
  dishCardDisabled: {
    opacity: 0.6
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  dietaryDot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  dietaryInner: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  dishTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy,
    flex: 1,
    marginRight: 8
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  dishCode: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.muted
  },
  dishMetaDot: {
    fontSize: 10,
    color: theme.colors.muted,
    marginHorizontal: 4
  },
  dishStation: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.body
  },
  dishTime: {
    fontSize: 10,
    color: theme.colors.muted
  },
  dishDesc: {
    fontSize: 11,
    color: theme.colors.body,
    marginTop: 3
  },
  dishActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radii.sm
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  stepperCount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    paddingHorizontal: 8
  },
  stockBadge: {
    backgroundColor: theme.colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.xs
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.dangerText
  },
  notesWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 6
  },
  notesInput: {
    fontSize: 11,
    color: theme.colors.navy,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopLeftRadius: theme.radii.card,
    borderTopRightRadius: theme.radii.card
  },
  drawerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  drawerSub: {
    fontSize: 10,
    color: theme.colors.muted
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  drawerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    paddingTop: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    maxHeight: '85%'
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12
  },
  drawerHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  drawerSubtext: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  noItemsText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontStyle: 'italic',
    marginBottom: 8
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  drawerItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.navy
  },
  drawerItemPrice: {
    fontSize: 11,
    color: theme.colors.muted
  },
  drawerItemNote: {
    fontSize: 10,
    color: theme.colors.primary,
    fontStyle: 'italic'
  },
  stepperWrapSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xs
  },
  stepperBtnSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  stepperCountSmall: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4
  },
  kotCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    padding: 8,
    marginBottom: 8
  },
  kotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
    marginBottom: 4
  },
  kotCardNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy
  },
  kotCardStation: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.muted
  },
  kotCardStatus: {
    backgroundColor: theme.colors.warningBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2
  },
  kotCardStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.warningText
  },
  kotItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  kotItemName: {
    fontSize: 12,
    color: theme.colors.navy
  },
  itemCancelled: {
    textDecorationLine: 'line-through',
    color: theme.colors.muted
  },
  cancelText: {
    fontSize: 9,
    color: theme.colors.danger,
    fontStyle: 'italic'
  },
  voidBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: theme.colors.dangerBg
  },
  voidBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.dangerText
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    marginTop: 14
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    padding: theme.spacing.lg,
    paddingBottom: 32
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: 12
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  pickerItemActive: {
    backgroundColor: theme.colors.primaryTint
  },
  pickerTableNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy
  },
  pickerTableMeta: {
    fontSize: 11,
    color: theme.colors.muted
  },
  pickerStatus: {
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
    marginTop: 2
  }
});
