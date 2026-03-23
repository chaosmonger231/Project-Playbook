import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import moduleRegistry from "../learningContent/moduleRegistry.json";
import "./ParticipantTrainingPanel.css";

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

function normalizeProgressDoc(moduleId, snap) {
  if (!snap.exists()) {
    return {
      moduleId,
      completed: false,
      quizPassed: false,
      score: null,
      percentComplete: 0,
      lastUpdated: null,
      status: "not_started",
    };
  }

  const data = snap.data() || {};
  const rawStatus = data.status;

  const completed =
    rawStatus === "completed" ||
    data.completed === true ||
    Number(data.percentComplete || 0) >= 100;

  const percentComplete =
    typeof data.percentComplete === "number"
      ? data.percentComplete
      : completed
      ? 100
      : rawStatus === "in_progress"
      ? 50
      : 0;

  const derivedStatus = completed
    ? "completed"
    : rawStatus === "in_progress" || percentComplete > 0
    ? "in_progress"
    : "not_started";

  return {
    moduleId,
    completed,
    quizPassed: !!data.quizPassed || completed,
    score: typeof data.score === "number" ? data.score : null,
    percentComplete,
    lastUpdated: data.updatedAt || data.lastUpdated || null,
    status: derivedStatus,
  };
}

export default function ParticipantTrainingPanel() {
  const navigate = useNavigate();
  const { uid, orgId, orgType, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trainingMode, setTrainingMode] = useState("open");
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [visibleModules, setVisibleModules] = useState([]);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function loadParticipantTraining() {
      if (userLoading) return;

      if (!uid || !orgId) {
        if (isMounted) {
          setLoading(false);
          setError("No organization found for this user.");
          setTrainingMode("open");
          setActiveCampaign(null);
          setVisibleModules([]);
          setProgressMap({});
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError("");
        }

        const settingsRef = doc(db, "orgs", orgId, "settings", "training");
        const settingsSnap = await getDoc(settingsRef);

        let mode = "open";

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data() || {};
          mode = settingsData.trainingMode || "open";
        }

        const allModules = moduleRegistry.modules || [];
        let campaign = null;
        let modules = [];

        if (mode === "controlled") {
          const playbooksRef = collection(db, "orgs", orgId, "playbooks");
          const activeCampaignQuery = query(
            playbooksRef,
            where("isActive", "==", true),
            limit(1)
          );

          const activeCampaignSnap = await getDocs(activeCampaignQuery);

          if (!activeCampaignSnap.empty) {
            const docSnap = activeCampaignSnap.docs[0];
            const campaignData = docSnap.data() || {};

            campaign = {
              id: docSnap.id,
              ...campaignData,
            };

            const assignedModuleIds = Array.isArray(campaignData.moduleIds)
              ? campaignData.moduleIds
              : [];

            modules = allModules.filter((module) =>
              assignedModuleIds.includes(module.moduleId)
            );
          } else {
            modules = [];
          }
        } else {
          modules = allModules.filter((module) => {
            if (!module.allowedOrgTypes || module.allowedOrgTypes.includes("all")) {
              return true;
            }
            if (!orgType) return false;
            return module.allowedOrgTypes.includes(orgType);
          });
        }

        const progressEntries = await Promise.all(
          modules.map(async (module) => {
            const moduleId = module.moduleId;
            const progressRef = doc(db, "users", uid, "trainingProgress", moduleId);
            const progressSnap = await getDoc(progressRef);
            return [moduleId, normalizeProgressDoc(moduleId, progressSnap)];
          })
        );

        const nextProgressMap = Object.fromEntries(progressEntries);

        if (!isMounted) return;

        setTrainingMode(mode);
        setActiveCampaign(campaign);
        setVisibleModules(modules);
        setProgressMap(nextProgressMap);
      } catch (err) {
        console.error("Failed to load participant training progress", err);

        if (!isMounted) return;
        setError("Could not load training progress.");
        setTrainingMode("open");
        setActiveCampaign(null);
        setVisibleModules([]);
        setProgressMap({});
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadParticipantTraining();

    return () => {
      isMounted = false;
    };
  }, [uid, orgId, orgType, userLoading]);

  const summary = useMemo(() => {
    const total = visibleModules.length;

    const completed = visibleModules.filter((module) => {
      return !!progressMap[module.moduleId]?.completed;
    }).length;

    const inProgress = visibleModules.filter((module) => {
      const progress = progressMap[module.moduleId];
      return progress && !progress.completed && (progress.percentComplete || 0) > 0;
    }).length;

    const notStarted = Math.max(total - completed - inProgress, 0);

    return { total, completed, inProgress, notStarted };
  }, [visibleModules, progressMap]);

  const learnerHasNoCampaign =
    trainingMode === "controlled" && !activeCampaign && !error;

  const learnerHasCampaignButNoModules =
    trainingMode === "controlled" &&
    activeCampaign &&
    (!Array.isArray(activeCampaign.moduleIds) || activeCampaign.moduleIds.length === 0);

  const campaignEndLabel =
    trainingMode === "controlled" ? formatCampaignEndDate(activeCampaign?.endAt) : "";

  if (userLoading || loading) {
    return (
      <div className="participant-training-panel">
        <div className="participant-training-status">
          Loading training progress...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="participant-training-panel">
        <div className="participant-training-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="participant-training-panel">
      <div className="participant-training-header">

      </div>

      <div className="participant-training-mode-banner">
        <div className="participant-training-mode-line">
          <strong>Current Training Campaign Mode:</strong>{" "}
          {trainingMode === "controlled" ? "Controlled" : "Organization-Based"}
          {trainingMode === "controlled" && campaignEndLabel && (
            <>
              <span className="participant-training-divider"> | </span>
              <span className="participant-training-campaign-end">
                Ends {campaignEndLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {learnerHasNoCampaign && (
        <div className="participant-training-empty">
          <h4>No active training campaign</h4>
          <p>Your coordinator has not assigned a training campaign yet.</p>
        </div>
      )}

      {learnerHasCampaignButNoModules && (
        <div className="participant-training-empty">
          <h4>No modules assigned</h4>
          <p>This active campaign does not currently include any lessons.</p>
        </div>
      )}

      {!learnerHasNoCampaign && !learnerHasCampaignButNoModules && (
        <>
          <div className="participant-training-summary">
            <div className="participant-training-stat">
              <span className="participant-training-stat-number">{summary.total}</span>
              <span className="participant-training-stat-label">Assigned</span>
            </div>

            <div className="participant-training-stat">
              <span className="participant-training-stat-number">
                {summary.completed}
              </span>
              <span className="participant-training-stat-label">Completed</span>
            </div>

            <div className="participant-training-stat">
              <span className="participant-training-stat-number">
                {summary.inProgress}
              </span>
              <span className="participant-training-stat-label">In Progress</span>
            </div>

            <div className="participant-training-stat">
              <span className="participant-training-stat-number">
                {summary.notStarted}
              </span>
              <span className="participant-training-stat-label">Not Started</span>
            </div>
          </div>

          {visibleModules.length === 0 ? (
            <div className="participant-training-empty">
              <h4>No training modules available</h4>
              <p>Your organization does not currently have visible lessons for you.</p>
            </div>
          ) : (
            <div className="participant-training-list">
              {visibleModules.map((module) => {
                const moduleId = module.moduleId;
                const progress = progressMap[moduleId] || {
                  completed: false,
                  percentComplete: 0,
                  score: null,
                };

                let statusText = "Not Started";
                if (progress.completed) {
                  statusText = "Completed";
                } else if ((progress.percentComplete || 0) > 0) {
                  statusText = "In Progress";
                }

                return (
                  <div key={moduleId} className="participant-training-card">
                    <div className="participant-training-card-main">
                      <div className="participant-training-card-title-row">
                        <h4 className="participant-training-card-title">
                          {module.title || moduleId}
                        </h4>
                        <span
                          className={`participant-training-badge ${
                            progress.completed
                              ? "completed"
                              : (progress.percentComplete || 0) > 0
                              ? "in-progress"
                              : "not-started"
                          }`}
                        >
                          {statusText}
                        </span>
                      </div>

                      {module.synopsis ? (
                        <p className="participant-training-card-description">
                          {module.synopsis}
                        </p>
                      ) : null}

                      <div className="participant-training-meta">
                        <span>{progress.percentComplete || 0}% complete</span>
                        {typeof progress.score === "number" ? (
                          <span>Quiz Score: {progress.score}%</span>
                        ) : null}
                      </div>

                      <div className="participant-training-progressbar">
                        <div
                          className="participant-training-progressbar-fill"
                          style={{ width: `${progress.percentComplete || 0}%` }}
                        />
                      </div>

                      <div className="participant-training-actions">
                        <button
                          type="button"
                          className="participant-training-open-button"
                          onClick={() => navigate(`/learning/${moduleId}`)}
                        >
                          {progress.completed ? "Review Lesson" : "Open Lesson"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}