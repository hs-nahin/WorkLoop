import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext } from './AuthContextInstance';

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

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
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};