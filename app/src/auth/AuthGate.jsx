import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser && location.pathname !== "/login") {
        // Not logged in → send to login
        navigate("/login");
      } else if (currentUser && location.pathname === "/login") {
        // Logged in but on login page → send home
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  if (loading) return <p>Loading...</p>;

  return children;
}

