import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function SignOutButton({ className = "" }) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    try {
      setBusy(true);
      await signOut(auth);              // works for Email/Password and Google
      window.location.replace("/login"); // jump back to login
    } catch (e) {
      console.error("Sign out failed", e);
      setBusy(false);
      alert("Sign out failed. See console for details.");
    }
  }

  return (
    <button onClick={handleSignOut} disabled={busy} className={className}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
