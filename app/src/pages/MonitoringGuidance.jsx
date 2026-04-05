import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

const ORG_GUIDANCE = {
  education: {
    title: "School / Education",
    intro:
      "Schools often have shared staff devices, lab systems, student-facing technology, and file access patterns that make both endpoint and network visibility useful.",
    shouldUseBoth:
      "If possible, yes. Wazuh and Suricata work well together in education because one helps watch activity on systems while the other helps watch suspicious traffic moving across shared school networks.",
    rollout: [
      "Deploy Wazuh first on shared staff devices, lab endpoints, or systems tied to student or staff records.",
      "Add Suricata where you can observe school network traffic, especially shared traffic paths, DNS requests, or SMB-related activity.",
      "Tune alerts for suspicious file changes, destructive commands, unusual DNS requests, and suspicious SMB behavior first.",
    ],
    watchFirst: [
      "Suspicious commands on shared staff or lab devices",
      "Unusual file changes on record-related systems",
      "Suspicious DNS lookups",
      "Unexpected SMB or shared-network activity",
    ],
    sampleSetupCode: `School / Education Starter Setup

Wazuh:
- Shared staff devices
- Important lab systems
- Systems handling student or staff records

Suricata:
- Shared school network traffic
- DNS visibility
- SMB / file-share related traffic

Watch first:
- suspicious commands
- unusual file changes
- suspicious DNS
- unusual SMB activity`,
  },
  government: {
    title: "Local Government / Public Agency",
    intro:
      "Local government organizations often need to protect administrative systems, finance systems, public records systems, and services that support day-to-day operations.",
    shouldUseBoth:
      "If possible, yes. Wazuh and Suricata usually make sense together because local government environments benefit from both host-side and network-side visibility.",
    rollout: [
      "Deploy Wazuh first on endpoints and servers supporting records, administration, finance, or service-related operations.",
      "Add Suricata where you need visibility into remote access traffic, suspicious outbound communication, or shared operational traffic.",
      "Tune alerts for backup deletion, log clearing, suspicious commands, and suspicious outbound traffic first.",
    ],
    watchFirst: [
      "Backup deletion or log tampering on key systems",
      "Suspicious commands on administrative or finance endpoints",
      "Suspicious outbound traffic",
      "Remote access or shared-service traffic anomalies",
    ],
    sampleSetupCode: `Local Government Starter Setup

Wazuh:
- Administrative endpoints
- Finance-related systems
- Public records systems
- Service-supporting servers

Suricata:
- Remote access traffic
- Suspicious outbound traffic
- Shared service network paths

Watch first:
- backup deletion
- log clearing
- suspicious commands
- unusual outbound communication`,
  },
  business: {
    title: "Small Business / Private Organization",
    intro:
      "Small businesses usually need practical monitoring without building a large security operation, so the goal is to start where the biggest operational risk exists.",
    shouldUseBoth:
      "If resources allow, yes. Wazuh and Suricata complement each other well because one improves endpoint and file visibility while the other improves internet-facing and network visibility.",
    rollout: [
      "Deploy Wazuh first on employee laptops, shared drives, file servers, or other systems where suspicious changes would cause downtime.",
      "Add Suricata where you want visibility into outbound traffic, internet-facing traffic, or suspicious movement tied to shared resources.",
      "Tune alerts for suspicious file changes, destructive commands, unusual outbound traffic, and suspicious DNS requests first.",
    ],
    watchFirst: [
      "Suspicious file changes on shared drives",
      "Destructive commands on important systems",
      "Suspicious outbound traffic",
      "Unexpected DNS or internet-facing behavior",
    ],
    sampleSetupCode: `Small Business Starter Setup

Wazuh:
- Employee laptops
- Shared drives
- File servers
- Key business systems

Suricata:
- Internet edge visibility
- Outbound traffic
- Traffic tied to shared resources

Watch first:
- suspicious file changes
- destructive commands
- suspicious outbound traffic
- unusual DNS activity`,
  },
};

function InfoCard({ label, color, children }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "16px",
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 6px 14px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 900,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          lineHeight: 1.6,
          color: "rgba(0, 0, 0, 0.78)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function MonitoringGuidance() {
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState("education");

  const guidance = ORG_GUIDANCE[selectedOrg];

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">
            Monitoring Guidance by Organization Type
          </h2>
          <p className="security-tools-sub">
            Choose an organization type to see a practical starter setup for how
            Wazuh and Suricata can fit together.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/securitymonitoringtools")}
        >
          ← Back to Security Monitoring Tools
        </button>
      </div>

      <div className="security-tools-intro">
        <h3 className="security-tools-intro-title">About this page</h3>
        <p className="security-tools-intro-text">
          This page is meant to show a lightweight starting setup, not a strict
          requirement. The goal is to help you see how Wazuh and Suricata can
          work together and what a realistic rollout may look like for your
          organization.
        </p>
      </div>

      <div className="security-tools-intro" style={{ marginTop: "18px" }}>
        <h3 className="security-tools-intro-title">Select your organization</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "14px",
          }}
        >
          {Object.entries(ORG_GUIDANCE).map(([key, value]) => {
            const isActive = selectedOrg === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedOrg(key)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: isActive
                    ? "2px solid #2563eb"
                    : "1px solid rgba(0, 0, 0, 0.12)",
                  background: isActive ? "#eff6ff" : "#ffffff",
                  color: "#0f172a",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 8px 18px rgba(37, 99, 235, 0.12)"
                    : "0 4px 10px rgba(0, 0, 0, 0.04)",
                }}
              >
                {value.title}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #f8fbff, #eef6ff)",
          border: "1px solid rgba(37, 99, 235, 0.12)",
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.04)",
        }}
      >
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: "1.2rem",
            fontWeight: 900,
            color: "#111827",
          }}
        >
          {guidance.title}
        </h3>

        <p
          style={{
            margin: "0 0 16px",
            lineHeight: 1.6,
            color: "rgba(0, 0, 0, 0.78)",
          }}
        >
          {guidance.intro}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <InfoCard label="Should you use both?" color="#7c3aed">
            {guidance.shouldUseBoth}
          </InfoCard>

          <InfoCard label="What to watch first" color="#16a34a">
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                lineHeight: 1.7,
                color: "rgba(0, 0, 0, 0.78)",
              }}
            >
              {guidance.watchFirst.map((item) => (
                <li key={item} style={{ marginBottom: "8px" }}>
                  {item}
                </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard label="Simple rollout" color="#b45309">
            <ol
              style={{
                margin: 0,
                paddingLeft: "18px",
                lineHeight: 1.7,
                color: "rgba(0, 0, 0, 0.78)",
              }}
            >
              {guidance.rollout.map((step) => (
                <li key={step} style={{ marginBottom: "8px" }}>
                  {step}
                </li>
              ))}
            </ol>
          </InfoCard>

          <InfoCard label="Sample starter setup" color="#dc2626">
            <pre
              style={{
                margin: 0,
                padding: "14px 16px",
                borderRadius: "14px",
                background: "#f8fbff",
                border: "1px solid rgba(37, 99, 235, 0.12)",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                fontSize: "0.92rem",
                lineHeight: 1.6,
                color: "#0f172a",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              <code>{guidance.sampleSetupCode}</code>
            </pre>
          </InfoCard>
        </div>
      </div>
    </ContentPanel>
  );
}