import { auth } from "../firebase/firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

export const authService = {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  subscribeToAuthChanges(callback) {
    onAuthStateChanged(auth, callback);
  }
};
