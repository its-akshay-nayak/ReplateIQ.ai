import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PRODUCTION CONFIGURATION ---
// To make this app production ready:
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Enable Authentication (Email/Password)
// 4. Enable Firestore Database
// 5. Copy your config object below
// 6. Set USE_FIREBASE = true

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Toggle this to TRUE if you have added your valid config above
export const USE_FIREBASE = true; 

let app, auth, db;

if (USE_FIREBASE) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
}

export { auth, db };