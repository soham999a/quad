import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyDbv9f-N87iUpHKJfmrw1IGsgXuF0wl0jw",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "quad-3c3b9.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "quad-3c3b9",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "quad-3c3b9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "700989991048",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:700989991048:web:742b2d7c03942319b5173d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;