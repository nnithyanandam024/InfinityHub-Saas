import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'muted' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
  size = 'md'
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.successBg, text: theme.colors.successText, border: '#A7F3D0' };
      case 'warning':
        return { bg: theme.colors.warningBg, text: theme.colors.warningText, border: '#FDE68A' };
      case 'danger':
        return { bg: theme.colors.dangerBg, text: theme.colors.dangerText, border: '#FECACA' };
      case 'primary':
        return { bg: theme.colors.primaryTint, text: theme.colors.primary, border: '#BFDBFE' };
      case 'muted':
        return { bg: theme.colors.surfaceSubtle, text: theme.colors.body, border: theme.colors.border };
      case 'outline':
        return { bg: 'transparent', text: theme.colors.body, border: theme.colors.border };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        size === 'sm' && styles.smBadge,
        style
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: text },
          size === 'sm' && styles.smLabel,
          textStyle
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center'
  },
  smBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  label: {
    ...theme.typography.badge,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  smLabel: {
    fontSize: 10
  }
});
