// src/firebase.ts


import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions'; // <-- Add this import
import { getStorage } from 'firebase/storage';

var APIKEY = "AIzaSyBTl0Jl9ZMQBA84LBbECwzUz5jcL4dYV3Y"
var AUTHDOMAIN = "mduwebsite1345.firebaseapp.com"
var PROJECTID = "mduwebsite1345"
var STORAGEBUCKET =  "mduwebsite1345.firebasestorage.app"
var MESSAGINGSENDERID = "653256711691"
var APPID =  "1:653256711691:web:5aca0f2e84ed19df90710e"
var VITE_ADMIN_PASSWORD= 'chuy1345'


const firebaseConfig = {
  apiKey: APIKEY,
  authDomain: AUTHDOMAIN,
  projectId: PROJECTID,
  storageBucket: STORAGEBUCKET,
  messagingSenderId: MESSAGINGSENDERID,
  appId: APPID
};
export const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); 
export const storage = getStorage(app);
export default app;