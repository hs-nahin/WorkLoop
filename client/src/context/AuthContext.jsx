import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  onPermissionsChange,
  getPermissionsVersion,
} from '../lib/permissions';
import { AuthContext } from './AuthContextInstance';
import { useContext } from 'react';

export { AuthContext };

const normalizeRole = (role) => {
  if (!role) return 'USER';
  return role.toUpperCase();
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  const fetchFirestoreProfile = useCallback(async (uid) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        data.role = normalizeRole(data.role);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          localStorage.setItem('firebase_token', idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
        setFirebaseUser(user);
        const profile = await fetchFirestoreProfile(user.uid);
        setFirestoreProfile(profile);
      } else {
        setFirebaseUser(null);
        setFirestoreProfile(null);
        setToken(null);
        localStorage.removeItem('firebase_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchFirestoreProfile]);

  useEffect(() => {
    const unsubChange = onPermissionsChange(() => {
      setPermissionsVersion(getPermissionsVersion());
    });
    return () => {
      unsubChange();
    };
  }, []);

  const login = async ({ email, password }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      setToken(idToken);
      localStorage.setItem('firebase_token', idToken);
      const profile = await fetchFirestoreProfile(user.uid);
      setFirestoreProfile(profile);
      return { user, profile };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerAdmin = async ({ name, email, password }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/auth/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create admin account');
    }
    return data;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setFirestoreProfile(null);
      setToken(null);
      localStorage.removeItem('firebase_token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const user = firestoreProfile || (firebaseUser ? {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || '',
    role: 'USER'
  } : null);

  const fetchMe = useCallback(async () => {
    if (firebaseUser) {
      const profile = await fetchFirestoreProfile(firebaseUser.uid);
      setFirestoreProfile(profile);
      return profile;
    }
    return null;
  }, [firebaseUser, fetchFirestoreProfile]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerAdmin, logout, fetchMe, permissionsVersion }}>
      {children}
    </AuthContext.Provider>
  );
};
