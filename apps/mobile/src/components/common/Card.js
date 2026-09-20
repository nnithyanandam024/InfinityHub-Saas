import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
export const Card = ({ children, style, onPress, variant = 'default' }) => {
    const containerStyles = [
        styles.base,
        variant === 'default' && styles.default,
        variant === 'flat' && styles.flat,
        variant === 'outline' && styles.outline,
        style
    ];
    if (onPress) {
        return (<TouchableOpacity style={containerStyles} activeOpacity={0.75} onPress={onPress}>
        {children}
      </TouchableOpacity>);
    }
    return <View style={containerStyles}>{children}</View>;
};
const styles = StyleSheet.create({
    base: {
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg
    },
    default: {
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    flat: {
        backgroundColor: theme.colors.surfaceSubtle
    },
    outline: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: 'transparent'
    }
});
//# sourceMappingURL=Card.js.map