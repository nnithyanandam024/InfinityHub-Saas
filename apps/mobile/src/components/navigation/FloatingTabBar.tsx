import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../../theme';

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets
}) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Check if current route requests hiding tab bar
  const currentDescriptor = descriptors[state.routes[state.index].key];
  const tabBarStyle = currentDescriptor?.options?.tabBarStyle as any;
  if (isKeyboardVisible || tabBarStyle?.display === 'none') {
    return null;
  }

  // Safe bottom offset for devices with home indicator bars
  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 14) + 4 : 14;

  return (
    <View style={[styles.floatingDock, { bottom: bottomOffset }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const rawLabel =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const label = typeof rawLabel === 'string' ? rawLabel : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key
          });
        };

        const iconColor = isFocused ? theme.colors.primary : theme.colors.muted;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              {options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: iconColor,
                    size: 19
                  })
                : null}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>

            {isFocused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingDock: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  iconWrap: {
    width: 38,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primaryTint
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center'
  },
  tabLabelActive: {
    fontWeight: '800',
    color: theme.colors.primary
  },
  tabLabelInactive: {
    fontWeight: '600',
    color: theme.colors.muted
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 2
  }
});
