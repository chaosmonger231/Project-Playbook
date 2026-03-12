// src/auth/userProfile.js
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  writeBatch,
} from "firebase/firestore";

function makeJoinCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
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
 * IMPORTANT:
 * We store org snapshot fields on the join code doc so participants
 * can resolve orgName/orgType without reading /orgs/{orgId} before membership.
 */
export async function createOrg({ name, orgType, employeeRange = null, createdBy }) {
  if (!name?.trim()) throw new Error("ORG_NAME_REQUIRED");
  if (!orgType) throw new Error("ORG_TYPE_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  const trimmedName = name.trim();

  const orgRef = doc(collection(db, "orgs"));
  const orgId = orgRef.id;

  const joinCode = await generateUniqueJoinCode();
  const joinRef = doc(db, "joinCodes", joinCode);

  const batch = writeBatch(db);

  batch.set(orgRef, {
    name: trimmedName,
    type: orgType,
    employeeRange: employeeRange || null,
    createdAt: serverTimestamp(),
    createdBy,
    joinCode,
    joinCodeUpdatedAt: serverTimestamp(),
  });

  batch.set(joinRef, {
    orgId,
    orgName: trimmedName,
    orgType,
    employeeRange: employeeRange || null,
    active: true,
    createdAt: serverTimestamp(),
    createdBy,
  });

  await batch.commit();

  return { orgId, joinCode };
}

/**
 * Regenerate join code (coordinator-only usage after onboarding).
 * IMPORTANT:
 * New join code doc also carries org snapshot fields so future participants
 * can join without needing a direct org read first.
 */
export async function regenerateOrgJoinCode({ orgId, createdBy, oldCode = null }) {
  if (!orgId) throw new Error("ORG_ID_REQUIRED");
  if (!createdBy) throw new Error("CREATED_BY_REQUIRED");

  const orgRef = doc(db, "orgs", orgId);
  const orgSnap = await getDoc(orgRef);
  if (!orgSnap.exists()) throw new Error("ORG_NOT_FOUND");

  const orgData = orgSnap.data() || {};
  const newCode = await generateUniqueJoinCode();
  const batch = writeBatch(db);

  batch.set(doc(db, "joinCodes", newCode), {
    orgId,
    orgName: orgData.name || "",
    orgType: orgData.type || "",
    employeeRange: orgData.employeeRange || null,
    active: true,
    createdAt: serverTimestamp(),
    createdBy,
  });

  batch.update(orgRef, {
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
 * Participant join flow.
 * IMPORTANT:
 * We resolve org snapshot data from /joinCodes/{code}, not /orgs/{orgId},
 * because participants may not be allowed to read the org doc yet.
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

  const codeData = codeSnap.data() || {};

  if (codeData.active === false) {
    const err = new Error("INVITE_CODE_INACTIVE");
    err.code = "INVITE_CODE_INACTIVE";
    throw err;
  }

  const orgId = codeData.orgId;
  if (!orgId) throw new Error("INVITE_CODE_MISSING_ORG");

  return {
    orgId,
    orgName: codeData.orgName || "",
    orgType: codeData.orgType || "",
    employeeRange: codeData.employeeRange || "",
    joinCode: code,
  };
}

/**
 * Upsert the logged-in user's profile under users/{uid}.
 * Always includes uid + email to satisfy rules.
 */
export async function upsertUserProfile(currentUser, profileData) {
  if (!currentUser?.uid) throw new Error("USER_REQUIRED");

  const userRef = doc(db, "users", currentUser.uid);
  const existingSnap = await getDoc(userRef);
  const alreadyExists = existingSnap.exists();

  await setDoc(
    userRef,
    {
      ...profileData,
      uid: currentUser.uid,
      email: currentUser.email || profileData.email || "",
      updatedAt: serverTimestamp(),
      ...(alreadyExists ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return true;
}

/**
 * Optional helper for repairing old users who have orgId but no orgName.
 * Safe to call after a user is already linked to an org.
 */
export async function backfillUserOrgFieldsFromOrg({ uid, orgId }) {
  if (!uid) throw new Error("UID_REQUIRED");
  if (!orgId) throw new Error("ORG_ID_REQUIRED");

  const orgSnap = await getDoc(doc(db, "orgs", orgId));
  if (!orgSnap.exists()) throw new Error("ORG_NOT_FOUND");

  const orgData = orgSnap.data() || {};

  await updateDoc(doc(db, "users", uid), {
    orgName: orgData.name || "",
    orgType: orgData.type || "",
    employeeRange: orgData.employeeRange || "",
    updatedAt: serverTimestamp(),
  });

  return {
    orgName: orgData.name || "",
    orgType: orgData.type || "",
    employeeRange: orgData.employeeRange || "",
  };
}