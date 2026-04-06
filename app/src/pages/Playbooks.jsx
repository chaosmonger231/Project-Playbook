// src/pages/Playbooks.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
        title: "Everyday Security Tools",
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
        path: "/detectionresponseplaybook",
        icon: "/images/detectionresponselogo.svg",
        type: "main",
        status: "not-started",
      },
      {
        id: "ransomware-response",
        title: "Ransomware Response Playbook",
        path: "/ransomwareresponseplaybook",
        icon: "/images/ransomwareresponselogo.svg",
        type: "support",
        status: "not-started",
      },
      {
        id: "incident-setup",
        title: "Incident Response Planning Playbook",
        path: "/incidentresponseplanning",
        icon: "/images/incidentresponselogo.svg",
        type: "support",
        status: "not-started",
      },
      {
        id: "monitoring-tools",
        title: "Security Monitoring Tools",
        path: "/securitymonitoringtools",
        icon: "/images/playbookImage1.png",
        type: "support",
        status: "not-started",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { uid } = useUser();

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [trainingUnlockedNext, setTrainingUnlockedNext] = useState(false);
  const [expandedZone, setExpandedZone] = useState(null);
  const [reviewedMap, setReviewedMap] = useState({});
  const [reviewSavingId, setReviewSavingId] = useState(null);
  const [hasSeenOverview, setHasSeenOverview] = useState(false);

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

  useEffect(() => {
    const sectionParam = (searchParams.get("section") || "").trim().toLowerCase();
    const validSections = new Set(["training", "policies", "response"]);

    if (validSections.has(sectionParam)) {
      setExpandedZone(sectionParam);
    } else {
      setExpandedZone(null);
    }
  }, [searchParams]);

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

  function handleCollapsedZoneClick(zoneKey) {
    if (!unlockedMap[zoneKey]) return;

    const nextZone = expandedZone === zoneKey ? null : zoneKey;
    setExpandedZone(nextZone);

    if (nextZone) {
      setSearchParams({ section: nextZone }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function handleCollapseExpanded() {
    setExpandedZone(null);

    if (searchParams.get("section")) {
      setSearchParams({}, { replace: true });
    }
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
          </div>

          <div className="playbooks-start-wrap">
            <button
              type="button"
              className="playbooks-start-card"
              onClick={() => navigate("/securityreadiness")}
            >
              <img
                src="/images/finalreview.svg"
                alt="Final Review"
                className="playbooks-start-icon"
              />
              <div className="playbooks-start-label">Final Review</div>
              <div className="playbooks-start-sub">
                Use the full attestation page to review readiness items, confirm
                completion details, and continue the documentation process.
              </div>
            </button>
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
              <div
                className="playbooks-modal-item"
                style={{ background: "linear-gradient(135deg, #c8f0df, #a8c7ff)" }}
              >
                <strong>Training Playbook</strong>
                <span>
                  Start here first. Launch employee training campaigns and build
                  awareness.
                </span>
              </div>

              <div
                className="playbooks-modal-item"
                style={{ background: "linear-gradient(135deg, #d9efaa, #c2e45b)" }}
              >
                <strong>Policy Playbook</strong>
                <span>
                  After training begins, use policy guidance and planning tools
                  to shape your cybersecurity program.
                </span>
              </div>

              <div
                className="playbooks-modal-item"
                style={{ background: "linear-gradient(135deg, #ffe1d6, #ffb4b4)" }}
              >
                <strong>Incident Response & Operations</strong>
                <span>
                  Prepare contacts, response guidance, ransomware information,
                  and monitoring support.
                </span>
              </div>

              <div
                className="playbooks-modal-item"
                style={{ background: "linear-gradient(135deg, #f7f380, #e69e1a)" }}
              >
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