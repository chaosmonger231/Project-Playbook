import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../auth/firebase";

/**
 * Get training mode for org.
 * Falls back to "open" if settings doc is missing or invalid.
 */
export async function getTrainingMode(orgId) {
  if (!orgId) return "open";

  try {
    const ref = doc(db, "orgs", orgId, "settings", "training");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return "open";
    }

    const data = snap.data() || {};
    return data.trainingMode === "controlled" ? "controlled" : "open";
  } catch (err) {
    console.error("Error getting training mode:", err);
    return "open";
  }
}

/**
 * Convert durationKey -> milliseconds.
 */
export function getDurationMs(durationKey) {
  switch (durationKey) {
    case "1_week":
      return 7 * 24 * 60 * 60 * 1000;
    case "1_month":
      return 30 * 24 * 60 * 60 * 1000;
    case "3_months":
      return 90 * 24 * 60 * 60 * 1000;
    case "6_months":
      return 180 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Compute end date from start + duration.
 */
export function computeEndAt(startAt, durationKey) {
  if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
    return null;
  }

  const ms = getDurationMs(durationKey);
  if (!ms) return null;

  return new Date(startAt.getTime() + ms);
}

/**
 * Normalize Firestore Timestamp / Date / string into JS Date.
 */
export function toJsDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d?.getTime?.()) ? null : d;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Check if playbook is currently active.
 */
export function isPlaybookActive(playbook) {
  if (!playbook || playbook.isActive !== true) return false;

  const start = toJsDate(playbook.startAt);
  const end = toJsDate(playbook.endAt);
  if (!start || !end) return false;

  const now = new Date();
  return now >= start && now <= end;
}

/**
 * Read all playbooks for an org.
 */
export async function getOrgPlaybooks(orgId) {
  if (!orgId) return [];

  try {
    const ref = collection(db, "orgs", orgId, "playbooks");
    const snap = await getDocs(ref);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.error("Error getting org playbooks:", err);
    return [];
  }
}

/**
 * Returns active playbooks only.
 */
export async function getActivePlaybooks(orgId) {
  const all = await getOrgPlaybooks(orgId);
  return all.filter(isPlaybookActive);
}

/**
 * Returns the first active playbook containing the given moduleId.
 * If none exists, returns null.
 */
export async function getActivePlaybookForModule(orgId, moduleId) {
  if (!orgId || !moduleId) return null;

  const active = await getActivePlaybooks(orgId);

  for (const playbook of active) {
    const moduleIds = Array.isArray(playbook.moduleIds) ? playbook.moduleIds : [];
    if (moduleIds.includes(moduleId)) {
      return playbook;
    }
  }

  return null;
}

/**
 * Returns true if a module is allowed under current training mode.
 *
 * open mode:
 * - allowed
 *
 * controlled mode:
 * - requires an active playbook containing the module
 */
export async function canAccessModuleByTrainingMode(orgId, moduleId) {
  if (!orgId || !moduleId) {
    return {
      allowed: false,
      trainingMode: "open",
      playbook: null,
      reason: "missing_context",
    };
  }

  const trainingMode = await getTrainingMode(orgId);

  if (trainingMode === "open") {
    return {
      allowed: true,
      trainingMode,
      playbook: null,
      reason: "open_mode",
    };
  }

  const playbook = await getActivePlaybookForModule(orgId, moduleId);

  if (playbook) {
    return {
      allowed: true,
      trainingMode,
      playbook,
      reason: "active_playbook",
    };
  }

  return {
    allowed: false,
    trainingMode,
    playbook: null,
    reason: "no_active_playbook",
  };
}