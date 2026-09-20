import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { IconName } from './Icon';
interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: IconName;
    style?: ViewStyle;
    textStyle?: TextStyle;
}
export declare const Button: React.FC<ButtonProps>;
export {};
//# sourceMappingURL=Button.d.ts.map