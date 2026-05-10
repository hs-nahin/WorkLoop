import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  subscribeUserPermissions,
  unsubscribeUserPermissions,
  subscribeRolePermissions,
  unsubscribeRolePermissions,
  onPermissionsChange,
  getPermissionsVersion,
} from '../lib/permissions';
import { AuthContext } from './AuthContextInstance';
import { useContext } from 'react';

export { AuthContext };

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
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Firestore profile:', error);
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
    const uid = firestoreProfile?.uid || firebaseUser?.uid;
    const role = firestoreProfile?.role;
    if (uid) subscribeUserPermissions(uid);
    if (role) subscribeRolePermissions(role);
    const unsubChange = onPermissionsChange(() => {
      setPermissionsVersion(getPermissionsVersion());
    });
    return () => {
      if (uid) unsubscribeUserPermissions(uid);
      if (role) unsubscribeRolePermissions(role);
      unsubChange();
    };
  }, [firestoreProfile?.uid, firestoreProfile?.role, firebaseUser?.uid]);

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
    email: firebaseUser.email, 
    uid: firebaseUser.uid,
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe, permissionsVersion }}>
      {children}
    </AuthContext.Provider>
  );
};
