import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export type IconName =
  | 'home'
  | 'package'
  | 'barcode'
  | 'stock'
  | 'user'
  | 'search'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'chevronDown'
  | 'chevronRight'
  | 'grid'
  | 'list'
  | 'filter'
  | 'appLauncher'
  | 'store'
  | 'cart'
  | 'alert'
  | 'settings'
  | 'shield'
  | 'reports'
  | 'tag'
  | 'receipt'
  | 'wallet'
  | 'cash';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = '#0F172A',
  style
}) => {
  const s = size;

  switch (name) {
    case 'home':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
          <View
            style={{
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid',
              borderLeftWidth: s / 2,
              borderRightWidth: s / 2,
              borderBottomWidth: s * 0.45,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              marginBottom: 1
            }}
          />
          <View
            style={{
              width: s * 0.72,
              height: s * 0.48,
              borderWidth: 1.8,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            <View style={{ width: s * 0.28, height: s * 0.24, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          </View>
        </View>
      );

    case 'package':
    case 'store':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              justifyContent: 'space-between',
              padding: 2
            }}
          >
            <View style={{ height: 1.5, width: '100%', backgroundColor: color }} />
            <View style={{ width: 1.5, height: '50%', backgroundColor: color, alignSelf: 'center' }} />
          </View>
        </View>
      );

    case 'barcode':
      return (
        <View style={[{ width: s, height: s, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: 2, height: s * 0.8, backgroundColor: color, marginRight: 2 }} />
          <View style={{ width: 1, height: s * 0.8, backgroundColor: color, marginRight: 2 }} />
          <View style={{ width: 3.5, height: s * 0.8, backgroundColor: color, marginRight: 2 }} />
          <View style={{ width: 1, height: s * 0.8, backgroundColor: color, marginRight: 2 }} />
          <View style={{ width: 2.5, height: s * 0.8, backgroundColor: color, marginRight: 2 }} />
          <View style={{ width: 1.5, height: s * 0.8, backgroundColor: color }} />
        </View>
      );

    case 'stock':
      return (
        <View style={[{ width: s, height: s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2.5 }, style]}>
          <View style={{ width: 3.2, height: s * 0.45, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 3.2, height: s * 0.75, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 3.2, height: s * 0.95, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case 'user':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.4,
              height: s * 0.4,
              borderRadius: s * 0.2,
              borderWidth: 1.8,
              borderColor: color,
              marginBottom: 1.5
            }}
          />
          <View
            style={{
              width: s * 0.75,
              height: s * 0.35,
              borderWidth: 1.8,
              borderColor: color,
              borderTopLeftRadius: s * 0.2,
              borderTopRightRadius: s * 0.2,
              borderBottomWidth: 0
            }}
          />
        </View>
      );

    case 'search':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.65,
              borderRadius: (s * 0.65) / 2,
              borderWidth: 1.8,
              borderColor: color,
              marginTop: -2,
              marginLeft: -2
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 1.5,
              right: 1.5,
              width: s * 0.32,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '45deg' }]
            }}
          />
        </View>
      );

    case 'grid':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ flexDirection: 'row', gap: 2, marginBottom: 2 }}>
            <View style={{ width: s * 0.38, height: s * 0.38, borderWidth: 1.6, borderColor: color, borderRadius: 2 }} />
            <View style={{ width: s * 0.38, height: s * 0.38, borderWidth: 1.6, borderColor: color, borderRadius: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: s * 0.38, height: s * 0.38, borderWidth: 1.6, borderColor: color, borderRadius: 2 }} />
            <View style={{ width: s * 0.38, height: s * 0.38, borderWidth: 1.6, borderColor: color, borderRadius: 2 }} />
          </View>
        </View>
      );

    case 'list':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', gap: 3 }, style]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ flex: 1, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ flex: 1, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ flex: 1, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'plus':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ position: 'absolute', width: 2, height: s * 0.7, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case 'minus':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: 2, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.5,
              height: s * 0.3,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }, { translateY: -1 }]
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ position: 'absolute', width: s * 0.65, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
          <View style={{ position: 'absolute', width: s * 0.65, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
        </View>
      );

    case 'chevronDown':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.45,
              height: s * 0.45,
              borderBottomWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }, { translateY: -s * 0.1 }]
            }}
          />
        </View>
      );

    case 'chevronRight':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.45,
              height: s * 0.45,
              borderTopWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }, { translateX: -s * 0.1 }]
            }}
          />
        </View>
      );

    case 'appLauncher':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center', gap: 2.5 }, style]}>
          <View style={{ flexDirection: 'row', gap: 2.5 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2.5 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2.5 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'cart':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: s * 0.5, borderWidth: 1.8, borderColor: color, borderRadius: 2, marginBottom: 2 }} />
          <View style={{ flexDirection: 'row', width: s * 0.55, justifyContent: 'space-between' }}>
            <View style={{ width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: color }} />
            <View style={{ width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'alert':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.8, height: s * 0.8, borderRadius: s * 0.4, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 2, height: s * 0.35, backgroundColor: color, borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'shield':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.75, height: s * 0.8, borderWidth: 1.8, borderColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: s * 0.4, borderBottomRightRadius: s * 0.4 }} />
        </View>
      );

    case 'reports':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.76,
              height: s * 0.9,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              paddingBottom: 2,
              paddingHorizontal: 1,
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%', marginBottom: 1 }}>
              <View style={{ width: 2.2, height: s * 0.3, backgroundColor: color, borderRadius: 0.5, marginRight: 2 }} />
              <View style={{ width: 2.2, height: s * 0.52, backgroundColor: color, borderRadius: 0.5, marginRight: 2 }} />
              <View style={{ width: 2.2, height: s * 0.38, backgroundColor: color, borderRadius: 0.5 }} />
            </View>
          </View>
        </View>
      );

    case 'tag':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.75, height: s * 0.75, borderWidth: 1.8, borderColor: color, borderRadius: 3, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'receipt':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: s * 0.85, borderWidth: 1.8, borderColor: color, borderRadius: 2, padding: 2, justifyContent: 'space-around' }}>
            <View style={{ height: 1.5, width: '80%', backgroundColor: color }} />
            <View style={{ height: 1.5, width: '60%', backgroundColor: color }} />
            <View style={{ height: 1.5, width: '70%', backgroundColor: color }} />
          </View>
        </View>
      );

    case 'wallet':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.85, height: s * 0.65, borderWidth: 1.8, borderColor: color, borderRadius: 3, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 2 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'cash':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.88, height: s * 0.58, borderWidth: 1.8, borderColor: color, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, borderWidth: 1.5, borderColor: color }} />
          </View>
        </View>
      );

    default:
      return <View style={[{ width: s, height: s, backgroundColor: color, borderRadius: 2 }, style]} />;
  }
};
