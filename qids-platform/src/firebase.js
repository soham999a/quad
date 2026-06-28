import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const required = (key) => {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing Firebase config: ${key} in .env`);
  return val;
};

const firebaseConfig = {
  apiKey:            required('VITE_FIREBASE_API_KEY'),
  authDomain:        required('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         required('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     required('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             required('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;