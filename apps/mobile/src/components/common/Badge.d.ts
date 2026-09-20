import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'muted' | 'outline';
interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    style?: ViewStyle;
    textStyle?: TextStyle;
    size?: 'sm' | 'md';
}
export declare const Badge: React.FC<BadgeProps>;
export {};
//# sourceMappingURL=Badge.d.ts.map