import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/apiClient';
import { AuthContext } from './AuthContextInstance';

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiRequest({ endpoint: '/users/me' });
      setUser(data);
    } catch (error) {
      console.error('Session expired or invalid:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (token) {
        try {
          await fetchMe();
        } catch {
          // Error handled inside fetchMe
        }
      } else {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => { isMounted = false; };
  }, [token, fetchMe]);

  const login = async (credentials) => {
    const data = await apiRequest({
      endpoint: '/auth/login',
      method: 'POST',
      body: credentials,
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};