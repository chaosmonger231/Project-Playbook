import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useUser } from "../auth/UserContext";
import { db } from "../auth/firebase";
import moduleRegistry from "../learningContent/moduleRegistry.json";
import "./Lessons.css";

const CATEGORY_LABELS = {
  all: "All",
  general: "General",
  education: "Education",
  small_business: "Small Business",
  local_government: "Local Government",
};

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function getPlaceholderLabel(module) {
  if (module.imageLabel && module.imageLabel.trim()) {
    return module.imageLabel.trim();
  }
  return getCategoryLabel(module.category);
}

function formatEstimatedTime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return "Estimated time unavailable";
  return `Estimated time: ${minutes} min`;
}

function formatCampaignEndDate(endAt) {
  if (!endAt) return "";

  try {
    const date =
      typeof endAt?.toDate === "function"
        ? endAt.toDate()
        : endAt instanceof Date
        ? endAt
        : new Date(endAt);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getSortableTime(campaign) {
  const endedAt =
    typeof campaign?.endedAt?.toMillis === "function" ? campaign.endedAt.toMillis() : 0;
  const createdAt =
    typeof campaign?.createdAt?.toMillis === "function" ? campaign.createdAt.toMillis() : 0;
  const startAt =
    typeof campaign?.startAt?.getTime === "function"
      ? campaign.startAt.getTime()
      : campaign?.startAt instanceof Date
      ? campaign.startAt.getTime()
      : 0;

  return Math.max(endedAt, createdAt, startAt, 0);
}

export default function Lessons() {
  const navigate = useNavigate();
  const { uid, role, orgType, orgId, loading } = useUser();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState("");
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignContext, setCampaignContext] = useState(null);
  const [trainingMode, setTrainingMode] = useState("open");
  const [progressMap, setProgressMap] = useState({});

  const modules = moduleRegistry.modules || [];
  const isCoordinator = role === "coordinator";

  useEffect(() => {
    async function fetchTrainingData() {
      if (loading) return;

      if (!orgId) {
        setCampaignLoading(false);
        setActiveCampaign(null);
        setCampaignContext(null);
        setCampaignError("No organization found for this user.");
        setTrainingMode("open");
        return;
      }

      setCampaignLoading(true);
      setCampaignError("");

      try {
        const settingsRef = doc(db, "orgs", orgId, "settings", "training");
        const settingsSnap = await getDoc(settingsRef);

        let mode = "open";

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          mode = data.trainingMode || "open";
        }

        setTrainingMode(mode);

        const playbooksRef = collection(db, "orgs", orgId, "playbooks");
        const playbooksSnapshot = await getDocs(playbooksRef);
        const playbooks = playbooksSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const active = playbooks.find((pb) => pb.isActive === true) || null;

        const latestEnded =
          [...playbooks]
            .filter((pb) => pb.isActive !== true)
            .sort((a, b) => getSortableTime(b) - getSortableTime(a))[0] || null;

        setActiveCampaign(active);
        setCampaignContext(active || latestEnded || null);
      } catch (error) {
        console.error("Failed to load training data:", error);
        setCampaignError(error.message || "Unable to load the active training campaign.");
        setActiveCampaign(null);
        setCampaignContext(null);
      } finally {
        setCampaignLoading(false);
      }
    }

    fetchTrainingData();
  }, [loading, orgId]);

  useEffect(() => {
    async function loadProgress() {
      if (!uid) {
        setProgressMap({});
        return;
      }

      const campaignId = campaignContext?.id;
      if (!campaignId) {
        setProgressMap({});
        return;
      }

      try {
        const progressRef = collection(
          db,
          "users",
          uid,
          "campaignProgress",
          campaignId,
          "modules"
        );
        const progressSnap = await getDocs(progressRef);

        const nextMap = {};
        progressSnap.forEach((docSnap) => {
          nextMap[docSnap.id] = docSnap.data();
        });

        setProgressMap(nextMap);
      } catch (error) {
        console.error("Failed to load lesson progress:", error);
        setProgressMap({});
      }
    }

    loadProgress();
  }, [uid, campaignContext?.id]);

  const canAccessByOrgType = (module) => {
    if (!module.allowedOrgTypes || module.allowedOrgTypes.includes("all")) {
      return true;
    }
    if (!orgType) return false;
    return module.allowedOrgTypes.includes(orgType);
  };

  const assignedModuleIds = useMemo(() => {
    if (!activeCampaign || !Array.isArray(activeCampaign.moduleIds)) return [];
    return activeCampaign.moduleIds;
  }, [activeCampaign]);

  const baseVisibleModules = useMemo(() => {
    if (trainingMode === "controlled") {
      return modules.filter((module) => assignedModuleIds.includes(module.moduleId));
    }

    return modules.filter((module) => canAccessByOrgType(module));
  }, [modules, trainingMode, assignedModuleIds, orgType]);

  const visibleFilters = useMemo(() => {
    const categoriesFromVisibleModules = baseVisibleModules
      .map((module) => module.category)
      .filter(Boolean);

    return ["all", ...new Set(categoriesFromVisibleModules)];
  }, [baseVisibleModules]);

  useEffect(() => {
    if (!visibleFilters.includes(selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [visibleFilters, selectedCategory]);

  const visibleModules = useMemo(() => {
    let filtered = baseVisibleModules;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((module) => module.category === selectedCategory);
    }

    return filtered;
  }, [baseVisibleModules, selectedCategory]);

  const learnerHasNoCampaign =
    !isCoordinator && trainingMode === "controlled" && !activeCampaign && !campaignError;

  const learnerHasCampaignButNoModules =
    !isCoordinator &&
    trainingMode === "controlled" &&
    activeCampaign &&
    (!Array.isArray(activeCampaign.moduleIds) || activeCampaign.moduleIds.length === 0);

  const campaignEndLabel =
    trainingMode === "controlled" ? formatCampaignEndDate(activeCampaign?.endAt) : "";

  if (loading) return <p>Loading…</p>;
  if (campaignLoading) return <p>Loading training campaign…</p>;

  return (
    <div className="lessons-page">
      <div className="lessons-header">
        <h1 className="lessons-title">
          Learning Modules
          <span className="lessons-divider"> | </span>
          <span className="lessons-subtitle-inline">
            Browse cybersecurity lessons by category and open each module on its own page.
          </span>
        </h1>
      </div>

      <div className="lessons-active-campaign-banner">
        <div className="lessons-training-mode-line">
          <strong>Training Mode:</strong>{" "}
          {trainingMode === "controlled" ? "Controlled" : "Organization-Based"}

          {trainingMode === "controlled" && campaignEndLabel && (
            <>
              <span className="lessons-divider"> | </span>
              <span className="lessons-campaign-end-inline">
                Ends {campaignEndLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {!isCoordinator && learnerHasNoCampaign && (
        <div className="lessons-empty-state">
          <h2>No active training campaign</h2>
          <p>Your coordinator has not assigned a training campaign yet.</p>
        </div>
      )}

      {!isCoordinator && campaignError && (
        <div className="lessons-empty-state">
          <h2>Unable to load training</h2>
          <p>{campaignError}</p>
        </div>
      )}

      {!isCoordinator && learnerHasCampaignButNoModules && (
        <div className="lessons-empty-state">
          <h2>No modules assigned</h2>
          <p>This active campaign does not currently include any lessons.</p>
        </div>
      )}

      {!(learnerHasNoCampaign || campaignError || learnerHasCampaignButNoModules) && (
        <>
          <div className="lessons-filters" aria-label="Lesson category filters">
            {visibleFilters.map((filterKey) => {
              const isActive = selectedCategory === filterKey;

              return (
                <button
                  key={filterKey}
                  type="button"
                  className={`lessons-filter ${isActive ? "lessons-filter--active" : ""}`}
                  onClick={() => setSelectedCategory(filterKey)}
                >
                  {getCategoryLabel(filterKey)}
                </button>
              );
            })}
          </div>

          <div className="lessons-meta">
            <span>
              Showing {visibleModules.length} module{visibleModules.length === 1 ? "" : "s"}
            </span>
            <span className="lessons-meta__divider">•</span>
            <span>{getCategoryLabel(selectedCategory)}</span>
          </div>

          {visibleModules.length === 0 ? (
            <div className="lessons-empty-state">
              <h2>No modules in this category</h2>
              <p>Try switching filters to view other available lessons.</p>
            </div>
          ) : (
            <div className="lessons-grid">
              {visibleModules.map((module) => {
                const progress = progressMap[module.moduleId] || {};
                const passed = progress.passed === true;
                const failed = progress.status === "failed";
                const isLocked = passed || failed;

                const hasScore =
                  typeof progress.correctAnswers === "number" &&
                  typeof progress.totalQuestions === "number";

                return (
                  <article key={module.moduleId} className="lesson-card">
                    <div className="lesson-card__media-wrap">
                      <div className="lesson-card__media">
                        {module.image ? (
                          <img
                            src={module.image}
                            alt=""
                            className="lesson-card__image"
                          />
                        ) : (
                          <div className="lesson-card__image-placeholder">
                            {getPlaceholderLabel(module)}
                          </div>
                        )}
                      </div>

                      {(passed || failed) && (
                        <div
                          className={`lesson-card__status-badge ${
                            passed
                              ? "lesson-card__status-badge--passed"
                              : "lesson-card__status-badge--failed"
                          }`}
                          aria-label={passed ? "Lesson completed" : "Lesson failed"}
                          title={passed ? "Completed" : "Failed"}
                        >
                          {passed ? "✓" : "✕"}
                        </div>
                      )}
                    </div>

                    <div className="lesson-card__divider" />

                    <div className="lesson-card__body">
                      <h2 className="lesson-card__title">{module.title}</h2>
                      <p className="lesson-card__description">{module.synopsis}</p>
                      <p className="lesson-card__time">
                        {formatEstimatedTime(module.estimatedMinutes)}
                      </p>

                      {hasScore && (
                        <p className="lesson-card__score">
                          Score: {progress.correctAnswers} / {progress.totalQuestions}
                        </p>
                      )}
                    </div>

                    <div className="lesson-card__divider lesson-card__divider--lower" />

                    <div className="lesson-card__footer">
                      <button
                        type="button"
                        className={`lesson-card__button ${
                          passed
                            ? "lesson-card__button--completed"
                            : failed
                            ? "lesson-card__button--failed"
                            : ""
                        }`}
                        onClick={() => {
                          if (isLocked) return;
                          navigate(`/learning/${module.moduleId}`);
                        }}
                        disabled={isLocked}
                      >
                        {passed ? "Completed" : failed ? "Failed" : "Start Lesson"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}