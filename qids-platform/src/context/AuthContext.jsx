import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch (e) {
          console.warn('Could not load user profile:', e.message);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email, password, name, role = 'individual', context = 'individual') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profile = { uid: cred.user.uid, name, email, role, context, createdAt: serverTimestamp() };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (e) {
      console.warn('Could not save user profile:', e.message);
    }
    setUserProfile(profile);
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) setUserProfile(snap.data());
    } catch (e) {
      console.warn('Could not load user profile:', e.message);
    }
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (!snap.exists()) {
        const profile = {
          uid: u.uid, name: u.displayName || '', email: u.email,
          role: 'individual', context: 'individual', createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', u.uid), profile);
        setUserProfile(profile);
      } else {
        setUserProfile(snap.data());
      }
    } catch (e) {
      console.warn('Firestore after Google sign-in:', e.message);
    }
    return u;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signup, login, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}