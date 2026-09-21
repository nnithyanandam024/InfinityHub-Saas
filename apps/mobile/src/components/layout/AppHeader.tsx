import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Icon, IconName } from '../common/Icon';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

export interface AppHeaderProps {
  navigation?: any;
  title?: string;
  subtitleBadge?: string;
  icon?: IconName;
  onBadgePress?: () => void;
  rightAction?: React.ReactNode;
  hideScanner?: boolean;
  onAvatarPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  navigation,
  title,
  subtitleBadge,
  icon = 'store',
  onBadgePress,
  rightAction,
  hideScanner = false,
  onAvatarPress
}) => {
  const localNav = useNavigation<any>();
  const nav = navigation || localNav;
  const { tenant } = useTenant();
  const { user } = useAuth();

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'OP';

  const displayTitle = title || tenant.name;
  const displayBadge =
    subtitleBadge ||
    (user?.role === 'SUPER_ADMIN' ? 'Platform Admin' : `${tenant.planName || 'Starter'} Plan`);

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      nav?.navigate('ProfileTab');
    }
  };

  return (
    <View style={styles.header}>
      {/* Store Identity */}
      <View style={styles.storeInfoWrap}>
        <View style={styles.storeIconWrap}>
          <Icon name={icon} size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.storeTextWrap}>
          <Text style={styles.storeName} numberOfLines={1}>
            {displayTitle}
          </Text>
          <View style={styles.badgeRow}>
            {onBadgePress ? (
              <TouchableOpacity
                style={styles.planPill}
                onPress={onBadgePress}
                activeOpacity={0.7}
              >
                <Text style={styles.planPillText}>{displayBadge}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.planPill}>
                <Text style={styles.planPillText}>{displayBadge}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right Actions: Quick Shortcut + Profile Avatar */}
      <View style={styles.rightActions}>
        {rightAction ? (
          rightAction
        ) : !hideScanner ? (
          <TouchableOpacity
            style={styles.iconActionBtn}
            onPress={() => nav?.navigate('Scanner')}
            activeOpacity={0.75}
            accessibilityLabel="Open Barcode Scanner"
          >
            <Icon name="barcode" size={18} color={theme.colors.navy} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          accessibilityLabel="View Account"
        >
          <Text style={styles.avatarText}>{userInitials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  storeInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  storeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  storeTextWrap: {
    flex: 1
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.navy,
    letterSpacing: -0.2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  planPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: theme.radii.full
  },
  planPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.body
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
