import { ThemeProvider } from 'next-themes';
import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import { Toaster } from './components/ui/sonner';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <AppRouter />
            <Toaster position="top-right" />
          </AppProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
