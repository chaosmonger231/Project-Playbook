import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return null;               // or a spinner
  if (!user) { window.location.replace("/login.html"); return null; }
  return children;
}
