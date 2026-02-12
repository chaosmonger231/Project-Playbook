import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generate a short join code (no confusing characters like 0/O/1/I).
 */
function generateJoinCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Create a new organization document.
 * Returns { orgId, joinCode }.
 */
export async function createOrg({
  name,
  type,
  employeeCount,
  employeeRange,
  createdBy,
}) {
  const orgsCol = collection(db, "orgs");

  // Try a few times to avoid rare joinCode collisions
  for (let attempt = 0; attempt < 6; attempt++) {
    const joinCode = generateJoinCode(6);

    // Check if joinCode is already used
    const q = query(orgsCol, where("joinCode", "==", joinCode), limit(1));
    const existing = await getDocs(q);
    if (!existing.empty) continue;

    const docRef = await addDoc(orgsCol, {
      name: (name || "").trim(),
      type, // "education" | "local_gov" | "small_business" (your keys)
      joinCode, // <-- org-level source of truth
      employeeCount: employeeCount ?? null, // optional legacy
      employeeRange: employeeRange ?? null, // recommended
      createdBy,
      createdAt: serverTimestamp(),
      joinCodeUpdatedAt: serverTimestamp(),
    });

    return { orgId: docRef.id, joinCode };
  }

  throw new Error("FAILED_TO_GENERATE_CODE");
}

/**
 * Participant: join an organization by joinCode.
 * Returns org info needed to attach user.
 */
export async function joinOrgByCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    const err = new Error("INVITE_CODE_REQUIRED");
    err.code = "INVITE_CODE_REQUIRED";
    throw err;
  }

  const orgsCol = collection(db, "orgs");
  const q = query(orgsCol, where("joinCode", "==", normalized), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    const err = new Error("ORG_NOT_FOUND");
    err.code = "ORG_NOT_FOUND";
    throw err;
  }

  const orgDoc = snap.docs[0];
  const org = orgDoc.data();

  return {
    orgId: orgDoc.id,
    orgName: org.name || "",
    orgType: org.type || "",
    employeeCount: org.employeeCount ?? null,
    employeeRange: org.employeeRange ?? "",
    joinCode: org.joinCode || normalized,
  };
}

/**
 * Coordinator: regenerate org joinCode (replaces the old one).
 * Returns the new joinCode.
 */
export async function regenerateOrgJoinCode(orgId) {
  if (!orgId) {
    const err = new Error("ORG_ID_REQUIRED");
    err.code = "ORG_ID_REQUIRED";
    throw err;
  }

  const orgRef = doc(db, "orgs", orgId);
  const orgSnap = await getDoc(orgRef);
  if (!orgSnap.exists()) {
    const err = new Error("ORG_NOT_FOUND");
    err.code = "ORG_NOT_FOUND";
    throw err;
  }

  const orgsCol = collection(db, "orgs");

  for (let attempt = 0; attempt < 6; attempt++) {
    const newCode = generateJoinCode(6);

    // Ensure uniqueness
    const q = query(orgsCol, where("joinCode", "==", newCode), limit(1));
    const existing = await getDocs(q);
    if (!existing.empty) continue;

    await updateDoc(orgRef, {
      joinCode: newCode,
      joinCodeUpdatedAt: serverTimestamp(),
    });

    return newCode;
  }

  throw new Error("FAILED_TO_GENERATE_CODE");
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

      // Canonical fields
      role: extraData.role ?? "participant",
      orgId: extraData.orgId ?? null,
      orgName: extraData.orgName ?? "",
      department: extraData.department ?? "",
      onboardingComplete: extraData.onboardingComplete ?? false,
      onboardingVersion: extraData.onboardingVersion ?? 2,

      // Targeting fields (optional)
      orgType: extraData.orgType ?? "",
      employeeCount: extraData.employeeCount ?? null,
      employeeRange: extraData.employeeRange ?? "",

      // Convenience (not source of truth, but helpful to show in UI)
      joinCode: extraData.joinCode ?? "",

      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}