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
 * No org update needed during bootstrap (avoids permission errors).
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

  // Create org with joinCode included up front
  batch.set(orgRef, {
    name: name.trim(),
    type: orgType,
    employeeRange: employeeRange || null,
    createdAt: serverTimestamp(),
    createdBy,
    joinCode,
    joinCodeUpdatedAt: serverTimestamp(),
  });

  // Create join code document
  batch.set(joinRef, {
    orgId,
    active: true,
    createdAt: serverTimestamp(),
    createdBy,
  });

  await batch.commit();

  return { orgId, joinCode };
}

/**
 * Regenerate join code (coordinator-only usage after onboarding).
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
 * Participant join flow.
 * IMPORTANT FIX:
 * We DO NOT read /orgs/{orgId} here because the participant
 * is not yet a member and rules will block that read.
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

  // 🚨 DO NOT read org doc here
  return {
    orgId,
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

  await setDoc(
    userRef,
    {
      ...profileData,
      uid: currentUser.uid,
      email: currentUser.email || profileData.email || "",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}