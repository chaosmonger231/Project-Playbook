import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
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

export default function Lessons() {
  const navigate = useNavigate();
  const { role, orgType, orgId, loading } = useUser();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState("");
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [trainingMode, setTrainingMode] = useState("open");

  const modules = moduleRegistry.modules || [];
  const isCoordinator = role === "coordinator";

  useEffect(() => {
    async function fetchTrainingData() {
      if (loading) return;

      if (!orgId) {
        setCampaignLoading(false);
        setActiveCampaign(null);
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

        if (mode === "controlled") {
          const playbooksRef = collection(db, "orgs", orgId, "playbooks");
          const playbooksQuery = query(
            playbooksRef,
            where("isActive", "==", true),
            limit(1)
          );

          const playbooksSnapshot = await getDocs(playbooksQuery);

          if (playbooksSnapshot.empty) {
            setActiveCampaign(null);
          } else {
            const docSnap = playbooksSnapshot.docs[0];
            setActiveCampaign({
              id: docSnap.id,
              ...docSnap.data(),
            });
          }
        } else {
          setActiveCampaign(null);
        }
      } catch (error) {
        console.error("Failed to load training data:", error);
        setCampaignError(error.message || "Unable to load the active training campaign.");
      } finally {
        setCampaignLoading(false);
      }
    }

    fetchTrainingData();
  }, [loading, orgId]);

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
    let filtered = modules;

    if (isCoordinator) {
      return filtered;
    }

    if (trainingMode === "controlled") {
      return filtered.filter((module) => assignedModuleIds.includes(module.moduleId));
    }

    return filtered.filter((module) => canAccessByOrgType(module));
  }, [modules, isCoordinator, trainingMode, assignedModuleIds, orgType]);

  const visibleFilters = useMemo(() => {
    if (isCoordinator) {
      return ["all", "general", "education", "small_business", "local_government"];
    }

    const categoriesFromVisibleModules = baseVisibleModules
      .map((module) => module.category)
      .filter(Boolean);

    return ["all", ...new Set(categoriesFromVisibleModules)];
  }, [isCoordinator, baseVisibleModules]);

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
        <h1 className="lessons-title">Learning Modules</h1>
        <p className="lessons-subtitle">
          Browse cybersecurity lessons by category and open each module on its own page.
        </p>
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
              {visibleModules.map((module) => (
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

                    {isCoordinator && (
                      <button
                        type="button"
                        className="lesson-card__menu"
                        aria-label={`Lesson actions for ${module.title}`}
                        title="Lesson actions"
                      >
                        ⋯
                      </button>
                    )}
                  </div>

                  <div className="lesson-card__divider" />

                  <div className="lesson-card__body">
                    <h2 className="lesson-card__title">{module.title}</h2>
                    <p className="lesson-card__description">{module.synopsis}</p>
                    <p className="lesson-card__time">
                      {formatEstimatedTime(module.estimatedMinutes)}
                    </p>
                  </div>

                  <div className="lesson-card__divider lesson-card__divider--lower" />

                  <div className="lesson-card__footer">
                    <button
                      type="button"
                      className="lesson-card__button"
                      onClick={() => navigate(`/learning/${module.moduleId}`)}
                    >
                      Start Lesson
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}