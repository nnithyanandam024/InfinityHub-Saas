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
  | 'cash'
  | 'smartphone'
  | 'creditCard'
  | 'book'
  | 'utensils'
  | 'table'
  | 'chefHat'
  | 'fire'
  | 'dish'
  | 'clock';

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

    case 'smartphone':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.58, height: s * 0.88, borderRadius: 3, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
            <View style={{ width: s * 0.22, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: s * 0.16, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'creditCard':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.88, height: s * 0.62, borderRadius: 2.5, borderWidth: 1.8, borderColor: color, justifyContent: 'space-between', paddingVertical: 2 }}>
            <View style={{ width: '100%', height: s * 0.12, backgroundColor: color }} />
            <View style={{ width: s * 0.25, height: 2, backgroundColor: color, marginLeft: 2, borderRadius: 0.5 }} />
          </View>
        </View>
      );

    case 'book':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.72, height: s * 0.85, borderRadius: 2, borderWidth: 1.8, borderColor: color, flexDirection: 'row' }}>
            <View style={{ width: 2.5, height: '100%', backgroundColor: color }} />
            <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 2, gap: 2 }}>
              <View style={{ width: '70%', height: 1.2, backgroundColor: color }} />
              <View style={{ width: '50%', height: 1.2, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    case 'utensils':
      return (
        <View style={[{ width: s, height: s, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s * 0.18 }, style]}>
          {/* Fork */}
          <View style={{ width: s * 0.28, height: s * 0.85, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', height: s * 0.38 }}>
              <View style={{ width: 1.8, height: '100%', backgroundColor: color }} />
              <View style={{ width: 1.8, height: '100%', backgroundColor: color }} />
              <View style={{ width: 1.8, height: '100%', backgroundColor: color }} />
            </View>
            <View style={{ width: '100%', height: 1.8, backgroundColor: color }} />
            <View style={{ width: 2, flex: 1, backgroundColor: color }} />
          </View>
          {/* Knife */}
          <View style={{ width: s * 0.22, height: s * 0.85, alignItems: 'center' }}>
            <View style={{ width: s * 0.22, height: s * 0.42, backgroundColor: color, borderTopRightRadius: s * 0.18, borderTopLeftRadius: 1 }} />
            <View style={{ width: 2, flex: 1, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'table':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Table Top Surface */}
          <View style={{ width: s * 0.86, height: 2.5, backgroundColor: color, borderRadius: 1 }} />
          {/* Table Legs */}
          <View style={{ flexDirection: 'row', width: s * 0.72, justifyContent: 'space-between', height: s * 0.55 }}>
            <View style={{ width: 2, height: '100%', backgroundColor: color }} />
            <View style={{ width: 2, height: '100%', backgroundColor: color }} />
          </View>
        </View>
      );

    case 'chefHat':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Puffed Hat Top */}
          <View style={{ flexDirection: 'row', width: s * 0.76, justifyContent: 'space-between', alignItems: 'flex-end', height: s * 0.45 }}>
            <View style={{ width: s * 0.26, height: s * 0.38, borderRadius: s * 0.13, backgroundColor: color }} />
            <View style={{ width: s * 0.32, height: s * 0.45, borderRadius: s * 0.16, backgroundColor: color }} />
            <View style={{ width: s * 0.26, height: s * 0.38, borderRadius: s * 0.13, backgroundColor: color }} />
          </View>
          {/* Base Brim */}
          <View style={{ width: s * 0.68, height: s * 0.28, borderWidth: 1.8, borderColor: color, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: 'transparent' }} />
        </View>
      );

    case 'fire':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ width: s * 0.65, height: s * 0.8, borderRadius: s * 0.32, borderTopLeftRadius: 1, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );

    case 'dish':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          {/* Cloche Knob */}
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color, marginBottom: 1 }} />
          {/* Cloche Dome */}
          <View style={{ width: s * 0.76, height: s * 0.38, borderTopLeftRadius: s * 0.38, borderTopRightRadius: s * 0.38, borderWidth: 1.8, borderColor: color, borderBottomWidth: 0 }} />
          {/* Cloche Plate Base */}
          <View style={{ width: s * 0.88, height: 2, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case 'clock':
      return (
        <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderRadius: s * 0.425,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: s * 0.16,
                width: 1.8,
                height: s * 0.28,
                backgroundColor: color,
                borderRadius: 1
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: s * 0.16,
                width: s * 0.24,
                height: 1.8,
                backgroundColor: color,
                borderRadius: 1
              }}
            />
          </View>
        </View>
      );

    default:
      return <View style={[{ width: s, height: s, backgroundColor: color, borderRadius: 2 }, style]} />;
  }
};
