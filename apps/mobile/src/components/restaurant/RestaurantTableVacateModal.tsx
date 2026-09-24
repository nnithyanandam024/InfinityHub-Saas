import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { RestaurantTable } from '@infinityhub/types';
import { useRestaurant } from '../../context/RestaurantContext';

interface RestaurantTableVacateModalProps {
  visible: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onVacated?: (table: RestaurantTable) => void;
}

export const RestaurantTableVacateModal: React.FC<RestaurantTableVacateModalProps> = ({
  visible,
  table,
  onClose,
  onVacated
}) => {
  const { resetTableToVacant, sections } = useRestaurant();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!table) return null;

  const sectionName = sections.find(s => s.id === table.sectionId)?.name || 'Dining Floor';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const updated = await resetTableToVacant(table.id);
      if (onVacated) {
        onVacated(updated);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark table as vacant');
    } finally {
      setIsSubmitting(false);
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
          {/* Top Sheet Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="table" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Mark Table Vacant</Text>
                <Text style={styles.subtitle}>Table {table.tableNumber} · {sectionName}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={16} color={theme.colors.body} />
            </TouchableOpacity>
          </View>

          {/* Table Details Meta Card */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardRow}>
              <View style={styles.metaCol}>
                <Text style={styles.tableCardLabel}>TABLE</Text>
                <Text style={styles.tableCardValue}>{table.tableNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaCol}>
                <Text style={styles.tableCardLabel}>CAPACITY</Text>
                <Text style={styles.tableCardValue}>{table.capacity} Seats</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaCol}>
                <Text style={styles.tableCardLabel}>STATUS</Text>
                <Badge
                  label={table.status.toUpperCase()}
                  variant={table.status === 'cleaning' ? 'warning' : 'info'}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Explanation Banner */}
          <View style={styles.messageBox}>
            <View style={styles.messageIconWrap}>
              <Icon name="check" size={16} color={theme.colors.successText} />
            </View>
            <Text style={styles.messageText}>
              Reset Table {table.tableNumber} to Vacant status. Table cleaning is finished and ready for incoming dining guests.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              label={isSubmitting ? 'Updating...' : 'Mark as Vacant'}
              variant="primary"
              icon="check"
              onPress={handleConfirm}
              disabled={isSubmitting}
              style={styles.confirmBtn}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    width: '100%'
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 14
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center'
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
  tableCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  tableCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  metaCol: {
    alignItems: 'center'
  },
  tableCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  tableCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.successBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.success + '30'
  },
  messageIconWrap: {
    marginTop: 1
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.successText,
    lineHeight: 18,
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    gap: 12
  },
  cancelBtn: {
    flex: 1
  },
  confirmBtn: {
    flex: 1.5
  }
});
