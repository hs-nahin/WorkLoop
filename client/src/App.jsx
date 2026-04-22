import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
