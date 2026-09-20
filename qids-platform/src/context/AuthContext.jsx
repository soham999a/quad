import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { upsertPublicEvaluator, removePublicEvaluator } from '../services/firestoreService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAuth = typeof window !== 'undefined' && window.__TEST_AUTH__;
    if (testAuth) {
      setUser(testAuth.user);
      setUserProfile(testAuth.profile);
      setLoading(false);
      return;
    }

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
    return { user: cred.user, profile };
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let profile = null;
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) { profile = snap.data(); setUserProfile(profile); }
    } catch (e) {
      console.warn('Could not load user profile:', e.message);
    }
    return { user: cred.user, profile };
  };

  const loginWithGoogle = async (role = 'individual', context = 'individual') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    let isNew = false;
    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (!snap.exists()) {
        isNew = true;
        const profile = {
          uid: u.uid, name: u.displayName || '', email: u.email,
          role, context, createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', u.uid), profile);
        setUserProfile(profile);
      } else {
        setUserProfile(snap.data());
      }
    } catch (e) {
      console.warn('Firestore after Google sign-in:', e.message);
    }
    return { user: u, isNew };
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
      // Keep the public evaluator directory in sync with role changes.
      if (role === 'evaluator') {
        await upsertPublicEvaluator(uid, {
          name: userProfile?.name || user?.displayName || '',
          email: userProfile?.email || user?.email || '',
        });
      } else {
        await removePublicEvaluator(uid);
      }
      if (user?.uid === uid) {
        setUserProfile(prev => prev ? { ...prev, role } : prev);
      }
    } catch (e) {
      console.warn('Could not update role:', e.message);
      throw e;
    }
  };

  const updateUserFields = async (uid, fields) => {
    const clean = {};
    Object.entries(fields || {}).forEach(([k, v]) => { if (v != null && v !== '') clean[k] = v; });
    try {
      await updateDoc(doc(db, 'users', uid), { ...clean, updatedAt: serverTimestamp() });
      if (typeof clean.name === 'string' && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: clean.name });
      }
      setUserProfile(prev => prev ? { ...prev, ...clean } : prev);
    } catch (e) {
      console.warn('Could not update profile:', e.message);
      throw e;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error('Not signed in.');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } catch (e) {
        console.warn('Could not refresh profile:', e.message);
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signup, login, loginWithGoogle, logout, resetPassword, updateUserRole, updateUserFields, changePassword, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}