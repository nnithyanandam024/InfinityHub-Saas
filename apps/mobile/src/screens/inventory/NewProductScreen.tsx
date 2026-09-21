import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useTenant } from '../../context/TenantContext';

const PHOTO_PRESETS = [
  {
    name: 'Silicone Case',
    url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80'
  },
  {
    name: 'USB-C Cable',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
  },
  {
    name: 'Power Bank',
    url: 'https://images.unsplash.com/photo-1609592424367-e9a930ffc0fc?w=400&q=80'
  },
  {
    name: 'Wireless Buds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80'
  },
  {
    name: 'Screen Guard',
    url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&q=80'
  }
];

export const NewProductScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { categories, addProduct, currencySymbol } = useTenant();

  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [sellingPrice, setSellingPrice] = useState('299');
  const [costPrice, setCostPrice] = useState('150');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [minimumStock, setMinimumStock] = useState('5');
  const [unit, setUnit] = useState('pcs');
  const [selectedPhoto, setSelectedPhoto] = useState(PHOTO_PRESETS[0].url);

  const handleGenerateSku = () => {
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleGenerateBarcode = () => {
    setBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }

    const matchedCat = categories.find(c => c.id === categoryId);
    addProduct({
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      categoryId,
      categoryName: matchedCat?.name || 'General',
      sellingPrice: parseFloat(sellingPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      minimumStock: parseInt(minimumStock) || 5,
      unit: unit as any,
      imagePath: selectedPhoto,
      thumbnailPath: selectedPhoto
    });

    Alert.alert('Product Created', `${name} has been added to the catalog.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevronRight" size={16} color={theme.colors.navy} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Matte Silicone Protective Case"
            placeholderTextColor={theme.colors.muted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Photo Selection Gallery */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Product Visual</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {PHOTO_PRESETS.map((p, idx) => {
              const isSelected = selectedPhoto === p.url;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.photoCard, isSelected && styles.photoCardActive]}
                  onPress={() => setSelectedPhoto(p.url)}
                  activeOpacity={0.75}
                >
                  <Image source={{ uri: p.url }} style={styles.photoImg} resizeMode="cover" />
                  <Text style={[styles.photoLabel, isSelected && styles.photoLabelActive]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
                onPress={() => setCategoryId(c.id)}
              >
                <Text style={[styles.catChipText, categoryId === c.id && styles.catChipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SKU & Barcode Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>SKU</Text>
              <TouchableOpacity onPress={handleGenerateSku}>
                <Text style={styles.genText}>Auto</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Barcode</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Scanner', { onScan: (code: string) => setBarcode(code) })}>
                  <Text style={styles.genText}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGenerateBarcode}>
                  <Text style={styles.genText}>Auto</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>
        </View>

        {/* Pricing Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Selling Price ({currencySymbol})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cost Price ({currencySymbol})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={costPrice}
              onChangeText={setCostPrice}
            />
          </View>
        </View>

        {/* Stock & Buffer Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Opening Stock</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={stockQuantity}
              onChangeText={setStockQuantity}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Min Buffer</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={minimumStock}
              onChangeText={setMinimumStock}
            />
          </View>

          <View style={[styles.inputGroup, { width: 70 }]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        <Button
          label="Save Product to Catalog"
          onPress={handleSave}
          variant="primary"
          size="lg"
          style={{ marginTop: 12 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 130
  },
  inputGroup: {
    marginBottom: theme.spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy,
    marginBottom: 6
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  genText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: theme.colors.navy
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  photoRow: {
    gap: 10
  },
  photoCard: {
    width: 80,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF'
  },
  photoCardActive: {
    borderColor: theme.colors.primary
  },
  photoImg: {
    width: '100%',
    height: 60
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.body,
    padding: 4,
    textAlign: 'center'
  },
  photoLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  catChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body
  },
  catChipTextActive: {
    color: '#FFFFFF'
  }
});
