import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import CyberNewsPanel from "../components/CyberNewsPanel";
import OrgStatusBanner from "../components/OrgStatusBanner";
import ContentPanel from "../components/ContentPanel";

export default function Home() {
  const { role, loading } = useUser();
  const navigate = useNavigate();

  // --- TEMP TEST: API Gateway -> Lambda -> S3 signed URL ---
  async function testSignedUrl() {
    const apiBase = "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com";
    const key = "Images/meme2.jpg";

    try {
      const res = await fetch(`${apiBase}/signed-url?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      console.log("SIGNED URL:", data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Signed URL test failed:", err);
    }
  }

  if (loading) return <p>Loading…</p>;

  const isCoordinator = role === "coordinator";

  return (
    <div className="home-container">
      <h2>
        Welcome, <CurrentUserName />
      </h2>

      {/* 🔔 Org Banner */}
      <OrgStatusBanner />

      {/* Main Layout */}
      <div className="home-layout">

        {/* Left Column: News */}
        <aside className="home-left">
          <CyberNewsPanel />
        </aside>

        {/* Right Column */}
        <section className="home-right">

          {/* Reusable Content Panel */}
          <ContentPanel>
            <div className="home-cards">

              {/* Playbooks */}
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
                  Manage playbooks, set participant visibility, and track organization completion.
                </div>
              </button>

              {/* Team Management */}
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
                  Invite members, manage roles, and view participation across your organization.
                </div>
              </button>

              {/* Incident Response */}
              <button
                type="button"
                className="action-card action-card--red"
                onClick={() => navigate("/incident")}
              >
                <div className="action-card__head">
                  <div className="action-card__title">Incident Response</div>
                </div>
                <div className="action-card__divider" />
                <div className="action-card__body">
                  Edit emergency contacts and response guidance for your organization.
                </div>
              </button>

            </div>
          </ContentPanel>

          {/* Optional participant-only tasks strip */}
          {!isCoordinator && (
            <div className="home-tasks">
              <div className="home-tasks-title">Your Tasks</div>
              <div className="home-tasks-sub">
                (Coming soon) Assigned modules and due dates will appear here.
              </div>
            </div>
          )}

          {/* Temporary Test Button */}
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={testSignedUrl}>
              Test S3 Signed URL
            </button>
          </div>

        </section>
      </div>
    </div>
  );
}