/// <reference types="react" />

declare module 'react-native' {
  export interface ViewStyle {
    [key: string]: any;
  }
  export interface TextStyle {
    [key: string]: any;
  }
  export interface ImageStyle {
    [key: string]: any;
  }

  export type StyleProp<T> = T | Array<T | undefined | null | false> | undefined | null;

  export interface ViewProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface TextProps {
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface ImageSourcePropType {
    uri?: string;
    [key: string]: any;
  }

  export interface ImageProps {
    source: ImageSourcePropType | number;
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    [key: string]: any;
  }

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: (event?: any) => void;
    activeOpacity?: number;
    disabled?: boolean;
    hitSlop?: any;
    accessibilityLabel?: string;
  }

  export interface ScrollViewProps extends ViewProps {
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    refreshControl?: React.ReactElement | null;
  }

  export interface TextInputProps extends ViewProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    keyboardType?: string;
    secureTextEntry?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    selectTextOnFocus?: boolean;
  }

  export interface FlatListProps<ItemT> extends ViewProps {
    data: ReadonlyArray<ItemT> | null | undefined;
    renderItem: (info: { item: ItemT; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: ItemT, index: number) => string;
    numColumns?: number;
    key?: string | number;
    contentContainerStyle?: StyleProp<ViewStyle>;
    columnWrapperStyle?: StyleProp<ViewStyle>;
    ItemSeparatorComponent?: React.ComponentType<any> | null;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    refreshControl?: React.ReactElement | null;
  }

  export interface ModalProps extends ViewProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    onRequestClose?: () => void;
  }

  export interface RefreshControlProps extends ViewProps {
    refreshing: boolean;
    onRefresh?: () => void;
    colors?: string[];
    [key: string]: any;
  }

  export class View extends React.Component<ViewProps> {}
  export class Text extends React.Component<TextProps> {}
  export class Image extends React.Component<ImageProps> {}
  export class TouchableOpacity extends React.Component<TouchableOpacityProps> {}
  export class TouchableWithoutFeedback extends React.Component<ViewProps & { onPress?: (e?: any) => void }> {}
  export class ScrollView extends React.Component<ScrollViewProps> {}
  export class TextInput extends React.Component<TextInputProps> {}
  export class SafeAreaView extends React.Component<ViewProps> {}
  export class FlatList<ItemT = any> extends React.Component<FlatListProps<ItemT>> {}
  export class Modal extends React.Component<ModalProps> {}
  export class RefreshControl extends React.Component<RefreshControlProps> {}

  export const Platform: {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
    select<T>(specifics: { [platform: string]: T }): T;
  };

  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T;
    hairlineWidth: number;
    flatten<T>(style: StyleProp<T>): T;
    absoluteFillObject: {
      position: 'absolute';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    };
    absoluteFill: any;
  };

  export const Alert: {
    alert(
      title: string,
      message?: string,
      buttons?: Array<{
        text?: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }>,
      options?: any
    ): void;
  };

  export interface StatusBarProps {
    barStyle?: 'default' | 'light-content' | 'dark-content';
    backgroundColor?: string;
    translucent?: boolean;
    animated?: boolean;
    hidden?: boolean;
  }
  export class StatusBar extends React.Component<StatusBarProps> {
    static setBarStyle(style: 'default' | 'light-content' | 'dark-content', animated?: boolean): void;
  }

  export namespace Animated {
    export class Value {
      constructor(value: number);
      setValue(value: number): void;
      interpolate(config: {
        inputRange: number[];
        outputRange: number[] | string[];
        extrapolate?: 'extend' | 'clamp' | 'identity';
        extrapolateLeft?: 'extend' | 'clamp' | 'identity';
        extrapolateRight?: 'extend' | 'clamp' | 'identity';
      }): any;
    }
    export interface AnimationConfig {
      toValue: number | Value;
      duration?: number;
      delay?: number;
      useNativeDriver: boolean;
      easing?: (value: number) => number;
      friction?: number;
      tension?: number;
      bounciness?: number;
      speed?: number;
    }
    export interface CompositeAnimation {
      start: (callback?: (result: { finished: boolean }) => void) => void;
      stop: () => void;
      reset: () => void;
    }
    export function timing(value: Value, config: AnimationConfig): CompositeAnimation;
    export function spring(value: Value, config: AnimationConfig): CompositeAnimation;
    export function sequence(animations: CompositeAnimation[]): CompositeAnimation;
    export function parallel(animations: CompositeAnimation[]): CompositeAnimation;
    export function loop(animation: CompositeAnimation, config?: { iterations?: number }): CompositeAnimation;
    export class View extends React.Component<ViewProps & { style?: any }> {}
    export class Text extends React.Component<TextProps & { style?: any }> {}
    export class Image extends React.Component<ImageProps & { style?: any }> {}
  }

  export const Easing: {
    linear: (t: number) => number;
    ease: (t: number) => number;
    quad: (t: number) => number;
    cubic: (t: number) => number;
    bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number;
    in(easing: (t: number) => number): (t: number) => number;
    out(easing: (t: number) => number): (t: number) => number;
    inOut(easing: (t: number) => number): (t: number) => number;
  };
}

declare module '@react-navigation/native' {
  export interface NavigationContainerProps {
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const NavigationContainer: React.FC<NavigationContainerProps>;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
}

declare module '@react-navigation/native-stack' {
  export interface NativeStackNavigationOptions {
    headerShown?: boolean;
    title?: string;
    headerStyle?: any;
    headerTintColor?: string;
    headerTitleStyle?: any;
    headerShadowVisible?: boolean;
    [key: string]: any;
  }
  export function createNativeStackNavigator<ParamList extends Record<string, object | undefined> = any>(): {
    Navigator: React.FC<any>;
    Screen: React.FC<any>;
    Group: React.FC<any>;
  };
}

declare module '@react-navigation/bottom-tabs' {
  export interface BottomTabNavigationOptions {
    headerShown?: boolean;
    title?: string;
    headerStyle?: any;
    headerTitleStyle?: any;
    tabBarLabel?: string;
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    tabBarStyle?: any;
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    [key: string]: any;
  }
  export function createBottomTabNavigator<ParamList extends Record<string, object | undefined> = any>(): {
    Navigator: React.FC<any>;
    Screen: React.FC<any>;
    Group: React.FC<any>;
  };
}

declare module 'react-native-safe-area-context' {
  export interface SafeAreaProviderProps {
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const SafeAreaProvider: React.FC<SafeAreaProviderProps>;
  export function useSafeAreaInsets(): { top: number; right: number; bottom: number; left: number };
}
