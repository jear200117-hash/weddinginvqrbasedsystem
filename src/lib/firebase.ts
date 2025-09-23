import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration - works for both development and production
const firebaseConfig = {
  apiKey: "AIzaSyCX8qPzqPzqPzqPzqPzqPzqPzqPzqPzqPzq", // Replace with your actual API key
  authDomain: "weddingmanagement-e9c30.firebaseapp.com",
  projectId: "weddingmanagement-e9c30",
  storageBucket: "weddingmanagement-e9c30.appspot.com",
  messagingSenderId: "123456789", // Replace with your actual sender ID
  appId: "1:123456789:web:abcdef123456", // Replace with your actual app ID
  measurementId: "G-XXXXXXXXXX" // Replace with your actual measurement ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    // Connect to Firestore emulator (matches firebase-functions firestore emulator on 8085)
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    
    console.log('Connected to Firebase emulators');
  } catch (error) {
    // Emulators might already be connected or not available
    console.log('Firebase emulators already connected or not available:', error);
  }
}

export default app;

