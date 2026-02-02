import React, { useEffect, useMemo, useState } from "react";

/**
 * LearningModuleQuiz
 * - Loads a module JSON from /public (served as static asset)
 * - Renders questions and choices
 * - Checks correctness using correctId
 *
 * Props:
 * - modulePath: string (default: "/learningModule/phishing.json")
 * - onComplete: function(result) => void
 *   result = { score, total, answers: [{ question, userAnswer, correctAnswer, correct }] }
 */
export default function LearningModuleQuiz({
  modulePath = "/learningModule/phishing.json",
  onComplete,
}) {
  const [moduleData, setModuleData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Score + review tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [answerLog, setAnswerLog] = useState([]); // one entry per question index

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      setModuleData(null);

      // reset quiz state on module load
      setCurrentIndex(0);
      setSelectedId(null);
      setHasSubmitted(false);
      setCorrectCount(0);
      setAnswerLog([]);

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

  if (isLoading) return <div>Loading module…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!moduleData) return <div>No module data found.</div>;
  if (!questions.length) return <div>This module has no questions.</div>;

  const isCorrect = selectedId === question.correctId;

  function handleSelect(choiceId) {
    if (hasSubmitted) return; // lock after submit
    setSelectedId(choiceId);
  }

  function handleSubmit() {
    if (selectedId == null) return;
    if (hasSubmitted) return;

    const correct = selectedId === question.correctId;

    setHasSubmitted(true);
    if (correct) setCorrectCount((c) => c + 1);

    // Build a human-readable review entry
    const userChoiceText =
      question.choices.find((c) => c.id === selectedId)?.text ?? String(selectedId);

    const correctChoiceText =
      question.choices.find((c) => c.id === question.correctId)?.text ??
      String(question.correctId);

    const entry = {
      question: question.prompt,
      userAnswer: userChoiceText,
      correctAnswer: correctChoiceText,
      correct,
    };

    // Store at the index of the current question
    setAnswerLog((prev) => {
      const next = [...prev];
      next[currentIndex] = entry;
      return next;
    });
  }

  function finishQuiz() {
    const result = {
      score: correctCount,
      total,
      answers: answerLog.filter(Boolean),
    };

    onComplete?.(result);
  }

  function handleNext() {
    if (!hasSubmitted) return;

    if (isLast) {
      // ✅ finished: report upward instead of alert()
      finishQuiz();
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelectedId(null);
    setHasSubmitted(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1rem" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>{moduleData.title || moduleData.moduleId}</h2>
        {moduleData.description ? (
          <p style={{ marginTop: "0.25rem", color: "#555" }}>
            {moduleData.description}
          </p>
        ) : null}
        <div style={{ marginTop: "0.5rem", color: "#666" }}>
          Question {currentIndex + 1} of {total}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{question.prompt}</h3>

        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
          {question.choices.map((choice, idx) => {
            const label = ["A", "B", "C", "D"][idx] || "";
            const isSelected = selectedId === choice.id;
            const showCorrect = hasSubmitted && choice.id === question.correctId;
            const showWrong = hasSubmitted && isSelected && choice.id !== question.correctId;

            return (
              <button
                key={choice.id}
                onClick={() => handleSelect(choice.id)}
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  cursor: hasSubmitted ? "default" : "pointer",
                  background: showCorrect
                    ? "#d1fadf"
                    : showWrong
                    ? "#ffe0e0"
                    : isSelected
                    ? "#e7f0ff"
                    : "#f7f7f7",
                }}
              >
                <strong>{label ? `${label}. ` : ""}</strong>
                {choice.text}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleSubmit}
            disabled={selectedId == null || hasSubmitted}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: 10,
              border: "1px solid #333",
              cursor: selectedId == null || hasSubmitted ? "not-allowed" : "pointer",
              background: "#fff",
            }}
          >
            Submit
          </button>

          <button
            onClick={handleNext}
            disabled={!hasSubmitted}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: 10,
              border: "1px solid #333",
              cursor: !hasSubmitted ? "not-allowed" : "pointer",
              background: "#fff",
            }}
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>

        {hasSubmitted ? (
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ fontWeight: 600 }}>{isCorrect ? "✅ Correct" : "❌ Incorrect"}</div>
            {question.explanation ? (
              <div style={{ marginTop: "0.25rem", color: "#444" }}>
                {question.explanation}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}