import React from "react";
import { Link } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function AccountTerms() {
  return (
    <ContentPanel>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #dbe6f3",
          borderRadius: "24px",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
          padding: "32px 32px 28px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "7px 12px",
            borderRadius: "999px",
            background: "#eaf2ff",
            color: "#2563eb",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Account Terms
        </div>

        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "2rem",
            lineHeight: 1.15,
            color: "#0f172a",
          }}
        >
          Project Playbook Account Terms
        </h1>

        <p
          style={{
            margin: "0 0 20px",
            color: "#475569",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          These account terms are a short summary for users creating or using a
          Project Playbook account.
        </p>

        <div
          style={{
            background: "#f8fbff",
            border: "1px solid #dbeafe",
            borderRadius: "18px",
            padding: "18px 20px",
            marginBottom: "22px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#1e40af",
              fontWeight: 700,
              lineHeight: 1.7,
            }}
          >
            By creating or using an account, you agree to use Project Playbook
            lawfully, protect your login credentials, and follow the platform’s
            rules for authorized cybersecurity readiness, training, and
            operational use.
          </p>
        </div>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            1. Account responsibility
          </h2>
          <p style={{ margin: "0 0 10px", color: "#475569", lineHeight: 1.7 }}>
            You are responsible for the information used to create your account
            and for activity that happens under your login. Keep your password
            and any other account access details secure.
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.8 }}>
            <li>Use accurate account information.</li>
            <li>Do not share access in unsafe or unauthorized ways.</li>
            <li>Notify your organization if you believe your account is compromised.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            2. Organizational use
          </h2>
          <p style={{ margin: "0 0 10px", color: "#475569", lineHeight: 1.7 }}>
            Project Playbook may be used by coordinators and participants within
            an organization. Coordinators are responsible for managing access
            carefully and sharing invite codes or account access only with
            authorized users.
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.8 }}>
            <li>Coordinators should manage organization access responsibly.</li>
            <li>Participants should only join organizations they are authorized to join.</li>
            <li>Users should not impersonate another organization or person.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            3. Allowed use
          </h2>
          <p style={{ margin: "0 0 10px", color: "#475569", lineHeight: 1.7 }}>
            Project Playbook is intended for lawful, authorized, defensive,
            planning, training, and readiness-related use.
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.8 }}>
            <li>Use the platform for cybersecurity readiness and operational planning.</li>
            <li>Do not use the platform to support illegal activity or unauthorized access.</li>
            <li>Do not use the platform to harm systems, people, or organizations.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            4. No substitute for legal or compliance advice
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            Project Playbook provides educational and operational guidance, but
            it does not replace legal advice, compliance review, regulatory
            reporting obligations, official incident reporting requirements, or
            third-party security assessments.
          </p>
        </section>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            5. Platform changes and availability
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            Features, content, and page structure may change over time as
            Project Playbook is updated. Some parts of the platform may be
            revised, expanded, temporarily unavailable, or removed.
          </p>
        </section>

        <section style={{ marginBottom: "22px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            6. Misuse and account restrictions
          </h2>
          <p style={{ margin: "0 0 10px", color: "#475569", lineHeight: 1.7 }}>
            Accounts may be restricted, suspended, or removed if they are used
            in ways that violate platform rules, applicable law, or the rights
            of other users or organizations.
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.8 }}>
            <li>Unauthorized or abusive use may result in loss of access.</li>
            <li>Illegal or harmful use is prohibited.</li>
            <li>Organizations remain responsible for their own internal account governance.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "10px" }}>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            7. Related documents
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            These account terms are only a short-form summary. For full details,
            please review the User Agreement and Privacy Policy within the website.
          </p>
        </section>
      </div>
    </ContentPanel>
  );
}