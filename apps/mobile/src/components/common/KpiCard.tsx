import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { Icon, IconName } from './Icon';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: IconName;
  variant?: 'primary' | 'warning' | 'danger' | 'success';
  onPress?: () => void;
  style?: ViewStyle;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'primary',
  onPress,
  style
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: theme.colors.warningBg,
          iconColor: theme.colors.warning,
          valColor: theme.colors.warning
        };
      case 'danger':
        return {
          iconBg: theme.colors.dangerBg,
          iconColor: theme.colors.danger,
          valColor: theme.colors.danger
        };
      case 'success':
        return {
          iconBg: theme.colors.successBg,
          iconColor: theme.colors.success,
          valColor: theme.colors.success
        };
      case 'primary':
      default:
        return {
          iconBg: theme.colors.primaryTint,
          iconColor: theme.colors.primary,
          valColor: theme.colors.navy
        };
    }
  };

  const { iconBg, iconColor, valColor } = getVariantStyles();

  const Content = (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={15} color={iconColor} />
        </View>
      </View>

      <Text style={[styles.value, { color: valColor }]} numberOfLines={1}>
        {value}
      </Text>

      {subtext ? (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchableWrap}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  touchableWrap: {
    width: '48.5%'
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 112,
    justifyContent: 'space-between',
    ...theme.shadows.card
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    flex: 1,
    marginRight: 6
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 2
  },
  subtext: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  }
});
