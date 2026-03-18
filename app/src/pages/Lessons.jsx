import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
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

function getVisibleFilters(role, orgType) {
  if (role === "coordinator") {
    return ["all", "general", "education", "small_business", "local_government"];
  }

  const filters = ["all", "general"];

  if (orgType === "education") {
    filters.push("education");
  }

  if (orgType === "small_business") {
    filters.push("small_business");
  }

  if (orgType === "local_gov") {
    filters.push("local_government");
  }

  return [...new Set(filters)];
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

export default function Lessons() {
  const navigate = useNavigate();
  const { role, orgType, loading } = useUser();
  const [selectedCategory, setSelectedCategory] = useState("all");

  if (loading) return <p>Loading…</p>;

  const modules = moduleRegistry.modules || [];

  const canAccess = (module) => {
    if (!module.allowedOrgTypes || module.allowedOrgTypes.includes("all")) {
      return true;
    }
    if (!orgType) return false;
    return module.allowedOrgTypes.includes(orgType);
  };

  const visibleFilters = getVisibleFilters(role, orgType);

  const visibleModules = useMemo(() => {
    let filtered = modules;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((module) => module.category === selectedCategory);
    }

    if (role !== "coordinator") {
      filtered = filtered.filter((module) => canAccess(module));
    }

    return filtered;
  }, [modules, role, selectedCategory, orgType]);

  return (
    <div className="lessons-page">
      <div className="lessons-header">
        <h1 className="lessons-title">Learning Modules</h1>
        <p className="lessons-subtitle">
          Browse cybersecurity lessons by category and open each module on its own page.
        </p>
      </div>

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

      <div className="lessons-grid">
        {visibleModules.map((module) => {
          const allowed = canAccess(module);
          const isCoordinator = role === "coordinator";

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
                {allowed ? (
                  <button
                    type="button"
                    className="lesson-card__button"
                    onClick={() => navigate(`/learning/${module.moduleId}`)}
                  >
                    Start Lesson
                  </button>
                ) : (
                  <div className="lesson-card__locked-wrap">
                    <button
                      type="button"
                      className="lesson-card__button lesson-card__button--disabled"
                      disabled
                    >
                      Locked
                    </button>
                    <p className="lesson-card__locked-text">
                      Ask your coordinator to enable this module.
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}