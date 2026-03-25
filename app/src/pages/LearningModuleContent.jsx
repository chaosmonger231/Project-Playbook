import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import ModuleVideo from "../components/ModuleVideo";
import LearningModuleQuiz from "../components/LearningModuleQuiz";

import moduleRegistry from "../learningContent/moduleRegistry.json";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import { getTrainingMode } from "../utils/trainingEngine";

// content JSON imports
import phishingContent from "../learningContent/phishing.content.json";
import eduPrivacyContent from "../learningContent/education_student_privacy.json";
import socialEngineeringContent from "../learningContent/social_engineering_awareness.content.json";
import passwordBasicsContent from "../learningContent/password_basics.content.json";
import mfaContent from "../learningContent/multi_factor_authentication.content.json";
import safeInternetContent from "../learningContent/safe_internet_link_safety.content.json";
import studentDeviceSafetyContent from "../learningContent/student_device_safety.content.json";
import classroomCommunicationContent from "../learningContent/classroom_communication_data_safety.content.json";
import vendorEmailFraudContent from "../learningContent/vendor_email_fraud.content.json";
import customerDataHandlingContent from "../learningContent/customer_data_handling.content.json";
import ransomwareBackupContent from "../learningContent/ransomware_backup_awareness.content.json";
import governmentTargetedAttacks from "../learningContent/government_targeted_attacks.content.json";
import incidentResponseReportingAgenciesContent from "../learningContent/incident_response_reporting_agencies.content.json";
import ransomwareServiceDisruptionContent from "../learningContent/ransomware_service_disruption_awareness.content.json";

const CONTENT = {
  phishing: phishingContent,
  education_student_privacy: eduPrivacyContent,
  social_engineering_awareness: socialEngineeringContent,
  password_basics: passwordBasicsContent,
  multi_factor_authentication: mfaContent,
  safe_internet_link_safety: safeInternetContent,
  student_device_safety: studentDeviceSafetyContent,
  classroom_communication_data_safety: classroomCommunicationContent,
  vendor_email_fraud: vendorEmailFraudContent,
  customer_data_handling: customerDataHandlingContent,
  ransomware_backup_awareness: ransomwareBackupContent,
  government_targeted_attacks: governmentTargetedAttacks,
  incident_response_reporting_agencies: incidentResponseReportingAgenciesContent,
  ransomware_service_disruption_awareness: ransomwareServiceDisruptionContent,
};

const REGISTRY_BY_ID = Object.fromEntries(
  (moduleRegistry.modules || []).map((m) => [m.moduleId, m])
);

function canAccessModuleByOrgType(moduleMeta, orgType) {
  if (!moduleMeta) return false;

  const allowedOrgTypes = moduleMeta.allowedOrgTypes || [];
  if (allowedOrgTypes.includes("all")) return true;
  if (!orgType) return false;

  return allowedOrgTypes.includes(orgType);
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

export default function LearningModuleContent() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { uid, orgId, orgType, role, loading } = useUser();

  const moduleMeta = useMemo(() => REGISTRY_BY_ID[moduleId], [moduleId]);
  const moduleData = useMemo(
    () => (moduleMeta ? CONTENT[moduleMeta.contentKey] : null),
    [moduleMeta]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [storedProgress, setStoredProgress] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [trainingMode, setTrainingMode] = useState("open");

  const [campaignChecked, setCampaignChecked] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignContext, setCampaignContext] = useState(null);

  const progressInitializedRef = useRef(false);
  const completionWriteRef = useRef(false);

  const hasActiveCampaign = !!activeCampaign?.id;
  const campaignId = campaignContext?.id || null;
  const noActiveCampaign = campaignChecked && !hasActiveCampaign;
  const isCoordinator = role === "coordinator";

  useEffect(() => {
    let cancelled = false;

    async function loadTrainingMode() {
      if (loading) return;

      if (!orgId) {
        setTrainingMode("open");
        return;
      }

      const mode = await getTrainingMode(orgId);
      if (!cancelled) {
        setTrainingMode(mode);
      }
    }

    loadTrainingMode();

    return () => {
      cancelled = true;
    };
  }, [loading, orgId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaignContext() {
      if (loading) return;

      if (!orgId) {
        if (!cancelled) {
          setActiveCampaign(null);
          setCampaignContext(null);
          setCampaignChecked(true);
        }
        return;
      }

      try {
        setCampaignChecked(false);

        const playbooksSnap = await getDocs(collection(db, "orgs", orgId, "playbooks"));
        const rows = playbooksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const active = rows.find((pb) => pb.isActive === true) || null;

        const latestEnded =
          [...rows]
            .filter((pb) => pb.isActive !== true)
            .sort((a, b) => getSortableTime(b) - getSortableTime(a))[0] || null;

        if (!cancelled) {
          setActiveCampaign(active);
          setCampaignContext(active || latestEnded || null);
          setCampaignChecked(true);
        }
      } catch (err) {
        console.error("Failed to load campaign context", err);
        if (!cancelled) {
          setActiveCampaign(null);
          setCampaignContext(null);
          setCampaignChecked(true);
          setProgressError("We could not load campaign information right now.");
        }
      }
    }

    loadCampaignContext();

    return () => {
      cancelled = true;
    };
  }, [loading, orgId]);

  useEffect(() => {
    progressInitializedRef.current = false;
    completionWriteRef.current = false;
    setQuizResult(null);
    setStoredProgress(null);
    setAttempts(0);
  }, [moduleId, campaignId]);

  useEffect(() => {
    if (loading || !campaignChecked) return;

    if (!moduleMeta || !moduleData) {
      setAccessChecked(true);
      return;
    }

    let hasAccess = false;

    if (isCoordinator) {
      if (trainingMode === "controlled") {
        hasAccess =
          !!activeCampaign &&
          Array.isArray(activeCampaign.moduleIds) &&
          activeCampaign.moduleIds.includes(moduleMeta.moduleId);
      } else {
        hasAccess = canAccessModuleByOrgType(moduleMeta, orgType);
      }
    } else {
      if (trainingMode === "controlled") {
        hasAccess =
          !!activeCampaign &&
          Array.isArray(activeCampaign.moduleIds) &&
          activeCampaign.moduleIds.includes(moduleMeta.moduleId);
      } else {
        hasAccess = canAccessModuleByOrgType(moduleMeta, orgType);
      }
    }

    if (!hasAccess) {
      alert("You do not have access to this lesson.");
      navigate("/lessons", { replace: true });
      return;
    }

    setAccessChecked(true);
  }, [
    loading,
    campaignChecked,
    moduleMeta,
    moduleData,
    trainingMode,
    activeCampaign,
    orgType,
    isCoordinator,
    navigate,
  ]);

  useEffect(() => {
    async function loadCampaignProgress() {
      if (
        loading ||
        !campaignChecked ||
        !accessChecked ||
        !uid ||
        !orgId ||
        !moduleMeta ||
        progressInitializedRef.current
      ) {
        return;
      }

      try {
        progressInitializedRef.current = true;

        if (!campaignId) {
          setStoredProgress(null);
          setAttempts(0);
          return;
        }

        const progressRef = doc(
          db,
          "users",
          uid,
          "campaignProgress",
          campaignId,
          "modules",
          moduleMeta.moduleId
        );

        const progressSnap = await getDoc(progressRef);

        if (!progressSnap.exists()) {
          if (!hasActiveCampaign) {
            setStoredProgress(null);
            setAttempts(0);
            return;
          }

          const initialProgress = {
            campaignId,
            moduleId: moduleMeta.moduleId,
            orgId,
            assigned: true,
            status: "in_progress",
            attempts: 0,
            score: null,
            totalQuestions: null,
            correctAnswers: null,
            passed: false,
            assignedAt: serverTimestamp(),
            startedAt: serverTimestamp(),
            completedAt: null,
            updatedAt: serverTimestamp(),
          };

          await setDoc(progressRef, initialProgress);

          setStoredProgress({
            campaignId,
            moduleId: moduleMeta.moduleId,
            orgId,
            assigned: true,
            status: "in_progress",
            attempts: 0,
            score: null,
            totalQuestions: null,
            correctAnswers: null,
            passed: false,
            completedAt: null,
          });
          setAttempts(0);
          return;
        }

        const existing = progressSnap.data() || {};
        setStoredProgress(existing);
        setAttempts(Number(existing.attempts) || 0);

        if (
          hasActiveCampaign &&
          existing.status !== "completed" &&
          existing.status !== "failed"
        ) {
          await updateDoc(progressRef, {
            assigned: true,
            status: "in_progress",
            startedAt: existing.startedAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Failed to initialize campaign progress", err);
        setProgressError("We could not save your lesson progress right now.");
      }
    }

    loadCampaignProgress();
  }, [
    loading,
    campaignChecked,
    accessChecked,
    uid,
    orgId,
    moduleMeta,
    campaignId,
    hasActiveCampaign,
  ]);

  useEffect(() => {
    async function saveQuizProgress() {
      if (
        loading ||
        !campaignChecked ||
        !hasActiveCampaign ||
        !accessChecked ||
        !uid ||
        !orgId ||
        !moduleMeta ||
        !campaignId ||
        !quizResult ||
        completionWriteRef.current
      ) {
        return;
      }

      const total = Number(quizResult.total) || 0;
      const score = Number(quizResult.score) || 0;
      const passed = total > 0 && score / total >= 0.5;
      const failed = attempts >= 2 && !passed;

      try {
        completionWriteRef.current = true;

        const progressRef = doc(
          db,
          "users",
          uid,
          "campaignProgress",
          campaignId,
          "modules",
          moduleMeta.moduleId
        );

        await setDoc(
          progressRef,
          {
            campaignId,
            moduleId: moduleMeta.moduleId,
            orgId,
            assigned: true,
            attempts,
            score,
            totalQuestions: total,
            correctAnswers: score,
            passed,
            status: passed ? "completed" : failed ? "failed" : "in_progress",
            completedAt: passed ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        setStoredProgress((prev) => ({
          ...(prev || {}),
          campaignId,
          moduleId: moduleMeta.moduleId,
          orgId,
          assigned: true,
          attempts,
          score,
          totalQuestions: total,
          correctAnswers: score,
          passed,
          status: passed ? "completed" : failed ? "failed" : "in_progress",
        }));
      } catch (err) {
        console.error("Failed to save quiz progress", err);
        setProgressError("We could not save your quiz completion right now.");
      }
    }

    saveQuizProgress();
  }, [
    quizResult,
    attempts,
    loading,
    campaignChecked,
    hasActiveCampaign,
    accessChecked,
    uid,
    orgId,
    moduleMeta,
    campaignId,
  ]);

  if (loading || !campaignChecked || !accessChecked) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!moduleData) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Module not found</h2>
        <button
          onClick={() => navigate("/lessons")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Back to Lessons Page
        </button>
      </div>
    );
  }

  const pages = moduleData.pages || [];
  const page = pages[pageIndex];
  const moduleTitle = moduleMeta?.title || moduleData?.title || "Untitled Module";

  if (!pages.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Module is missing pages</h2>
        <p>
          This content file doesn’t include a <code>pages</code> array yet.
        </p>
        <button onClick={() => navigate("/lessons")}>Back to Lessons Catalog</button>
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Invalid page index</h2>
        <p>Page {pageIndex + 1} doesn’t exist for this module.</p>
        <button onClick={() => setPageIndex(0)}>Restart Module</button>
      </div>
    );
  }

  const lessonPageIndexes = pages
    .map((p, idx) => ({ page: p, idx }))
    .filter(({ page }) => page.type !== "quiz" && page.type !== "results")
    .map(({ idx }) => idx);

  const currentLessonPagePosition = lessonPageIndexes.indexOf(pageIndex);
  const lessonPageNumber =
    currentLessonPagePosition >= 0 ? currentLessonPagePosition + 1 : null;
  const lessonPageTotal = lessonPageIndexes.length;

  const isQuizPage = page.type === "quiz";
  const isResultsPage = page.type === "results";
  const isQuizWelcome = page.type === "quizWelcome";

  const showLessonPageCount = !isQuizPage && !isResultsPage && lessonPageNumber != null;
  const showTopLessonNav = !isQuizPage && !isResultsPage && !isQuizWelcome;

  const liveHasQuizResult = !!quizResult && Number(quizResult.total) > 0;
  const livePassed =
    liveHasQuizResult &&
    Number(quizResult.score) / Number(quizResult.total) >= 0.5;

  const storedPassed = storedProgress?.passed === true;
  const storedFailed = storedProgress?.status === "failed";

  const passed = liveHasQuizResult ? livePassed : storedPassed;
  const failed = liveHasQuizResult ? attempts >= 2 && !livePassed : storedFailed;

  const hasPerfectScore =
    !!quizResult &&
    Number(quizResult.total) > 0 &&
    Number(quizResult.score) === Number(quizResult.total);

  const isLocked = noActiveCampaign || passed || failed;
  const restartDisabled = noActiveCampaign || attempts >= 2 || passed;

  const goNext = () => {
    const currentPos = lessonPageIndexes.indexOf(pageIndex);
    if (currentPos < 0) return;

    const nextLessonIndex = lessonPageIndexes[currentPos + 1];
    if (typeof nextLessonIndex === "number") {
      setPageIndex(nextLessonIndex);
    }
  };

  const goBack = () => {
    const currentPos = lessonPageIndexes.indexOf(pageIndex);
    if (currentPos < 0) return;

    const prevLessonIndex = lessonPageIndexes[currentPos - 1];
    if (typeof prevLessonIndex === "number") {
      setPageIndex(prevLessonIndex);
    }
  };

  const goToLessonPage = (lessonPosition) => {
    const targetIndex = lessonPageIndexes[lessonPosition];
    if (typeof targetIndex === "number") {
      setPageIndex(targetIndex);
    }
  };

  function restartQuiz() {
    if (restartDisabled) return;

    setQuizResult(null);
    completionWriteRef.current = false;

    const quizWelcomeIndex = pages.findIndex((p) => p.type === "quizWelcome");
    setPageIndex(quizWelcomeIndex >= 0 ? quizWelcomeIndex : 0);
  }

  function returnToPageOne() {
    setPageIndex(0);
  }

  function renderTopLessonNav() {
    const isFirstLessonPage = currentLessonPagePosition <= 0;
    const isLastLessonPage = currentLessonPagePosition >= lessonPageTotal - 1;

    return (
      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          disabled={isFirstLessonPage}
          onClick={goBack}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#fff",
            cursor: isFirstLessonPage ? "not-allowed" : "pointer",
            opacity: isFirstLessonPage ? 0.5 : 1,
          }}
        >
          Back
        </button>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "center",
            flex: "1 1 auto",
            minWidth: 180,
          }}
        >
          {lessonPageIndexes.map((_, lessonPos) => {
            const isCurrent = lessonPos === currentLessonPagePosition;

            return (
              <button
                key={lessonPos}
                type="button"
                onClick={() => goToLessonPage(lessonPos)}
                aria-label={`Go to page ${lessonPos + 1}`}
                title={`Page ${lessonPos + 1}`}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: isCurrent ? "2px solid #16325c" : "1px solid #8fb1e3",
                  background: isCurrent ? "#16325c" : "#7fb0f4",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>

        <button
          disabled={isLastLessonPage}
          onClick={goNext}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#fff",
            cursor: isLastLessonPage ? "not-allowed" : "pointer",
            opacity: isLastLessonPage ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    );
  }

  function renderQuizWelcomeActions() {
    return (
      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={returnToPageOne}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {page.backButtonText || "Back to Page 1"}
        </button>

        <button
          onClick={() => {
            if (isLocked) return;
            const quizIndex = pages.findIndex((p) => p.type === "quiz");
            setPageIndex(quizIndex >= 0 ? quizIndex : pageIndex);
          }}
          disabled={isLocked}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #1d4ed8",
            background: isLocked ? "#9ca3af" : "#2563eb",
            color: "#fff",
            cursor: isLocked ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: isLocked ? 0.7 : 1,
          }}
        >
          {noActiveCampaign
            ? "No Active Campaign"
            : passed
            ? "Completed"
            : failed
            ? "Failed"
            : page.startButtonText || "Start Quiz"}
        </button>
      </div>
    );
  }

  function renderPage() {
    switch (page.type) {
      case "welcome":
        return (
          <div>
            <h2>{page.title}</h2>
            {page.subtitle && <p>{page.subtitle}</p>}
            {page.video && (
              <ModuleVideo
                videoId={page.video.videoId}
                title={page.video.caption || "Video"}
              />
            )}
          </div>
        );

      case "textImage":
        return (
          <div>
            <h2>{page.title}</h2>

            {typeof page.text === "string" && page.text.trim().length > 0 && (
              <div
                style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: page.text }}
              />
            )}

            {Array.isArray(page.bullets) && page.bullets.length > 0 && (
              <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.6 }}>
                {page.bullets.map((b, idx) => (
                  <li key={idx} style={{ marginBottom: 12 }}>
                    {b.title && (
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {b.title}
                      </div>
                    )}
                    {b.text && <div style={{ opacity: 0.9 }}>{b.text}</div>}
                  </li>
                ))}
              </ul>
            )}

            {page.image && (
              <img
                src={page.image.src}
                alt={page.image.alt || ""}
                style={{
                  width: "100%",
                  maxWidth: 900,
                  borderRadius: 12,
                  marginTop: 16,
                }}
              />
            )}

            {Array.isArray(page.images) && page.images.length > 0 && (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {page.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.src}
                    alt={img.alt || ""}
                    style={{ width: "100%", maxWidth: 900, borderRadius: 12 }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case "quickQA":
        return (
          <div>
            <h2>{page.title}</h2>
            <div style={{ marginTop: 12 }}>
              {page.items?.map((it, idx) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <p>
                    <b>Q:</b> {it.q}
                  </p>
                  <p>
                    <b>A:</b> {it.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "video":
        return (
          <div>
            <h2>{page.title}</h2>
            {page.video && (
              <ModuleVideo
                videoId={page.video.videoId}
                title={page.video.caption || "Video"}
              />
            )}
          </div>
        );

      case "quizWelcome":
        return (
          <div>
            <h2>{page.title}</h2>
            {page.subtitle && (
              <p style={{ maxWidth: 720, lineHeight: 1.6 }}>{page.subtitle}</p>
            )}

            {noActiveCampaign && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                There is no active campaign right now. You can review previous results, but you
                cannot continue this quiz.
              </div>
            )}

            {!noActiveCampaign && isLocked && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: passed ? "#ecfdf5" : "#fef2f2",
                  border: passed ? "1px solid #86efac" : "1px solid #fca5a5",
                  color: passed ? "#166534" : "#991b1b",
                  fontWeight: 700,
                }}
              >
                {passed
                  ? "This quiz has already been completed for this lesson."
                  : "This quiz is locked because no attempts remain."}
              </div>
            )}

            {renderQuizWelcomeActions()}
          </div>
        );

      case "quiz":
        if (noActiveCampaign) {
          return (
            <div>
              <h2>No Active Campaign</h2>
              <p>You cannot take this quiz because there is no active campaign right now.</p>
              <button
                onClick={() => {
                  const resultsIndex = pages.findIndex((p) => p.type === "results");
                  if (resultsIndex >= 0) {
                    setPageIndex(resultsIndex);
                  } else {
                    navigate("/lessons");
                  }
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                View Previous Results
              </button>
            </div>
          );
        }

        if (isLocked) {
          return (
            <div>
              <h2>Quiz Locked</h2>
              <p>
                {passed
                  ? "You have already completed this quiz."
                  : "You have used both attempts for this quiz."}
              </p>
              <button
                onClick={() => {
                  const resultsIndex = pages.findIndex((p) => p.type === "results");
                  if (resultsIndex >= 0) {
                    setPageIndex(resultsIndex);
                  } else {
                    navigate("/lessons");
                  }
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                View Results
              </button>
            </div>
          );
        }

        return (
          <LearningModuleQuiz
            modulePath={page.quizModulePath}
            onComplete={(result) => {
              completionWriteRef.current = false;
              setQuizResult(result);
              setAttempts((prev) => prev + 1);

              const resultsIndex = pages.findIndex((p) => p.type === "results");
              setPageIndex(resultsIndex >= 0 ? resultsIndex : pageIndex);
            }}
          />
        );

      case "results":
        return (
          <div>
            <h2>{page.title}</h2>
            {page.subtitle && <p>{page.subtitle}</p>}

            {quizResult ? (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: passed ? "#ecfdf5" : "#fef2f2",
                    border: passed ? "1px solid #86efac" : "1px solid #fca5a5",
                    color: passed ? "#166534" : "#991b1b",
                    fontWeight: 700,
                  }}
                >
                  {passed
                    ? "Congratulations! You passed the quiz."
                    : failed
                    ? "You did not pass and no attempts remain."
                    : "You did not reach the passing score. Please review the lesson and try again."}
                </div>

                <p>
                  <b>Score:</b> {quizResult.score} / {quizResult.total}
                </p>

                {page.showReview && Array.isArray(quizResult.answers) && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Review</h3>
                    {quizResult.answers.map((a, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: 14,
                          padding: 14,
                          border: "1px solid #d7e3f7",
                          borderRadius: 12,
                          background: "#f8fbff",
                        }}
                      >
                        <p>
                          <b>Q:</b> {a.question}
                        </p>
                        <p>
                          <b>Your answer:</b> {String(a.userAnswer)}{" "}
                          <span style={{ fontWeight: "bold" }}>
                            {a.correct ? "✅" : "❌"}
                          </span>
                        </p>
                        {!a.correct && (
                          <p>
                            <b>Correct answer:</b> {String(a.correctAnswer)}
                          </p>
                        )}
                        {a.explanation ? (
                          <p style={{ marginTop: 8 }}>
                            <b>Explanation:</b> {a.explanation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : storedProgress &&
              typeof storedProgress.correctAnswers === "number" &&
              typeof storedProgress.totalQuestions === "number" ? (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: storedPassed ? "#ecfdf5" : "#fef2f2",
                    border: storedPassed ? "1px solid #86efac" : "1px solid #fca5a5",
                    color: storedPassed ? "#166534" : "#991b1b",
                    fontWeight: 700,
                  }}
                >
                  {storedPassed
                    ? "You have already passed this quiz."
                    : storedFailed
                    ? "This quiz is locked because no attempts remain."
                    : noActiveCampaign
                    ? "There is no active campaign right now. Showing your most recent saved result."
                    : "No quiz result found yet."}
                </div>

                <p>
                  <b>Score:</b> {storedProgress.correctAnswers} / {storedProgress.totalQuestions}
                </p>
              </div>
            ) : noActiveCampaign ? (
              <p>There is no active campaign right now, and no saved result exists for this lesson.</p>
            ) : (
              <p>No quiz result found yet.</p>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 18,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={restartQuiz}
                disabled={restartDisabled}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                  cursor: restartDisabled ? "not-allowed" : "pointer",
                  opacity: restartDisabled ? 0.5 : 1,
                }}
              >
                {noActiveCampaign
                  ? "No Active Campaign"
                  : hasPerfectScore
                  ? "Perfect Score Achieved"
                  : passed
                  ? "Completed"
                  : failed
                  ? "No Attempts Left"
                  : attempts === 1
                  ? "Restart Quiz (Last Attempt)"
                  : page.buttons?.restartQuizText || "Restart Quiz (1 retry)"}
              </button>

              <button
                onClick={() => navigate("/lessons")}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {page.buttons?.returnToLessonsText || "Done"}
              </button>
            </div>
          </div>
        );

      default:
        return <div>Unknown page type: {page.type}</div>;
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              lineHeight: 1.15,
              color: "#16325c",
            }}
          >
            {moduleTitle}
          </h1>

          {showLessonPageCount && (
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              Page {lessonPageNumber} / {lessonPageTotal}
            </div>
          )}

          <div style={{ opacity: 0.65, marginTop: 8, fontSize: 14 }}>
            Training Mode: {trainingMode === "controlled" ? "Controlled" : "Open"}
          </div>

          <div style={{ opacity: 0.65, marginTop: 6, fontSize: 14 }}>
            Campaign View: {hasActiveCampaign ? "Active Campaign" : campaignContext ? "Most Recent Campaign" : "No Campaign"}
          </div>

          {progressError && (
            <div
              style={{
                marginTop: 10,
                color: "#991b1b",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 14,
              }}
            >
              {progressError}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/lessons")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Back to Lessons Catalog
        </button>
      </div>

      {showTopLessonNav && renderTopLessonNav()}

      <div
        style={{
          marginTop: 16,
          background: "white",
          borderRadius: 16,
          padding: 24,
          border: "2px solid #60a5fa",
          boxShadow: "0 8px 20px rgba(59,130,246,0.18)",
        }}
      >
        {renderPage()}
      </div>
    </div>
  );
}