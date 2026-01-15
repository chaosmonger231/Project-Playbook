import { useOutletContext, useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";
import CyberNewsPanel from "../components/CyberNewsPanel";

// This is for testing Firestore connection. Keep it under comment unless when testing.
// import { db } from "../auth/firebase";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const { selected } = useOutletContext();
  const { role, loading } = useUser();
  const navigate = useNavigate();

    // --- TEMP TEST: API Gateway -> Lambda -> S3 signed URL ---
  async function testSignedUrl() {
    const apiBase = "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com";
    const key = "Images/meme2.jpg"; // change to whatever file you want

    try {
      const res = await fetch(`${apiBase}/signed-url?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      console.log("SIGNED URL:", data.url);

      // Optional: open the image in a new tab
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Signed URL test failed:", err);
    }
  }


//TEST BOTTOM LINE//

  if (loading) {
    return <p>Loading…</p>;
  }

  let mainContent = null;

  if (role === "coordinator") {
    // COORDINATOR HOME
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
          <p>Use these tools to plan, prioritize, and track your organization's cybersecurity
            improvements.
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
                  src={pb.icon}        // 👈 uses the icon from your playbooks array
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
          <p>Select Overview, Actions & Invites, or Playbook from the sidebar.</p>
        </section>
      );
    }
  } else {
    // PARTICIPANT HOME
    if (selected === "box1") {
      mainContent = (
        <section>
          <h3>Your Training Overview</h3>
          <p>
            Here you’ll see assigned modules, due dates, and your recent results.
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

  return (
    <>
      <h2>
        Welcome, <CurrentUserName />
      </h2>

      {mainContent}

      {/* Test Button below – comment out when done */}
      {/* <button onClick={testFirestore}>Test Firestore</button> */}
      <button onClick={testSignedUrl}>Test S3 Signed URL</button>
    </>
  );
}
