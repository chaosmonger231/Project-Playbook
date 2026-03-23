import { db } from "../auth/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Saves one HB96 submission under: orgs/{orgId}/attestations/{autoId}
 * Returns { submissionId }
 */
export async function saveHb96Attestation({
  orgId,
  uid,
  displayName,
  answers,
  notes,
  version = "hb96-v1",
}) {
  if (!orgId) throw new Error("Missing orgId");
  if (!uid) throw new Error("Missing uid");
  if (!displayName) throw new Error("Missing displayName");

  const ref = collection(db, "orgs", orgId, "attestations");

  const docRef = await addDoc(ref, {
    playbookId: "hb96",
    version,
    uid,
    displayName,
    answers: answers || {},
    notes: notes || "",
    createdAt: serverTimestamp(),

    // PDF pipeline starts as pending; AWS step will update later
    pdf: {
      status: "pending",
      storagePath: null,
      generatedAt: null,
    },
  });

  return { submissionId: docRef.id };
}