import React, { useEffect, useMemo, useState } from "react";

/**
 * LearningModuleQuiz
 *
 * New flow:
 * - user can move question-to-question without grading each one
 * - correctness is checked only at the very end
 * - all questions must be answered before finishing
 * - onComplete receives full review data
 *
 * Props:
 * - modulePath: string
 * - onComplete: function(result) => void
 */
export default function LearningModuleQuiz({
  modulePath = "/learningModule/phishing.json",
  onComplete,
}) {
  const [moduleData, setModuleData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  // store answers by question index
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      setModuleData(null);

      setCurrentIndex(0);
      setSelectedAnswers({});

      try {
        const res = await fetch(modulePath);
        if (!res.ok) {
          throw new Error(
            `Failed to load module JSON (${res.status}) from ${modulePath}`
          );
        }
        const data = await res.json();
        if (isMounted) setModuleData(data);
      } catch (e) {
        if (isMounted) setError(e?.message || "Failed to load module.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [modulePath]);

  const questions = moduleData?.questions || [];
  const total = questions.length;
  const question = questions[currentIndex];

  const isLast = useMemo(() => currentIndex >= total - 1, [currentIndex, total]);
  const selectedId = selectedAnswers[currentIndex] ?? null;

  const answeredCount = useMemo(() => {
    return Object.values(selectedAnswers).filter(
      (value) => value !== null && value !== undefined
    ).length;
  }, [selectedAnswers]);

  const allAnswered = total > 0 && answeredCount === total;

  if (isLoading) return <div>Loading module…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!moduleData) return <div>No module data found.</div>;
  if (!questions.length) return <div>This module has no questions.</div>;

  function handleSelect(choiceId) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: choiceId,
    }));
  }

  function goBack() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }

  function goToQuestion(index) {
    setCurrentIndex(index);
  }

  function finishQuiz() {
    if (!allAnswered) return;

    const answers = questions.map((q, idx) => {
      const userSelectedId = selectedAnswers[idx];

      const userChoiceText =
        q.choices.find((c) => c.id === userSelectedId)?.text ??
        String(userSelectedId);

      const correctChoiceText =
        q.choices.find((c) => c.id === q.correctId)?.text ?? String(q.correctId);

      const correct = userSelectedId === q.correctId;

      return {
        question: q.prompt,
        userAnswer: userChoiceText,
        correctAnswer: correctChoiceText,
        correct,
        explanation: q.explanation || "",
      };
    });

    const score = answers.filter((a) => a.correct).length;

    onComplete?.({
      score,
      total,
      answers,
    });
  }

  const mutedTextColor = "#55657d";
  const borderColor = "#d6e3f8";
  const primaryText = "#16325c";
  const selectedBg = "#eaf3ff";
  const cardBg = "#f8fbff";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontSize: "2rem",
            lineHeight: 1.15,
            color: primaryText,
          }}
        >
          {moduleData.title || moduleData.moduleId}
        </h2>

        {moduleData.description ? (
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: mutedTextColor,
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}
          >
            {moduleData.description}
          </p>
        ) : null}

        <div
          style={{
            marginTop: 16,
            color: mutedTextColor,
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          Question {currentIndex + 1} of {total}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: 24,
          background: cardBg,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
            fontSize: "1.9rem",
            lineHeight: 1.25,
            color: "#000",
            whiteSpace: "pre-wrap",
          }}
          dangerouslySetInnerHTML={{ __html: question.prompt }}
        >
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          {question.choices.map((choice, idx) => {
            const label = ["A", "B", "C", "D"][idx] || "";
            const isSelected = selectedId === choice.id;

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleSelect(choice.id)}
                style={{
                  textAlign: "left",
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: "1px solid #c4d2e8",
                  cursor: "pointer",
                  background: isSelected ? selectedBg : "#fff",
                  fontSize: "1rem",
                  lineHeight: 1.45,
                }}
              >
                <strong>{label ? `${label}. ` : ""}</strong>
                {choice.text}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {questions.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = selectedAnswers[idx] != null;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => goToQuestion(idx)}
                aria-label={`Go to question ${idx + 1}`}
                title={`Question ${idx + 1}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: isCurrent ? "2px solid #16325c" : "1px solid #9bb3d8",
                  background: isCurrent
                    ? "#16325c"
                    : isAnswered
                    ? "#8fb8ff"
                    : "#ffffff",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: mutedTextColor, fontSize: "0.95rem" }}>
            {answeredCount} of {total} answered
          </div>

          {!allAnswered && (
            <div style={{ color: mutedTextColor, fontSize: "0.95rem" }}>
              Answer all questions before finishing.
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={goBack}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #333",
              background: "#fff",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
          >
            Back
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={goNext}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #333",
                background: "#fff",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={finishQuiz}
              disabled={!allAnswered}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #333",
                background: "#fff",
                cursor: !allAnswered ? "not-allowed" : "pointer",
                opacity: !allAnswered ? 0.5 : 1,
                marginLeft: "auto",
              }}
            >
              Finish Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}