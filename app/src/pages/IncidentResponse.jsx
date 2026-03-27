import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import ContentPanel from "../components/ContentPanel";
import { db } from "../auth/firebase";
import { auth } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

const INCIDENT_RESPONSE_GENERATE_URL =
  "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/incidentresponse/generate-pdf";
const INCIDENT_RESPONSE_DOWNLOAD_URL =
  "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/incidentresponse/download-url";

const PHASES = [
  { id: "preparation", label: "Preparation", short: "1" },
  { id: "detection", label: "Detection & Analysis", short: "2" },
  { id: "containment", label: "Containment", short: "3" },
  { id: "recovery", label: "Eradication & Recovery", short: "4" },
  { id: "review", label: "Post-Incident Review", short: "5" },
];

const DEFAULT_INCIDENT_RESPONSE = {
  title: "Incident Response Plan",
  subtitle:
    "Use this page to define how your organization prepares for, responds to, and recovers from cybersecurity incidents.",
  quickActions: [
    "Notify the primary incident contact immediately",
    "Isolate affected systems or accounts if needed",
    "Preserve logs, screenshots, and other evidence",
    "Assess the scope and business impact",
    "Determine whether internal or external reporting is required",
  ],
  reporting: {
    mode: "ohio_hb96",
    custom: {
      internalEscalation: "Immediately upon discovery",
      dpsTimeline: "",
      auditorTimeline: "",
      notes:
        "Use your organization’s own reporting procedures and timelines here.",
    },
    ohioGuided: {
      internalEscalation:
        "Immediately upon discovery. Notify the incident lead and technical team without delay.",
      dpsTimeline:
        "Report confirmed cybersecurity incidents to appropriate state authorities within 7 days when applicable.",
      auditorTimeline:
        "Report incidents affecting financial systems, public records, or operations to the Auditor of State within 30 days when applicable.",
      notes:
        "This section includes Ohio-focused reporting guidance as a starting point. Your organization is responsible for reviewing and confirming that all reporting details, timelines, and contacts are accurate and current before relying on this information.",
    },
  },
  contacts: [
    {
      name: "",
      role: "Primary Incident Contact",
      phone: "",
      email: "",
      notes: "",
    },
    {
      name: "",
      role: "Technical Lead",
      phone: "",
      email: "",
      notes: "",
    },
    {
      name: "",
      role: "Leadership / Executive Contact",
      phone: "",
      email: "",
      notes: "",
    },
    {
      name: "",
      role: "Communications Contact",
      phone: "",
      email: "",
      notes: "",
    },
    {
      name: "",
      role: "External / Vendor Contact",
      phone: "",
      email: "",
      notes: "",
    },
  ],
  pdf: {
    status: "idle",
    storagePath: "",
    generatedAt: null,
    downloadFileName: "incident-response-plan.pdf",
    errorMessage: "",
  },
  phases: {
    preparation: {
      title: "Preparation",
      description:
        "Define responsibilities, critical systems, support resources, and readiness steps before an incident occurs.",
      fields: {
        criticalSystems:
          "List the most important systems, services, and data that should be prioritized during an incident.",
        incidentLead:
          "Identify who leads the incident response process and who can make response decisions.",
        backupReadiness:
          "Describe where backups are stored, how often they are verified, and how recovery would be performed.",
        externalSupport:
          "List any outside support such as IT vendors, legal counsel, cyber insurance contacts, or communications support.",
        preparationNotes:
          "Add any preparation notes, decision authority details, or readiness gaps.",
      },
    },
    detection: {
      title: "Detection & Analysis",
      description:
        "Document how incidents are identified, what should be recorded, and how scope is assessed.",
      fields: {
        detectionSources:
          "Describe how incidents may be detected, such as staff reporting, alerts, monitoring tools, vendor notifications, or unusual account activity.",
        initialTriage:
          "Describe the first triage steps to determine what happened and whether the event is credible.",
        evidenceCollection:
          "Describe what evidence should be collected and preserved, such as logs, screenshots, suspicious emails, timestamps, filenames, IPs, and user reports.",
        impactAssessment:
          "Describe how your organization will determine affected users, systems, services, or data.",
        detectionNotes:
          "Add additional notes for analysis, tracking, or documentation expectations.",
      },
    },
    containment: {
      title: "Containment",
      description:
        "Define how to limit damage, isolate affected assets, and prevent spread while preserving evidence.",
      fields: {
        isolationSteps:
          "Describe how affected devices, systems, or accounts should be isolated safely.",
        accountControls:
          "Describe when passwords should be reset, accounts disabled, or sessions revoked.",
        temporarySafeguards:
          "Describe any temporary firewall rules, network blocks, or access restrictions that may be used.",
        communicationSteps:
          "Describe who should be notified internally during containment and how status updates should be shared.",
        containmentNotes:
          "Add additional containment notes, caveats, or escalation triggers.",
      },
    },
    recovery: {
      title: "Eradication & Recovery",
      description:
        "Define how threats are removed, services are restored, and business operations are safely resumed.",
      fields: {
        eradicationSteps:
          "Describe how malware, unauthorized access, or malicious persistence will be removed.",
        restorationPlan:
          "Describe how systems will be rebuilt, restored from backup, or returned to service.",
        validationChecks:
          "Describe what checks must happen before systems are considered safe to return to operation.",
        ransomwareGuidance:
          "Describe your organization’s position on ransom payment, approvals, and legal or policy requirements.",
        recoveryNotes:
          "Add recovery notes, communications needs, or service restoration priorities.",
      },
    },
    review: {
      title: "Post-Incident Review",
      description:
        "Capture lessons learned, control gaps, and improvements after the incident is stabilized.",
      fields: {
        rootCause:
          "Describe how root cause will be assessed and documented after the incident.",
        lessonsLearned:
          "Describe what should be reviewed with staff, leadership, or partners after the incident.",
        policyGaps:
          "Describe what gaps in policy, tooling, staffing, or communication should be recorded.",
        trainingNeeds:
          "Describe what training or awareness improvements should follow the incident.",
        reviewNotes:
          "Add any post-incident improvement notes or action items.",
      },
    },
  },
};

function mergePlanData(data) {
  return {
    ...DEFAULT_INCIDENT_RESPONSE,
    ...data,
    reporting: {
      ...DEFAULT_INCIDENT_RESPONSE.reporting,
      ...(data?.reporting || {}),
      custom: {
        ...DEFAULT_INCIDENT_RESPONSE.reporting.custom,
        ...(data?.reporting?.custom || {}),
      },
      ohioGuided: {
        ...DEFAULT_INCIDENT_RESPONSE.reporting.ohioGuided,
        ...(data?.reporting?.ohioGuided || {}),
      },
    },
    pdf: {
      ...DEFAULT_INCIDENT_RESPONSE.pdf,
      ...(data?.pdf || {}),
    },
    contacts:
      Array.isArray(data?.contacts) && data.contacts.length > 0
        ? data.contacts
        : DEFAULT_INCIDENT_RESPONSE.contacts,
    quickActions:
      Array.isArray(data?.quickActions) && data.quickActions.length > 0
        ? data.quickActions
        : DEFAULT_INCIDENT_RESPONSE.quickActions,
    phases: PHASES.reduce((acc, phase) => {
      acc[phase.id] = {
        ...DEFAULT_INCIDENT_RESPONSE.phases[phase.id],
        ...(data?.phases?.[phase.id] || {}),
        fields: {
          ...DEFAULT_INCIDENT_RESPONSE.phases[phase.id].fields,
          ...(data?.phases?.[phase.id]?.fields || {}),
        },
      };
      return acc;
    }, {}),
  };
}

function InfoLabel({ label, info }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
        color: "#334155",
        fontWeight: 700,
        position: "relative",
      }}
    >
      <span>{label}</span>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "18px",
          height: "18px",
          borderRadius: "999px",
          background: "#e2e8f0",
          color: "#334155",
          fontSize: "0.78rem",
          fontWeight: 800,
          cursor: "pointer",
          userSelect: "none",
          border: "1px solid #cbd5e1",
          padding: 0,
          lineHeight: 1,
        }}
        aria-label={`More information about ${label}`}
      >
        ?
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "absolute",
            top: "26px",
            left: 0,
            zIndex: 20,
            width: "260px",
            background: "#0f172a",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 500,
            lineHeight: 1.45,
            padding: "10px 12px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
          }}
        >
          {info}
        </div>
      )}
    </div>
  );
}

function IncidentResponse() {
  const { profile, role, orgId, uid, loading: userLoading } = useUser();
  const isCoordinator = role === "coordinator";

  const [plan, setPlan] = useState(DEFAULT_INCIDENT_RESPONSE);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadingSaved, setReloadingSaved] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [activePhase, setActivePhase] = useState("preparation");
  const [editingQuickActionIndex, setEditingQuickActionIndex] = useState(null);
  const [quickActionDraft, setQuickActionDraft] = useState("");

  const docRef = useMemo(() => {
    if (!orgId) return null;
    return doc(db, "orgs", orgId, "incidentResponse", "current");
  }, [orgId]);

  const resetEditingUi = () => {
    setEditingQuickActionIndex(null);
    setQuickActionDraft("");
  };

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be signed in to generate or download the PDF.");
    }
    return currentUser.getIdToken();
  };

  const loadSavedPlan = async ({ silent = false } = {}) => {
    if (!docRef) {
      setPlan(mergePlanData(DEFAULT_INCIDENT_RESPONSE));
      return;
    }

    if (!silent) {
      setPageLoading(true);
    }

    try {
      setError("");
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setPlan(mergePlanData(snap.data()));
      } else {
        setPlan(mergePlanData(DEFAULT_INCIDENT_RESPONSE));
      }
    } catch (err) {
      console.error("Failed to load incident response plan:", err);
      setError("Unable to load the incident response plan.");
    } finally {
      if (!silent) {
        setPageLoading(false);
      }
    }
  };

  useEffect(() => {
    if (userLoading) return;
    loadSavedPlan();
  }, [docRef, userLoading]);

  const handleTopLevelChange = (field, value) => {
    setPlan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuickActionChange = (index, value) => {
    setPlan((prev) => {
      const next = [...prev.quickActions];
      next[index] = value;
      return {
        ...prev,
        quickActions: next,
      };
    });
  };

  const addQuickAction = () => {
    setPlan((prev) => ({
      ...prev,
      quickActions: [...prev.quickActions, "New quick action"],
    }));
  };

  const removeQuickAction = (index) => {
    setPlan((prev) => ({
      ...prev,
      quickActions: prev.quickActions.filter((_, i) => i !== index),
    }));

    if (editingQuickActionIndex === index) {
      resetEditingUi();
    }
  };

  const startEditingQuickAction = (index, currentValue) => {
    setEditingQuickActionIndex(index);
    setQuickActionDraft(currentValue);
  };

  const saveEditingQuickAction = (index) => {
    handleQuickActionChange(index, quickActionDraft.trim() || "New quick action");
    resetEditingUi();
  };

  const cancelEditingQuickAction = () => {
    resetEditingUi();
  };

  const handleContactChange = (index, field, value) => {
    setPlan((prev) => {
      const nextContacts = [...prev.contacts];
      nextContacts[index] = {
        ...nextContacts[index],
        [field]: value,
      };
      return {
        ...prev,
        contacts: nextContacts,
      };
    });
  };

  const addContact = () => {
    setPlan((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { name: "", role: "", phone: "", email: "", notes: "" },
      ],
    }));
  };

  const removeContact = (index) => {
    setPlan((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleReportingModeChange = (mode) => {
    setPlan((prev) => ({
      ...prev,
      reporting: {
        ...prev.reporting,
        mode,
      },
    }));
  };

  const handleReportingFieldChange = (field, value) => {
    setPlan((prev) => {
      const modeKey =
        prev.reporting.mode === "ohio_hb96" ? "ohioGuided" : "custom";

      return {
        ...prev,
        reporting: {
          ...prev.reporting,
          [modeKey]: {
            ...prev.reporting[modeKey],
            [field]: value,
          },
        },
      };
    });
  };

  const handlePhaseFieldChange = (phaseId, fieldKey, value) => {
    setPlan((prev) => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phaseId]: {
          ...prev.phases[phaseId],
          fields: {
            ...prev.phases[phaseId].fields,
            [fieldKey]: value,
          },
        },
      },
    }));
  };

  const savePlanToFirestore = async ({
    pdfOverrides = null,
    version = "incident-response-v5",
  } = {}) => {
    if (!docRef || !orgId || !isCoordinator) {
      throw new Error("Only coordinators can save this incident response plan.");
    }

    const payload = {
      ...plan,
      orgId,
      version,
      updatedAt: serverTimestamp(),
      updatedBy: uid || null,
      updatedByName:
        profile?.displayName ||
        profile?.name ||
        profile?.email ||
        "Coordinator",
    };

    if (pdfOverrides) {
      payload.pdf = {
        ...plan.pdf,
        ...pdfOverrides,
      };
    }

    await setDoc(docRef, payload, { merge: true });

    setPlan((prev) => ({
      ...prev,
      ...(pdfOverrides ? { pdf: { ...prev.pdf, ...pdfOverrides } } : {}),
    }));
  };

  const handleRestoreDefaults = () => {
    setPlan(mergePlanData(DEFAULT_INCIDENT_RESPONSE));
    setSaveMessage("");
    setError("");
    setActivePhase("preparation");
    resetEditingUi();
  };

  const handleResetToCurrentSavedPlan = async () => {
    setReloadingSaved(true);
    setSaveMessage("");
    setError("");
    resetEditingUi();

    try {
      await loadSavedPlan({ silent: true });
    } finally {
      setReloadingSaved(false);
    }
  };

  const handleSave = async () => {
    if (!docRef || !orgId || !isCoordinator) return;

    try {
      setSaving(true);
      setSaveMessage("");
      setError("");

      await savePlanToFirestore();
      setSaveMessage("Incident response plan saved successfully.");
    } catch (err) {
      console.error("Failed to save incident response plan:", err);
      setError("Unable to save incident response plan.");
    } finally {
      setSaving(false);
    }
  };

  const waitForPdfReady = async (maxAttempts = 10, delayMs = 2000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const snap = await getDoc(docRef);

      if (!snap.exists()) continue;

      const current = mergePlanData(snap.data());

      if (current.pdf?.status === "ready" && current.pdf?.storagePath) {
        setPlan(current);
        return current;
      }

      if (current.pdf?.status === "error") {
        throw new Error(
          current.pdf?.errorMessage || "PDF generation failed."
        );
      }
    }

    throw new Error(
      "PDF generation is taking longer than expected. Try again in a moment."
    );
  };

  const handleDownloadPdf = async () => {
    if (!docRef || !orgId || !isCoordinator) return;

    if (
      INCIDENT_RESPONSE_GENERATE_URL.includes("REPLACE_WITH") ||
      INCIDENT_RESPONSE_DOWNLOAD_URL.includes("REPLACE_WITH")
    ) {
      setError("Set the incident response PDF API URLs before downloading.");
      return;
    }

    try {
      setDownloadingPdf(true);
      setSaveMessage("");
      setError("");

      await savePlanToFirestore({
        pdfOverrides: {
          status: "pending",
          storagePath: "",
          generatedAt: null,
          errorMessage: "",
          downloadFileName: "incident-response-plan.pdf",
        },
      });

      const token = await getAuthToken();

      const generateRes = await fetch(INCIDENT_RESPONSE_GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId,
          planType: "incidentResponse",
        }),
      });

      if (!generateRes.ok) {
        const text = await generateRes.text();
        throw new Error(text || "Failed to start PDF generation.");
      }

      const readyPlan = await waitForPdfReady();

      const downloadRes = await fetch(INCIDENT_RESPONSE_DOWNLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId,
          storagePath: readyPlan.pdf.storagePath,
          fileName:
            readyPlan.pdf.downloadFileName || "incident-response-plan.pdf",
        }),
      });

      if (!downloadRes.ok) {
        const text = await downloadRes.text();
        throw new Error(text || "Failed to get signed download URL.");
      }

      const downloadData = await downloadRes.json();
      const downloadUrl =
        downloadData?.downloadUrl || downloadData?.url || null;

      if (!downloadUrl) {
        throw new Error("Download URL was not returned.");
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
      setSaveMessage("Incident response PDF is ready.");
    } catch (err) {
      console.error("Failed to download incident response PDF:", err);
      setError(
        err?.message || "Unable to generate or download the incident response PDF."
      );

      try {
        await savePlanToFirestore({
          pdfOverrides: {
            status: "error",
            errorMessage:
              err?.message || "Unable to generate or download the PDF.",
          },
        });
      } catch (updateErr) {
        console.error("Failed to update PDF error state:", updateErr);
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const activePhaseData = plan.phases[activePhase];
  const activeReporting =
    plan.reporting.mode === "ohio_hb96"
      ? plan.reporting.ohioGuided
      : plan.reporting.custom;

  if (userLoading) {
    return (
      <ContentPanel>
        <div className="content-panel-card">
          <h1>Incident Response</h1>
          <p>Loading user access...</p>
        </div>
      </ContentPanel>
    );
  }

  if (pageLoading) {
    return (
      <ContentPanel>
        <div className="content-panel-card">
          <h1>Incident Response</h1>
          <p>Loading incident response plan...</p>
        </div>
      </ContentPanel>
    );
  }

  return (
    <ContentPanel>
      <div className="content-panel-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#b91c1c",
                marginBottom: "6px",
              }}
            >
              NIST-Informed Incident Response Lifecycle
            </div>

            {isCoordinator ? (
              <input
                type="text"
                value={plan.title}
                onChange={(e) => handleTopLevelChange("title", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "680px",
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "10px",
                }}
              />
            ) : (
              <h1 style={{ margin: "0 0 10px 0" }}>{plan.title}</h1>
            )}

            {isCoordinator ? (
              <textarea
                value={plan.subtitle}
                onChange={(e) => handleTopLevelChange("subtitle", e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  maxWidth: "760px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  padding: "12px",
                  resize: "vertical",
                }}
              />
            ) : (
              <p style={{ margin: 0, lineHeight: 1.7, color: "#475569" }}>
                {plan.subtitle}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              ← Home
            </Link>

            {isCoordinator && (
              <button
                onClick={handleResetToCurrentSavedPlan}
                disabled={reloadingSaved || downloadingPdf}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor:
                    reloadingSaved || downloadingPdf ? "not-allowed" : "pointer",
                  opacity: reloadingSaved || downloadingPdf ? 0.7 : 1,
                }}
              >
                {reloadingSaved ? "Resetting..." : "Reset to Current Saved Plan"}
              </button>
            )}

            {isCoordinator && (
              <button
                onClick={handleRestoreDefaults}
                disabled={downloadingPdf}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: downloadingPdf ? "not-allowed" : "pointer",
                  opacity: downloadingPdf ? 0.7 : 1,
                }}
              >
                Restore Defaults
              </button>
            )}

            {isCoordinator && (
              <button
                onClick={handleSave}
                disabled={saving || downloadingPdf}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: saving || downloadingPdf ? "#94a3b8" : "#16a34a",
                  color: "#fff",
                  fontWeight: 800,
                  cursor:
                    saving || downloadingPdf ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Plan"}
              </button>
            )}

            {isCoordinator && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || saving}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: downloadingPdf ? "#94a3b8" : "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  cursor:
                    downloadingPdf || saving ? "not-allowed" : "pointer",
                }}
                title="Generate and download PDF"
              >
                {downloadingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {saveMessage ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#ecfdf5",
              border: "1px solid #86efac",
              color: "#166534",
              fontWeight: 700,
            }}
          >
            {saveMessage}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "14px",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>Emergency Contacts</h2>

            {isCoordinator && (
              <button
                onClick={addContact}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px dashed #94a3b8",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Contact
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {plan.contacts.map((contact, index) => (
              <div
                key={`contact-${index}`}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "#f8fafc",
                }}
              >
                {isCoordinator ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        padding: "10px 12px",
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Role"
                      value={contact.role}
                      onChange={(e) =>
                        handleContactChange(index, "role", e.target.value)
                      }
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        padding: "10px 12px",
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Phone"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        padding: "10px 12px",
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        padding: "10px 12px",
                      }}
                    />

                    <textarea
                      placeholder="Notes"
                      value={contact.notes}
                      onChange={(e) =>
                        handleContactChange(index, "notes", e.target.value)
                      }
                      rows={3}
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        padding: "12px",
                        resize: "vertical",
                      }}
                    />

                    <button
                      onClick={() => removeContact(index)}
                      style={{
                        width: "fit-content",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#b91c1c",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Remove Contact
                    </button>
                  </div>
                ) : (
                  <div style={{ lineHeight: 1.6 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "#0f172a",
                      }}
                    >
                      {contact.name || "Not provided"}
                    </div>
                    <div style={{ color: "#475569", marginBottom: "8px" }}>
                      {contact.role || "Role not provided"}
                    </div>
                    <div>
                      <strong>Phone:</strong> {contact.phone || "—"}
                    </div>
                    <div>
                      <strong>Email:</strong> {contact.email || "—"}
                    </div>
                    <div>
                      <strong>Notes:</strong> {contact.notes || "—"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            alignItems: "start",
            marginBottom: "20px",
          }}
        >
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Quick Actions</h2>

            <div style={{ display: "grid", gap: "10px" }}>
              {plan.quickActions.map((item, index) => {
                const isEditing = editingQuickActionIndex === index;

                return (
                  <div
                    key={`action-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        minWidth: "28px",
                        height: "28px",
                        borderRadius: "999px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      {isCoordinator && isEditing ? (
                        <input
                          type="text"
                          value={quickActionDraft}
                          onChange={(e) => setQuickActionDraft(e.target.value)}
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            padding: "9px 10px",
                          }}
                        />
                      ) : (
                        <div style={{ lineHeight: 1.6 }}>{item}</div>
                      )}
                    </div>

                    {isCoordinator && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditingQuickAction(index)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#16a34a",
                                color: "#fff",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>

                            <button
                              onClick={cancelEditingQuickAction}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                color: "#0f172a",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                startEditingQuickAction(index, item)
                              }
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                color: "#0f172a",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => removeQuickAction(index)}
                              title="Remove"
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#b91c1c",
                                fontSize: "18px",
                                fontWeight: 800,
                                cursor: "pointer",
                                lineHeight: 1,
                                padding: "2px 4px",
                              }}
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isCoordinator && (
                <button
                  onClick={addQuickAction}
                  style={{
                    marginTop: "4px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px dashed #94a3b8",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Quick Action
                </button>
              )}
            </div>
          </section>

          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
              Reporting & Escalation
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                Reporting Mode
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => isCoordinator && handleReportingModeChange("custom")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border:
                      plan.reporting.mode === "custom"
                        ? "2px solid #1d4ed8"
                        : "1px solid #cbd5e1",
                    background:
                      plan.reporting.mode === "custom" ? "#eff6ff" : "#fff",
                    color: "#0f172a",
                    fontWeight: 700,
                    cursor: isCoordinator ? "pointer" : "default",
                  }}
                >
                  Custom Reporting
                </button>

                <button
                  type="button"
                  onClick={() =>
                    isCoordinator && handleReportingModeChange("ohio_hb96")
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border:
                      plan.reporting.mode === "ohio_hb96"
                        ? "2px solid #b45309"
                        : "1px solid #cbd5e1",
                    background:
                      plan.reporting.mode === "ohio_hb96" ? "#fff7ed" : "#fff",
                    color: "#0f172a",
                    fontWeight: 700,
                    cursor: isCoordinator ? "pointer" : "default",
                  }}
                >
                  Ohio / HB 96 Guided
                </button>
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "0.93rem",
                  lineHeight: 1.5,
                }}
              >
                {plan.reporting.mode === "custom"
                  ? "Use your organization’s own reporting procedures and timelines."
                  : "Use Ohio-focused default guidance as a starting point, then adjust as needed."}
              </div>
            </div>

            {plan.reporting.mode === "ohio_hb96" && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fff7ed",
                  border: "1px solid #fbbf24",
                  color: "#92400e",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                  Ohio / HB 96 Guided Reporting Notice
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  This section includes Ohio-focused reporting guidance as a
                  starting point. Your organization is responsible for reviewing
                  and confirming that all reporting details, timelines, and
                  contacts are accurate and current before relying on this
                  information.
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <InfoLabel
                  label="Internal Escalation"
                  info="Who should be notified inside your organization as soon as a possible incident is discovered."
                />
                {isCoordinator ? (
                  <input
                    type="text"
                    value={activeReporting.internalEscalation}
                    onChange={(e) =>
                      handleReportingFieldChange(
                        "internalEscalation",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "10px 12px",
                    }}
                  />
                ) : (
                  <div>{activeReporting.internalEscalation}</div>
                )}
              </div>

              <div>
                <InfoLabel
                  label="DPS / State Reporting Timeline"
                  info="Use this field to describe when and how your organization should report qualifying incidents to state authorities, if applicable."
                />
                {isCoordinator ? (
                  <input
                    type="text"
                    value={activeReporting.dpsTimeline}
                    onChange={(e) =>
                      handleReportingFieldChange("dpsTimeline", e.target.value)
                    }
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "10px 12px",
                    }}
                  />
                ) : (
                  <div>{activeReporting.dpsTimeline}</div>
                )}
              </div>

              <div>
                <InfoLabel
                  label="Auditor Reporting Timeline"
                  info="Use this field to record when incidents should be reported to the Auditor of State or other oversight body, if applicable."
                />
                {isCoordinator ? (
                  <input
                    type="text"
                    value={activeReporting.auditorTimeline}
                    onChange={(e) =>
                      handleReportingFieldChange(
                        "auditorTimeline",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "10px 12px",
                    }}
                  />
                ) : (
                  <div>{activeReporting.auditorTimeline}</div>
                )}
              </div>

              <div>
                <InfoLabel
                  label="Notes"
                  info="Use this section for extra reporting instructions, reminders, exceptions, or organization-specific guidance."
                />
                {isCoordinator ? (
                  <textarea
                    value={activeReporting.notes}
                    onChange={(e) =>
                      handleReportingFieldChange("notes", e.target.value)
                    }
                    rows={5}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "12px",
                      resize: "vertical",
                    }}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {activeReporting.notes}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "18px",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: 0 }}>Incident Response Lifecycle</h2>
            <div style={{ marginTop: "6px", color: "#475569" }}>
              Select a phase below to define what your organization should do at
              each stage of incident response.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {PHASES.map((phase) => {
              const isActive = activePhase === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setActivePhase(phase.id)}
                  style={{
                    border: isActive
                      ? "2px solid #b91c1c"
                      : "1px solid #cbd5e1",
                    background: isActive ? "#fef2f2" : "#fff",
                    borderRadius: "16px",
                    padding: "14px 10px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      margin: "0 auto 8px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      background: isActive ? "#b91c1c" : "#e2e8f0",
                      color: isActive ? "#fff" : "#334155",
                    }}
                  >
                    {phase.short}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: "0.95rem",
                    }}
                  >
                    {phase.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#b91c1c",
                marginBottom: "6px",
              }}
            >
              Active Phase
            </div>
            <h2 style={{ margin: "0 0 8px 0" }}>{activePhaseData.title}</h2>
            <div style={{ color: "#475569", lineHeight: 1.7 }}>
              {activePhaseData.description}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {Object.entries(activePhaseData.fields).map(([fieldKey, value]) => {
              const label = fieldKey
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());

              return (
                <div
                  key={fieldKey}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "14px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: "8px",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      fontSize: "0.92rem",
                      color: "#64748b",
                      marginBottom: "10px",
                      lineHeight: 1.5,
                    }}
                  >
                    Use this space to describe what your organization should do
                    during this phase.
                  </div>

                  {isCoordinator ? (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        handlePhaseFieldChange(
                          activePhase,
                          fieldKey,
                          e.target.value
                        )
                      }
                      rows={6}
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        padding: "12px",
                        resize: "vertical",
                      }}
                    />
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div
          style={{
            marginTop: "14px",
            fontSize: "0.92rem",
            color: "#c25c1c",
            textAlign: "center",
          }}
        >
          Remember to save your changes before leaving this page.
        </div>
      </div>
    </ContentPanel>
  );
}

export default IncidentResponse;