import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { RestaurantTable } from '@infinityhub/types';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';

interface RestaurantQuickSeatModalProps {
  visible: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onSeatSuccess: (seatedTable: RestaurantTable) => void;
}

export const RestaurantQuickSeatModal: React.FC<RestaurantQuickSeatModalProps> = ({
  visible,
  table,
  onClose,
  onSeatSuccess
}) => {
  const { seatTable } = useRestaurant();
  const { user } = useAuth();

  const [guestCount, setGuestCount] = useState<number>(2);
  const [captainName, setCaptainName] = useState<string>('Captain Rajesh');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (table) {
      setGuestCount(table.capacity || 2);
      setCaptainName(user?.name || table.assignedCaptain || 'Captain Rajesh');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [table, user]);

  if (!table) return null;

  const handleSeat = async () => {
    if (guestCount < 1) return;
    setIsSubmitting(true);
    try {
      const updated = await seatTable(table.id, guestCount, captainName);
      onSeatSuccess(updated);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Seat Table {table.tableNumber}</Text>
                  <View style={styles.capacityBadge}>
                    <Text style={styles.capacityText}>Max {table.capacity} Seats</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>Assign dining party and open order pad</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={16} color={theme.colors.body} />
              </TouchableOpacity>
            </View>

            {/* Guest Count Stepper */}
            <View style={styles.section}>
              <Text style={styles.label}>Number of Guests</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepBtn, guestCount <= 1 && styles.stepBtnDisabled]}
                  onPress={() => setGuestCount(prev => Math.max(1, prev - 1))}
                  disabled={guestCount <= 1}
                >
                  <Icon name="minus" size={18} color={guestCount <= 1 ? theme.colors.muted : theme.colors.navy} />
                </TouchableOpacity>

                <View style={styles.countDisplay}>
                  <Text style={styles.countNumber}>{guestCount}</Text>
                  <Text style={styles.countUnit}>{guestCount === 1 ? 'Guest' : 'Guests'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepBtn, guestCount >= 20 && styles.stepBtnDisabled]}
                  onPress={() => setGuestCount(prev => Math.min(20, prev + 1))}
                  disabled={guestCount >= 20}
                >
                  <Icon name="plus" size={18} color={guestCount >= 20 ? theme.colors.muted : theme.colors.navy} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Assigned Captain */}
            <View style={styles.section}>
              <Text style={styles.label}>Serving Captain</Text>
              <TextInput
                style={styles.input}
                value={captainName}
                onChangeText={setCaptainName}
                placeholder="Enter captain name"
                placeholderTextColor={theme.colors.muted}
              />
            </View>

            {/* Notes / Special Requests */}
            <View style={styles.section}>
              <Text style={styles.label}>Special Requests (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Baby chair required, anniversary dinner"
                placeholderTextColor={theme.colors.muted}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={isSubmitting ? 'Seating...' : 'Confirm & Open Order Pad'}
                variant="primary"
                onPress={handleSeat}
                disabled={isSubmitting}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    padding: theme.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : theme.spacing.xl
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.navy
  },
  capacityBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  subtitle: {
    fontSize: 12,
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
  section: {
    marginBottom: theme.spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body,
    marginBottom: 6
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnDisabled: {
    opacity: 0.4
  },
  countDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.navy
  },
  countUnit: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.navy,
    backgroundColor: '#FFFFFF'
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.lg
  }
});
