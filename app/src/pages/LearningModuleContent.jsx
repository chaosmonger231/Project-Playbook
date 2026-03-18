import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import ModuleVideo from "../components/ModuleVideo";
import LearningModuleQuiz from "../components/LearningModuleQuiz";

import moduleRegistry from "../learningContent/moduleRegistry.json";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

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

function canAccessModule(moduleMeta, orgType, role) {
  if (!moduleMeta) return false;
  if (role === "coordinator") return true;

  const allowedOrgTypes = moduleMeta.allowedOrgTypes || [];
  if (allowedOrgTypes.includes("all")) return true;
  if (!orgType) return false;

  return allowedOrgTypes.includes(orgType);
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
  const [retakeUsed, setRetakeUsed] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [progressError, setProgressError] = useState("");

  const progressInitializedRef = useRef(false);
  const completionWriteRef = useRef(false);

  const isAllowed = useMemo(
    () => canAccessModule(moduleMeta, orgType, role),
    [moduleMeta, orgType, role]
  );

  useEffect(() => {
    if (loading) return;

    if (!moduleMeta || !moduleData) {
      setAccessChecked(true);
      return;
    }

    if (!isAllowed) {
      alert("You do not have access to this lesson.");
      navigate("/lessons", { replace: true });
      return;
    }

    setAccessChecked(true);
  }, [loading, moduleMeta, moduleData, isAllowed, navigate]);

  useEffect(() => {
    async function ensureTrainingProgressStarted() {
      if (
        loading ||
        !accessChecked ||
        !isAllowed ||
        !uid ||
        !orgId ||
        !moduleMeta ||
        progressInitializedRef.current
      ) {
        return;
      }

      try {
        progressInitializedRef.current = true;

        const progressRef = doc(db, "users", uid, "trainingProgress", moduleMeta.moduleId);
        const progressSnap = await getDoc(progressRef);

        if (!progressSnap.exists()) {
          await setDoc(progressRef, {
            moduleId: moduleMeta.moduleId,
            orgId,
            assigned: true,
            status: "in_progress",
            assignedAt: serverTimestamp(),
            startedAt: serverTimestamp(),
            completedAt: null,
            updatedAt: serverTimestamp(),
          });
          return;
        }

        const existing = progressSnap.data() || {};
        if (existing.status !== "completed") {
          await updateDoc(progressRef, {
            assigned: true,
            status: "in_progress",
            startedAt: existing.startedAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Failed to initialize training progress", err);
        setProgressError("We could not save your lesson progress right now.");
      }
    }

    ensureTrainingProgressStarted();
  }, [loading, accessChecked, isAllowed, uid, orgId, moduleMeta]);

  useEffect(() => {
    async function markCompleted() {
      if (
        loading ||
        !accessChecked ||
        !isAllowed ||
        !uid ||
        !orgId ||
        !moduleMeta ||
        !quizResult ||
        completionWriteRef.current
      ) {
        return;
      }

      const total = Number(quizResult.total) || 0;
      const score = Number(quizResult.score) || 0;
      const passed = total > 0 && score / total >= 0.5;

      if (!passed) return;

      try {
        completionWriteRef.current = true;

        const progressRef = doc(db, "users", uid, "trainingProgress", moduleMeta.moduleId);

        await setDoc(
          progressRef,
          {
            moduleId: moduleMeta.moduleId,
            orgId,
            assigned: true,
            status: "completed",
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to mark lesson completed", err);
        setProgressError("We could not save your quiz completion right now.");
      }
    }

    markCompleted();
  }, [quizResult, loading, accessChecked, isAllowed, uid, orgId, moduleMeta]);

  if (loading || !accessChecked) {
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

  const hasQuizResult = !!quizResult && Number(quizResult.total) > 0;
  const passed =
    hasQuizResult &&
    Number(quizResult.score) / Number(quizResult.total) >= 0.5;

  const hasPerfectScore =
    !!quizResult &&
    Number(quizResult.total) > 0 &&
    Number(quizResult.score) === Number(quizResult.total);

  const restartDisabled = retakeUsed || passed;

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
    setRetakeUsed(true);
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
            const quizIndex = pages.findIndex((p) => p.type === "quiz");
            setPageIndex(quizIndex >= 0 ? quizIndex : pageIndex);
          }}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #1d4ed8",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {page.startButtonText || "Start Quiz"}
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

            {renderQuizWelcomeActions()}
          </div>
        );

      case "quiz":
        return (
          <LearningModuleQuiz
            modulePath={page.quizModulePath}
            onComplete={(result) => {
              setQuizResult(result);

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
                {hasPerfectScore
                  ? "Perfect Score Achieved"
                  : retakeUsed
                  ? "Restart Used"
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