import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create a new organization document.
 * Returns the new org's ID.
 */
export async function createOrg({ name, type, employeeCount, createdBy }) {
  const orgsCol = collection(db, "orgs");

  const docRef = await addDoc(orgsCol, {
    name,                        // "Evergreen Elementary School"
    type,                        // "k12" | "local_gov" | "small_business" | "individual"
    employeeCount: employeeCount ?? null,
    createdBy,                   // uid of coordinator
    createdAt: serverTimestamp(),
  });

  return docRef.id; // this is orgId
}

/**
 * Create or update a user profile document in "users/{uid}".
 */
export async function upsertUserProfile(user, extraData = {}) {
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? "",
      displayName: extraData.displayName ?? user.displayName ?? "",

      // canonical fields used by AccountPage + onboarding
      role: extraData.role ?? "coordinator", // default if not provided
      orgId: extraData.orgId ?? null,
      orgName: extraData.orgName ?? "",         
      department: extraData.department ?? "",   
      onboardingComplete: extraData.onboardingComplete ?? false,

      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true } 
  );
}
