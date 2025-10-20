import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRvU612Xh4GZzhfnH8mkrZyi2ctYvIF_4",
  authDomain: "projectplaybookauth-3c020.firebaseapp.com",
  projectId: "projectplaybookauth-3c020",
  storageBucket: "projectplaybookauth-3c020.firebasestorage.app",
  messagingSenderId: "74028554477",
  appId: "1:74028554477:web:6c4fba11754bb8aa1a94e4",
  measurementId: "G-2B8L1S5TE3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .catch(e => console.warn("Auth persistence not set:", e));