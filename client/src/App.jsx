import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
