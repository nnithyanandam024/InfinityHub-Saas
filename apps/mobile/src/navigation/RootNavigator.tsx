import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { Icon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/inventory/DashboardScreen';
import { ProductListScreen } from '../screens/inventory/ProductListScreen';
import { ProductDetailScreen } from '../screens/inventory/ProductDetailScreen';
import { NewProductScreen } from '../screens/inventory/NewProductScreen';
import { StockScreen } from '../screens/stock/StockScreen';
import { StockAdjustmentScreen } from '../screens/stock/StockAdjustmentScreen';
import { BarcodeScannerScreen } from '../screens/scanner/BarcodeScannerScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const InventoryNav = createNativeStackNavigator();
const StockNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function InventoryStackNavigator() {
  return (
    <InventoryNav.Navigator screenOptions={{ headerShown: false }}>
      <InventoryNav.Screen name="ProductList" component={ProductListScreen} />
      <InventoryNav.Screen name="ProductDetail" component={ProductDetailScreen} />
      <InventoryNav.Screen name="NewProduct" component={NewProductScreen} />
      <InventoryNav.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
    </InventoryNav.Navigator>
  );
}

function StockStackNavigator() {
  return (
    <StockNav.Navigator screenOptions={{ headerShown: false }}>
      <StockNav.Screen name="StockOverview" component={StockScreen} />
      <StockNav.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
      <StockNav.Screen name="ProductDetail" component={ProductDetailScreen} />
    </StockNav.Navigator>
  );
}

function HomeTabs() {
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="home" size={19} color={color} />
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryStackNavigator}
        options={{
          tabBarLabel: 'Catalog',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="package" size={19} color={color} />
        }}
      />
      <Tab.Screen
        name="StockTab"
        component={StockStackNavigator}
        options={{
          tabBarLabel: 'Stock',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="stock" size={19} color={color} />
        }}
      />
      {!isStaff && (
        <Tab.Screen
          name="ReportsTab"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ color }: { color: string }) => <Icon name="reports" size={19} color={color} />
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }: { color: string }) => <Icon name="user" size={19} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={HomeTabs} />
      <RootStack.Screen name="Scanner" component={BarcodeScannerScreen} />
      <RootStack.Screen name="NewProduct" component={NewProductScreen} />
      <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <RootStack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
    </RootStack.Navigator>
  );
}
