
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcyMsF-XMKl6Ef3HIso9HEp_MPcNPenoM",
  authDomain: "drrs-45d19.firebaseapp.com",
  projectId: "drrs-45d19",
  storageBucket: "drrs-45d19.firebasestorage.app",
  messagingSenderId: "257505899666",
  appId: "1:257505899666:web:3dbc1b68df88c5a3b0224b",
  measurementId: "G-BTDD14GVZR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;