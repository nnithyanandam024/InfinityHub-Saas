import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Image, TextInput, ScrollView, Platform } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTenant } from '../../context/TenantContext';
const QUICK_ADD_DELTAS = [+1, +5, +10, +25, -1, -5];
const MOVEMENT_REASONS = [
    { id: 'RESTOCK', label: 'Restock Shipment' },
    { id: 'SALE', label: 'Counter Sale' },
    { id: 'AUDIT', label: 'Audit Correction' },
    { id: 'DAMAGED', label: 'Damaged / Write-off' }
];
export const QuickStockBottomSheet = ({ visible, product, onClose, onSuccess }) => {
    const { updateProductStock, formatPrice } = useTenant();
    const [quantity, setQuantity] = useState(0);
    const [selectedReason, setSelectedReason] = useState('RESTOCK');
    const [note, setNote] = useState('');
    useEffect(() => {
        if (product) {
            setQuantity(product.stockQuantity);
            setSelectedReason('RESTOCK');
            setNote('');
        }
    }, [product, visible]);
    if (!product)
        return null;
    const currentStock = product.stockQuantity;
    const delta = quantity - currentStock;
    const imgUri = product.thumbnailPath || product.imagePath;
    const handleApplyDelta = (d) => {
        setQuantity(prev => Math.max(0, prev + d));
    };
    const handleSave = () => {
        const reasonLabel = MOVEMENT_REASONS.find(r => r.id === selectedReason)?.label || 'Quick adjustment';
        const finalReason = note ? `${reasonLabel}: ${note}` : reasonLabel;
        updateProductStock(product.id, quantity, finalReason);
        onSuccess?.();
        onClose();
    };
    return (<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handle}/>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Product Glance Header */}
                <View style={styles.productHeader}>
                  <View style={styles.thumbWrap}>
                    {imgUri ? (<Image source={{ uri: imgUri }} style={styles.thumb} resizeMode="cover"/>) : (<View style={styles.fallbackThumb}>
                        <Text style={styles.fallbackThumbText}>
                          {product.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>)}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productSku}>
                      SKU: {product.sku} · {formatPrice(product.sellingPrice)}
                    </Text>
                    <View style={styles.stockBadgeRow}>
                      <Badge label={`Current: ${currentStock} ${product.unit}`} variant={currentStock <= 0 ? 'danger' : currentStock <= product.minimumStock ? 'warning' : 'success'} size="sm"/>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="close" size={16} color={theme.colors.muted}/>
                  </TouchableOpacity>
                </View>

                {/* Big Interactive Stepper */}
                <View style={styles.stepperContainer}>
                  <Text style={styles.sectionHeading}>Update On-Hand Stock</Text>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity style={[styles.stepperBtn, quantity <= 0 && styles.stepperBtnDisabled]} onPress={() => setQuantity(prev => Math.max(0, prev - 1))} disabled={quantity <= 0} activeOpacity={0.7}>
                      <Icon name="minus" size={20} color={quantity <= 0 ? theme.colors.muted : theme.colors.navy}/>
                    </TouchableOpacity>

                    <View style={styles.stepperValueWrap}>
                      <TextInput style={styles.stepperInput} value={String(quantity)} onChangeText={t => {
            const val = parseInt(t.replace(/[^0-9]/g, ''), 10);
            setQuantity(isNaN(val) ? 0 : val);
        }} keyboardType="number-pad" selectTextOnFocus/>
                      <Text style={styles.unitText}>{product.unit}</Text>
                    </View>

                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setQuantity(prev => prev + 1)} activeOpacity={0.7}>
                      <Icon name="plus" size={20} color={theme.colors.navy}/>
                    </TouchableOpacity>
                  </View>

                  {/* Stock Delta Indicator Pill */}
                  {delta !== 0 && (<View style={[styles.deltaPill, delta > 0 ? styles.deltaPillPositive : styles.deltaPillNegative]}>
                      <Text style={[styles.deltaText, delta > 0 ? styles.deltaTextPositive : styles.deltaTextNegative]}>
                        {delta > 0 ? `+${delta}` : delta} {product.unit} from current count
                      </Text>
                    </View>)}
                </View>

                {/* Quick Addition Chips */}
                <View style={styles.quickChipsRow}>
                  {QUICK_ADD_DELTAS.map(d => (<TouchableOpacity key={d} style={styles.chipBtn} onPress={() => handleApplyDelta(d)} activeOpacity={0.75}>
                      <Text style={styles.chipText}>
                        {d > 0 ? `+${d}` : d}
                      </Text>
                    </TouchableOpacity>))}
                </View>

                {/* Reason Selection Chips */}
                <Text style={styles.sectionHeading}>Reason for Adjustment</Text>
                <View style={styles.reasonWrap}>
                  {MOVEMENT_REASONS.map(r => {
            const isSelected = selectedReason === r.id;
            return (<TouchableOpacity key={r.id} style={[styles.reasonChip, isSelected && styles.reasonChipActive]} onPress={() => setSelectedReason(r.id)} activeOpacity={0.8}>
                        <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>);
        })}
                </View>

                {/* Optional Note */}
                <View style={styles.noteContainer}>
                  <TextInput style={styles.noteInput} placeholder="Optional note / reference number..." placeholderTextColor={theme.colors.muted} value={note} onChangeText={setNote}/>
                </View>

                {/* Primary Action Button */}
                <View style={styles.actions}>
                  <Button label={`Confirm (${quantity} ${product.unit})`} onPress={handleSave} variant="primary" icon="check"/>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>);
};
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end'
    },
    sheetContainer: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: theme.radii.sheet,
        borderTopRightRadius: theme.radii.sheet,
        maxHeight: '85%',
        ...theme.shadows.sheet
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 10
    },
    handle: {
        width: 38,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    thumbWrap: {
        width: 48,
        height: 48,
        borderRadius: theme.radii.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceSubtle
    },
    thumb: {
        width: '100%',
        height: '100%'
    },
    fallbackThumb: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    fallbackThumbText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.navy
    },
    productInfo: {
        flex: 1,
        marginLeft: 12
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.navy
    },
    productSku: {
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 2
    },
    stockBadgeRow: {
        marginTop: 4
    },
    closeBtn: {
        padding: 6,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.surfaceSubtle
    },
    sectionHeading: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 8
    },
    stepperContainer: {
        alignItems: 'center',
        marginTop: 4
    },
    stepperBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: theme.radii.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 6,
        width: '100%'
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: theme.radii.md,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.subtle
    },
    stepperBtnDisabled: {
        opacity: 0.4
    },
    stepperValueWrap: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center'
    },
    stepperInput: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.colors.navy,
        textAlign: 'center',
        minWidth: 70,
        padding: 0
    },
    unitText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.muted,
        marginLeft: 4
    },
    deltaPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: theme.radii.full,
        marginTop: 8
    },
    deltaPillPositive: {
        backgroundColor: '#ECFDF5'
    },
    deltaPillNegative: {
        backgroundColor: '#FEF2F2'
    },
    deltaText: {
        fontSize: 12,
        fontWeight: '700'
    },
    deltaTextPositive: {
        color: theme.colors.success
    },
    deltaTextNegative: {
        color: theme.colors.danger
    },
    quickChipsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 8
    },
    chipBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: theme.radii.sm,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy
    },
    reasonWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    reasonChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    reasonChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    reasonChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.body
    },
    reasonChipTextActive: {
        color: '#FFFFFF'
    },
    noteContainer: {
        marginTop: 14
    },
    noteInput: {
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: theme.colors.navy
    },
    actions: {
        marginTop: 20
    }
});
//# sourceMappingURL=QuickStockBottomSheet.js.map