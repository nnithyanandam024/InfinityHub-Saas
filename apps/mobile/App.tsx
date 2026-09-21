import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { TenantProvider } from './src/context/TenantContext';
import { AppProvider } from './src/context/AppContext';
import { PosProvider } from './src/context/PosContext';
import { RestaurantProvider } from './src/context/RestaurantContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TenantProvider>
          <AppProvider>
            <PosProvider>
              <RestaurantProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </RestaurantProvider>
            </PosProvider>
          </AppProvider>
        </TenantProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
