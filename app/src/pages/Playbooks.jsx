// src/pages/Playbooks.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import { useUser } from "../auth/UserContext";
import { db } from "../auth/firebase";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const OVERVIEW_STORAGE_KEY = "playbooksOverviewSeen_v3";
const TRAINING_UNLOCK_STORAGE_KEY = "playbooksTrainingUnlocked_v3";

function getReviewedStorageKey(uid) {
  return `playbooksReviewedMap_${uid || "anonymous"}_v1`;
}

const PLAYBOOK_ZONES = [
  {
    key: "training",
    title: "Training and Awareness",
    themeClass: "playbooks-zone--training",
    collapsedThemeClass: "playbooks-collapsed--training",
    statusText: "0/2 complete",
    items: [
      {
        id: "training-campaign",
        title: "Training Campaign Playbook",
        path: "/playbook5",
        icon: "/images/trainingcampaignplaybooklogo.svg",
        type: "main",
        status: "in-progress",
        unlocksNext: true,
      },
      {
        id: "security-tools",
        title: "Security Tools",
        path: "/securitytools",
        icon: "/images/securitytoolslogo.svg",
        type: "support",
        status: "not-started",
      },
    ],
  },
  {
    key: "policies",
    title: "Policies & Guidance",
    themeClass: "playbooks-zone--policies",
    collapsedThemeClass: "playbooks-collapsed--policies",
    statusText: "0/2 complete",
    items: [
      {
        id: "policy-guide",
        title: "Policy Guide",
        path: "/policyguide",
        icon: "/images/policyguidelogo.svg",
        type: "support",
        status: "not-started",
      },
      {
        id: "risk-tools",
        title: "Risk & Impact Planning Tools",
        path: "/riskplanningtools",
        icon: "/images/riskimpactplanninglogo.svg",
        type: "main",
        status: "not-started",
      },
    ],
  },
  {
    key: "response",
    title: "Incident Response & Operations",
    themeClass: "playbooks-zone--response",
    collapsedThemeClass: "playbooks-collapsed--response",
    statusText: "0/4 complete",
    items: [
      {
        id: "response-guidance",
        title: "Detection & Response Playbook",
        path: "/playbook3",
        icon: "/images/detectionresponselogo.svg",
        type: "main",
        status: "not-started",
      },
      {
        id: "ransomware-response",
        title: "Ransomware Response",
        path: "/ransomwareresponse",
        icon: "/images/ransomwareresponselogo.svg",
        type: "support",
        status: "not-started",
      },
      {
        id: "incident-setup",
        title: "Incident Response Setup",
        path: "/incidentresponse",
        icon: "/images/incidentresponselogo.svg",
        type: "support",
        status: "not-started",
      },
      {
        id: "monitoring-tools",
        title: "Wazuh & Suricata",
        path: "/playbook4",
        icon: "/images/playbookImage1.png",
        type: "support",
        status: "not-started",
      },
    ],
  },
];

const CHECKLIST_GROUPS = [
  {
    title: "Training",
    items: [
      {
        id: "employee-training",
        label: "Employee training conducted",
        note: "Blue 68% | Some participants have not completed all lessons",
      },
    ],
  },
  {
    title: "Policies",
    items: [
      {
        id: "cybersecurity-program",
        label: "Cybersecurity program adopted",
      },
    ],
  },
  {
    title: "Incident Response",
    items: [
      {
        id: "incident-response-plan",
        label: "Incident response plan documented",
      },
      {
        id: "incident-reporting",
        label: "Incident reporting procedure documented",
      },
      {
        id: "ransomware-protocols",
        label: "Ransomware protocols documented",
      },
      {
        id: "backup-recovery",
        label: "Backup & recovery process documented",
      },
    ],
  },
];

function getStatusLabel(status) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

function readReviewedFromLocal(uid) {
  try {
    const raw = localStorage.getItem(getReviewedStorageKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeReviewedToLocal(uid, map) {
  try {
    localStorage.setItem(getReviewedStorageKey(uid), JSON.stringify(map));
  } catch {
    // ignore localStorage failures
  }
}

export default function Playbooks() {
  const navigate = useNavigate();
  const { uid } = useUser();

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [trainingUnlockedNext, setTrainingUnlockedNext] = useState(false);
  const [expandedZone, setExpandedZone] = useState(null);
  const [reviewedMap, setReviewedMap] = useState({});
  const [reviewSavingId, setReviewSavingId] = useState(null);
  const [hasSeenOverview, setHasSeenOverview] = useState(false);

  const [checklistState, setChecklistState] = useState({
    "employee-training": false,
    "cybersecurity-program": false,
    "incident-response-plan": false,
    "incident-reporting": false,
    "ransomware-protocols": false,
    "backup-recovery": false,
  });

  useEffect(() => {
    const seen = localStorage.getItem(OVERVIEW_STORAGE_KEY) === "true";
    const unlocked =
      localStorage.getItem(TRAINING_UNLOCK_STORAGE_KEY) === "true";

    setHasSeenOverview(seen);
    setTrainingUnlockedNext(unlocked);

    if (!seen) {
      setOverviewOpen(true);
      setExpandedZone(null);
    }
  }, []);

  useEffect(() => {
    if (!uid) {
      setReviewedMap({});
      return;
    }

    let cancelled = false;

    async function loadReviewed() {
      const localMap = readReviewedFromLocal(uid);

      if (!cancelled) {
        setReviewedMap(localMap);
      }

      try {
        const snap = await getDocs(collection(db, "users", uid, "playbookStatus"));
        const firestoreMap = {};

        snap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          firestoreMap[docSnap.id] = data.reviewed === true;
        });

        const merged = { ...localMap, ...firestoreMap };

        if (!cancelled) {
          setReviewedMap(merged);
        }

        writeReviewedToLocal(uid, merged);
      } catch (error) {
        console.error("Failed to load reviewed state from Firestore:", error);
      }
    }

    loadReviewed();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const isPoliciesUnlocked = hasSeenOverview || trainingUnlockedNext;
  const isResponseUnlocked = hasSeenOverview || trainingUnlockedNext;

  const unlockedMap = useMemo(
    () => ({
      training: true,
      policies: isPoliciesUnlocked,
      response: isResponseUnlocked,
    }),
    [isPoliciesUnlocked, isResponseUnlocked]
  );

  const reviewedCounts = useMemo(() => {
    const counts = {};
    for (const zone of PLAYBOOK_ZONES) {
      const done = zone.items.filter((item) => reviewedMap[item.id]).length;
      counts[zone.key] = `${done}/${zone.items.length} reviewed`;
    }
    return counts;
  }, [reviewedMap]);

  function closeOverview() {
    setOverviewOpen(false);
    setHasSeenOverview(true);
    localStorage.setItem(OVERVIEW_STORAGE_KEY, "true");
  }

  function toggleChecklistItem(id) {
    setChecklistState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleCollapsedZoneClick(zoneKey) {
    if (!unlockedMap[zoneKey]) return;
    setExpandedZone((prev) => (prev === zoneKey ? null : zoneKey));
  }

  function handleCollapseExpanded() {
    setExpandedZone(null);
  }

  function handleCardOpen(item) {
    if (item.unlocksNext) {
      setTrainingUnlockedNext(true);
      localStorage.setItem(TRAINING_UNLOCK_STORAGE_KEY, "true");
    }
    navigate(item.path);
  }

  async function toggleReviewed(itemId) {
    if (!uid || reviewSavingId) return;

    const nextValue = !reviewedMap[itemId];
    const nextMap = {
      ...reviewedMap,
      [itemId]: nextValue,
    };

    setReviewedMap(nextMap);
    writeReviewedToLocal(uid, nextMap);
    setReviewSavingId(itemId);

    try {
      await setDoc(
        doc(db, "users", uid, "playbookStatus", itemId),
        {
          reviewed: nextValue,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Failed to save reviewed state:", error);
    } finally {
      setReviewSavingId(null);
    }
  }

  const expandedZoneData = PLAYBOOK_ZONES.find((z) => z.key === expandedZone);

  return (
    <ContentPanel>
      <div className="playbooks-hub-head">
        <div>
          <h2 className="playbooks-title">Playbooks</h2>
          <p className="playbooks-sub">
            Follow the readiness flow to explore training, policy, and incident
            response tools.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </div>

      <div className="playbooks-flow-board">
        <section className="playbooks-step-band playbooks-step-band--start">
          <div className="playbooks-step-band__header">
            <div className="playbooks-step-pill playbooks-step-pill--start">
              Step 1
            </div>
            <h3 className="playbooks-step-heading">Begin Here</h3>
            <p className="playbooks-step-copy">
              Start with the readiness overview before working through the
              categories below.
            </p>
          </div>

          <div className="playbooks-start-wrap">
            <button
              type="button"
              className="playbooks-start-card"
              onClick={() => setOverviewOpen(true)}
            >
              <img
                src="/images/startHere.png"
                alt="Security Readiness Overview"
                className="playbooks-start-icon"
              />
              <div className="playbooks-start-label">
                Security Readiness Overview
              </div>
              <div className="playbooks-start-sub">
                Open the overview and understand the full flow
              </div>
            </button>
          </div>
        </section>

        <section className="playbooks-step-band playbooks-step-band--work">
          <div className="playbooks-step-band__header">
            <div className="playbooks-step-pill playbooks-step-pill--work">
              Step 2
            </div>
            <h3 className="playbooks-step-heading">Work Through the Playbooks</h3>
            <p className="playbooks-step-copy">
              Choose a category, open its playbooks, and track reviewed items as
              you go.
            </p>
          </div>

          <div className="playbooks-categories-wrap">
            <div className="playbooks-collapsed-grid">
              {PLAYBOOK_ZONES.map((zone) => {
                const isExpanded = expandedZone === zone.key;
                const isUnlocked = unlockedMap[zone.key];

                return (
                  <button
                    key={zone.key}
                    type="button"
                    className={[
                      "playbooks-collapsed-card",
                      zone.collapsedThemeClass,
                      isExpanded ? "is-expanded" : "",
                      !isUnlocked ? "is-locked" : "",
                    ].join(" ")}
                    onClick={() => handleCollapsedZoneClick(zone.key)}
                    disabled={!isUnlocked}
                  >
                    {!isUnlocked && (
                      <div className="playbooks-collapsed-lock">Locked</div>
                    )}

                    <div className="playbooks-collapsed-title">{zone.title}</div>
                    <div className="playbooks-collapsed-progress">
                      {zone.statusText}
                    </div>
                    <div className="playbooks-collapsed-progress-secondary">
                      {reviewedCounts[zone.key]}
                    </div>

                    {!isUnlocked && (
                      <div className="playbooks-collapsed-note">
                        Complete Training Playbook first
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {expandedZoneData && (
            <section
              className={`playbooks-zone-expanded ${expandedZoneData.themeClass}`}
            >
              <div className="playbooks-zone-expanded-head">
                <div>
                  <h3 className="playbooks-zone-expanded-title">
                    {expandedZoneData.title}
                  </h3>
                  <div className="playbooks-zone-expanded-progress">
                    {expandedZoneData.statusText}
                  </div>
                  <div className="playbooks-zone-expanded-reviewed">
                    {reviewedCounts[expandedZoneData.key]}
                  </div>
                </div>

                <button
                  type="button"
                  className="security-tools-back"
                  onClick={handleCollapseExpanded}
                >
                  Collapse
                </button>
              </div>

              <div
                className={`playbooks-zone-expanded-items playbooks-zone-expanded-items--${expandedZoneData.key}`}
              >
                {expandedZoneData.items.map((item) => {
                  const isReviewed = reviewedMap[item.id] === true;
                  const isSaving = reviewSavingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={[
                        "playbooks-node-card",
                        item.type === "support"
                          ? "playbooks-node-card--support"
                          : "",
                        isReviewed ? "playbook-reviewed" : "",
                      ].join(" ")}
                    >
                      <span
                        className={`playbooks-status-chip status-${item.status}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      <button
                        type="button"
                        className="playbooks-node-open"
                        onClick={() => handleCardOpen(item)}
                      >
                        <img
                          src={item.icon}
                          alt={item.title}
                          className="playbooks-node-icon"
                        />
                        <div className="playbooks-node-title">{item.title}</div>
                      </button>

                      <button
                        type="button"
                        className={[
                          "playbook-review-btn",
                          isReviewed ? "is-reviewed" : "",
                        ].join(" ")}
                        onClick={() => toggleReviewed(item.id)}
                        disabled={!uid || isSaving}
                      >
                        {isSaving
                          ? "Saving..."
                          : isReviewed
                          ? "Unmark Reviewed"
                          : "Mark as Reviewed"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        <section className="playbooks-step-band playbooks-step-band--finish">
          <div className="playbooks-step-band__header playbooks-step-band__header--finish">
            <div className="playbooks-step-band__header-main">
              <div className="playbooks-step-pill playbooks-step-pill--finish">
                Step 3
              </div>
              <h3 className="playbooks-step-heading">
                Final Review / Attestation
              </h3>
              <p className="playbooks-step-copy">
                Review your readiness items and continue to the full attestation
                when you are ready.
              </p>
            </div>

            <aside className="playbooks-attestation-definition">
              <div className="playbooks-attestation-definition__label">
                Definition
              </div>
              <div className="playbooks-attestation-definition__word">
                Attestation
              </div>
              <div className="playbooks-attestation-definition__pronounce">
                noun
              </div>
              <p className="playbooks-attestation-definition__text">
                Evidence or confirmation that something has been completed,
                reviewed, or documented.
              </p>
            </aside>
          </div>

          <div className="playbooks-readiness-grid">
            <div className="playbooks-checklist-groups">
              {CHECKLIST_GROUPS.map((group) => (
                <div key={group.title} className="playbooks-checklist-group">
                  <div className="playbooks-checklist-group-title">
                    {group.title}
                  </div>

                  <div className="playbooks-checklist-items">
                    {group.items.map((item) => (
                      <label
                        key={item.id}
                        className="playbooks-checklist-item"
                      >
                        <div className="playbooks-checklist-item-main">
                          <input
                            type="checkbox"
                            checked={!!checklistState[item.id]}
                            onChange={() => toggleChecklistItem(item.id)}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.note && (
                          <div className="playbooks-checklist-note">
                            {item.note}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="playbooks-attestation-panel">
              <div className="playbooks-attestation-card">
                <div className="playbooks-attestation-kicker">
                  Review & Submit
                </div>
                <h4 className="playbooks-attestation-title">
                  Open Full Attestation
                </h4>
                <p className="playbooks-attestation-text">
                  Use the full attestation page to review readiness items,
                  confirm completion details, and continue the documentation
                  process.
                </p>

                <button
                  type="button"
                  className="playbooks-attestation-link"
                  onClick={() => navigate("/securityreadiness")}
                >
                  Open Full Attestation
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {overviewOpen && (
        <div className="playbooks-modal-backdrop" onClick={closeOverview}>
          <div className="playbooks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="playbooks-modal-head">
              <h3 className="playbooks-modal-title">
                Security Readiness Overview
              </h3>

              <button
                type="button"
                className="playbooks-modal-close"
                onClick={closeOverview}
              >
                ×
              </button>
            </div>

            <p className="playbooks-modal-text">
              This hub helps your organization work toward core HB96 readiness
              expectations in a lightweight, practical way.
            </p>

            <div className="playbooks-modal-list">
              <div className="playbooks-modal-item">
                <strong>Training Playbook</strong>
                <span>
                  Start here first. Launch employee training campaigns and build
                  awareness.
                </span>
              </div>

              <div className="playbooks-modal-item">
                <strong>Policy Playbook</strong>
                <span>
                  After training begins, use policy guidance and planning tools
                  to shape your cybersecurity program.
                </span>
              </div>

              <div className="playbooks-modal-item">
                <strong>Incident Response & Operations</strong>
                <span>
                  Prepare contacts, response guidance, ransomware information,
                  and monitoring support.
                </span>
              </div>

              <div className="playbooks-modal-item">
                <strong>Checklist & Attestation</strong>
                <span>
                  Track progress in the final section, then open the full
                  attestation page when ready to review and submit.
                </span>
              </div>
            </div>

            <div className="playbooks-modal-note">
              This is a lightweight starting point. For full legal or compliance
              requirements, consult a qualified cybersecurity or legal
              professional.
            </div>
          </div>
        </div>
      )}
    </ContentPanel>
  );
}