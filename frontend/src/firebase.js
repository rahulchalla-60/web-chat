import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ensure these match your .env variables exactly
const firebaseConfig = {
  apiKey: "AIzaSyBLMOAoKv-1zETFkdLsOy5r5zgZiggCiBk",
  authDomain: "web-chat-ce1ae.firebaseapp.com",
  projectId: "web-chat-ce1ae",
  storageBucket: "web-chat-ce1ae.firebasestorage.app",
  messagingSenderId: "234126522257",
  appId: "1:234126522257:web:f24b0c55756a44e5c1cc30",
  measurementId: "G-CJ4F1Z8GDZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);