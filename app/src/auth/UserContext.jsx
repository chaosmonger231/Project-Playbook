import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// This holds { firebaseUser, profile, role, loading }
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error("Failed to load user profile", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        profile,

        // convenience fields
        role: profile?.role || null,
        orgId: profile?.orgId || null,
        orgType: profile?.orgType || null,   
        orgName: profile?.orgName || null,   

        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Hook we will use in other components
export function useUser() {
  return useContext(UserContext);
}