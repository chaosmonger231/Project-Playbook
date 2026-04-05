import React, { useMemo, useState } from "react";
import "./Login.css";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../auth/firebase";

const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 12 characters",
    test: (value) => value.length >= 12,
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "At least 1 special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

function mapAuthError(error) {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/account-exists-with-different-sign-in-method":
      return "This email is already tied to a different sign-in method.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled before it completed.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/password-does-not-meet-requirements":
      return "Password must meet all of the requirements shown below.";
    case "auth/weak-password":
      return "Please choose a stronger password.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [mode, setMode] = useState("signin");
  const isCreateMode = mode === "create";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const passwordChecks = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  const passwordIsStrong = passwordChecks.every((rule) => rule.passed);

  const validateCreateAccount = () => {
    if (!email.trim()) return "Please enter your email address.";
    if (!password) return "Please enter a password.";
    if (!passwordIsStrong) {
      return "Password must meet all of the requirements shown below.";
    }
    if (!confirmPassword) return "Please confirm your password.";
    if (password !== confirmPassword) {
      return "Password and confirm password do not match.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setSubmitting(true);

    try {
      if (isCreateMode) {
        const validationMessage = validateCreateAccount();
        if (validationMessage) {
          setError(validationMessage);
          setSubmitting(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      navigate("/");
    } catch (e) {
      if (e.code === "auth/account-exists-with-different-sign-in-method") {
        try {
          const googleResult = await signInWithPopup(auth, provider);
          const credential = EmailAuthProvider.credential(email.trim(), password);
          await linkWithCredential(googleResult.user, credential);
          navigate("/");
        } catch (linkErr) {
          setError(`Linking failed: ${mapAuthError(linkErr)}`);
        }
      } else {
        setError(mapAuthError(e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setInfoMessage("");
    setSubmitting(true);

    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfoMessage("");

    if (!email.trim()) {
      setError("Enter your email address first, then click Forgot password.");
      return;
    }

    setResettingPassword(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMessage("Password reset email sent. Check your inbox.");
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setResettingPassword(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setInfoMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="login-page">
      <div
        className={`login-shell ${
          isCreateMode ? "login-shell--create" : "login-shell--signin"
        }`}
      >
        <div className="login-brand-panel">
          <div className="login-brand-visual">
            <img
              src="/images/projectplayboooklogov2.png"
              alt="Project Playbook"
              className="login-brand-image"
            />
          </div>

          <h1 className="login-brand-title">
            Cyber readiness for real organizations.
          </h1>

          <p className="login-brand-text">
            Training, playbooks, and readiness tools built for smaller
            organizations.
          </p>

          <div className="login-brand-card">
            <h3>What you can do inside Project Playbook</h3>
            <ul>
              <li>Work through cybersecurity training modules</li>
              <li>Review incident response and planning playbooks</li>
              <li>Track readiness and team progress</li>
              <li>Use practical tools designed for smaller organizations</li>
            </ul>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-card">
            <div
              className="login-mode-switch"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                className={mode === "signin" ? "login-mode-btn active" : "login-mode-btn"}
                onClick={() => switchMode("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === "create" ? "login-mode-btn active" : "login-mode-btn"}
                onClick={() => switchMode("create")}
              >
                Create Account
              </button>
            </div>

            <div className="login-form-header">
              <h2>{isCreateMode ? "Create your account" : "Welcome back"}</h2>
              <p>
                {isCreateMode
                  ? "Set up your Project Playbook account to continue."
                  : "Sign in to continue to your dashboard and playbooks."}
              </p>
            </div>

            {error ? <div className="login-alert login-alert--error">{error}</div> : null}
            {infoMessage ? (
              <div className="login-alert login-alert--info">{infoMessage}</div>
            ) : null}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-field-row">
                  <label htmlFor="password">Password</label>
                  {!isCreateMode ? (
                    <button
                      type="button"
                      className="login-link-btn"
                      onClick={handleForgotPassword}
                      disabled={resettingPassword || submitting}
                    >
                      {resettingPassword ? "Sending..." : "Forgot password?"}
                    </button>
                  ) : null}
                </div>

                <input
                  id="password"
                  type="password"
                  placeholder={isCreateMode ? "Create a strong password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isCreateMode ? "new-password" : "current-password"}
                  required
                />
              </div>

              {isCreateMode ? (
                <>
                  <div className="password-rules-card">
                    <div className="password-rules-title">Password requirements</div>
                    <ul className="password-rules-list">
                      {passwordChecks.map((rule) => (
                        <li
                          key={rule.id}
                          className={rule.passed ? "password-rule passed" : "password-rule"}
                        >
                          <span className="password-rule-indicator">
                            {rule.passed ? "✓" : "•"}
                          </span>
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="login-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <p className="login-agreement">
                    By creating an account, you agree to the{" "}
                    <Link to="/account-terms">Account Terms</Link>,{" "}
                    <Link to="/user-agreement">User Agreement</Link>, and{" "}
                    <Link to="/privacy-policy">Privacy Policy</Link>.
                  </p>
                </>
              ) : null}

              <button type="submit" className="login-primary-btn" disabled={submitting}>
                {submitting
                  ? isCreateMode
                    ? "Creating Account..."
                    : "Signing In..."
                  : isCreateMode
                  ? "Create Account"
                  : "Continue"}
              </button>

              <div className="login-divider">
                <hr />
                <span>OR</span>
                <hr />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="login-google-btn"
                disabled={submitting}
              >
                Continue with Google
              </button>
            </form>

            <p className="login-footer-text">
              {isCreateMode ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="login-inline-switch"
                    onClick={() => switchMode("signin")}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="login-inline-switch"
                    onClick={() => switchMode("create")}
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}