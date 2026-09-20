import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { TenantProvider } from './src/context/TenantContext';
import { AppProvider } from './src/context/AppContext';
import { PosProvider } from './src/context/PosContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/components/splash/SplashScreen';
export default function App() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    return (<SafeAreaProvider>
      <AuthProvider>
        <TenantProvider>
          <AppProvider>
            <PosProvider>
              {isSplashVisible && (<SplashScreen minDisplayMs={1400} onFinish={() => setIsSplashVisible(false)}/>)}
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </PosProvider>
          </AppProvider>
        </TenantProvider>
      </AuthProvider>
    </SafeAreaProvider>);
}
//# sourceMappingURL=App.js.map