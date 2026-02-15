// src/auth/userProfile.js
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";

function makeJoinCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Create joinCodes/{CODE} and set orgs/{orgId}.joinCode = CODE
 */
export async function regenerateOrgJoinCode({ orgId, createdBy }) {
  if (!orgId) throw new Error("ORG_ID_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  let newCode = makeJoinCode(6);

  // ensure unique
  for (let i = 0; i < 8; i++) {
    const existsSnap = await getDoc(doc(db, "joinCodes", newCode));
    if (!existsSnap.exists()) break;
    newCode = makeJoinCode(6);
  }

  await setDoc(doc(db, "joinCodes", newCode), {
    orgId,
    active: true,
    createdAt: serverTimestamp(),
    createdBy,
  });

  await updateDoc(doc(db, "orgs", orgId), {
    joinCode: newCode,
    joinCodeUpdatedAt: serverTimestamp(),
  });

  return newCode;
}

/**
 * Create an org doc and generate its initial join code.
 * NOTE: This matches your Onboarding.jsx call signature.
 */
export async function createOrg({ name, orgType, employeeRange = null, createdBy }) {
  if (!name?.trim()) throw new Error("ORG_NAME_REQUIRED");
  if (!orgType) throw new Error("ORG_TYPE_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  const orgRef = doc(collection(db, "orgs"));
  const orgId = orgRef.id;

  await setDoc(orgRef, {
    name: name.trim(),
    type: orgType,
    employeeRange: employeeRange || null,
    createdAt: serverTimestamp(),
    createdBy,
  });

  const joinCode = await regenerateOrgJoinCode({ orgId, createdBy });
  return { orgId, joinCode };
}

/**
 * Validate invite code by reading joinCodes/{CODE}.
 * Returns org info (if available) so onboarding can write it into the user profile.
 */
export async function joinOrgByCode(inviteCodeRaw) {
  const code = (inviteCodeRaw || "").trim().toUpperCase();
  if (!code) throw new Error("INVITE_CODE_REQUIRED");

  const codeSnap = await getDoc(doc(db, "joinCodes", code));
  if (!codeSnap.exists()) {
    // your onboarding maps ORG_NOT_FOUND -> "not recognized"
    const err = new Error("ORG_NOT_FOUND");
    err.code = "ORG_NOT_FOUND";
    throw err;
  }

  const codeData = codeSnap.data();
  if (codeData.active === false) {
    const err = new Error("INVITE_CODE_INACTIVE");
    err.code = "INVITE_CODE_INACTIVE";
    throw err;
  }

  const orgId = codeData.orgId;
  if (!orgId) throw new Error("INVITE_CODE_MISSING_ORG");

  const orgSnap = await getDoc(doc(db, "orgs", orgId));
  const orgData = orgSnap.exists() ? orgSnap.data() : null;

  return {
    orgId,
    orgName: orgData?.name || "",
    orgType: orgData?.type || "",
    employeeRange: orgData?.employeeRange || "",
    joinCode: orgData?.joinCode || code, // org doc should have it
  };
}

/**
 * Upsert the logged-in user's profile under users/{uid}.
 * This matches your Onboarding.jsx usage exactly.
 */
export async function upsertUserProfile(currentUser, profileData) {
  if (!currentUser?.uid) throw new Error("USER_REQUIRED");

  const userRef = doc(db, "users", currentUser.uid);

  await setDoc(
    userRef,
    {
      ...profileData,
      uid: currentUser.uid,
      email: currentUser.email || profileData.email || "",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // harmless due to merge; keeps first write if you prefer
    },
    { merge: true }
  );

  return true;
}