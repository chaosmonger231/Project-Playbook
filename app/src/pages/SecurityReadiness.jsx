// src/pages/SecurityReadiness.jsx
import { useMemo, useState } from "react";
import ContentPanel from "../components/ContentPanel";
import { useUser } from "../auth/UserContext";
import { useNavigate } from "react-router-dom";

// Firestore
import { auth, db } from "../auth/firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

const CHECKLIST_V1 = [
  {
    id: "program_training",
    title: "A. Program & Training",
    items: [
      {
        id: "program_adopted",
        label: "Cybersecurity program adopted",
        hint: "Organization has a defined cybersecurity program (policy/process) in place.",
      },
      {
        id: "employee_training",
        label: "Employee training conducted",
        hint: "Staff receive cybersecurity awareness training on a regular basis.",
      },
    ],
  },
  {
    id: "incident_preparedness",
    title: "B. Incident Preparedness",
    items: [
      {
        id: "ir_plan_documented",
        label: "Incident Response Plan documented",
        hint: "An incident response plan exists and is accessible to the right people.",
      },
      {
        id: "incident_reporting_procedure",
        label: "Incident reporting procedure defined",
        hint: "Clear steps for reporting incidents (who/where/how) are defined.",
      },
      {
        id: "ransomware_response_policy",
        label: "Ransomware response policy documented",
        hint: "Ransomware-specific response steps are documented (containment, recovery, comms).",
      },
      {
        id: "backup_recovery_plan",
        label: "Backup / recovery plan documented",
        hint: "Backups and restore procedures exist and are tested periodically.",
      },
    ],
  },
];

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function SecurityReadiness() {
  const [checked, setChecked] = useState(() => ({})); // { [itemId]: boolean }
  const [attestedByName, setAttestedByName] = useState("");
  const [notes, setNotes] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { orgId, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const { totalItems, checkedCount, readinessPct } = useMemo(() => {
    const all = CHECKLIST_V1.flatMap((c) => c.items);
    const total = all.length;
    const done = all.reduce((acc, it) => acc + (checked[it.id] ? 1 : 0), 0);
    return {
      totalItems: total,
      checkedCount: done,
      readinessPct: pct(done, total),
    };
  }, [checked]);

  const { checkedItems, uncheckedItems } = useMemo(() => {
    const all = CHECKLIST_V1.flatMap((c) =>
      c.items.map((it) => ({ ...it, category: c.title }))
    );
    return {
      checkedItems: all.filter((it) => !!checked[it.id]),
      uncheckedItems: all.filter((it) => !checked[it.id]),
    };
  }, [checked]);

  function toggle(itemId) {
    setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  function openConfirm() {
    const trimmed = attestedByName.trim();
    if (!trimmed) {
      alert("Please enter your name before saving an attestation.");
      return;
    }
    setIsModalOpen(true);
  }

  function closeConfirm() {
    if (!saving) setIsModalOpen(false);
  }

  async function confirmSave() {
    const trimmedName = attestedByName.trim();
    const uid = auth.currentUser?.uid;

    if (!trimmedName) {
      alert("Please enter your name before saving.");
      return;
    }
    if (!uid) {
      alert("You must be signed in to save.");
      return;
    }
    if (userLoading) {
      alert("User profile is still loading. Try again in a second.");
      return;
    }
    if (!orgId) {
      alert("No orgId on your user profile. Check Firestore: users/{uid}.orgId");
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);

      // Writes: orgs/{orgId}/hb96/{requirementId}
      for (const cat of CHECKLIST_V1) {
        for (const it of cat.items) {
          const ref = doc(db, "orgs", orgId, "hb96", it.id);
          batch.set(
            ref,
            {
              value: !!checked[it.id],
              attestedByName: trimmedName,
              attestedByUid: uid,
              notes: notes.trim() || "",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      await batch.commit();
      setIsModalOpen(false);
      alert("Saved to Firestore.");
    } catch (e) {
      console.error("HB96 save failed:", e);
      alert("Save failed. Check console and Firestore rules (permission-denied).");
    } finally {
      setSaving(false);
    }
  }

  // ---- Modernized styles (no external CSS required) ----
  const pageWrap = { display: "grid", gap: 16 };

  const card = {
    border: "1px solid rgba(15, 23, 42, 0.10)",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(2, 6, 23, 0.06)",
  };

  const subtleText = { color: "rgba(15, 23, 42, 0.65)", fontSize: 13 };

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(2, 6, 23, 0.04)",
    border: "1px solid rgba(2, 6, 23, 0.06)",
    fontSize: 12,
    color: "rgba(15, 23, 42, 0.75)",
  };

  const statCard = {
    ...card,
    minWidth: 260,
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(16,185,129,0.10) 45%, rgba(59,130,246,0.10) 100%)",
    border: "1px solid rgba(99,102,241,0.18)",
  };

  const input = {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.16)",
    outline: "none",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  };

  const textarea = {
    ...input,
    resize: "vertical",
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(2, 6, 23, 0.06)",
  };

  const primaryBtn = {
    ...btn,
    border: "1px solid rgba(99,102,241,0.30)",
    color: "rgba(15,23,42,0.95)",
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(16,185,129,0.18) 100%)",
    opacity: saving ? 0.75 : 1,
    cursor: saving ? "not-allowed" : "pointer",
  };

  const itemRow = (isChecked) => ({
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 140ms ease",
    border: isChecked
      ? "1px solid rgba(16, 185, 129, 0.35)"
      : "1px solid rgba(15, 23, 42, 0.10)",
    background: isChecked
      ? "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(34,197,94,0.08) 60%, rgba(255,255,255,0.85) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
    boxShadow: isChecked
      ? "0 14px 24px rgba(16,185,129,0.10)"
      : "0 10px 18px rgba(2,6,23,0.04)",
  });

  const attestationCard = {
    ...card,
    padding: 14,
    border: "1px solid rgba(59,130,246,0.18)",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(147,51,234,0.08) 45%, rgba(16,185,129,0.08) 100%)",
  };

  return (
    <ContentPanel>
      <div style={pageWrap}>
        {/* Header + Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={pill}>Security Readiness</div>
            <h2 style={{ margin: "10px 0 0 0" }}>Security Readiness (HB 96)</h2>
            <div style={{ ...subtleText, marginTop: 6 }}>
              Trust-based alignment tracking. No uploads. No compliance certification language.
            </div>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: 13, marginBottom: 6, color: "rgba(15,23,42,0.78)" }}>
              <strong>Readiness</strong>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {readinessPct}%
            </div>
            <div style={{ ...subtleText, marginTop: 6 }}>
              {checkedCount} of {totalItems} items checked
            </div>
          </div>
        </div>

        {/* Checklist */}
        {CHECKLIST_V1.map((cat) => (
          <div key={cat.id} style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>{cat.title}</h3>
              <div style={subtleText}>
                {cat.items.reduce((acc, it) => acc + (checked[it.id] ? 1 : 0), 0)} / {cat.items.length}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {cat.items.map((it) => {
                const isChecked = !!checked[it.id];
                return (
                  <label key={it.id} style={itemRow(isChecked)}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(it.id)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 750, color: "rgba(15,23,42,0.92)" }}>{it.label}</div>
                      {it.hint ? <div style={{ ...subtleText, marginTop: 4 }}>{it.hint}</div> : null}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Attestation (bottom) */}
        <div style={attestationCard}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 240, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(15,23,42,0.88)" }}>
                Attestation (required to save)
              </div>
              <div style={{ ...subtleText, marginTop: 4 }}>
                Confirms alignment tracking, not legal certification.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setChecked({});
                  setNotes("");
                }}
                style={btn}
              >
                Reset (local)
              </button>

              <button
                type="button"
                onClick={openConfirm}
                style={primaryBtn}
                disabled={saving || userLoading || !orgId}
                title={
                    userLoading
                    ? "Loading profile..."
                    : !orgId
                    ? "No orgId on user profile"
                    : ""
                }
                >
                Save Attestation
                </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1.05fr 1.2fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,0.80)" }}>
                Attested by
              </label>
              <input
                value={attestedByName}
                onChange={(e) => setAttestedByName(e.target.value)}
                placeholder="Your name"
                style={input}
              />
              <div style={{ ...subtleText, marginTop: 6 }}>Your entries are saved when you confirm.</div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,0.80)" }}>
                Optional notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add brief notes (optional)…"
                rows={2}
                style={textarea}
              />
              <div style={{ ...subtleText, marginTop: 6 }}>
                Keep notes high-level. Do not paste incident details.
              </div>
            </div>
          </div>
        </div>
        <div
            style={{
                marginTop: 14,
                fontSize: 12,
                color: "rgba(15,23,42,0.55)",
                borderTop: "1px solid rgba(15,23,42,0.08)",
                paddingTop: 10,
            }}
            >
            Previous saves can be found under{" "}
            <span
                onClick={() => navigate("/")}
                style={{
                fontWeight: 600,
                color: "rgba(59,130,246,0.85)",
                cursor: "pointer",
                }}
            >
                Team Management
            </span>{" "}
            on the Home page.
            </div>

        {/* Modal */}
        {isModalOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2,6,23,0.55)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 50,
            }}
            onClick={closeConfirm}
          >
            <div
              style={{
                width: "min(560px, 100%)",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderRadius: 18,
                padding: 16,
                boxShadow: "0 16px 60px rgba(2,6,23,0.30)",
                border: "1px solid rgba(99,102,241,0.22)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0, marginBottom: 6 }}>Confirm attestation</h3>
              <div style={subtleText}>
                You are confirming this checklist reflects your organization’s current alignment status. This is not a legal certification.
              </div>

              <div style={{ marginTop: 12, ...card, background: "rgba(2,6,23,0.03)" }}>
                <div style={{ fontSize: 14 }}>
                  <strong>Name:</strong> {attestedByName.trim() || "(missing)"}
                </div>
                <div style={{ fontSize: 14, marginTop: 6 }}>
                  <strong>Checked:</strong> {checkedCount} / {totalItems} ({readinessPct}%)
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(16,185,129,0.25)",
                      background: "rgba(16,185,129,0.08)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Checked</div>
                    <div style={{ display: "grid", gap: 6, maxHeight: 180, overflow: "auto", paddingRight: 6 }}>
                      {checkedItems.length ? (
                        checkedItems.map((it) => (
                          <div key={it.id} style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 700 }}>{it.category}:</span> {it.label}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)" }}>None selected.</div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(239,68,68,0.20)",
                      background: "rgba(239,68,68,0.06)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Not checked</div>
                    <div style={{ display: "grid", gap: 6, maxHeight: 180, overflow: "auto", paddingRight: 6 }}>
                      {uncheckedItems.length ? (
                        uncheckedItems.map((it) => (
                          <div key={it.id} style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 700 }}>{it.category}:</span> {it.label}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)" }}>All selected.</div>
                      )}
                    </div>
                  </div>
                </div>

                {notes.trim() ? (
                  <div style={{ fontSize: 14, marginTop: 10 }}>
                    <strong>Notes:</strong> {notes.trim()}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={closeConfirm} style={btn} disabled={saving}>
                  Cancel
                </button>
                <button type="button" onClick={confirmSave} style={primaryBtn} disabled={saving}>
                  {saving ? "Saving..." : "Confirm and Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ContentPanel>
  );
}