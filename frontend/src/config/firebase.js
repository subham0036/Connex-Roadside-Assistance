import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANPCCVZwzuKoJWP4f_snK7x9g3hRFkmXs",
  authDomain: "connex-76f37.firebaseapp.com",
  projectId: "connex-76f37",
  storageBucket: "connex-76f37.firebasestorage.app",
  messagingSenderId: "799690989287",
  appId: "1:799690989287:web:6dff3830e72cd27cd74c42",
  measurementId: "G-EC02LMWFJG"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Enable phone auth in all regions
firebaseAuth.languageCode = "en";
