import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

interface TenantSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  visible,
  onClose
}) => {
  const { availableTenants, activeTenantId, switchTenant } = useTenant();
  const { updateUserTenant } = useAuth();

  const handleSelect = (tenantId: string, tenantName: string) => {
    switchTenant(tenantId);
    updateUserTenant(tenantId, tenantName);
    onClose();
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
            {/* Header */}
            <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Switch Business Workspace</Text>
                  <Text style={styles.subtitle}>Select store to manage catalog and stock</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={16} color={theme.colors.body} />
                </TouchableOpacity>
              </View>

              {/* List of Tenants */}
              <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
                {availableTenants.map(t => {
                  const isActive = t.id === activeTenantId;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.item, isActive && styles.itemActive]}
                      onPress={() => handleSelect(t.id, t.name)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.avatar, isActive && styles.avatarActive]}>
                        <Icon name="store" size={18} color={isActive ? theme.colors.primary : theme.colors.body} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.tenantName, isActive && styles.tenantNameActive]} numberOfLines={1}>
                            {t.name}
                          </Text>
                          {isActive && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>Active</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.tenantMeta}>
                          {t.category} · {t.productCount} Products · {t.planName} Plan
                        </Text>
                      </View>

                      {isActive && (
                        <View style={styles.checkWrap}>
                          <Icon name="check" size={14} color={theme.colors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '75%',
    paddingTop: theme.spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  title: {
    ...theme.typography.h2
  },
  subtitle: {
    ...theme.typography.caption,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.sm
  },
  itemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarActive: {
    backgroundColor: theme.colors.primaryLight
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  tenantName: {
    ...theme.typography.bodyBold
  },
  tenantNameActive: {
    color: theme.colors.primary
  },
  tenantMeta: {
    ...theme.typography.caption,
    marginTop: 2
  },
  activePill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radii.full
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary
  },
  checkWrap: {
    marginLeft: 8
  }
});
