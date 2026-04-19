import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
