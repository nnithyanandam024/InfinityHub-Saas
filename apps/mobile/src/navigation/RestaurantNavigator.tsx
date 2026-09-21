import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { Icon } from '../components/common/Icon';
import { RestaurantTablesScreen } from '../screens/restaurant/RestaurantTablesScreen';
import { RestaurantOrderScreen } from '../screens/restaurant/RestaurantOrderScreen';
import { RestaurantKdsScreen } from '../screens/restaurant/RestaurantKdsScreen';
import { RestaurantMenuScreen } from '../screens/restaurant/RestaurantMenuScreen';
import { RestaurantAccountScreen } from '../screens/restaurant/RestaurantAccountScreen';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';

const RestaurantTab = createBottomTabNavigator();

export const RestaurantNavigator: React.FC = () => {
  return (
    <RestaurantTab.Navigator
      tabBar={(props: any) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <RestaurantTab.Screen
        name="RestaurantTablesTab"
        component={RestaurantTablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="table" size={19} color={color} />
        }}
      />
      <RestaurantTab.Screen
        name="RestaurantOrderTab"
        component={RestaurantOrderScreen}
        options={{
          tabBarLabel: 'Order Pad',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="utensils" size={19} color={color} />
        }}
      />
      <RestaurantTab.Screen
        name="RestaurantKdsTab"
        component={RestaurantKdsScreen}
        options={{
          tabBarLabel: 'Kitchen',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="chefHat" size={19} color={color} />
        }}
      />
      <RestaurantTab.Screen
        name="RestaurantMenuTab"
        component={RestaurantMenuScreen}
        options={{
          tabBarLabel: 'Menu 86d',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="dish" size={19} color={color} />
        }}
      />
      <RestaurantTab.Screen
        name="RestaurantAccountTab"
        component={RestaurantAccountScreen}
        options={{
          tabBarLabel: 'Ops & Shifts',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="store" size={19} color={color} />
        }}
      />
    </RestaurantTab.Navigator>
  );
};
