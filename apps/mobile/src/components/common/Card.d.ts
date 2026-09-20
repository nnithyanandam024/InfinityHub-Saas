import React from 'react';
import { ViewStyle } from 'react-native';
interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'flat' | 'outline';
}
export declare const Card: React.FC<CardProps>;
export {};
//# sourceMappingURL=Card.d.ts.map