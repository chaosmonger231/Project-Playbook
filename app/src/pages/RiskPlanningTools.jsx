import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

const RISK_PLANNING_TOOLS = [
  {
    id: "impact-calculator",
    title: "Impact Calculator",
    icon: "/images/playbookImage1.png",
    whatItIs:
      "A lightweight front-end tool that helps estimate how disruptive a cybersecurity event could be to your organization.",
    whyItMatters:
      "It helps teams think through service disruption, operational downtime, recovery challenges, and broader business consequences.",
    link: "/impactcalculator",
  },
  {
    id: "risk-calculator",
    title: "Risk Assessment Tool",
    icon: "/images/playbookImage2.png",
    whatItIs:
      "A front-end risk assessment tool that helps estimate likelihood, impact, and overall risk using a simple NIST-aligned approach.",
    whyItMatters:
      "It helps organizations turn gaps and weaknesses into trackable risks so they can prioritize mitigation and planning.",
    link: "/riskcalculator",
  },
];

export default function RiskPlanningTools() {
  const navigate = useNavigate();
  const [flippedId, setFlippedId] = useState(null);

  function handleFlip(cardId) {
    setFlippedId((prev) => (prev === cardId ? null : cardId));
  }

  function handleOpenTool(link, event) {
    event.stopPropagation();
    navigate(link);
  }

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Risk &amp; Planning Tools</h2>
          <p className="security-tools-sub">
            Explore lightweight tools that help your organization estimate
            impact, assess risk, and support planning decisions without needing
            a backend.
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
          These tools are meant to be simple starting points for smaller
          organizations. Use the Impact Calculator to estimate organizational
          consequences, and use the Risk Assessment Tool to combine likelihood
          and impact into an overall risk priority.
        </p>
      </div>

      <div className="security-tools-grid">
        {RISK_PLANNING_TOOLS.map((tool) => {
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
                    <button
                      type="button"
                      className="security-tool-link"
                      onClick={(e) => handleOpenTool(tool.link, e)}
                    >
                      Open Tool
                    </button>
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