import { CompanyProvider } from './context/CompanyContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import AppRouter from './router/AppRouter/AppRouter';

function App() {
  return (
    <CompanyProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CompanyProvider>
  );
}

export default App;