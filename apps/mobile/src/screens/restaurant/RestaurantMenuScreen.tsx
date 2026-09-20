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
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantMenuItem } from '@infinityhub/types';

export const RestaurantMenuScreen: React.FC<{ navigation: any }> = () => {
  const { menuItems, toggleMenuItemAvailability } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(m => m.categoryName || 'General'));
    return ['all', ...Array.from(cats)];
  }, [menuItems]);

  const stats = useMemo(() => {
    const total = menuItems.length;
    const inStock = menuItems.filter(m => m.isAvailable).length;
    const outOfStock = total - inStock;
    return { total, inStock, outOfStock };
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategory === 'all' || (item.categoryName || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleToggle = async (item: RestaurantMenuItem) => {
    await toggleMenuItemAvailability(item.id);
  };

  const renderItem = ({ item }: { item: RestaurantMenuItem }) => {
    return (
      <View style={[styles.dishRow, !item.isAvailable && styles.dishRowOutOfStock]}>
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            {/* Dietary Dot */}
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

            <Text style={styles.dishName}>{item.name}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.dishCode}>{item.code}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.dishStation}>{item.station.toUpperCase()}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.dishPrice}>₹{item.price}</Text>
          </View>
        </View>

        {/* In-Stock Toggle */}
        <View style={styles.toggleCol}>
          <Text style={[styles.toggleLabel, item.isAvailable ? styles.inStockText : styles.outOfStockText]}>
            {item.isAvailable ? 'In Stock' : '86-ed'}
          </Text>
          <TouchableOpacity
            style={[styles.switchTrack, item.isAvailable ? styles.switchTrackActive : styles.switchTrackInactive]}
            onPress={() => handleToggle(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.switchThumb, item.isAvailable ? styles.switchThumbActive : styles.switchThumbInactive]} />
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
        <Text style={styles.title}>Menu & Kitchen 86 Control</Text>
        <Text style={styles.subtitle}>Toggle dish availability in real-time on Captain Pad</Text>
      </View>

      {/* KPI Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Dishes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.successText }]}>{stats.inStock}</Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.dangerText }]}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>86-ed Out</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search dishes by name or item code..."
          placeholderTextColor={theme.colors.muted}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
                {cat === 'all' ? 'All' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dishes List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.navy
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: 2
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.lg,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  categoryScrollWrap: {
    paddingBottom: 8
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  catPillActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  catPillTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 24
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: 8
  },
  dishRowOutOfStock: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border
  },
  infoCol: {
    flex: 1,
    marginRight: 12
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dietaryDot: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dietaryInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.navy,
    flex: 1
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  dishCode: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted
  },
  metaDot: {
    fontSize: 11,
    color: theme.colors.muted,
    marginHorizontal: 4
  },
  dishStation: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.body
  },
  dishPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.navy
  },
  toggleCol: {
    alignItems: 'center'
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2
  },
  inStockText: {
    color: theme.colors.successText
  },
  outOfStockText: {
    color: theme.colors.dangerText
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center'
  },
  switchTrackActive: {
    backgroundColor: theme.colors.primary,
    alignItems: 'flex-end'
  },
  switchTrackInactive: {
    backgroundColor: theme.colors.border,
    alignItems: 'flex-start'
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2
  },
  switchThumbActive: {},
  switchThumbInactive: {}
});
