// src/pages/Help.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import "./help.css";

const FAQS = [
  {
    question: "Who should I contact first?",
    answer:
      "For organization-specific questions like member access, deadlines, training expectations, or readiness workflows, contact your coordinator first. For platform issues, bugs, or page problems, contact the Project Playbook team.",
  },
  {
    question: "Can I leave a message here?",
    answer:
      "Yes. This page includes a lightweight message form for presentation purposes. It is currently placeholder UI and is not yet wired to a backend.",
  },
  {
    question: "What kind of problems should be reported?",
    answer:
      "Examples include trouble signing in, broken buttons, page layout issues, confusion about where to go next, missing files, or trouble understanding which feature to use.",
  },
  {
    question: "Can I download support files from here?",
    answer:
      "Yes. This page can list downloadable or viewable PDF resources such as quick guides, onboarding documents, or coordinator instructions.",
  },
];

const PDF_RESOURCES = [
  {
    title: "pdf1",
    description: "TEST TEST TEST TEST",
    file: "/docs/participant-quick-start.pdf",
  },
  {
    title: "pdf2",
    description: "TEST TEST TEST TEST",
    file: "/docs/coordinator-overview.pdf",
  },
  {
    title: "pdf3",
    description: "TEST TEST TEST TEST",
    file: "/docs/platform-support-guide.pdf",
  },
];

function Modal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="help-modal__overlay" onClick={onClose}>
      <div
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-sent-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-modal__icon">✓</div>
        <h3 id="message-sent-title">Message Sent</h3>
        <p>Your message has been marked as sent for demo purposes.</p>
        <button type="button" className="help-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`help-accordion ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="help-accordion__button"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{question}</span>
        <span className="help-accordion__icon">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="help-accordion__content">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState("coordinator");
  const [showModal, setShowModal] = useState(false);

  return (
    <ContentPanel>
      <div className={`help-page ${showModal ? "help-page--blurred" : ""}`}>
        <div className="help-page__topbar">
          <button
            type="button"
            className="help-page__back"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          <div className="help-page__links">
            <Link
              to="/help"
              className="help-page__link help-page__link--active"
            >
              Help
            </Link>
            <Link to="/user-agreement" className="help-page__link">
              User Agreement
            </Link>
            <Link to="/privacy-policy" className="help-page__link">
              Privacy Policy
            </Link>
          </div>
        </div>

        <section className="help-hero">
          <div className="help-hero__main">
            <div className="help-hero__eyebrow">Project Playbook Support</div>
            <h1 className="help-hero__title">
            Help / Docs <span style={{ color: "#d5e309", margin: "0 10px" }}>|</span>
            <span className="help-hero__text">
                Find support guidance, leave a message for your coordinator or the platform
                team, and access quick reference documents in one place.
            </span>
            </h1>

            <div className="help-hero__chips">
              <span className="help-chip">Support</span>
              <span className="help-chip">Reference</span>
              <span className="help-chip">PDF Resources</span>
            </div>
          </div>
        </section>

        <section className="help-grid help-grid--main">
          <article className="help-card help-card--faq">
            <div className="help-card__header">
              <h2>Frequently Asked Questions</h2>
              <p>Quick answers to common support and navigation questions.</p>
            </div>

            <div className="help-faqs">
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </article>

          <article className="help-card help-card--message">
            <div className="help-card__header">
              <h2>Communications</h2>
              <p>
                This is a presentation-friendly placeholder form. It looks real,
                but it is not wired yet.
              </p>
            </div>

            <div className="help-form">
              <label className="help-label">
                Send message to
                <select
                  className="help-input"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <option value="coordinator">Coordinator</option>
                  <option value="platform">Project Playbook Team</option>
                </select>
              </label>

              <label className="help-label">
                Your name
                <input
                  className="help-input"
                  type="text"
                  placeholder="Enter your name"
                />
              </label>

              <label className="help-label">
                Subject
                <input
                  className="help-input"
                  type="text"
                  placeholder={
                    messageType === "coordinator"
                      ? "Example: Question about assigned lessons"
                      : "Example: Broken page or platform issue"
                  }
                />
              </label>

              <label className="help-label">
                Message
                <textarea
                  className="help-input help-input--textarea"
                  placeholder="Type your message here..."
                />
              </label>

              <div className="help-form__actions">
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => setShowModal(true)}
                >
                  Send Message
                </button>
                <span className="help-form__note">
                  Placeholder only — not connected yet
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="help-card help-card--resources">
          <div className="help-card__header">
            <h2>Additional Resources</h2>
            <p>Resources in PDF form.</p>
          </div>

          <div className="help-resources">
            {PDF_RESOURCES.map((item) => (
              <div className="help-resource" key={item.title}>
                <div className="help-resource__main">
                  <div className="help-resource__title">{item.title}</div>
                  <p className="help-resource__text">{item.description}</p>
                </div>

                <div className="help-resource__actions">
                  <a
                    href={item.file}
                    target="_blank"
                    rel="noreferrer"
                    className="help-btn"
                  >
                    View PDF
                  </a>
                  <a
                    href={item.file}
                    download
                    className="help-btn help-btn--secondary"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} />
    </ContentPanel>
  );
}