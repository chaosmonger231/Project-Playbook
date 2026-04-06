import { useMemo, useState } from "react";
import ContentPanel from "../components/ContentPanel";
import { useUser } from "../auth/UserContext";
import { useNavigate, Link } from "react-router-dom";

// Firestore
import { auth, db } from "../auth/firebase";
import {
  doc,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

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
        hint: "Majority of staff receive cybersecurity awareness training on a regular basis.",
      },
    ],
  },
  {
    id: "incident_preparedness",
    title: "B. Incident Preparedness",
    items: [
      {
        id: "ir_plan_documented",
        label: "Incident response plan documented",
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
        hint: "Ransomware-specific response steps are documented (containment, recovery, communications).",
      },
      {
        id: "backup_recovery_plan",
        label: "Backup / recovery plan documented",
        hint: "Backups and restore procedures exist and are tested periodically.",
      },
    ],
  },
  {
    id: "access_protection",
    title: "C. Access & Protection",
    items: [
      {
        id: "mfa_enabled_key_accounts",
        label: "Multi-factor authentication enabled for key accounts",
        hint: "MFA is enabled for important or sensitive accounts where practical.",
      },
      {
        id: "critical_systems_updated",
        label: "Critical systems are updated regularly",
        hint: "Important systems and software are patched and updated on a routine basis.",
      },
      {
        id: "protective_security_tools",
        label: "Protective security tools are in place",
        hint: "Security tools such as endpoint protection, firewalling, filtering, or monitoring are in use where appropriate.",
      },
    ],
  },
];

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_HB96_API_BASE;
  if (fromEnv) return String(fromEnv).replace(/\/+$/, "");
  return "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/prod";
}

function getSectionProgress(section, checked) {
  const total = section.items.length;
  const done = section.items.reduce((acc, item) => acc + (checked[item.id] ? 1 : 0), 0);
  return {
    total,
    done,
    percent: pct(done, total),
  };
}

export default function SecurityReadiness() {
  const [checked, setChecked] = useState(() => ({}));
  const [attestedByName, setAttestedByName] = useState("");
  const [notes, setNotes] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState("form");
  const [reportData, setReportData] = useState(null);

  const { orgId, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const { totalItems, checkedCount, readinessPct } = useMemo(() => {
    const all = CHECKLIST_V1.flatMap((c) => c.items);
    const total = all.length;
    const done = all.reduce((acc, it) => acc + (checked[it.id] ? 1 : 0), 0);
    return { totalItems: total, checkedCount: done, readinessPct: pct(done, total) };
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
    setStatus(null);

    const trimmed = attestedByName.trim();
    if (!trimmed) {
      setStatus({ type: "error", msg: "Please enter your name before saving an attestation." });
      scrollToTop();
      return;
    }
    if (userLoading) {
      setStatus({ type: "info", msg: "User profile is still loading. Try again in a second." });
      scrollToTop();
      return;
    }
    if (!auth.currentUser) {
      setStatus({ type: "error", msg: "You must be signed in to save." });
      scrollToTop();
      return;
    }
    if (!orgId) {
      setStatus({
        type: "error",
        msg: "No orgId on your user profile. Check Firestore: users/{uid}.orgId",
      });
      scrollToTop();
      return;
    }

    setIsModalOpen(true);
  }

  function closeConfirm() {
    if (!saving) setIsModalOpen(false);
  }

  async function requestHb96Pdf({ orgId, submissionId }) {
    const apiBase = getApiBase();

    const user = auth.currentUser;
    if (!user) throw new Error("User not signed in");

    const idToken = await user.getIdToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${apiBase}/hb96/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orgId, submissionId }),
        signal: controller.signal,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`AWS PDF request failed (${res.status}): ${text}`);

      try {
        return JSON.parse(text);
      } catch {
        return { ok: true };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  function resetForNewSubmission() {
    setChecked({});
    setAttestedByName("");
    setNotes("");
    setIsModalOpen(false);
    setSaving(false);
    setReportData(null);
    setMode("form");
    scrollToTop();
  }

  async function confirmSave() {
    setStatus(null);

    const trimmedName = attestedByName.trim();
    const uid = auth.currentUser?.uid;

    if (!trimmedName) {
      setStatus({ type: "error", msg: "Please enter your name before saving." });
      scrollToTop();
      return;
    }
    if (!uid) {
      setStatus({ type: "error", msg: "You must be signed in to save." });
      scrollToTop();
      return;
    }
    if (userLoading) {
      setStatus({ type: "info", msg: "User profile is still loading. Try again in a second." });
      scrollToTop();
      return;
    }
    if (!orgId) {
      setStatus({
        type: "error",
        msg: "No orgId on your user profile. Check Firestore: users/{uid}.orgId",
      });
      scrollToTop();
      return;
    }

    setSaving(true);

    const version = "hb96-v1";
    const createdAtUtcIso = new Date().toISOString();
    let submissionId = null;

    try {
      const attestationsRef = collection(db, "orgs", orgId, "attestations");
      const submissionDoc = await addDoc(attestationsRef, {
        playbookId: "hb96",
        version,
        createdAt: serverTimestamp(),
        createdAtUtcIso,
        uid,
        displayName: trimmedName,
        answers: { ...checked },
        notes: notes.trim() || "",
        pdf: {
          status: "pending",
          storagePath: null,
          generatedAt: null,
          downloadFileName: null,
        },
      });

      submissionId = submissionDoc.id;

      const batch = writeBatch(db);
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
              lastSubmissionId: submissionId,
              version,
            },
            { merge: true }
          );
        }
      }
      await batch.commit();

      setReportData({
        orgId,
        submissionId,
        createdAtUtcIso,
        attestedByName: trimmedName,
        notes: notes.trim() || "",
        checkedItems,
        uncheckedItems,
        checkedCount,
        totalItems,
        readinessPct,
      });

      try {
        await requestHb96Pdf({ orgId, submissionId });

        setStatus({
          type: "success",
          msg: (
            <span>
              Saved. Submission ID: <strong>{submissionId}</strong>. PDF generation started.{" "}
              <Link
                to="/organization?tab=attestations"
                style={{ fontWeight: 700, color: "rgba(59,130,246,0.95)" }}
              >
                Go to Team Management → Attestations
              </Link>{" "}
              to download this or previous PDF reports.
            </span>
          ),
        });
      } catch (err) {
        console.error("PDF generation request failed:", err);
        setStatus({
          type: "info",
          msg: (
            <span>
              Saved. Submission ID: <strong>{submissionId}</strong>. PDF request failed (check
              API/CORS/logs). You can still view this record in{" "}
              <Link
                to="/organization?tab=attestations"
                style={{ fontWeight: 700, color: "rgba(59,130,246,0.95)" }}
              >
                Team Management → Attestations
              </Link>
              .
            </span>
          ),
        });
      }

      setIsModalOpen(false);
      setMode("report");
      scrollToTop();
    } catch (e) {
      console.error("HB96 save failed:", e);
      setStatus({
        type: "error",
        msg: "Save failed. Check console and Firestore rules (permission-denied).",
      });
      scrollToTop();
    } finally {
      setSaving(false);
    }
  }

  const pageWrap = { display: "grid", gap: 16 };

  const banner = (type) => ({
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    background:
      type === "success"
        ? "rgba(16,185,129,0.12)"
        : type === "error"
        ? "rgba(239,68,68,0.10)"
        : "rgba(59,130,246,0.10)",
    color: "rgba(15,23,42,0.90)",
    fontSize: 13,
  });

  const card = {
    border: "1px solid rgba(15, 23, 42, 0.10)",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(2, 6, 23, 0.06)",
  };

  const subtleText = { color: "rgba(15, 23, 42, 0.65)", fontSize: 13 };

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
    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  };

  const textarea = { ...input, resize: "vertical" };

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

  const infoBadge = {
    width: 22,
    height: 22,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(59,130,246,0.18)",
    color: "rgba(15,23,42,0.82)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "default",
    flex: "0 0 auto",
  };

  const itemRow = (isChecked) => ({
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 140ms ease",
    border: isChecked ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(15, 23, 42, 0.10)",
    background: isChecked
      ? "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(34,197,94,0.08) 60%, rgba(255,255,255,0.85) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
    boxShadow: isChecked ? "0 14px 24px rgba(16,185,129,0.10)" : "0 10px 18px rgba(2,6,23,0.04)",
  });

  const attestationCard = {
    ...card,
    padding: 14,
    border: "1px solid rgba(59,130,246,0.18)",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(147,51,234,0.08) 45%, rgba(16,185,129,0.08) 100%)",
  };

  const twoCol = {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const hb96GuideCard = {
    ...card,
    padding: 18,
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
  };

  const hb96GuideList = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 14,
  };

  const hb96GuideItem = {
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    padding: 12,
  };

  const readinessGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  };

  const readinessPane = {
    ...card,
    padding: 16,
  };

  const paneBarTrack = {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,0.08)",
    overflow: "hidden",
    marginTop: 10,
  };

  const paneBarFill = (percent) => ({
    width: `${percent}%`,
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #22c55e 0%, #2563eb 100%)",
  });

  return (
    <ContentPanel>
      <div style={pageWrap}>
        {status ? <div style={banner(status.type)}>{status.msg}</div> : null}

        {mode === "report" ? (
          <div style={card}>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Submission saved</h2>
            <div style={subtleText}>
              Submission ID: <strong>{reportData?.submissionId}</strong>
            </div>
            <div style={{ ...subtleText, marginTop: 6 }}>
              Checked: {reportData?.checkedCount} / {reportData?.totalItems} ({reportData?.readinessPct}%)
            </div>

            <div style={{ marginTop: 12, ...card, background: "rgba(2,6,23,0.03)" }}>
              <div style={{ fontSize: 14 }}>
                <strong>Name:</strong> {reportData?.attestedByName || "(missing)"}
              </div>
              <div style={{ fontSize: 14, marginTop: 6 }}>
                <strong>Timestamp (UTC):</strong> {reportData?.createdAtUtcIso}
              </div>

              <div style={twoCol}>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(16,185,129,0.25)",
                    background: "rgba(16,185,129,0.08)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Checked</div>
                  <div style={{ display: "grid", gap: 6, maxHeight: 260, overflow: "auto", paddingRight: 6 }}>
                    {reportData?.checkedItems?.length ? (
                      reportData.checkedItems.map((it) => (
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
                  <div style={{ display: "grid", gap: 6, maxHeight: 260, overflow: "auto", paddingRight: 6 }}>
                    {reportData?.uncheckedItems?.length ? (
                      reportData.uncheckedItems.map((it) => (
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

              {reportData?.notes ? (
                <div style={{ fontSize: 14, marginTop: 12 }}>
                  <strong>Notes:</strong> {reportData.notes}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                style={btn}
                onClick={() => navigate("/organization?tab=attestations")}
                title="Downloads will be available under Team Management → Attestations"
              >
                Download PDF
              </button>

              <button
                type="button"
                style={btn}
                onClick={() => navigate("/organization?tab=attestations")}
              >
                Go to Team Management
              </button>

              <button type="button" style={primaryBtn} onClick={resetForNewSubmission}>
                Submit a new one
              </button>
            </div>
          </div>
        ) : null}

        {mode === "form" ? (
          <>
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
                <h1 style={{ margin: "20px 0 0 0" }}>Security Readiness (HB 96)</h1>
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

            <div style={hb96GuideCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(15,23,42,0.92)" }}>
                    What HB 96 is looking for
                  </div>
                  <div style={{ ...subtleText, marginTop: 4 }}>
                    This page helps your organization track practical readiness areas tied to basic cybersecurity program maturity, incident preparedness, and protective controls.
                  </div>
                </div>

                <span
                  style={infoBadge}
                  title="This is a practical trust-based readiness snapshot for internal tracking and planning. It is not a legal certification."
                >
                  i
                </span>
              </div>

              <div style={hb96GuideList}>
                <div style={hb96GuideItem}>
                  <div style={{ fontWeight: 800, color: "rgba(15,23,42,0.9)" }}>
                    Program & Training
                  </div>
                  <div style={{ ...subtleText, marginTop: 4 }}>
                    Cybersecurity program direction and regular staff awareness efforts.
                  </div>
                </div>

                <div style={hb96GuideItem}>
                  <div style={{ fontWeight: 800, color: "rgba(15,23,42,0.9)" }}>
                    Incident Preparedness
                  </div>
                  <div style={{ ...subtleText, marginTop: 4 }}>
                    Planning, reporting, ransomware response, and backup/recovery readiness.
                  </div>
                </div>

                <div style={hb96GuideItem}>
                  <div style={{ fontWeight: 800, color: "rgba(15,23,42,0.9)" }}>
                    Access & Protection
                  </div>
                  <div style={{ ...subtleText, marginTop: 4 }}>
                    MFA, updates, and practical protective security tools for key systems.
                  </div>
                </div>
              </div>
            </div>

            <div style={readinessGrid}>
              {CHECKLIST_V1.map((cat) => {
                const progress = getSectionProgress(cat, checked);

                return (
                  <div key={cat.id} style={readinessPane}>
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
                        {progress.done} / {progress.total}
                      </div>
                    </div>

                    <div style={paneBarTrack}>
                      <div style={paneBarFill(progress.percent)} />
                    </div>

                    <div style={{ ...subtleText, marginTop: 8 }}>
                      {progress.percent}% complete in this readiness area
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
                              <div style={{ fontWeight: 750, color: "rgba(15,23,42,0.92)" }}>
                                {it.label}
                              </div>
                              {it.hint ? (
                                <div style={{ ...subtleText, marginTop: 4 }}>{it.hint}</div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={attestationCard}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(15,23,42,0.88)" }}>
                    Attestation (required to save)
                  </div>
                  <div style={{ ...subtleText, marginTop: 4 }}>
                    Confirms alignment tracking, not legal certification. Only Coordinators can attest.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setChecked({});
                      setNotes("");
                      setStatus(null);
                      scrollToTop();
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
                    title={userLoading ? "Loading profile..." : !orgId ? "No orgId on user profile" : ""}
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
                onClick={() => navigate("/organization?tab=attestations")}
                style={{ fontWeight: 600, color: "rgba(59,130,246,0.85)", cursor: "pointer" }}
              >
                Team Management → Attestations
              </span>
              .
            </div>

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
                  <div style={{ color: "rgba(15,23,42,0.65)", fontSize: 13 }}>
                    You are confirming this checklist reflects your organization’s current alignment status. This is not a legal certification.
                  </div>

                  <div style={{ marginTop: 12, ...card, background: "rgba(2,6,23,0.03)" }}>
                    <div style={{ fontSize: 14 }}>
                      <strong>Name:</strong> {attestedByName.trim() || "(missing)"}
                    </div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>
                      <strong>Checked:</strong> {checkedCount} / {totalItems} ({readinessPct}%)
                    </div>

                    <div style={twoCol}>
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
          </>
        ) : null}
      </div>
    </ContentPanel>
  );
}