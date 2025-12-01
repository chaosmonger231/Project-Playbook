import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import ModuleVideo from "../components/ModuleVideo";

// Map box1–box4 to module names
const MODULE_LABELS = {
  box1: "Module 1 – Phishing & Email Safety",
  box2: "Module 2 – Passwords & MFA",
  box3: "Module 3 – Ransomware & Backups",
  box4: "Module 4 – Protecting Student / Customer Data",
};

export default function Train() {
  const { selected } = useOutletContext(); // "box1", "box2", ...
  const { role, loading, orgName } = useUser(); // assuming orgName later, fallback below

  const [moduleAssignments, setModuleAssignments] = useState({
    box1: true,   // demo: phishing already active
    box2: false,
    box3: false,
    box4: false,
  });

  if (loading) {
    return <p>Loading…</p>;
  }

  const moduleLabel = MODULE_LABELS[selected] || "Lesson";
  const orgLabel = orgName || "your organization";

  let mainContent = null;

  // =============== COORDINATOR VIEW ===============
  if (role === "coordinator") {
    const isAssigned = moduleAssignments[selected] ?? false;

    const toggleAssigned = () => {
      setModuleAssignments(prev => ({
        ...prev,
        [selected]: !isAssigned,
      }));
    };

    if (selected === "box1") {
      mainContent = (
        <section>
          <h3>{moduleLabel}</h3>

          {/* Video Summary */}
          <ModuleVideo
            videoId="pcSv22DTDUI"
            title="Test Video"
          />

          <p>
            Teach staff how to spot phishing emails, suspicious links, and
            fake login pages. This module focuses on real-world examples
            that small organizations see every day.
          </p>

          <ul style={{ marginTop: "10px" }}>
            <li>Recognizing common phishing red flags</li>
            <li>What to do when a suspicious email is received</li>
            <li>How to report phishing in your environment</li>
          </ul>

          <div style={{ marginTop: "14px" }}>
            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={isAssigned}
                onChange={toggleAssigned}
                style={{ marginRight: "6px" }}
              />
              Make this module active for {orgLabel} (demo toggle)
            </label>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>
              In a future version, this toggle will assign the module to all
              participants in this organization using the org ID.
            </p>
          </div>
        </section>
      );
    } else if (selected === "box2") {
      const isOn = moduleAssignments[selected] ?? false;
      mainContent = (
        <section>
          <h3>{moduleLabel}</h3>

          {/* Video Summary */}
          <ModuleVideo
            videoId="pcSv22DTDUI"
            title="Test Video"
          />

          <p>
            This module covers strong passwords, passphrases, and multi-factor
            authentication (MFA).
          </p>
          <ul style={{ marginTop: "10px" }}>
            <li>Creating strong, memorable passwords</li>
            <li>Why re-using passwords is risky</li>
            <li>How MFA protects accounts from compromise</li>
          </ul>

          <div style={{ marginTop: "14px" }}>
            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={isOn}
                onChange={toggleAssigned}
                style={{ marginRight: "6px" }}
              />
              Make this module active for {orgLabel}
            </label>
          </div>
        </section>
      );
    } else if (selected === "box3") {
      const isOn = moduleAssignments[selected] ?? false;
      mainContent = (
        <section>
          <h3>{moduleLabel}</h3>

          {/* Video Summary */}
          <ModuleVideo
            videoId="pcSv22DTDUI"
            title="Test Video"
          />

          <p>
            Introduces ransomware basics and why backups and early reporting
            are critical.
          </p>
          <ul style={{ marginTop: "10px" }}>
            <li>How ransomware works in simple terms</li>
            <li>Why reporting a suspicious alert early matters</li>
            <li>How backups can reduce impact</li>
          </ul>

          <div style={{ marginTop: "14px" }}>
            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={isOn}
                onChange={toggleAssigned}
                style={{ marginRight: "6px" }}
              />
              Make this module active for {orgLabel}
            </label>
          </div>
        </section>
      );
    } else if (selected === "box4") {
      const isOn = moduleAssignments[selected] ?? false;
      mainContent = (
        <section>
          <h3>{moduleLabel}</h3>

          {/* Video Summary */}
          <ModuleVideo
            videoId="pcSv22DTDUI"
            title="Test Video"
          />

          <p>
            Focuses on handling sensitive data properly (student records,
            customer information, HR data, etc.).
          </p>
          <ul style={{ marginTop: "10px" }}>
            <li>What counts as sensitive or regulated data</li>
            <li>Safe handling and sharing basics</li>
            <li>What to do if data is sent to the wrong person</li>
          </ul>

          <div style={{ marginTop: "14px" }}>
            <label style={{ fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={isOn}
                onChange={toggleAssigned}
                style={{ marginRight: "6px" }}
              />
              Make this module active for {orgLabel}
            </label>
          </div>
        </section>
      );
    } else {
      mainContent = (
        <section>
          <h3>Learning Modules</h3>
          <p>Select a module on the left to configure it.</p>
        </section>
      );
    }
  }

  // =============== PARTICIPANT VIEW ===============
  else {
    if (selected === "box1") {
      mainContent = (
        <section>
          <h3>{MODULE_LABELS.box1}</h3>
          <p>
            Learn how to recognize and report phishing emails and suspicious
            links before they cause damage.
          </p>
          <ul style={{ marginTop: "10px" }}>
            <li>Spotting fake senders and urgent language</li>
            <li>Checking links before clicking</li>
            <li>How to report phishing in your organization</li>
          </ul>
        </section>
      );
    } else if (selected === "box2") {
      mainContent = (
        <section>
          <h3>{MODULE_LABELS.box2}</h3>
          <p>
            This module walks through creating strong passwords and using
            multi-factor authentication to protect your accounts.
          </p>
        </section>
      );
    } else if (selected === "box3") {
      mainContent = (
        <section>
          <h3>{MODULE_LABELS.box3}</h3>
          <p>
            Understand what ransomware is, what it looks like in real life,
            and what you should do if something doesn&apos;t look right.
          </p>
        </section>
      );
    } else if (selected === "box4") {
      mainContent = (
        <section>
          <h3>{MODULE_LABELS.box4}</h3>
          <p>
            Learn the basics of handling sensitive information (like student
            or customer data) safely.
          </p>
        </section>
      );
    } else {
      mainContent = (
        <section>
          <h3>Learning Modules</h3>
          <p>Select a module on the left to view its details.</p>
        </section>
      );
    }
  }

  return (
    <>
      <h2>
        Learning Modules for {orgLabel === "your organization" ? <CurrentUserName /> : orgLabel}
      </h2>
      {mainContent}
    </>
  );
}
