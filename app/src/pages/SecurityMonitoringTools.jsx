import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

const SECURITY_MONITORING_ITEMS = [
  {
    id: "wazuh-tool",
    title: "Wazuh",
    icon: "/images/playbookImage1.png",
    whatItIs:
      "A host and log monitoring platform that helps organizations review endpoint activity, logs, suspicious commands, file changes, and other indicators of compromise.",
    whyItMatters:
      "It gives organizations more visibility into what is happening on systems directly, which can help identify destructive behavior earlier.",
    link: "/wazuhmonitoringtool",
    buttonLabel: "Learn More",
  },
  {
    id: "suricata-tool",
    title: "Suricata",
    icon: "/images/playbookImage2.png",
    whatItIs:
      "A network monitoring and intrusion detection tool that helps inspect traffic for suspicious DNS, HTTP, SMB, and other protocol activity.",
    whyItMatters:
      "It helps organizations spot suspicious or malicious activity moving across the network before a threat spreads further.",
    link: "/suricatamonitoringtool",
    buttonLabel: "Learn More",
  },
  {
    id: "org-guidance-tool",
    title: "Monitoring Guidance",
    icon: "/images/playbookImage3.png",
    whatItIs:
      "A simple guide that helps schools, local government organizations, and small businesses understand how Wazug and Suricata may fit into their environment.",
    whyItMatters:
      "It gives users a practical starting point by organization type, including how these tools can work together, where to begin if resources are limited, and a simple example setup",
    link: "/monitoringguidance",
    buttonLabel: "Open Guidance",
  },
];

export default function SecurityMonitoringTools() {
  const navigate = useNavigate();
  const [flippedId, setFlippedId] = useState(null);

  function handleFlip(cardId) {
    setFlippedId((prev) => (prev === cardId ? null : cardId));
  }

  function handleOpenItem(link, event) {
    event.stopPropagation();
    navigate(link);
  }

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Security Monitoring Tools</h2>
          <p className="security-tools-sub">
            Explore practical monitoring resources that can help organizations
            improve endpoint and network visibility, detect suspicious behavior
            earlier, and support incident response efforts.
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
          This page introduces two security monitoring tools and one simple
          guidance page to help organizations think through where monitoring may
          fit best. Wazuh focuses more on endpoint, host, and log activity,
          while Suricata focuses more on network traffic and intrusion
          detection.
        </p>
      </div>

      <div className="security-tools-grid">
        {SECURITY_MONITORING_ITEMS.map((item) => {
          const isFlipped = flippedId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`security-tool-card ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => handleFlip(item.id)}
            >
              <div className="security-tool-card-inner">
                <div className="security-tool-card-face security-tool-card-front">
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="security-tool-icon"
                  />
                  <div className="security-tool-name">{item.title}</div>
                  <div className="security-tool-hint">Click to learn more</div>
                </div>

                <div className="security-tool-card-face security-tool-card-back">
                  <div className="security-tool-back-title">{item.title}</div>

                  <div className="security-tool-copy-block">
                    <div className="security-tool-copy-label">What it is</div>
                    <div className="security-tool-copy-text">
                      {item.whatItIs}
                    </div>
                  </div>

                  <div className="security-tool-copy-block">
                    <div className="security-tool-copy-label">
                      Why it matters
                    </div>
                    <div className="security-tool-copy-text">
                      {item.whyItMatters}
                    </div>
                  </div>

                  <div className="security-tool-links">
                    <button
                      type="button"
                      className="security-tool-link"
                      onClick={(e) => handleOpenItem(item.link, e)}
                    >
                      {item.buttonLabel}
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