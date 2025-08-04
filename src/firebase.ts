// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions'; // <-- Add this import


const firebaseConfig = {
  apiKey: "AIzaSyBTl0Jl9ZMQBA84LBbECwzUz5jcL4dYV3Y",
  authDomain: "mduwebsite1345.firebaseapp.com",
  projectId: "mduwebsite1345",
  storageBucket: "mduwebsite1345.firebasestorage.app",
  messagingSenderId: "653256711691",
  appId: "1:653256711691:web:5aca0f2e84ed19df90710e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // <-- Export functions here