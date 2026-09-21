import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { Icon } from '../components/common/Icon';
import { PosTerminalScreen } from '../screens/pos/PosTerminalScreen';
import { PosInvoicesScreen } from '../screens/pos/PosInvoicesScreen';
import { PosShiftScreen } from '../screens/pos/PosShiftScreen';
import { PosKhataScreen } from '../screens/pos/PosKhataScreen';
import { PosAccountScreen } from '../screens/pos/PosAccountScreen';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';

const PosTab = createBottomTabNavigator();

export const PosNavigator: React.FC = () => {
  return (
    <PosTab.Navigator
      tabBar={(props: any) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <PosTab.Screen
        name="PosRegisterTab"
        component={PosTerminalScreen}
        options={{
          tabBarLabel: 'Register',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="cart" size={19} color={color} />
        }}
      />
      <PosTab.Screen
        name="PosInvoicesTab"
        component={PosInvoicesScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="receipt" size={19} color={color} />
        }}
      />
      <PosTab.Screen
        name="PosShiftTab"
        component={PosShiftScreen}
        options={{
          tabBarLabel: 'Shift',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="cash" size={19} color={color} />
        }}
      />
      <PosTab.Screen
        name="PosKhataTab"
        component={PosKhataScreen}
        options={{
          tabBarLabel: 'Khata',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="wallet" size={19} color={color} />
        }}
      />
      <PosTab.Screen
        name="PosAccountTab"
        component={PosAccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="store" size={19} color={color} />
        }}
      />
    </PosTab.Navigator>
  );
};
