import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as ReactNative from 'react-native';
const ActivityIndicator = ReactNative.ActivityIndicator;
import { theme } from '../../theme';
import { Icon } from './Icon';
export const Button = ({ label, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, style, textStyle }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    btn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    text: { color: '#FFFFFF' }
                };
            case 'secondary':
                return {
                    btn: { backgroundColor: theme.colors.primaryTint, borderColor: theme.colors.primaryLight },
                    text: { color: theme.colors.primary }
                };
            case 'outline':
                return {
                    btn: { backgroundColor: '#FFFFFF', borderColor: theme.colors.border },
                    text: { color: theme.colors.navy }
                };
            case 'danger':
                return {
                    btn: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
                    text: { color: '#FFFFFF' }
                };
            case 'ghost':
                return {
                    btn: { backgroundColor: 'transparent', borderColor: 'transparent' },
                    text: { color: theme.colors.body }
                };
        }
    };
    const { btn, text } = getVariantStyles();
    return (<TouchableOpacity style={[
            styles.base,
            btn,
            size === 'sm' && styles.sm,
            size === 'lg' && styles.lg,
            (disabled || loading) && styles.disabled,
            style
        ]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? (<ActivityIndicator size="small" color={text.color}/>) : (<View style={styles.contentRow}>
          {icon && (<Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} color={text.color} style={{ marginRight: 6 }}/>)}
          <Text style={[
                styles.label,
                text,
                size === 'sm' && styles.smLabel,
                size === 'lg' && styles.lgLabel,
                textStyle
            ]}>
            {label}
          </Text>
        </View>)}
    </TouchableOpacity>);
};
const styles = StyleSheet.create({
    base: {
        borderRadius: theme.radii.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16
    },
    sm: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme.radii.sm
    },
    lg: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: theme.radii.lg
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    label: {
        fontSize: 14,
        fontWeight: '600'
    },
    smLabel: {
        fontSize: 12
    },
    lgLabel: {
        fontSize: 16
    },
    disabled: {
        opacity: 0.5
    }
});
//# sourceMappingURL=Button.js.map