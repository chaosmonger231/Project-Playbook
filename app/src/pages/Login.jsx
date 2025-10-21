import React, { useState } from "react";
import "./Login.css";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  linkWithCredential,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  // Persist auth in browser session only
  setPersistence(auth, browserSessionPersistence);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (createNew) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (e) {
      if (e.code === "auth/account-exists-with-different-sign-in-method") {
        try {
          const googleResult = await signInWithPopup(auth, provider);
          const credential = EmailAuthProvider.credential(email, password);
          await linkWithCredential(googleResult.user, credential);
          alert("Accounts linked! You can now log in either way.");
          navigate("/");
        } catch (linkErr) {
          console.error("Link failed:", linkErr);
          setError("Linking failed: " + linkErr.message);
        }
      } else {
        setError(e.message || "Authentication failed");
      }
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const newPassword = prompt(
        "Set a password so you can log in with email later (optional):"
      );
      if (newPassword) {
        const cred = EmailAuthProvider.credential(user.email, newPassword);
        await linkWithCredential(user, cred);
        alert("Password added! You can now log in with email/password too.");
      }
      navigate("/");
    } catch (e) {
      setError(e.message || "Google sign-in failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Project Playbook</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {createNew ? "Create Account" : "Continue"}
          </button>

          <div className="divider">
            <hr /> <span>OR</span> <hr />
          </div>

          <button type="button" onClick={handleGoogle} className="google-btn">
            Continue with Google
          </button>

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={createNew}
                onChange={() => setCreateNew(!createNew)}
              />
              Create a new account
            </label>
          </div>

          <div className="error-text">{error}</div>
          <p className="hint">You'll be redirected after signing in.</p>
        </form>
      </div>
    </div>
  );
}
