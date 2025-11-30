import { useOutletContext, useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import CurrentUserName from "../components/CurrentUserName";

// Following imports for testing Firestore connection. Comment it out when done.
// import { db } from "../auth/firebase";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const { selected } = useOutletContext();
  const { role, loading } = useUser();
  const navigate = useNavigate();

  if (loading) {
    return <p>Loading…</p>;
  }

  let mainContent = null;

  if (role === "coordinator") {
    // COORDINATOR HOME
    if (selected === "box1") {
      mainContent = (
        <section>
          <h3>Overview</h3>
          <p>Overview content goes here.</p>
        </section>
      );
    } else if (selected === "box2") {
      mainContent = (
        <section>
          <h3>Actions & Invites</h3>
          <p>Actions & invites content goes here.</p>
        </section>
      );
    } else if (selected === "box3") {
      mainContent = (
        <section>
          <h3>Playbooks</h3>
          <p>Use these tools to plan, prioritize, and track your organization's cybersecurity
            improvements.
          </p>

          <button
            type="button"
            onClick={() => navigate("/playbook2")}
            style={{
              marginTop: "0.75rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              background: "#2563eb",
              color: "#fff",
            }}
          >
            Open Playbook 2
          </button>

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
      <p>
        Current box: <strong>{selected}</strong>
      </p>

      {mainContent}

      {/* Test Button below – comment out when done */}
      {/* <button onClick={testFirestore}>Test Firestore</button> */}
    </>
  );
}
