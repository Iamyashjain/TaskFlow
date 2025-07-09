import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "studio-jr5x2.web.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase if the config is valid
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error('Firebase initialization error', e);
    }
} else {
    console.warn("Firebase configuration is incomplete. Firebase features will be disabled.");
}

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured. Please check your environment variables."));
  }
  // Catch and log the popup blocked error specifically
  return signInWithPopup(auth, provider).catch((error) => {
    if (error.code === 'auth/popup-blocked') {
      console.error('Popup blocked:', 'Please allow popups for this site to sign in with Google.');
      alert('Sign-in popup blocked by the browser. Please allow popups for this site.');
    }
    throw error; // Re-throw the error so it can be handled further up if needed
  });
};

export const signOut = () => {
    if (!auth) {
        return Promise.reject(new Error("Firebase is not configured."));
    }
    return firebaseSignOut(auth);
};

export { auth, db };
