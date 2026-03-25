import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

const SECURITY_TOOLS = [
  {
    id: "risk-impact-calculator",
    title: "Risk Impact Calculator",
    icon: "/images/securityTools/GoogleAuthenticator.png",
    whatItIs:
      "A free app that generates one-time login codes for multi-factor authentication.",
    whyItMatters:
      "It helps protect accounts even if a password is stolen or reused.",
    link: "https://support.google.com/accounts/answer/1066447",
    video: null,
  },
  
];

export default function SecurityTools() {
  const navigate = useNavigate();
  const [flippedId, setFlippedId] = useState(null);

  function handleFlip(cardId) {
    setFlippedId((prev) => (prev === cardId ? null : cardId));
  }

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Security Tools</h2>
          <p className="security-tools-sub">
            Explore practical tools that can improve day-to-day cybersecurity
            with minimal cost and setup.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/playbooks")}
        >
          ← Back to Playbooks
        </button>
      </div>

      <div className="security-tools-intro">
        <h3 className="security-tools-intro-title">About this page</h3>
        <p className="security-tools-intro-text">
          The following tools can help improve your organization’s security and
          are commonly used for authentication, password protection, and backup
          readiness. This page is meant to be a lightweight starting point for
          exploring helpful security options.
        </p>
      </div>

      <div className="security-tools-grid">
        {SECURITY_TOOLS.map((tool) => {
          const isFlipped = flippedId === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              className={`security-tool-card ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => handleFlip(tool.id)}
            >
              <div className="security-tool-card-inner">
                <div className="security-tool-card-face security-tool-card-front">
                  <img
                    src={tool.icon}
                    alt={tool.title}
                    className="security-tool-icon"
                  />
                  <div className="security-tool-name">{tool.title}</div>
                  <div className="security-tool-hint">Click to learn more</div>
                </div>

                <div className="security-tool-card-face security-tool-card-back">
                  <div className="security-tool-back-title">{tool.title}</div>

                  <div className="security-tool-copy-block">
                    <div className="security-tool-copy-label">What it is</div>
                    <div className="security-tool-copy-text">
                      {tool.whatItIs}
                    </div>
                  </div>

                  <div className="security-tool-copy-block">
                    <div className="security-tool-copy-label">Why it matters</div>
                    <div className="security-tool-copy-text">
                      {tool.whyItMatters}
                    </div>
                  </div>

                  <div className="security-tool-links">
                    <a
                      href={tool.link}
                      target="_blank"
                      rel="noreferrer"
                      className="security-tool-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn More
                    </a>

                    {tool.video && (
                      <a
                        href={tool.video}
                        target="_blank"
                        rel="noreferrer"
                        className="security-tool-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ContentPanel>
  );
}