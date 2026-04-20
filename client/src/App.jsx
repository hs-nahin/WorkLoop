import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
