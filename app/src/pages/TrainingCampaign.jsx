// src/pages/TrainingCampaign.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import ContentPanel from "../components/ContentPanel";
import moduleRegistry from "../learningContent/moduleRegistry.json";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import { computeEndAt, getTrainingMode } from "../utils/trainingEngine";
import "./TrainingCampaign.css";

const DURATION_OPTIONS = [
  {
    key: "1_week",
    label: "1 Week",
    description: "Best for very small teams or quick awareness refreshes.",
  },
  {
    key: "1_month",
    label: "1 Month",
    description: "A balanced option for most organizations.",
  },
  {
    key: "3_months",
    label: "3 Months",
    description: "Useful for organizations that need more flexibility across schedules.",
  },
  {
    key: "6_months",
    label: "6 Months",
    description:
      "Best for larger organizations or organizations that need a longer rollout window.",
  },
];

const CATEGORY_CONFIG = {
  general: {
    label: "General",
    description: "Core lessons that apply across all organization types.",
    image: "/images/playbookImage1.png",
  },
  education: {
    label: "Education",
    description: "Lessons focused on schools, classrooms, and student data safety.",
    image: "/images/playbookImage2.png",
  },
  small_business: {
    label: "Small Business",
    description: "Lessons for private companies, customer data, and business operations.",
    image: "/images/playbookImage3.png",
  },
  local_government: {
    label: "Local Government",
    description: "Lessons for agencies, reporting, and public-sector disruption scenarios.",
    image: "/images/playbookImage1.png",
  },
};

function sortModulesForDisplay(modules) {
  return [...modules].sort((a, b) => {
    const aCategory = a.category || "";
    const bCategory = b.category || "";
    if (aCategory !== bCategory) return aCategory.localeCompare(bCategory);
    return (a.title || "").localeCompare(b.title || "");
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const d =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString();
}

function getModeLabel(mode) {
  return mode === "controlled" ? "Controlled" : "Organization-Based";
}

function getCategoryLabel(categoryKey) {
  return CATEGORY_CONFIG[categoryKey]?.label || categoryKey || "Uncategorized";
}

function getCategoryDescription(categoryKey) {
  return CATEGORY_CONFIG[categoryKey]?.description || "";
}

function getCategoryImage(categoryKey) {
  return CATEGORY_CONFIG[categoryKey]?.image || "/images/playbookImage2.png";
}

function groupModulesByCategory(modules) {
  const grouped = {};

  modules.forEach((module) => {
    const category = module.category || "uncategorized";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(module);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortModulesForDisplay(grouped[key]);
  });

  return grouped;
}

function getCategoryOrder(categories) {
  const preferredOrder = ["general", "education", "small_business", "local_government"];
  const preferred = preferredOrder.filter((key) => categories.includes(key));
  const extras = categories
    .filter((key) => !preferredOrder.includes(key))
    .sort((a, b) => a.localeCompare(b));

  return [...preferred, ...extras];
}

export default function TrainingCampaign() {
  const { uid, orgId, orgType, role, loading } = useUser();

  const [step, setStep] = useState(0);

  const [trainingMode, setTrainingMode] = useState("open");
  const [selectedMode, setSelectedMode] = useState("open");
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [durationKey, setDurationKey] = useState("1_week");
  const [campaignName, setCampaignName] = useState("");
  const [savingMode, setSavingMode] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [endingCampaignId, setEndingCampaignId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activePlaybooks, setActivePlaybooks] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});

  const allModules = useMemo(() => {
    return sortModulesForDisplay(moduleRegistry.modules || []);
  }, []);

  const organizationBasedModules = useMemo(() => {
    if (role !== "coordinator") return [];

    return sortModulesForDisplay(
      allModules.filter((m) => {
        const allowed = Array.isArray(m.allowedOrgTypes) ? m.allowedOrgTypes : [];
        return allowed.includes("all") || (orgType ? allowed.includes(orgType) : false);
      })
    );
  }, [allModules, orgType, role]);

  const controlledModules = useMemo(() => {
    if (role !== "coordinator") return [];
    return allModules;
  }, [allModules, role]);

  const controlledModulesByCategory = useMemo(() => {
    return groupModulesByCategory(controlledModules);
  }, [controlledModules]);

  const controlledCategoryKeys = useMemo(() => {
    return getCategoryOrder(Object.keys(controlledModulesByCategory));
  }, [controlledModulesByCategory]);

  const selectedModules = useMemo(() => {
    const selectedSet = new Set(selectedModuleIds);
    return allModules.filter((m) => selectedSet.has(m.moduleId));
  }, [allModules, selectedModuleIds]);

  const selectedDurationOption = useMemo(() => {
    return (
      DURATION_OPTIONS.find((option) => option.key === durationKey) ||
      DURATION_OPTIONS[0]
    );
  }, [durationKey]);

  const defaultCampaignName = useMemo(() => {
    return `${getModeLabel(selectedMode)} Campaign - ${selectedDurationOption.label}`;
  }, [selectedMode, selectedDurationOption]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      if (loading || !orgId) return;

      try {
        setError("");

        const mode = await getTrainingMode(orgId);
        if (!cancelled) {
          setTrainingMode(mode);
          setSelectedMode(mode);
        }

        const playbooksSnap = await getDocs(collection(db, "orgs", orgId, "playbooks"));
        if (!cancelled) {
          const rows = playbooksSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const aTime =
                typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
              const bTime =
                typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
              return bTime - aTime;
            });

          setActivePlaybooks(rows.filter((pb) => pb.isActive === true));
        }
      } catch (err) {
        console.error("Failed to load training campaign data", err);
        if (!cancelled) {
          setError("We could not load training campaign data right now.");
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [loading, orgId]);

  function toggleModule(moduleId) {
    setSelectedModuleIds((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      }
      return [...prev, moduleId];
    });
  }

  function toggleCardFlip(categoryKey) {
    setFlippedCards((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }

  async function handleSaveMode() {
    if (!orgId || role !== "coordinator") return false;

    try {
      setSavingMode(true);
      setError("");
      setSuccessMessage("");

      await setDoc(
        doc(db, "orgs", orgId, "settings", "training"),
        {
          trainingMode: selectedMode,
          updatedAt: serverTimestamp(),
          updatedBy: uid || null,
        },
        { merge: true }
      );

      setTrainingMode(selectedMode);

      if (selectedMode === "open") {
        setSelectedModuleIds(organizationBasedModules.map((m) => m.moduleId));
      } else {
        setSelectedModuleIds([]);
      }

      setFlippedCards({});
      setSuccessMessage("Training mode updated successfully.");
      return true;
    } catch (err) {
      console.error("Failed to save training mode", err);
      setError("We could not save training mode right now.");
      return false;
    } finally {
      setSavingMode(false);
    }
  }

  async function handleLaunchCampaign() {
    if (!orgId || !uid || role !== "coordinator") return;

    if (!selectedModuleIds.length) {
      setError("No lessons are selected for this campaign.");
      setSuccessMessage("");
      return;
    }

    const startAt = new Date();
    const endAt = computeEndAt(startAt, durationKey);

    if (!endAt) {
      setError("We could not determine the campaign end date.");
      setSuccessMessage("");
      return;
    }

    try {
      setLaunching(true);
      setError("");
      setSuccessMessage("");

      const titleToUse = campaignName.trim() || defaultCampaignName;

      const docRef = await addDoc(collection(db, "orgs", orgId, "playbooks"), {
        title: titleToUse,
        orgId,
        moduleIds: selectedModuleIds,
        durationKey,
        startAt,
        endAt,
        isActive: true,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });

      const newPlaybook = {
        id: docRef.id,
        title: titleToUse,
        orgId,
        moduleIds: selectedModuleIds,
        durationKey,
        startAt,
        endAt,
        isActive: true,
        createdBy: uid,
        createdAt: null,
      };

      setActivePlaybooks((prev) => [newPlaybook, ...prev]);
      setDurationKey("1_week");
      setCampaignName("");
      setSelectedModuleIds([]);
      setFlippedCards({});
      setSuccessMessage("Training campaign launched successfully.");
      setStep(0);
    } catch (err) {
      console.error("Failed to launch training campaign", err);
      setError("We could not launch the training campaign right now.");
    } finally {
      setLaunching(false);
    }
  }

  async function handleEndCampaign(playbookId) {
    if (!orgId || !playbookId) return;

    const confirmed = window.confirm(
      "End this campaign? Learners will no longer have it as an active campaign."
    );
    if (!confirmed) return;

    try {
      setEndingCampaignId(playbookId);
      setError("");
      setSuccessMessage("");

      await updateDoc(doc(db, "orgs", orgId, "playbooks", playbookId), {
        isActive: false,
        endedAt: serverTimestamp(),
        endedBy: uid || null,
        updatedAt: serverTimestamp(),
      });

      setActivePlaybooks((prev) => prev.filter((pb) => pb.id !== playbookId));
      setSuccessMessage("Campaign ended successfully.");
    } catch (err) {
      console.error("Failed to end campaign", err);
      setError("We could not end the campaign right now.");
    } finally {
      setEndingCampaignId("");
    }
  }

  if (loading) {
    return (
      <ContentPanel>
        <div style={{ padding: 8 }}>Loading…</div>
      </ContentPanel>
    );
  }

  if (role !== "coordinator") {
    return (
      <ContentPanel>
        <div className="training-campaign-basic-card">
          <h2 style={{ marginTop: 0 }}>Training Campaign</h2>
          <p>Only coordinators can access this page.</p>
        </div>
      </ContentPanel>
    );
  }

  return (
    <ContentPanel>
        <div className="training-campaign-topline">
            <span className="training-campaign-topline-title">
            Training Campaign Playbook
            </span>
            <span className="training-campaign-topline-sep">|</span>
            <span className="training-campaign-topline-sub">
            Launch a guided training campaign for your organization.
            </span>
        </div>

                  {(error || successMessage) && (
                    <div className="training-campaign-toast-wrap">
                    {error && (
                        <div className="training-campaign-toast training-campaign-toast--error">
                        {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="training-campaign-toast training-campaign-toast--success">
                        {successMessage}
                        </div>
                    )}
                    </div>
                )}

      {step === 0 && (
        <section className="training-campaign-section">
          <h3 className="training-campaign-section-title">What this playbook does</h3>
          <p className="training-campaign-copy">
            This playbook helps coordinators configure and launch a training campaign.
            You will choose how the campaign should behave, review which lessons are
            included, choose a campaign duration, and then launch it for your organization.
          </p>

          <div className="training-campaign-info-box">
            <div className="training-campaign-info-title">Campaign Types</div>
            <div className="training-campaign-info-line">
              <strong>Organization-Based:</strong> all general lessons and all lessons
              relevant to your organization type are included automatically.
            </div>
            <div className="training-campaign-info-line">
              <strong>Controlled:</strong> you choose which lessons to include in the
              campaign.
            </div>
          </div>

          <div className="training-campaign-actions">
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setStep(1);
              }}
              className="training-campaign-btn training-campaign-btn--primary"
            >
              Start Playbook
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="training-campaign-section">
          <h3 className="training-campaign-section-title">1. Choose Campaign Type</h3>
          <p className="training-campaign-subcopy">
            Select how this campaign should determine lesson access.
          </p>

          <div className="training-campaign-mode-grid">
            <button
              type="button"
              onClick={() => setSelectedMode("open")}
              className={`training-campaign-mode-card ${
                selectedMode === "open" ? "is-selected is-orgbased" : ""
              }`}
            >
              <div className="training-campaign-mode-title">Organization-Based</div>
              <div className="training-campaign-mode-text">
                All general lessons and all lessons relevant to your organization type
                are included automatically.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("controlled")}
              className={`training-campaign-mode-card ${
                selectedMode === "controlled" ? "is-selected is-controlled" : ""
              }`}
            >
              <div className="training-campaign-mode-title">Controlled</div>
              <div className="training-campaign-mode-text">
                You choose which lessons are included in the campaign. This is better
                for focused or tightly managed training rollouts.
              </div>
            </button>
          </div>

          <div className="training-campaign-meta-line">
            Current saved mode: <strong>{getModeLabel(trainingMode)}</strong>
          </div>

          <div className="training-campaign-actions">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="training-campaign-btn training-campaign-btn--secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={async () => {
                const ok = await handleSaveMode();
                if (ok) {
                  setStep(2);
                }
              }}
              disabled={savingMode}
              className="training-campaign-btn training-campaign-btn--primary"
            >
              {savingMode ? "Saving..." : "Save and Continue"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="training-campaign-section">
          <h3 className="training-campaign-section-title">2. Review Included Lessons</h3>

          {selectedMode === "open" ? (
            <>
              <p className="training-campaign-copy">
                In <strong>Organization-Based</strong> mode, all general lessons and all
                lessons relevant to your organization type are included automatically.
                These lessons are shown below and cannot be changed here.
              </p>

              <div className="training-campaign-readonly-list">
                {organizationBasedModules.map((module) => (
                  <div key={module.moduleId} className="training-campaign-readonly-item">
                    <div className="training-campaign-readonly-title">{module.title}</div>
                    {module.category && (
                      <div className="training-campaign-readonly-meta">
                        Category: {getCategoryLabel(module.category)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="training-campaign-copy">
                In <strong>Controlled</strong> mode, choose exactly which lessons should
                be included in this campaign. Click a card to flip it and manage the lessons
                in that category.
              </p>

              <div className="training-campaign-card-grid">
                {controlledCategoryKeys.map((categoryKey) => {
                  const categoryModules = controlledModulesByCategory[categoryKey] || [];
                  const selectedCount = categoryModules.filter((module) =>
                    selectedModuleIds.includes(module.moduleId)
                  ).length;
                  const isFlipped = !!flippedCards[categoryKey];

                  return (
                    <div
                      key={categoryKey}
                      className={`training-campaign-flip-card ${isFlipped ? "is-flipped" : ""}`}
                    >
                      <div className="training-campaign-flip-card-inner">
                        <button
                          type="button"
                          className="training-campaign-flip-face training-campaign-flip-front"
                          onClick={() => toggleCardFlip(categoryKey)}
                        >
                          <div
                            className="training-campaign-card-image"
                            style={{ backgroundImage: `url(${getCategoryImage(categoryKey)})` }}
                          />
                          <div className="training-campaign-card-content">
                            <div className="training-campaign-card-title">
                              {getCategoryLabel(categoryKey)}
                            </div>
                            <div className="training-campaign-card-description">
                              {getCategoryDescription(categoryKey)}
                            </div>
                            <div className="training-campaign-card-stats">
                              <div>Lessons: {categoryModules.length}</div>
                              <div>Selected: {selectedCount}</div>
                            </div>
                          </div>
                        </button>

                        <div className="training-campaign-flip-face training-campaign-flip-back">
                          <div className="training-campaign-card-back-header">
                            <div className="training-campaign-card-back-title">
                              {getCategoryLabel(categoryKey)}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCardFlip(categoryKey)}
                              className="training-campaign-mini-btn"
                            >
                              Back
                            </button>
                          </div>

                          <div className="training-campaign-card-back-list">
                            {categoryModules.map((module) => (
                              <label
                                key={module.moduleId}
                                className="training-campaign-card-back-item"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedModuleIds.includes(module.moduleId)}
                                  onChange={() => toggleModule(module.moduleId)}
                                />
                                <span>{module.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedModuleIds.length === 0 && (
                <div className="training-campaign-alert training-campaign-alert--error training-campaign-alert--mt">
                  Select at least one lesson to continue.
                </div>
              )}
            </>
          )}

          <div className="training-campaign-actions">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="training-campaign-btn training-campaign-btn--secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedMode === "controlled" && selectedModuleIds.length === 0) {
                  setError("Select at least one lesson before continuing.");
                  return;
                }
                setError("");
                setSuccessMessage("");
                setStep(3);
              }}
              className="training-campaign-btn training-campaign-btn--primary"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="training-campaign-section">
          <h3 className="training-campaign-section-title">3. Choose Campaign Duration</h3>
          <p className="training-campaign-copy">
            Choose how long the campaign should remain active for your organization.
          </p>

          <div className="training-campaign-duration-grid">
            {DURATION_OPTIONS.map((option) => {
              const selected = durationKey === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDurationKey(option.key)}
                  className={`training-campaign-duration-card ${selected ? "is-selected" : ""}`}
                >
                  <div className="training-campaign-duration-title">{option.label}</div>
                  <div className="training-campaign-duration-text">{option.description}</div>
                </button>
              );
            })}
          </div>

          <div className="training-campaign-actions">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="training-campaign-btn training-campaign-btn--secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setStep(4);
              }}
              className="training-campaign-btn training-campaign-btn--primary"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="training-campaign-section">
          <h3 className="training-campaign-section-title">4. Review and Launch</h3>
          <p className="training-campaign-copy">
            Review the campaign details below. You may optionally give this campaign a custom name.
          </p>

          <div className="training-campaign-review-grid">
            <div className="training-campaign-review-card">
              <div className="training-campaign-review-title">Campaign Type</div>
              <div className="training-campaign-review-value">{getModeLabel(selectedMode)}</div>
            </div>

            <div className="training-campaign-review-card">
              <div className="training-campaign-review-title">Included Lessons</div>
              <div className="training-campaign-review-value">
                {selectedModules.length} lesson{selectedModules.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="training-campaign-review-card">
              <div className="training-campaign-review-title">Duration</div>
              <div className="training-campaign-review-value">{selectedDurationOption.label}</div>
              <div className="training-campaign-review-subvalue">
                {selectedDurationOption.description}
              </div>
            </div>

            <div className="training-campaign-review-card training-campaign-review-card--white">
              <label htmlFor="campaignName" className="training-campaign-review-title">
                Campaign Name (Optional)
              </label>
              <input
                id="campaignName"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={defaultCampaignName}
                className="training-campaign-input"
              />
              <div className="training-campaign-review-subvalue">
                If left blank, the system will use: <strong>{defaultCampaignName}</strong>
              </div>
            </div>
          </div>

          <div className="training-campaign-actions">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="training-campaign-btn training-campaign-btn--secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleLaunchCampaign}
              disabled={launching}
              className="training-campaign-btn training-campaign-btn--primary"
            >
              {launching ? "Launching..." : "Launch Campaign"}
            </button>
          </div>
        </section>
      )}

      {activePlaybooks.length > 0 && (
        <section className="training-campaign-section training-campaign-section--mt">
          <h3 className="training-campaign-section-title">Active Campaigns</h3>

          <div className="training-campaign-active-list">
            {activePlaybooks.map((pb) => (
              <div key={pb.id} className="training-campaign-active-item">
                <div className="training-campaign-active-title">
                  {pb.title || "Untitled Campaign"}
                </div>
                <div className="training-campaign-active-meta">
                  Duration: {pb.durationKey || "—"}
                </div>
                <div className="training-campaign-active-meta">
                  Starts: {formatDateTime(pb.startAt)}
                </div>
                <div className="training-campaign-active-meta">
                  Ends: {formatDateTime(pb.endAt)}
                </div>

                <div className="training-campaign-active-actions">
                  <button
                    type="button"
                    onClick={() => handleEndCampaign(pb.id)}
                    disabled={endingCampaignId === pb.id}
                    className="training-campaign-btn training-campaign-btn--danger-outline"
                  >
                    {endingCampaignId === pb.id ? "Ending..." : "End Campaign"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </ContentPanel>
  );
}