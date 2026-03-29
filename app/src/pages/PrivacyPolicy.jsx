// src/pages/PrivacyPolicy.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import "../pages/legal-pages.css";

const SECTIONS = [
  {
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how Project Playbook handles account, training, readiness, and organization-related information used through the platform.",
      "Project Playbook is designed primarily for organizations located in Ohio and within the United States. The platform and its privacy approach are intended for that context.",
    ],
  },
  {
    title: "2. Regional Scope",
    body: [
      "Project Playbook is not specifically designed to meet jurisdiction-specific legal requirements outside the United States, including requirements commonly associated with the European Union.",
      "Organizations and users outside the United States are responsible for determining whether the platform is appropriate for their local legal, privacy, and compliance needs.",
    ],
  },
  {
    title: "3. Information We May Collect",
    body: [
      "Depending on how the platform is used, Project Playbook may collect account, profile, organization, and participation-related information such as names, email addresses, role information, organization identifiers, organization type, training progress, readiness responses, attestation-related entries, notes, and related platform activity.",
      "The platform may also process technical information reasonably needed to operate the service, such as authentication-related data, timestamps, usage events, and records associated with platform workflows.",
    ],
  },
  {
    title: "4. How Information Is Used",
    body: [
      "Information is used to operate Project Playbook, provide access to the platform, support training workflows, track progress, generate readiness-related records, support organizational administration, improve usability, and maintain the security and functionality of the service.",
      "Information may also be used to support internal summaries, dashboards, visualizations, and documentation features available within the platform.",
    ],
  },
  {
    title: "5. Organization-Level Visibility",
    body: [
      "Because Project Playbook is designed for organizational use, certain information may be visible to authorized coordinators or organizational administrators depending on platform role, page access, and system permissions.",
      "This may include user status, role information, training participation, completion progress, readiness-related submissions, and similar operational records needed for organization-level coordination and oversight.",
    ],
  },
  {
    title: "6. Training, Readiness, and Attestation Data",
    body: [
      "Project Playbook may store training progress, lesson completion status, readiness checklist responses, attestation-related entries, notes, and related timestamps when users or organizations interact with those workflows.",
      "These records are intended to support internal organizational readiness and platform functionality. They are not presented as formal audit, legal, or regulatory certification records unless an organization separately validates them through appropriate outside professionals.",
    ],
  },
  {
    title: "7. Data Storage and Security",
    body: [
      "Project Playbook uses reasonable technical measures intended to support platform security and access control. However, no system can guarantee absolute security.",
      "Users are responsible for maintaining the security of their own accounts. Coordinators are responsible for appropriately managing organizational access, permissions, and internal handling of organization-related information within their own environment.",
      "Project Playbook is not responsible for unauthorized access, exposure, or misuse resulting from weak credentials, compromised accounts, poor internal security practices, or organizational failure to manage access appropriately.",
    ],
  },
  {
    title: "8. Sharing of Information",
    body: [
      "Project Playbook is not intended to operate as an advertising platform and is not designed around third-party advertising, sponsored placements, or paid promotional content.",
      "Information may be handled through service providers, infrastructure providers, authentication systems, storage services, or platform components reasonably needed to operate the service. We do not state that the platform is tailored to every non-U.S. privacy framework or data transfer requirement.",
    ],
  },
  {
    title: "9. Third-Party Links and Resources",
    body: [
      "Project Playbook may reference outside resources, tools, or public guidance for cybersecurity and incident response information. We are not responsible for the privacy, security, content, or practices of third-party sites or services.",
      "Users should review the terms and privacy practices of any third-party services they choose to access.",
    ],
  },
  {
    title: "10. Ad-Free Service",
    body: [
      "Project Playbook is currently offered as an ad-free service and is not designed around third-party advertisements, sponsored content, or paid promotional placements as part of the user experience.",
    ],
  },
  {
    title: "11. User Choices",
    body: [
      "Users may contact their coordinator or the Project Playbook team through available support paths for questions about account-related information, organization access, or use of the platform.",
      "Some information may remain part of organization records, readiness history, administrative logs, or operational records where retention is reasonably tied to platform functionality, security, or organizational workflow.",
    ],
  },
  {
    title: "12. Changes to this Privacy Policy",
    body: [
      "Project Playbook may update this Privacy Policy from time to time. When updates are made, the revised version may be posted with an updated effective or last-updated date.",
      "Continued use of the platform after changes are posted constitutes acceptance of the revised policy.",
    ],
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <ContentPanel>
      <div className="legal-page">
        <div className="legal-page__topbar">
          <button
            type="button"
            className="legal-page__back"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          <div className="legal-page__links">
            <Link to="/user-agreement" className="legal-page__link">
              User Agreement
            </Link>
            <Link
              to="/privacy-policy"
              className="legal-page__link legal-page__link--active"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <section className="legal-hero">
          <div className="legal-hero__content">
            <div className="legal-hero__eyebrow">Project Playbook Policy</div>
            <h1 className="legal-hero__title">Privacy Policy</h1>
            <p className="legal-hero__subtitle">
              How Project Playbook handles account, training, readiness, and
              organization-related information used through the platform.
            </p>

            <div className="legal-hero__meta">
              <div className="legal-hero__meta-card">
                <span className="legal-hero__meta-label">Last updated</span>
                <strong>March 29, 2026</strong>
              </div>
              <div className="legal-hero__meta-card">
                <span className="legal-hero__meta-label">Regional scope</span>
                <strong>Ohio / United States</strong>
              </div>
              <div className="legal-hero__meta-card">
                <span className="legal-hero__meta-label">Advertising</span>
                <strong>Ad-free service</strong>
              </div>
            </div>
          </div>

          <div className="legal-hero__art">
            <div className="legal-hero__art-card">
              <div className="legal-hero__art-badge">Privacy</div>
              <h3>Data Use and Visibility</h3>
              <p>
                Project Playbook may collect and display limited account,
                training, and readiness information needed for platform
                operations and authorized organization-level coordination.
              </p>
              <div className="legal-hero__art-image-slot">
                Optional privacy illustration / shield image
              </div>
            </div>
          </div>
        </section>

        <section className="legal-callout">
          <h2>Plain-language summary</h2>
          <p>
            Project Playbook collects the information needed to operate the
            platform, support organizational workflows, and display training and
            readiness activity. It is Ohio/U.S.-focused, ad-free, and not built
            as a universal privacy-compliance solution for every jurisdiction.
          </p>
        </section>

        <section className="legal-sections">
          {SECTIONS.map((section) => (
            <article className="legal-card" key={section.title}>
              <h2 className="legal-card__title">{section.title}</h2>
              <div className="legal-card__body">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="legal-contact">
          <div className="legal-contact__card">
            <h2>Questions about privacy or platform data?</h2>
            <p>
              For questions about account access, organization visibility, or
              platform support, contact your coordinator or visit the Help page
              for the most current support path.
            </p>
            <div className="legal-contact__actions">
              <Link to="/help" className="legal-contact__button">
                Go to Help
              </Link>
              <Link
                to="/user-agreement"
                className="legal-contact__button legal-contact__button--secondary"
              >
                View User Agreement
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ContentPanel>
  );
}