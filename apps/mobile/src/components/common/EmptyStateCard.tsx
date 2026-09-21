import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { Icon, IconName } from './Icon';
import { Button } from './Button';

export interface EmptyStateCardProps {
  icon?: IconName;
  iconSize?: number;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon = 'package',
  iconSize = 24,
  title,
  subtitle,
  actionLabel,
  onAction,
  style
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={iconSize} color={theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button
            size="sm"
            label={actionLabel}
            onPress={onAction}
            variant="outline"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy,
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8
  },
  actionWrap: {
    marginTop: 12
  }
});
