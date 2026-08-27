// Firebase configuration for The Call Prayer Ministry
// Firestore-only architecture: Firebase Storage is intentionally NOT used.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHal2DBM6Lq-PU37MaJeVqFCDOI97Fb_s",
  authDomain: "thcphm.firebaseapp.com",
  projectId: "thcphm",
  storageBucket: "thcphm.firebasestorage.app",
  messagingSenderId: "419234993152",
  appId: "1:419234993152:web:e0cfc0d2cc62d09cf634e5",
  measurementId: "G-GF6CZT4EJW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics is optional so the site still works when opened in environments
// where Firebase Analytics is not supported.
let analytics = null;
isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
}).catch(() => {});

export { app, auth, db, analytics };
