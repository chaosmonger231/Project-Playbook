import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; 

export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Not logged in → only allow /login
      if (!currentUser) {
        setLoading(false);
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
        return;
      }

      // Logged in → check onboarding status in Firestore
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        const onboardingComplete = !!data.onboardingComplete;

        // If onboarding is NOT done, force them to /onboarding
        if (!onboardingComplete && location.pathname !== "/onboarding") {
          setLoading(false);
          navigate("/onboarding", { replace: true });
          return;
        }

        // If onboarding IS done but they are on /onboarding, push them home
        if (onboardingComplete && location.pathname === "/onboarding") {
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }

        // If onboarding IS done and they're on /login (somehow), send home
        if (onboardingComplete && location.pathname === "/login") {
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }

        setLoading(false);
      } catch (e) {
        console.error("AuthGate profile check failed:", e);
        // If something goes wrong reading profile, be safe and send to onboarding
        if (location.pathname !== "/onboarding") {
          navigate("/onboarding", { replace: true });
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  if (loading) return <p>Loading...</p>;

  return children;
}
