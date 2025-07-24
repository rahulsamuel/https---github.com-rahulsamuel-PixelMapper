
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzjmFCbP-1n0TJsV6raYf7zXFSU-ufzU8",
  authDomain: "pixelmapper-3rrq2.firebaseapp.com",
  projectId: "pixelmapper-3rrq2",
  storageBucket: "pixelmapper-3rrq2.firebasestorage.app",
  messagingSenderId: "791582552511",
  appId: "1:791582552511:web:61af5f856bd0925f25310a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
