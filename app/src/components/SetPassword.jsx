/*
// components/SetPasswordModal.jsx
import { useState } from "react";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function SetPasswordModal({ onClose }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in first.");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, cred);
      alert(" Password linked successfully! You can now log in with email/password.");
      onClose(); // hide modal
    } catch (e) {
      console.error("Link failed:", e);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-3 w-[320px]">
        <h2 className="text-lg font-semibold">Set a Password</h2>
        <p className="text-sm text-gray-600">Create a password to log in without Google next time.</p>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-gray-300 rounded-md w-full p-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {busy ? "Linking..." : "Save Password"}
        </button>

        <button type="button" onClick={onClose} className="w-full text-gray-600 text-sm mt-2">
          Skip for now
        </button>
      </form>
    </div>
  );
}

*/
