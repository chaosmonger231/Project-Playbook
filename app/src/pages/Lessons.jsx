import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import "./Lessons.css";

/**
 * ======================================================================
 * TEMP MOCK LESSONS
 * ======================================================================
 *
 * Use this block to add future lesson cards while UI/design is in progress.
 *
 * HOW TO ADD A NEW LESSON
 * 1. Copy one existing object below.
 * 2. Change:
 *    - moduleId            -> unique route/id slug, ex: "password-basics"
 *    - title               -> lesson title shown on the card
 *    - synopsis            -> short description shown on the card
 *    - estimatedMinutes    -> estimated lesson time in minutes
 *    - category            -> one of:
 *                             "general"
 *                             "education"
 *                             "small_business"
 *                             "local_government"
 *    - allowedOrgTypes     -> array of org types allowed to view it
 *                             Use ["all"] if everyone can access it
 *                             Examples:
 *                             ["all"]
 *                             ["education"]
 *                             ["small_business"]
 *                             ["local_government"]
 *                             ["education", "local_government"]
 *    - image               -> optional image path from /public
 *                             Example:
 *                             "/lesson-images/sampleimage1.png"
 *                             or
 *                             "/sampleimage1.png"
 *                             Leave null if no image exists yet
 *    - imageLabel          -> short placeholder text shown inside image area
 *                             when image is missing
 *
 * IMAGE INSTRUCTIONS
 * - Save your lesson image inside /public
 * - Example locations:
 *   /public/sampleimage1.png
 *   /public/lesson-images/phishing.png
 * - Then set the image field to:
 *   image: "/sampleimage1.png"
 *   OR
 *   image: "/lesson-images/phishing.png"
 *
 * IMPORTANT NOTES
 * - The route will navigate to: /learning/:moduleId
 * - Keep moduleId lowercase and hyphenated
 * - The card title is separate from imageLabel
 * - imageLabel should be short, ex:
 *   "Phishing"
 *   "FERPA"
 *   "Passwords"
 *   "Public Records"
 *
 * EXAMPLE TEMPLATE
 * {
 *   moduleId: "password-basics",
 *   title: "Password Basics",
 *   synopsis: "Learn how to create strong passwords and avoid common password mistakes.",
 *   estimatedMinutes: 10,
 *   category: "general",
 *   allowedOrgTypes: ["all"],
 *   image: "/sampleimage1.png",
 *   imageLabel: "Passwords",
 * }
 */
const TEMP_LESSONS = [
  {
    moduleId: "phishing-basics",
    title: "Phishing Basics",
    synopsis: "Learn how to spot phishing emails, fake logins, and suspicious links before they become incidents.",
    estimatedMinutes: 10,
    category: "general",
    allowedOrgTypes: ["all"],
    image: null,
    imageLabel: "Phishing",
  },
  {
    moduleId: "password-basics",
    title: "Password Basics",
    synopsis: "Build better password habits, understand password managers, and reduce account takeover risk.",
    estimatedMinutes: 8,
    category: "general",
    allowedOrgTypes: ["all"],
    image: null,
    imageLabel: "Passwords",
  },
  {
    moduleId: "multi-factor-authentication",
    title: "Multi-Factor Authentication",
    synopsis: "Understand why MFA matters, where to enable it, and how it helps stop account compromise.",
    estimatedMinutes: 12,
    category: "general",
    allowedOrgTypes: ["all"],
    image: null,
    imageLabel: "MFA",
  },
  {
    moduleId: "ferpa-data-protection",
    title: "Keeping Student Health and Personal Info Safe",
    synopsis: "Handle student data safely and avoid FERPA issues involving AI tools, email, sharing, and personal devices.",
    estimatedMinutes: 14,
    category: "education",
    allowedOrgTypes: ["education"],
    image: null,
    imageLabel: "FERPA",
  },
  {
    moduleId: "student-device-safety",
    title: "Student Device and Account Safety",
    synopsis: "Reduce classroom technology risk through safer device handling, account hygiene, and smart daily practices.",
    estimatedMinutes: 9,
    category: "education",
    allowedOrgTypes: ["education"],
    image: null,
    imageLabel: "Devices",
  },
  {
    moduleId: "vendor-email-fraud",
    title: "Vendor Invoice and Email Fraud",
    synopsis: "Recognize invoice scams, payment redirection attempts, and high-risk business email patterns.",
    estimatedMinutes: 11,
    category: "small_business",
    allowedOrgTypes: ["small_business"],
    image: null,
    imageLabel: "Vendors",
  },
  {
    moduleId: "customer-data-handling",
    title: "Customer Data Handling Basics",
    synopsis: "Protect customer and employee information through practical handling, storage, and sharing habits.",
    estimatedMinutes: 10,
    category: "small_business",
    allowedOrgTypes: ["small_business"],
    image: null,
    imageLabel: "Data",
  },
  {
    moduleId: "public-records-and-email",
    title: "Public Records and Email Awareness",
    synopsis: "Understand how public-sector communications, retention expectations, and disclosure risk intersect.",
    estimatedMinutes: 13,
    category: "local_government",
    allowedOrgTypes: ["local_government"],
    image: null,
    imageLabel: "Records",
  },
  {
    moduleId: "incident-reporting-for-agencies",
    title: "Incident Reporting for Agencies",
    synopsis: "Teach staff when to escalate suspicious activity and how to respond without creating more risk.",
    estimatedMinutes: 7,
    category: "local_government",
    allowedOrgTypes: ["local_government"],
    image: null,
    imageLabel: "Reporting",
  },
];

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

  if (
    orgType &&
    ["education", "small_business", "local_government"].includes(orgType)
  ) {
    filters.push(orgType);
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

  const modules = TEMP_LESSONS;
  const visibleFilters = getVisibleFilters(role, orgType);

  const canAccess = (module) => {
    if (!module.allowedOrgTypes || module.allowedOrgTypes.includes("all")) {
      return true;
    }
    if (!orgType) return false;
    return module.allowedOrgTypes.includes(orgType);
  };

  const visibleModules = useMemo(() => {
    let filtered = modules;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((module) => module.category === selectedCategory);
    }

    if (role !== "coordinator") {
      filtered = filtered.filter((module) => canAccess(module));
    }

    return filtered;
  }, [role, selectedCategory, orgType]);

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