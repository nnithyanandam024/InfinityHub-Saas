import React from 'react';
import { ViewStyle } from 'react-native';
export type IconName = 'home' | 'package' | 'barcode' | 'stock' | 'user' | 'search' | 'plus' | 'minus' | 'check' | 'close' | 'chevronDown' | 'chevronRight' | 'grid' | 'list' | 'filter' | 'appLauncher' | 'store' | 'cart' | 'alert' | 'settings' | 'shield' | 'reports' | 'tag' | 'receipt' | 'wallet' | 'cash';
interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    style?: ViewStyle;
}
export declare const Icon: React.FC<IconProps>;
export {};
//# sourceMappingURL=Icon.d.ts.map