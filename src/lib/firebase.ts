import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration for local development with emulators
const firebaseConfig = {
  apiKey: "dummy-api-key",
  authDomain: "weddingmanagement-e9c30.firebaseapp.com",
  projectId: "weddingmanagement-e9c30",
  storageBucket: "weddingmanagement-e9c30.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
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

