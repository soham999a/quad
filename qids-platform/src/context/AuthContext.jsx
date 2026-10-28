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
import { postToAdmins } from '../services/notificationService';

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
          if (snap.exists()) {
            setUserProfile(snap.data());
            // Self-heal the public evaluator directory: accounts that signed
            // up as evaluators before directory sync existed never got an
            // entry (entries were only written on later role *changes*), so
            // they were invisible to students. Read-guarded: one extra read
            // for evaluators on sign-in, a write only when the entry is
            // actually missing.
            const p = snap.data();
            if (p.role === 'evaluator') {
              try {
                const dirSnap = await getDoc(doc(db, 'publicEvaluators', firebaseUser.uid));
                if (!dirSnap.exists()) {
                  await upsertPublicEvaluator(firebaseUser.uid, {
                    name: p.name || '',
                    email: p.email || '',
                  });
                }
              } catch (e) {
                console.warn('Evaluator directory self-heal:', e.message);
              }
            }
          }
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
    // Directory entry at birth. Signup is a role-creation moment the sync
    // used to miss (entries were only written on later role *changes*), so a
    // fresh signup-as-evaluator stayed invisible to students. Best-effort:
    // the service logs failures; signup must not block on it.
    if (role === 'evaluator') {
      await upsertPublicEvaluator(cred.user.uid, { name, email });
      // Ping the admins so a new evaluator never goes unnoticed (server
      // verifies the claim and dedupes; silent no-op on localhost).
      postToAdmins({ kind: 'evaluator-signup', name, email, user: cred.user });
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
        // Directory entry at birth, same reason as in signup(): a first-time
        // Google profile with the evaluator role used to skip the directory.
        // Admins are also told about it, server-verified and deduped.
        if (role === 'evaluator') {
          await upsertPublicEvaluator(u.uid, { name: profile.name, email: profile.email });
          postToAdmins({ kind: 'evaluator-signup', name: profile.name, email: profile.email, user: u });
        }
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
      // Keep the public evaluator directory in sync with role changes — but
      // only for the account holder's own change. Name/email here resolve to
      // the *acting* user's data; when an admin changes someone else's role,
      // the caller (AdminPanel) does the directory write with that user's
      // real name/email, so this context must not overwrite it with the
      // admin's.
      const isSelf = user?.uid === uid;
      if (isSelf && role === 'evaluator') {
        await upsertPublicEvaluator(uid, {
          name: userProfile?.name || user?.displayName || '',
          email: userProfile?.email || user?.email || '',
        });
        // Tell the admins about the role gain too (server-verified +
        // deduped per day, so switching roles back and forth stays quiet).
        postToAdmins({
          kind: 'evaluator-role',
          name: userProfile?.name || user?.displayName || '',
          email: userProfile?.email || user?.email || '',
          user,
        });
      } else if (isSelf && role !== 'evaluator') {
        await removePublicEvaluator(uid);
      }
      if (isSelf) {
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
      // This is the path onboarding uses to commit the chosen persona, so it
      // must keep the evaluator directory in sync too: a student switching to
      // the evaluator persona here is a role *creation* just like Settings.
      // Name/email changes refresh the entry so it never goes stale.
      if ('role' in clean || 'name' in clean || 'email' in clean) {
        const nextProfile = { ...userProfile, ...clean };
        if (nextProfile.role === 'evaluator') {
          await upsertPublicEvaluator(uid, {
            name: nextProfile.name || user?.displayName || '',
            email: nextProfile.email || user?.email || '',
          });
        } else if ('role' in clean) {
          await removePublicEvaluator(uid);
        }
      }
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