import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import ModuleVideo from "../components/ModuleVideo";
import LearningButton from "../components/LearningButton";
import Sidebar from "../components/Sidebar";
import ContentPanel from "../components/ContentPanel";

/**
 * Train owns its nav + state.
 * id must match /learning/:topic
 */
const MODULES = [
  {
    id: "phishing",
    label: "Phishing & Email Safety",
    fullTitle: "Module 1 – Phishing & Email Safety",
    videoId: "JlQovysQBn0",
    coordinator: {
      desc:
        "Teach staff how to spot phishing emails, suspicious links, and fake login pages. This module focuses on real-world examples that small organizations see every day.",
      bullets: [
        "Recognizing common phishing red flags",
        "What to do when a suspicious email is received",
        "How to report phishing in your environment",
      ],
    },
    participant: {
      desc:
        "Learn how to recognize and report phishing emails and suspicious links before they cause damage.",
      bullets: [
        "Spotting fake senders and urgent language",
        "Checking links before clicking",
        "How to report phishing in your organization",
      ],
    },
  },
  {
    id: "passwords",
    label: "Passwords & MFA",
    fullTitle: "Module 2 – Passwords & MFA",
    videoId: "XIlF2qkav5c",
    coordinator: {
      desc:
        "This module covers strong passwords, passphrases, and multi-factor authentication (MFA).",
      bullets: [
        "Creating strong, memorable passwords",
        "Why re-using passwords is risky",
        "How MFA protects accounts from compromise",
      ],
    },
    participant: {
      desc:
        "This module walks through creating strong passwords and using multi-factor authentication to protect your accounts.",
      bullets: [],
    },
  },
  {
    id: "ransomware",
    label: "Ransomware & Backups",
    fullTitle: "Module 3 – Ransomware & Backups",
    videoId: "-KL9APUjj3E",
    coordinator: {
      desc:
        "Introduces ransomware basics and why backups and early reporting are critical.",
      bullets: [
        "How ransomware works in simple terms",
        "Why reporting a suspicious alert early matters",
        "How backups can reduce impact",
      ],
    },
    participant: {
      desc:
        "Understand what ransomware is, what it looks like in real life, and what you should do if something doesn’t look right.",
      bullets: [],
    },
  },
  {
    id: "data-protection",
    label: "Protecting Sensitive Data",
    fullTitle: "Module 4 – Protecting Sensitive Data",
    videoId: "laR7kRUIydA",
    coordinator: {
      desc:
        "Focuses on handling sensitive data properly (student records, customer information, HR data, etc.).",
      bullets: [
        "What counts as sensitive or regulated data",
        "Safe handling and sharing basics",
        "What to do if data is sent to the wrong person",
      ],
    },
    participant: {
      desc:
        "Learn the basics of handling sensitive information (like student or customer data) safely.",
      bullets: [],
    },
  },
];

export default function Train() {
  const { role, loading, orgName } = useUser();
  const navigate = useNavigate();

  const isCoordinator = role === "coordinator";
  const orgLabel = orgName || "your organization";

  // Sidebar items (labels are owned by Train, not Sidebar)
  const sidebarItems = useMemo(
    () => MODULES.map((m) => ({ id: m.id, label: m.label })),
    []
  );

  const [selectedId, setSelectedId] = useState(MODULES[0].id);

  // Demo org-wide activation toggles (future: persist to Firestore)
  const [moduleAssignments, setModuleAssignments] = useState(() => {
    const init = {};
    MODULES.forEach((m, idx) => {
      init[m.id] = idx === 0;
    });
    return init;
  });

  if (loading) return <p>Loading…</p>;

  const selectedModule = MODULES.find((m) => m.id === selectedId) || MODULES[0];
  const isAssigned = moduleAssignments[selectedId] ?? false;

  const toggleAssigned = () => {
    setModuleAssignments((prev) => ({
      ...prev,
      [selectedId]: !isAssigned,
    }));
  };

  const goToPlayer = () => navigate(`/learning/${selectedId}`);

  const bullets = isCoordinator
    ? selectedModule.coordinator.bullets
    : selectedModule.participant.bullets;

  const desc = isCoordinator
    ? selectedModule.coordinator.desc
    : selectedModule.participant.desc;

  return (
    <>
      <h2>
        Learning Modules for{" "}
        {orgLabel === "your organization" ? <CurrentUserName /> : orgLabel}
      </h2>

      <div className="train-layout">
        <Sidebar
          selected={selectedId}
          onSelect={setSelectedId}
          items={sidebarItems}
          variant="tight"
        />

        <ContentPanel>
          <h3>{selectedModule.fullTitle}</h3>

          {isCoordinator && (
            <ModuleVideo videoId={selectedModule.videoId} title="Test Video" />
          )}

          <p>{desc}</p>

          {bullets.length > 0 && (
            <ul style={{ marginTop: 10 }}>
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
            <LearningButton key={selectedId} label="Start Learning" onClick={goToPlayer} />
          </div>

          {isCoordinator && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={toggleAssigned}
                  style={{ marginRight: 6 }}
                />
                Make this module active for {orgLabel} (demo toggle)
              </label>

              <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}>
                In a future version, this toggle will assign the module to all participants
                in this organization using the org ID.
              </p>
            </div>
          )}
        </ContentPanel>
      </div>
    </>
  );
}