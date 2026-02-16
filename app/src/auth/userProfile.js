// src/auth/userProfile.js
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  writeBatch,
} from "firebase/firestore";

function makeJoinCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function generateUniqueJoinCode() {
  let code = makeJoinCode(6);
  for (let i = 0; i < 10; i++) {
    const snap = await getDoc(doc(db, "joinCodes", code));
    if (!snap.exists()) return code;
    code = makeJoinCode(6);
  }
  return code;
}

/**
 * Create an org doc and its initial join code atomically.
 * IMPORTANT: We set joinCode on org creation so we do NOT need to update /orgs/{orgId}
 * before the user is a coordinator (avoids permission-denied).
 */
export async function createOrg({ name, orgType, employeeRange = null, createdBy }) {
  if (!name?.trim()) throw new Error("ORG_NAME_REQUIRED");
  if (!orgType) throw new Error("ORG_TYPE_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  const orgRef = doc(collection(db, "orgs"));
  const orgId = orgRef.id;

  const joinCode = await generateUniqueJoinCode();
  const joinRef = doc(db, "joinCodes", joinCode);

  const batch = writeBatch(db);

  // Org doc created with joinCode included up-front (allowed by org create rule)
  batch.set(orgRef, {
    name: name.trim(),
    type: orgType,
    employeeRange: employeeRange || null,
    createdAt: serverTimestamp(),
    createdBy,

    joinCode,
    joinCodeUpdatedAt: serverTimestamp(),
  });

  // Join code doc (allowed by joinCodes create rule)
  batch.set(joinRef, {
    orgId,
    active: true,
    createdAt: serverTimestamp(),
    createdBy, // MUST be string uid
  });

  await batch.commit();

  return { orgId, joinCode };
}

/**
 * Regenerate join code later (ONLY works once user is already a coordinator in that org),
 * because it updates /orgs/{orgId}. This should be called from coordinator-only UI.
 *
 * Pass oldCode if you want to delete the prior join code doc.
 */
export async function regenerateOrgJoinCode({ orgId, createdBy, oldCode = null }) {
  if (!orgId) throw new Error("ORG_ID_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  const newCode = await generateUniqueJoinCode();

  const batch = writeBatch(db);

  batch.set(doc(db, "joinCodes", newCode), {
    orgId,
    active: true,
    createdAt: serverTimestamp(),
    createdBy,
  });

  batch.update(doc(db, "orgs", orgId), {
    joinCode: newCode,
    joinCodeUpdatedAt: serverTimestamp(),
  });

  if (oldCode) {
    batch.delete(doc(db, "joinCodes", oldCode));
  }

  await batch.commit();

  return newCode;
}

/**
 * Validate invite code by reading joinCodes/{CODE}.
 * Returns org info so onboarding can write it into the user profile.
 */
export async function joinOrgByCode(inviteCodeRaw) {
  const code = (inviteCodeRaw || "").trim().toUpperCase();
  if (!code) throw new Error("INVITE_CODE_REQUIRED");

  const codeSnap = await getDoc(doc(db, "joinCodes", code));
  if (!codeSnap.exists()) {
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
    joinCode: orgData?.joinCode || code,
  };
}

/**
 * Upsert the logged-in user's profile under users/{uid}.
 * Always includes uid + email so it passes your rules.
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

      // If you want createdAt to only ever be set once, remove this line
      // and set createdAt only when you detect doc doesn't exist.
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}