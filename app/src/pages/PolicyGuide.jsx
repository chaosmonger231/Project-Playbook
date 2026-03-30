import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import { getAuth } from "firebase/auth";

const POLICY_GUIDE_STORAGE_KEY = "policyGuideProgress";

const QUESTIONS = [
  {
    id: "orgType",
    step: 1,
    prompt: "What type of organization are you?",
    helper:
      "This helps tailor the recommendations so they feel more relevant to your environment.",
    options: [
      {
        value: "education",
        label: "School / Education",
        sublabel:
          "K–12, higher education, or another education-focused organization.",
      },
      {
        value: "business",
        label: "Small Business / Private Company",
        sublabel: "Private business, nonprofit, or similar organization.",
      },
      {
        value: "government",
        label: "Local Government / Public Agency",
        sublabel: "City, county, township, or other public-sector organization.",
      },
      {
        value: "other",
        label: "Other",
        sublabel: "Another organization type not listed above.",
      },
    ],
  },
  {
    id: "orgSize",
    step: 2,
    prompt: "Approximately how many employees or users do you support?",
    helper:
      "This is a lightweight sizing question to help prioritize simpler first steps.",
    options: [
      {
        value: "1-10",
        label: "1–10",
        sublabel: "Very small team or organization.",
      },
      {
        value: "11-50",
        label: "11–50",
        sublabel: "Small but growing organization.",
      },
      {
        value: "51-200",
        label: "51–200",
        sublabel: "Moderate number of staff or users.",
      },
      {
        value: "200+",
        label: "200+",
        sublabel: "Larger environment with more coordination needs.",
      },
    ],
  },
  {
    id: "sensitiveData",
    step: 3,
    prompt: "Does your organization store sensitive data?",
    helper:
      "Examples include student records, customer information, payment information, or internal business data.",
    options: [
      {
        value: "yes",
        label: "Yes",
        sublabel: "We handle sensitive or confidential data.",
      },
      {
        value: "no",
        label: "No",
        sublabel: "We do not store much sensitive data.",
      },
      {
        value: "not-sure",
        label: "Not Sure",
        sublabel: "We are unsure what counts as sensitive data.",
      },
    ],
  },
  {
    id: "remoteAccess",
    step: 4,
    prompt: "Do employees access systems remotely?",
    helper:
      "Think about staff working from home, using cloud tools outside the office, or logging in from other locations.",
    options: [
      {
        value: "yes",
        label: "Yes",
        sublabel: "Employees or contractors access systems remotely.",
      },
      {
        value: "no",
        label: "No",
        sublabel: "Access is mostly limited to on-site use.",
      },
      {
        value: "not-sure",
        label: "Not Sure",
        sublabel: "We are not fully sure how systems are accessed.",
      },
    ],
  },
  {
    id: "mfa",
    step: 5,
    prompt: "Do you currently use multi-factor authentication (MFA)?",
    helper:
      "MFA adds an extra step to sign in, such as a code from an authenticator app.",
    options: [
      {
        value: "yes",
        label: "Yes",
        sublabel: "We use MFA on important accounts.",
      },
      {
        value: "no",
        label: "No",
        sublabel: "We do not currently use MFA.",
      },
      {
        value: "partial",
        label: "Partially",
        sublabel: "We use MFA on some accounts only.",
      },
    ],
  },
  {
    id: "backups",
    step: 6,
    prompt: "Do you have regular backups for important systems or data?",
    helper:
      "Backups should be created regularly and checked so they can actually be restored when needed.",
    options: [
      {
        value: "yes",
        label: "Yes",
        sublabel: "We have regular backups in place.",
      },
      {
        value: "no",
        label: "No",
        sublabel: "We do not have consistent backups.",
      },
      {
        value: "not-sure",
        label: "Not Sure",
        sublabel: "We are unsure how often backups happen.",
      },
    ],
  },
  {
    id: "incidentPlan",
    step: 7,
    prompt: "Do you have a documented incident response plan?",
    helper:
      "This means your organization knows who responds, who to contact, and how incidents should be reported.",
    options: [
      {
        value: "yes",
        label: "Yes",
        sublabel: "We have a documented plan.",
      },
      {
        value: "no",
        label: "No",
        sublabel: "We do not currently have one.",
      },
      {
        value: "not-sure",
        label: "Not Sure",
        sublabel:
          "We may have something informal, but not a clear documented plan.",
      },
    ],
  },
  {
    id: "confidence",
    step: 8,
    prompt: "How confident are you in your current cybersecurity readiness?",
    helper:
      "This is a self-assessment to help prioritize what should come first.",
    options: [
      {
        value: "low",
        label: "Low",
        sublabel: "We need a stronger starting point.",
      },
      {
        value: "medium",
        label: "Medium",
        sublabel: "We have some basics in place.",
      },
      {
        value: "high",
        label: "High",
        sublabel: "We feel fairly prepared overall.",
      },
    ],
  },
];

function buildRecommendations(answers) {
  const recommendations = [];
  const priorityActions = [];
  const suggestedTools = [];
  const matchedPolicies = new Set();
  const matchedTools = new Set();

  function addRecommendation(rec) {
    if (matchedPolicies.has(rec.title)) return;
    matchedPolicies.add(rec.title);
    recommendations.push(rec);
  }

  function addTool(tool) {
    if (matchedTools.has(tool.title)) return;
    matchedTools.add(tool.title);
    suggestedTools.push(tool);
  }

  const orgType = answers.orgType;
  const orgSize = answers.orgSize;

  if (answers.mfa === "no" || answers.mfa === "partial") {
    addRecommendation({
      title: "Access Control Policy",
      summary:
        "Define who should have access to systems and require stronger authentication for important accounts.",
      whyItMatters:
        "Multi Factor Authentication and stronger account protection are fast, practical ways to reduce account compromise risk.",
      actionLabel: "View Security Tools",
      actionPath: "/securitytools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--blue",
    });

    addTool({
      title: "Google Authenticator",
      description: "A simple option for adding MFA to important accounts.",
      actionLabel: "Open Security Tools",
      actionPath: "/securitytools",
      openInNewTab: false,
    });

    addTool({
      title: "Microsoft Authenticator",
      description: "Useful for Microsoft accounts and other supported services.",
      actionLabel: "Open Security Tools",
      actionPath: "/securitytools",
      openInNewTab: false,
    });

    priorityActions.push("Enable MFA for your most important accounts first.");
  }

  if (answers.backups === "no" || answers.backups === "not-sure") {
    addRecommendation({
      title: "Backup & Recovery Policy",
      summary:
        "Define what gets backed up, how often backups happen, and who verifies recovery is possible.",
      whyItMatters:
        "Regular backups and tested recovery steps are foundational for resilience after ransomware or device failure.",
      actionLabel: "View Incident Response Tools",
      actionPath: "/incidentresponse",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--green",
    });

    addTool({
      title: "Cloud Backup Tools",
      description:
        "Backup tools can help reduce downtime after ransomware or accidental loss.",
      actionLabel: "Open Security Tools",
      actionPath: "/securitytools",
      openInNewTab: false,
    });

    priorityActions.push(
      "Review backup frequency and confirm you can restore from backups."
    );
  }

  if (answers.incidentPlan === "no" || answers.incidentPlan === "not-sure") {
    addRecommendation({
      title: "Incident Response Policy",
      summary:
        "Document who responds, what gets reported, and how incidents are handled when something goes wrong.",
      whyItMatters:
        "A basic response plan should identify key contacts, responsibilities, and reporting expectations before an incident occurs.",
      actionLabel: "Go to Incident Response",
      actionPath: "/incidentresponse",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--red",
    });

    priorityActions.push("Document incident contacts and reporting expectations.");
  }

  if (answers.sensitiveData === "yes" || answers.sensitiveData === "not-sure") {
    addRecommendation({
      title: "Data Protection Policy",
      summary:
        "Clarify how sensitive information is handled, who can access it, and how it should be protected.",
      whyItMatters:
        "Knowing what sensitive data you have and restricting access appropriately helps reduce exposure and confusion.",
      actionLabel: "Open Planning Tools",
      actionPath: "/riskplanningtools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--purple",
    });

    priorityActions.push(
      "Identify which systems and people can access sensitive data."
    );
  }

  if (answers.remoteAccess === "yes") {
    addRecommendation({
      title: "Remote Access Policy",
      summary:
        "Set expectations for remote logins, approved devices, and secure access outside the office.",
      whyItMatters:
        "Remote access increases exposure and should be paired with stronger account protection and clear approved-access practices.",
      actionLabel: "View Security Tools",
      actionPath: "/securitytools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--blue",
    });

    priorityActions.push(
      "Review how remote users access systems and whether MFA is required."
    );
  }

  if (answers.confidence === "low") {
    addRecommendation({
      title: "Security Awareness & Training Policy",
      summary:
        "Establish regular training expectations so employees understand common risks and basic reporting steps.",
      whyItMatters:
        "Training quality and frequency are key parts of reducing risk and improving reporting behavior.",
      actionLabel: "Open Training Playbooks",
      actionPath: "/playbooks",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--yellow",
    });

    priorityActions.push(
      "Start with employee training and basic account protection improvements."
    );
  }

  if (orgType === "education") {
    addRecommendation({
      title: "Student & Education Data Handling Policy",
      summary:
        "Define how student, staff, and school-related information should be accessed, shared, and protected.",
      whyItMatters:
        "Education environments often handle sensitive records and need clear expectations for who can access them.",
      actionLabel: "Open Planning Tools",
      actionPath: "/riskplanningtools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--purple",
    });
  }

  if (orgType === "government") {
    addRecommendation({
      title: "Public Reporting & Response Responsibilities",
      summary:
        "Clarify reporting expectations, approval chains, and external coordination responsibilities for incidents.",
      whyItMatters:
        "Public organizations often need clearer communications and incident handling responsibilities.",
      actionLabel: "Go to Incident Response",
      actionPath: "/incidentresponse",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--red",
    });
  }

  if (orgSize === "51-200" || orgSize === "200+") {
    addRecommendation({
      title: "Role & Responsibility Policy",
      summary:
        "Document who owns cybersecurity responsibilities, who approves changes, and who responds during incidents.",
      whyItMatters:
        "As organizations grow, unclear responsibilities create delays and confusion during security events.",
      actionLabel: "Open Planning Tools",
      actionPath: "/riskplanningtools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--blue",
    });
  }

  addTool({
    title: "Impact Calculator",
    description:
      "Use this to think through how incidents could affect your organization.",
    actionLabel: "Open Impact Calculator",
    actionPath: "/playbook2",
    openInNewTab: false,
  });

  if (!recommendations.length) {
    addRecommendation({
      title: "Baseline Cybersecurity Program Policy",
      summary:
        "Maintain a simple documented program that covers access, training, incident response, and backups.",
      whyItMatters:
        "A basic cybersecurity program helps clarify responsibilities, priorities, and expectations across the organization.",
      actionLabel: "Open Planning Tools",
      actionPath: "/riskplanningtools",
      openInNewTab: false,
      accentClass: "policy-guide-result-card--blue",
    });

    priorityActions.push(
      "Review your overall cybersecurity program and confirm responsibilities are clear."
    );
  }

  return {
    recommendations,
    priorityActions: Array.from(new Set(priorityActions)),
    suggestedTools,
  };
}

export default function PolicyGuide() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [hasRestoredState, setHasRestoredState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POLICY_GUIDE_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (typeof parsed.started === "boolean") {
          setStarted(parsed.started);
        }

        if (
          typeof parsed.currentIndex === "number" &&
          parsed.currentIndex >= 0 &&
          parsed.currentIndex <= QUESTIONS.length
        ) {
          setCurrentIndex(parsed.currentIndex);
        }

        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
      }
    } catch (error) {
      console.error("Failed to restore Policy Guide progress:", error);
    } finally {
      setHasRestoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredState) return;

    try {
      localStorage.setItem(
        POLICY_GUIDE_STORAGE_KEY,
        JSON.stringify({
          started,
          currentIndex,
          answers,
        })
      );
    } catch (error) {
      console.error("Failed to save Policy Guide progress:", error);
    }
  }, [started, currentIndex, answers, hasRestoredState]);

  const currentQuestion = QUESTIONS[currentIndex];
  const isComplete = currentIndex >= QUESTIONS.length;
  const progressPercent = Math.round((currentIndex / QUESTIONS.length) * 100);

  const results = useMemo(() => buildRecommendations(answers), [answers]);

  function handleAnswer(value) {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }

  function goNext() {
    if (!currentQuestion || !answers[currentQuestion.id]) return;
    setCurrentIndex((prev) => prev + 1);
  }

  function goBack() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function restartGuide() {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers({});
    setDownloadError("");
    setIsDownloading(false);

    try {
      localStorage.removeItem(POLICY_GUIDE_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear Policy Guide progress:", error);
    }
  }

  function handleOpen(path) {
    navigate(path);
  }

  async function handleDownloadRecommendations() {
    setDownloadError("");
    setIsDownloading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("You must be signed in to download recommendations.");
      }

      const idToken = await user.getIdToken();

      const response = await fetch(
        "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/prod/policy-guide/generate-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            organizationName: "My Organization",
            answers,
            results,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate download.");
      }

      if (!data?.downloadUrl) {
        throw new Error("No download URL was returned.");
      }

      const anchor = document.createElement("a");
      anchor.href = data.downloadUrl;
      anchor.setAttribute("download", data.fileName || "policy-guide.pdf");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("Policy Guide download failed:", error);
      setDownloadError(
        error?.message || "Could not generate your recommendations PDF."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ContentPanel>
      <div className="policy-guide-head">
        <div>
          <h2 className="policy-guide-title">Policy Guide</h2>
          <p className="policy-guide-sub">
            Build lightweight cybersecurity policy recommendations for your
            organization using a simple guided experience.
          </p>
        </div>

        <button
          type="button"
          className="policy-guide-back"
          onClick={() => navigate("/playbooks")}
        >
          ← Back to Playbooks
        </button>
      </div>

      {!started && (
        <div className="policy-guide-landing">
          <div className="policy-guide-landing-media">
            <img
              src="/images/policyguidelogo.svg"
              alt="Policy Guide"
              className="policy-guide-landing-image"
            />
          </div>

          <div className="policy-guide-landing-content">
            <h3 className="policy-guide-landing-title">What this is</h3>

            <p className="policy-guide-landing-text">
              This tool asks a few simple questions and then suggests
              foundational cybersecurity policies and next steps for your
              organization.
            </p>

            <p className="policy-guide-landing-text">
              The guidance is inspired by NIST’s small-organization
              cybersecurity quick-start approach and is meant to help you think
              through what your organization should focus on first.
            </p>

            <div className="policy-guide-disclaimer">
              This is a lightweight starting point and not legal advice. Your
              organization may need cybersecurity, regulatory, or legal guidance
              for full compliance.
            </div>

            <button
              type="button"
              className="policy-guide-start"
              onClick={() => setStarted(true)}
            >
              Start Now
            </button>
          </div>
        </div>
      )}

      {started && !isComplete && currentQuestion && (
        <div className="policy-guide-question-shell">
          <div className="policy-guide-progress-head">
            <div className="policy-guide-progress-label">
              Question {currentQuestion.step} of {QUESTIONS.length}
            </div>
            <div className="policy-guide-progress-value">
              {progressPercent}%
            </div>
          </div>

          <div className="policy-guide-progress-bar">
            <div
              className="policy-guide-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="policy-guide-question-card">
            <h3 className="policy-guide-question-title">
              {currentQuestion.prompt}
            </h3>
            <p className="policy-guide-question-helper">
              {currentQuestion.helper}
            </p>

            <div className="policy-guide-options">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`policy-guide-option ${
                      selected ? "is-selected" : ""
                    }`}
                    onClick={() => handleAnswer(option.value)}
                  >
                    <div className="policy-guide-option-label">
                      {option.label}
                    </div>
                    <div className="policy-guide-option-sublabel">
                      {option.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="policy-guide-nav">
              <button
                type="button"
                className="policy-guide-nav-btn policy-guide-nav-btn--secondary"
                onClick={goBack}
                disabled={currentIndex === 0}
              >
                Back
              </button>

              <button
                type="button"
                className="policy-guide-nav-btn policy-guide-nav-btn--primary"
                onClick={goNext}
                disabled={!answers[currentQuestion.id]}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {started && isComplete && (
        <div className="policy-guide-results">
          <div className="policy-guide-results-head">
            <div>
              <h3 className="policy-guide-results-title">
                Your Recommended Policies
              </h3>
              <p className="policy-guide-results-sub">
                Based on your answers, these are the best areas to focus on
                first.
              </p>
              <div className="policy-guide-results-notice">
                Download your recommendations before leaving this page. Your
                results are saved in this browser for convenience, but the PDF is
                the best copy to keep and share.
              </div>
            </div>

            <div className="policy-guide-results-actions">
              <button
                type="button"
                className="policy-guide-download-btn"
                onClick={handleDownloadRecommendations}
                disabled={isDownloading}
              >
                {isDownloading
                  ? "Generating PDF..."
                  : "Download Recommendations"}
              </button>

              <button
                type="button"
                className="policy-guide-restart-btn"
                onClick={restartGuide}
                disabled={isDownloading}
              >
                Restart Guide
              </button>
            </div>
          </div>

          {downloadError && (
            <div className="policy-guide-download-error">{downloadError}</div>
          )}

          <div className="policy-guide-priority-box">
            <h4 className="policy-guide-priority-title">Priority Summary</h4>
            <ul className="policy-guide-priority-list">
              {results.priorityActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="policy-guide-results-grid">
            <div className="policy-guide-results-main">
              {results.recommendations.map((rec) => (
                <div
                  key={rec.title}
                  className={`policy-guide-result-card ${rec.accentClass || ""}`}
                >
                  <div className="policy-guide-result-card-title">
                    {rec.title}
                  </div>

                  <div className="policy-guide-result-card-summary">
                    {rec.summary}
                  </div>

                  <div className="policy-guide-result-card-section-label">
                    Why this matters
                  </div>

                  <div className="policy-guide-result-card-why">
                    {rec.whyItMatters}
                  </div>

                  <button
                    type="button"
                    className="policy-guide-result-card-action"
                    onClick={() => handleOpen(rec.actionPath)}
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              ))}
            </div>

            <aside className="policy-guide-results-side">
              <div className="policy-guide-side-card policy-guide-side-card--tools">
                <h4 className="policy-guide-side-title">Suggested Tools</h4>

                <div className="policy-guide-side-list">
                  {results.suggestedTools.map((tool) => (
                    <div key={tool.title} className="policy-guide-side-item">
                      <div className="policy-guide-side-item-title">
                        {tool.title}
                      </div>

                      <div className="policy-guide-side-item-text">
                        {tool.description}
                      </div>

                      <button
                        type="button"
                        className="policy-guide-side-item-action"
                        onClick={() => handleOpen(tool.actionPath)}
                      >
                        {tool.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="policy-guide-side-card policy-guide-side-card--note">
                <h4 className="policy-guide-side-title">Important Note</h4>
                <p className="policy-guide-side-note">
                  This guide is a lightweight starting point based on
                  cybersecurity best practices. Organizations may need
                  professional cybersecurity, legal, or regulatory guidance for
                  full compliance.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </ContentPanel>
  );
}