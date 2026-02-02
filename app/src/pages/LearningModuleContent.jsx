import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ModuleVideo from "../components/ModuleVideo";
import LearningModuleQuiz from "../components/LearningModuleQuiz";

// content JSON imports
import phishingContent from "../learningContent/phishing.content.json";
// import passwordsContent from "../learningContent/passwords.content.json";

const CONTENT = {
  phishing: phishingContent,
  // passwords: passwordsContent,
};

export default function LearningModuleContent() {
  const { topic } = useParams();
  const navigate = useNavigate();

  const moduleData = useMemo(() => CONTENT[topic], [topic]);
  const [pageIndex, setPageIndex] = useState(0);

  // quiz results live here after quiz finishes
  const [quizResult, setQuizResult] = useState(null);

  // ✅ allow only ONE retake
  const [retakeUsed, setRetakeUsed] = useState(false);

  if (!moduleData) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Module not found</h2>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  const pages = moduleData.pages || [];
  const page = pages[pageIndex];

  const goNext = () => setPageIndex((i) => Math.min(pages.length - 1, i + 1));
  const goBack = () => setPageIndex((i) => Math.max(0, i - 1));

  function restartQuiz() {
    // ✅ block infinite retakes
    if (retakeUsed) return;

    setQuizResult(null);
    setRetakeUsed(true);

    const quizWelcomeIndex = pages.findIndex((p) => p.type === "quizWelcome");
    setPageIndex(quizWelcomeIndex >= 0 ? quizWelcomeIndex : 0);
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

            {/* Text (supports \n\n line breaks) */}
            {typeof page.text === "string" && page.text.trim().length > 0 && (
              <div style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {page.text}
              </div>
            )}

            {/* Bullets (semantic list) */}
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
            {page.subtitle && <p>{page.subtitle}</p>}
            <button
              onClick={() => {
                const quizIndex = pages.findIndex((p) => p.type === "quiz");
                setPageIndex(quizIndex >= 0 ? quizIndex : pageIndex);
              }}
              style={{ padding: "12px 16px", borderRadius: 12, marginTop: 12 }}
            >
              {page.startButtonText || "Start Quiz"}
            </button>
          </div>
        );

      case "quiz":
        return (
          <div>
            <h2>Quiz</h2>
            <LearningModuleQuiz
              modulePath={page.quizModulePath}
              onComplete={(result) => {
                setQuizResult(result);

                const resultsIndex = pages.findIndex((p) => p.type === "results");
                setPageIndex(resultsIndex >= 0 ? resultsIndex : pageIndex);
              }}
            />
          </div>
        );

      case "results":
        return (
          <div>
            <h2>{page.title}</h2>
            {page.subtitle && <p>{page.subtitle}</p>}

            {quizResult ? (
              <div style={{ marginTop: 12 }}>
                <p>
                  <b>Score:</b> {quizResult.score} / {quizResult.total}
                </p>

                {page.showReview && Array.isArray(quizResult.answers) && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Review</h3>
                    {quizResult.answers.map((a, idx) => (
                      <div key={idx} style={{ marginBottom: 12 }}>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p>No quiz result found yet.</p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {!retakeUsed ? (
                <button
                  onClick={restartQuiz}
                  style={{ padding: "12px 16px", borderRadius: 12 }}
                >
                  {page.buttons?.restartQuizText || "Restart Quiz"} (1 retry)
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  Restart Used
                </button>
              )}

              <button
                onClick={() => navigate("/")}
                style={{ padding: "12px 16px", borderRadius: 12 }}
              >
                {page.buttons?.backToHomeText || "Back to Home"}
              </button>
            </div>
          </div>
        );

      default:
        return <div>Unknown page type: {page.type}</div>;
    }
  }

  const isQuizPage = page.type === "quiz";
  const isResultsPage = page.type === "results";
  const isQuizWelcome = page.type === "quizWelcome";

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ opacity: 0.75 }}>
          Page {pageIndex + 1} / {pages.length}
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "10px 14px", borderRadius: 10 }}
        >
          Exit
        </button>
      </div>

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

        {/* Navigation controls (hide on quiz/results/quizWelcome) */}
        {!isQuizPage && !isResultsPage && !isQuizWelcome && (
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              disabled={pageIndex === 0}
              onClick={goBack}
              style={{ padding: "12px 16px", borderRadius: 12 }}
            >
              Back
            </button>
            <button
              onClick={goNext}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                marginLeft: "auto",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}