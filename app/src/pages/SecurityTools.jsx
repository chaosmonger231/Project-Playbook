import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

const SECURITY_TOOLS = [
  {
    id: "google-authenticator",
    title: "Google Authenticator",
    icon: "/images/securityTools/GoogleAuthenticator.png",
    whatItIs:
      "A free app that generates one-time login codes for multi-factor authentication.",
    whyItMatters:
      "It helps protect accounts even if a password is stolen or reused.",
    link: "https://support.google.com/accounts/answer/1066447",
    video: null,
  },
  {
    id: "microsoft-authenticator",
    title: "Microsoft Authenticator",
    icon: "/images/securityTools/microsoft-authenticator.svg",
    whatItIs:
      "A free authentication app that supports one-time codes and approval prompts.",
    whyItMatters:
      "It adds a second layer of protection to Microsoft and other supported accounts.",
    link: "https://support.microsoft.com/en-US/authenticator/about-microsoft-authenticator",
    video: null,
  },
  {
    id: "bitwarden",
    title: "Bitwarden",
    icon: "/images/securityTools/bitwardenLogo.png",
    whatItIs:
      "A password manager that stores and generates strong passwords in one place.",
    whyItMatters:
      "It reduces password reuse and makes it easier to use strong, unique credentials.",
    link: "https://bitwarden.com/about/",
    video: null,
  },
  {
    id: "onepassword",
    title: "1Password",
    icon: "/images/securityTools/1passwordLogo.png",
    whatItIs:
      "A password manager for storing logins, notes, and other sensitive information securely.",
    whyItMatters:
      "It helps teams and individuals organize passwords and improve access security.",
    link: "https://1password.com/",
    video: null,
  },
  {
    id: "cloud-backups",
    title: "Cloud Backups",
    icon: "/images/securityTools/cloudBackupLogo.png",
    whatItIs:
      "Backup services such as OneDrive or Google Drive can help store important files safely.",
    whyItMatters:
      "Backups help organizations recover faster from ransomware, accidental deletion, or device failure.",
    link: "https://support.google.com/drive/answer/2424384",
    video: null,
  },
  {
    id: "windows-defender",
    title: "Microsoft Defender",
    icon: "/images/securityTools/microsoftDefenderLogo.svg",
    whatItIs:
      "Built-in security software on Windows that helps protect devices from malware and other threats.",
    whyItMatters:
      "It provides baseline protection without requiring a separate antivirus purchase for many users.",
    link: "https://www.microsoft.com/en-us/security/business/microsoft-defender",
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