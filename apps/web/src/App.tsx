import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { SplashScreen } from './components/ui/SplashScreen';

export function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return typeof window !== 'undefined' ? !sessionStorage.getItem('infinityhub_splashed') : true;
  });

  const handleSplashFinish = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('infinityhub_splashed', 'true');
    }
    setShowSplash(false);
  };

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TenantProvider>
            {showSplash && <SplashScreen onFinish={handleSplashFinish} minDisplayMs={1100} />}
            <AppRoutes />
          </TenantProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

