import { useOutletContext, useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import CyberNewsPanel from "../components/CyberNewsPanel";
import OrgStatusBanner from "../components/OrgStatusBanner";

export default function Home() {
  const { selected } = useOutletContext();
  const { role, loading } = useUser();
  const navigate = useNavigate();

  // --- TEMP TEST: API Gateway -> Lambda -> S3 signed URL ---
  async function testSignedUrl() {
    const apiBase = "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com";
    const key = "Images/meme2.jpg";

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

  if (loading) {
    return <p>Loading…</p>;
  }

  let mainContent = null;

  // =========================
  // COORDINATOR VIEW
  // =========================
  if (role === "coordinator") {
    if (selected === "box1") {
      mainContent = (
        <div className="home-layout">
          <CyberNewsPanel />
          <section className="home-main">
            <h3>Overview</h3>
            <p>Overview content goes here.</p>
          </section>
        </div>
      );
    } else if (selected === "box2") {
      mainContent = (
        <section>
          <h3>Actions & Invites</h3>
          <p>Actions & invites content goes here.</p>
        </section>
      );
    } else if (selected === "box3") {
      const playbooks = [
        {
          id: 1,
          label: "Playbook 1",
          path: "/playbook1",
          icon: "/images/playbookImage1.png",
        },
        {
          id: 2,
          label: "Impact Calculator Playbook",
          path: "/playbook2",
          icon: "/images/playbookImage2.png",
        },
        {
          id: 3,
          label: "Detection and Response Playbook",
          path: "/playbook3",
          icon: "/images/playbookImage3.png",
        },
        {
          id: 4,
          label: "Playbook 4",
          path: "/playbook4",
          icon: "/images/playbookImage1.png",
        },
        {
          id: 5,
          label: "Playbook 5",
          path: "/playbook5",
          icon: "/images/playbookImage2.png",
        },
      ];

      function openPlaybook(path) {
        navigate(path);
      }

      mainContent = (
        <section>
          <h3>Playbooks</h3>
          <p>
            Use these tools to plan, prioritize, and track your organization's
            cybersecurity improvements.
          </p>

          <div className="playbook-grid">
            {playbooks.map((pb) => (
              <button
                key={pb.id}
                type="button"
                className="playbook-card"
                onClick={() => openPlaybook(pb.path)}
              >
                <img
                  src={pb.icon}
                  alt={pb.label}
                  className="playbook-icon"
                />
                <span className="playbook-label">{pb.label}</span>
              </button>
            ))}
          </div>
        </section>
      );
    } else {
      mainContent = (
        <section>
          <h3>Coordinator Home</h3>
          <p>
            Select Overview, Actions & Invites, or Playbook from the sidebar.
          </p>
        </section>
      );
    }
  }

  // =========================
  // PARTICIPANT VIEW
  // =========================
  else {
    if (selected === "box1") {
      mainContent = (
        <section>
          <h3>Your Training Overview</h3>
          <p>
            Here you’ll see assigned modules, due dates, and your recent
            results.
          </p>
        </section>
      );
    } else if (selected === "box2") {
      mainContent = (
        <section>
          <h3>My Training</h3>
          <p>Here you’ll see the modules assigned to you.</p>
        </section>
      );
    } else if (selected === "box3") {
      mainContent = (
        <section>
          <h3>My Results</h3>
          <p>Here you’ll see your quiz scores and completion history.</p>
        </section>
      );
    } else {
      mainContent = (
        <section>
          <h3>Welcome</h3>
          <p>Use the sidebar to view your training or results.</p>
        </section>
      );
    }
  }

  // =========================
  // FINAL RENDER
  // =========================
  return (
    <div className="home-container">
      <h2>
        Welcome, <CurrentUserName />
      </h2>

      {/* 🔔 Full-width Org Banner */}
      <OrgStatusBanner />

      {/* 📦 Dynamic Page Content */}
      {mainContent}

      {/* Temporary Test Button */}
      <button onClick={testSignedUrl}>Test S3 Signed URL</button>
    </div>
  );
}