import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import AppRouter from './router/AppRouter/AppRouter';
import ToastContainer from './components/ui/ToastContainer';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppRouter />
          <ToastContainer />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
