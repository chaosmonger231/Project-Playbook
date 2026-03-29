// src/pages/UserAgreement.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import "../pages/legal-pages.css";

const SECTIONS = [
  {
    title: "1. Acceptance of this Agreement",
    body: [
      "By accessing or using Project Playbook, you agree to follow this User Agreement. If you do not agree to these terms, you should not use the platform.",
      "This platform is intended to support cybersecurity readiness, training, documentation, and organizational planning for eligible users and participating organizations.",
    ],
  },
  {
    title: "2. Intended Use and Regional Focus",
    body: [
      "Project Playbook is designed primarily for organizations located in Ohio and within the United States. Certain workflows, recommendations, and readiness materials are built around Ohio-focused operational and cybersecurity guidance.",
      "Project Playbook is not represented as a compliance solution for laws or regulations outside the United States, including European Union requirements. Organizations outside the United States are responsible for determining whether use of the platform is appropriate for their local legal and compliance needs.",
    ],
  },
  {
    title: "3. Eligibility and Organizational Authority",
    body: [
      "You may use Project Playbook only if you are legally permitted to do so under applicable law.",
      "If you access or use the platform on behalf of an organization, school, business, public office, or other entity, you represent that you have the authority to act on behalf of that organization and to accept these terms in connection with that use.",
    ],
  },
  {
    title: "4. Account Responsibility and Organizational Security",
    body: [
      "Users are responsible for maintaining the confidentiality and security of their own login credentials and for activity that occurs through their accounts.",
      "Coordinators are responsible for managing organizational access, user setup, permissions, and internal handling of organization-related information within their own environment.",
      "Project Playbook is not responsible for loss, exposure, misuse, or unauthorized access resulting from a user’s or organization’s failure to maintain account security, internal access controls, password hygiene, or appropriate administrative oversight.",
    ],
  },
  {
    title: "5. Acceptable Use",
    body: [
      "You may use Project Playbook only for lawful, authorized, educational, operational, and defensive readiness purposes.",
      "You may not use Project Playbook, its content, example workflows, training materials, documents, or any related code or resources for unlawful, harmful, malicious, unauthorized, or abusive activity. This includes using the platform or its materials to support cybercrime, unauthorized access, disruption, surveillance, fraud, or any activity that violates applicable law or the rights of others.",
    ],
  },
  {
    title: "6. No Resale or Paid Third-Party Service Use",
    body: [
      "Project Playbook may not be sold, licensed, sublicensed, rented, marketed, bundled, or otherwise provided to third parties in exchange for payment, fees, compensation, or other commercial benefit without prior written permission from the Project Playbook team.",
      "This includes presenting Project Playbook as a paid service, consulting deliverable, managed service, or packaged offering for companies, schools, government entities, or other organizations.",
      "Organizations may use Project Playbook for their own internal training, readiness, and operational purposes, but may not charge others for access to the platform or represent it as a paid third-party service.",
    ],
  },
  {
    title: "7. Platform Materials and Intellectual Property",
    body: [
      "Unless otherwise stated, the Project Playbook platform, branding, design, layout, training materials, page content, documents, code, and related visual or written materials remain the property of Project Playbook or its respective rights holders.",
      "You may not copy, republish, redistribute, modify, create derivative commercial offerings from, or otherwise exploit platform materials beyond permitted internal use unless expressly authorized in writing.",
    ],
  },
  {
    title: "8. User Content and Submissions",
    body: [
      "Users and organizations are responsible for the accuracy, legality, appropriateness, and authorization of any information they submit through the platform, including notes, training activity, readiness responses, attestations, and other organization-entered content.",
      "By submitting content through the platform, you represent that you have the right to provide that content for internal platform use in connection with operating Project Playbook.",
    ],
  },
  {
    title: "9. Educational and Readiness Purpose Only",
    body: [
      "Project Playbook is intended to support internal cybersecurity readiness, training, and organizational planning. It is not a substitute for third-party auditors, legal counsel, certified compliance professionals, or independent security assessors.",
      "Organizations should seek qualified outside professionals when formal audits, legal review, certification, forensic investigation, regulatory interpretation, or external compliance assessment is required.",
    ],
  },
  {
    title: "10. Third-Party Resources",
    body: [
      "Project Playbook may reference or link to outside resources, agencies, tools, or websites for additional guidance. These third-party resources are not controlled by Project Playbook, and we are not responsible for their content, availability, accuracy, security practices, or services.",
      "Your use of third-party resources is at your own discretion and risk.",
    ],
  },
  {
    title: "11. Service Changes, Availability, and Access",
    body: [
      "Project Playbook may be updated, modified, limited, paused, or discontinued at any time. Features, content, and workflows may change without prior notice.",
      "We do not guarantee uninterrupted availability of the platform or that every feature will remain available in its current form.",
      "We reserve the right to restrict, suspend, or terminate access to the platform or specific features if use violates this Agreement, creates risk, or is otherwise determined to be inappropriate for the platform.",
    ],
  },
  {
    title: "12. Disclaimer of Warranties",
    body: [
      "Project Playbook is provided on an “as is” and “as available” basis without warranties of any kind, whether express or implied.",
      "We do not guarantee that the platform will be uninterrupted, error-free, fully secure, fully accurate, or suitable for any particular legal, compliance, operational, or business purpose.",
    ],
  },
  {
    title: "13. Limitation of Liability",
    body: [
      "To the fullest extent permitted by applicable law, Project Playbook and its creators, contributors, and affiliated parties will not be responsible for indirect, incidental, consequential, special, exemplary, or punitive damages, or for losses arising from reliance on the platform, service interruption, data issues, third-party conduct, organizational misuse, or failure to meet legal or compliance expectations.",
      "Use of the platform is at your own discretion and risk.",
    ],
  },
  {
    title: "14. Governing Law",
    body: [
      "This User Agreement is governed by the laws of the State of Ohio, without regard to conflict of laws principles, except where applicable law requires otherwise.",
    ],
  },
  {
    title: "15. Changes to this Agreement",
    body: [
      "Project Playbook may update this User Agreement from time to time. When updates are made, the revised version may be posted with an updated effective or last-updated date.",
      "Continued use of the platform after changes are posted constitutes acceptance of the revised agreement.",
    ],
  },
];

export default function UserAgreement() {
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
            <Link
              to="/user-agreement"
              className="legal-page__link legal-page__link--active"
            >
              User Agreement
            </Link>
            <Link to="/privacy-policy" className="legal-page__link">
              Privacy Policy
            </Link>
          </div>
        </div>

        <section className="legal-hero">
          <div className="legal-hero__content">
            <div className="legal-hero__eyebrow">Project Playbook Terms</div>
            <h1 className="legal-hero__title">User Agreement</h1>
            <p className="legal-hero__subtitle">
              Terms for using Project Playbook and its training, readiness,
              documentation, and organizational support tools.
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
                <span className="legal-hero__meta-label">Use model</span>
                <strong>Internal organizational use</strong>
              </div>
            </div>
          </div>

          <div className="legal-hero__art">
            <div className="legal-hero__art-card">
              <div className="legal-hero__art-badge">Agreement</div>
              <h3>Platform Use Standards</h3>
              <p>
                Project Playbook supports internal cybersecurity readiness and
                training. It is not a paid third-party service offering,
                external audit substitute, or commercial resale product.
              </p>
              <div className="legal-hero__art-image-slot">
                Optional agreement illustration / document image
              </div>
            </div>
          </div>
        </section>

        <section className="legal-callout">
          <h2>Plain-language summary</h2>
          <p>
            Use Project Playbook lawfully, keep your account secure, do not sell
            or repackage the service, and do not treat the platform as a
            replacement for professional legal, audit, or compliance review.
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
            <h2>Questions about these terms?</h2>
            <p>
              For general questions about platform use, account access, or
              organization administration, contact your coordinator or visit the
              Help page for the most current support path.
            </p>
            <div className="legal-contact__actions">
              <Link to="/help" className="legal-contact__button">
                Go to Help
              </Link>
              <Link
                to="/privacy-policy"
                className="legal-contact__button legal-contact__button--secondary"
              >
                View Privacy Policy
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ContentPanel>
  );
}