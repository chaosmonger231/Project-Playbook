import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import CyberNewsPanel from "../components/CyberNewsPanel";
import ContentPanel from "../components/ContentPanel";

export default function Home() {
  const { role, orgName, loading } = useUser();
  const navigate = useNavigate();

  async function testSignedUrl() {
    const apiBase = "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/prod";
    const key = "Images/Lessons Module - Multi-Factor Authentication (General).mp4";

    try {
      const res = await fetch(
        `${apiBase}/signed-url?key=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      console.log("SIGNED URL:", data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Signed URL test failed:", err);
    }
  }

  if (loading) return <p>Loading…</p>;

  const isCoordinator = role === "coordinator";
  const roleLabel = isCoordinator ? "Coordinator" : "Participant";
  const orgLabel = orgName?.trim() || "Organization not set";

  return (
    <div className="home-container">
      <div className="home-top-row">
        <div className="home-top-left">
          <div className="home-identity-card">
            <div className="home-identity-card__content">
              <div className="home-identity-card__avatar">
                <img
                  src="/images/profilecharacter.png"
                  alt="Profile"
                  className="home-identity-card__avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              </div>

              <div className="home-identity-card__text">
                <h2 className="home-identity-card__name">
                  <CurrentUserName />
                </h2>

                <div className="home-identity-card__meta">
                  <span className="home-identity-card__org">{orgLabel}</span>
                  <span className="home-identity-card__divider">|</span>
                  <span className="home-identity-card__role">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="home-top-right">
          <div className="home-featured-news">
            <CyberNewsPanel variant="featured" />
          </div>
        </div>
      </div>

      <div className="home-layout">

        <section className="home-right">
          <ContentPanel>
            <div className="home-cards">

              <button
                type="button"
                className="action-card action-card--about"
                onClick={() => navigate("/about")}
              >
                <div className="action-card__head">
                  <div className="action-card__title">About Project Playbook</div>
                </div>
                <div className="action-card__divider" />
                
                <div className="action-card__body">
                  <p>
                    Project Playbook delivers guided training, playbooks, and practical tools to help organizations improve cybersecurity readiness. 
                    Following the passage of <strong>Ohio HB96</strong>, many public organizations are now required to adopt cybersecurity programs. Project Playbook 
                    helps meet these requirements while also supporting small businesses and other organizations working to strengthen their security posture. 
                  <br/>
                  <br/>
                    Click this card to learn more.
                  </p>
                </div>
              </button>

              <button
                type="button"
                className="action-card action-card--blue"
                onClick={() => navigate("/playbooks")}
              >
                <div className="action-card__head">
                  <div className="action-card__title">Playbooks</div>
                </div>
                <div className="action-card__divider" />
                <div className="action-card__body">
                  Manage playbooks, set participant visibility, and track
                  organization completion.
                  <div className="showcase-grid">
                    <img src="/images/playbookImage1.png" alt="Phishing" />
                    <img src="/images/playbookImage1.png" alt="Ransomware" />
                    <img src="/images/playbookImage2.png" alt="Passwords" />
                    <img
                      src="/images/playbookImage2.png"
                      alt="Incident Response"
                    />
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="action-card action-card--green"
                onClick={() => navigate("/organization")}
              >
                <div className="action-card__head">
                  <div className="action-card__title">Team Management</div>
                </div>
                <div className="action-card__divider" />
                <div className="action-card__body">
                  Invite members, manage roles, and view participation across
                  your organization.
                  <div className="showcase-grid">
                    <img src="/images/networking.png" alt="Networking" />
                    <img src="/images/column.png" alt="Column" />
                    <img src="/images/piechart.png" alt="Pie Chart" />
                    <img src="/images/management.png" alt="Management" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="action-card action-card--red"
                onClick={() => navigate("/incidentresponse")}
              >
                <div className="action-card__head">
                  <div className="action-card__title">Incident Response</div>
                </div>
                <div className="action-card__divider" />
                <div className="action-card__body">
                  Edit emergency contacts and response guidance for your
                  organization.
                  <div className="showcase-grid">
                    <img
                      src="/images/cybersecurity.png"
                      alt="Cybersecurity"
                    />
                    <img src="/images/contact.png" alt="Contact" />
                    <img src="/images/alarm.png" alt="Alarm" />
                    <img src="/images/info.png" alt="Info" />
                  </div>
                </div>
              </button>
            </div>
          </ContentPanel>
{/*
          {!isCoordinator && (
            <div className="home-tasks">
              <div className="home-tasks-title">Your Tasks</div>
              <div className="home-tasks-sub">
                (Coming soon) Assigned modules and due dates will appear here.
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={testSignedUrl}>
              Test S3 Signed URL
            </button>
          </div>
*/}
        </section>
      </div>
    </div>
  );
}