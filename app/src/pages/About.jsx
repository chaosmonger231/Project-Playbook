import { useState } from "react";
import ContentPanel from "../components/ContentPanel";

const TEAM_MEMBERS = [
  {
    name: "Nick Capozzi",
    image: "/images/capozzi.jpg",
    link: "https://www.linkedin.com/in/nicholas-capozzi-a20332224/",
  },
  {
    name: "Vedika Amin",
    image: "/images/genericImage.png",
    link: "https://www.linkedin.com/in/vedikaamin/",
  },
  {
    name: "James Halsey",
    image: "/images/genericImage2.png",
    link: "https://www.linkedin.com/in/example3",
  },
  {
    name: "Mark Nudalo",
    image: "/images/itsame.jpg",
    link: "https://www.linkedin.com/in/marknudalo/",
  },
];

const QUICK_LINKS = [
  {
    label: "Ohio House Bill 96",
    href: "https://codes.ohio.gov/ohio-revised-code/section-9.64",
    external: true,
  },  
  { label: "Open Lessons", href: "/lessons", external: false },
  { label: "Open Playbooks", href: "/playbooks", external: false },
  { label: "Security Readiness", href: "/securityreadiness", external: false },
  
];

export default function About() {
  const [openSection, setOpenSection] = useState("why");

  function toggleSection(key) {
    setOpenSection((current) => (current === key ? null : key));
  }

  function handleInternal(link) {
    window.location.href = link;
  }

  const sideCard = {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1.5px solid #d1d5db",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 120px 28px rgba(15, 23, 42, 0.05)",
    position: "sticky",
    top: "24px",
  };

  const teamStack = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "18px",
    justifyItems: "center",
    marginTop: "18px",
  };

  const teamBubble = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    textAlign: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    borderRadius: "18px",
    padding: "8px",
    width: "100%",
    textDecoration: "none",
  };

  const teamImage = {
    width: "108px",
    height: "108px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #e5e7eb",
    display: "block",
    background: "#fff",
    marginBottom: "10px",
  };

  const teamName = {
    fontWeight: 600,
    fontSize: "14px",
    color: "#111827",
    lineHeight: 1.3,
  };

  const quickLinkCard = {
    ...sideCard,
    background: "linear-gradient(180deg, #ffffff 0%, #f6fbff 100%)",
    border: "1px solid #dbeafe",
  };

  const quickLinkButton = {
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "12px",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    display: "block",
    textDecoration: "none",
  };

  const accordionItemStyle = {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    background: "#f8fbff",
    marginBottom: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
    };

  const accordionHeaderStyle = {
    width: "100%",
    textAlign: "left",
    padding: "16px 18px",
    background: "#ffffff",
    border: "none",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const accordionBodyStyle = {
    padding: "0 18px 18px 18px",
    color: "#374151",
    lineHeight: 1.7,
  };

  return (
    <ContentPanel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(700px, 900px) 260px",
          gap: "24px",
          alignItems: "start",
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "8px 16px 24px",
        }}
      >
        {/* LEFT SIDE */}
        <aside style={sideCard}>
          <h3 style={{ marginBottom: "10px", marginTop: "10px" }}>
            Meet the Team
            <span style={{ margin: "0 8px", color: "#d4c54a" }}>|</span>
            <span
              style={{ color: "#6b7280", fontWeight: 400, fontSize: "14px" }}
            >
              LinkedIn
            </span>
          </h3>

          <div style={teamStack}>
            {TEAM_MEMBERS.map((member) => (
              <a
                key={member.name}
                href={member.link}
                target="_blank"
                rel="noopener noreferrer"
                style={teamBubble}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(0,0,0,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <img src={member.image} alt={member.name} style={teamImage} />
                <div style={teamName}>{member.name}</div>
              </a>
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "16px",
            padding: "28px",
          }}
        >
          <h1 style={{ marginBottom: "12px", marginTop: "1px" }}>About Project Playbook</h1>

          <p style={{ marginBottom: "20px", color: "#374151" }}>
            Project Playbook is a cybersecurity readiness platform designed to
            help organizations strengthen security through guided training,
            structured playbooks, and practical tools. It focuses on real-world
            preparedness, helping teams understand risks, improve awareness, and
            take actionable steps toward better security practices.
          </p>

          <div style={{ marginTop: "20px" }}>
            <div style={accordionItemStyle}>
              <button
                type="button"
                style={accordionHeaderStyle}
                onClick={() => toggleSection("why")}
              >
                <span>Why It Matters</span>
                <span>{openSection === "why" ? "−" : "+"}</span>
              </button>

              {openSection === "why" && (
                <div style={accordionBodyStyle}>
                  <p style={{ margin: 0 }}>
                    Following the passage of Ohio House Bill 96 (HB96), many
                    public organizations are now required to adopt formal
                    cybersecurity programs. Project Playbook helps organizations
                    meet these expectations while also supporting small
                    businesses and other teams looking to improve their security
                    posture.
                  </p>
                </div>
              )}
            </div>

            <div style={accordionItemStyle}>
              <button
                type="button"
                style={accordionHeaderStyle}
                onClick={() => toggleSection("who")}
              >
                <span>Who It’s For</span>
                <span>{openSection === "who" ? "−" : "+"}</span>
              </button>

              {openSection === "who" && (
                <div style={accordionBodyStyle}>
                  <ul style={{ margin: 0, paddingLeft: "22px" }}>
                    <li>Local government and public sector organizations</li>
                    <li>Educational institutions</li>
                    <li>Small businesses and private organizations</li>
                    <li>
                      Teams looking to improve cybersecurity awareness and
                      readiness
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div style={accordionItemStyle}>
              <button
                type="button"
                style={accordionHeaderStyle}
                onClick={() => toggleSection("provides")}
              >
                <span>What Project Playbook Provides</span>
                <span>{openSection === "provides" ? "−" : "+"}</span>
              </button>

              {openSection === "provides" && (
                <div style={accordionBodyStyle}>
                  <ul style={{ margin: 0, paddingLeft: "22px" }}>
                    <li>
                      <strong>Training Modules</strong> – Build awareness of
                      common threats such as phishing, social engineering, and
                      safe practices
                    </li>
                    <li>
                      <strong>Playbooks</strong> – Step-by-step guidance for
                      handling cybersecurity scenarios and improving readiness
                    </li>
                    <li>
                      <strong>Practical Tools</strong> – Tools like the Impact
                      Calculator to support planning and decision-making
                    </li>
                    <li>
                      <strong>Readiness Tracking</strong> – Track progress and
                      align with security expectations
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div style={accordionItemStyle}>
              <button
                type="button"
                style={accordionHeaderStyle}
                onClick={() => toggleSection("approach")}
              >
                <span>Our Approach</span>
                <span>{openSection === "approach" ? "−" : "+"}</span>
              </button>

              {openSection === "approach" && (
                <div style={accordionBodyStyle}>
                  <p style={{ margin: 0 }}>
                    Project Playbook focuses on simplicity and usability.
                    Instead of overwhelming teams with complex frameworks, it
                    breaks cybersecurity into manageable steps that can be
                    understood and applied by organizations of all sizes.
                  </p>
                </div>
              )}
            </div>

            <div style={accordionItemStyle}>
              <button
                type="button"
                style={accordionHeaderStyle}
                onClick={() => toggleSection("start")}
              >
                <span>Get Started</span>
                <span>{openSection === "start" ? "−" : "+"}</span>
              </button>

              {openSection === "start" && (
                <div style={accordionBodyStyle}>
                  <p style={{ margin: 0 }}>
                    Whether you are working to meet compliance requirements or
                    simply want to improve your organization’s security posture,
                    Project Playbook provides the tools and guidance to help you
                    get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <aside style={quickLinkCard}>
          <h3 style={{ marginBottom: "8px", marginTop: "1px"}}>Quick Access</h3>
          <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.5 }}>
            Jump to key areas of Project Playbook or open related resources.
          </p>

          <div style={{ marginTop: "18px" }}>
            {QUICK_LINKS.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={quickLinkButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 18px rgba(15,23,42,0.08)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#dbe3ee";
                  }}
                >
                  {item.label}
                  <span style={{ float: "right", opacity: 0.6 }}>↗</span>
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  style={quickLinkButton}
                  onClick={() => handleInternal(item.href)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 18px rgba(15,23,42,0.08)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#dbe3ee";
                  }}
                >
                  {item.label}
                  <span style={{ float: "right", opacity: 0.6 }}>→</span>
                </button>
              )
            )}
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Start with the playbooks and training modules, then use Security
            Readiness to review progress and next steps.
          </div>
        </aside>
      </div>
    </ContentPanel>
  );
}