import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { Icon } from '../components/common/Icon';
import { PosTerminalScreen } from '../screens/pos/PosTerminalScreen';
import { PosInvoicesScreen } from '../screens/pos/PosInvoicesScreen';
import { PosShiftScreen } from '../screens/pos/PosShiftScreen';
import { PosKhataScreen } from '../screens/pos/PosKhataScreen';
import { PosAccountScreen } from '../screens/pos/PosAccountScreen';
const PosTab = createBottomTabNavigator();
export const PosNavigator = () => {
    return (<PosTab.Navigator screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.muted,
            tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 6
            },
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
                marginTop: 2
            },
            headerShown: false
        }}>
      <PosTab.Screen name="PosRegisterTab" component={PosTerminalScreen} options={{
            tabBarLabel: 'Register',
            tabBarIcon: ({ color }) => <Icon name="cart" size={19} color={color}/>
        }}/>
      <PosTab.Screen name="PosInvoicesTab" component={PosInvoicesScreen} options={{
            tabBarLabel: 'Invoices',
            tabBarIcon: ({ color }) => <Icon name="receipt" size={19} color={color}/>
        }}/>
      <PosTab.Screen name="PosShiftTab" component={PosShiftScreen} options={{
            tabBarLabel: 'Shift',
            tabBarIcon: ({ color }) => <Icon name="cash" size={19} color={color}/>
        }}/>
      <PosTab.Screen name="PosKhataTab" component={PosKhataScreen} options={{
            tabBarLabel: 'Khata',
            tabBarIcon: ({ color }) => <Icon name="wallet" size={19} color={color}/>
        }}/>
      <PosTab.Screen name="PosAccountTab" component={PosAccountScreen} options={{
            tabBarLabel: 'Account',
            tabBarIcon: ({ color }) => <Icon name="store" size={19} color={color}/>
        }}/>
    </PosTab.Navigator>);
};
//# sourceMappingURL=PosNavigator.js.map