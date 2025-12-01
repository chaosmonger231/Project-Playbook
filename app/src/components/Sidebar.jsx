import "./Sidebar.css";
import { useLocation } from "react-router-dom";
import { useUser } from "../auth/UserContext";

export default function Sidebar({
  selected,
  onSelect,
  items = ["box1", "box2", "box3", "box4"],
}) {
  const location = useLocation();
  const { role } = useUser();

  const isHome = location.pathname === "/";
  const isLessons = location.pathname === "/train";

  function getLabel(id) {
    // ---------- HOME TAB ----------
    if (isHome) {
      if (role === "coordinator") {
        if (id === "box1") return "Overview";
        if (id === "box2") return "Actions & Invites";
        if (id === "box3") return "Playbook";
      } else {
        if (id === "box1") return "Overview";
        if (id === "box2") return "My Training";
        if (id === "box3") return "My Results";
      }
    }

    // ---------- LESSONS / TRAIN TAB ----------
    if (isLessons) {
      if (role === "coordinator") {
        if (id === "box1") return "Phishing & Email Safety";
        if (id === "box2") return "Passwords & MFA";
        if (id === "box3") return "Ransomware & Backups";
        if (id === "box4") return "Protecting Sensitive Data";
      } else {
        if (id === "box1") return "Module 1 Phishing & Email Safety";
        if (id === "box2") return "Module 2 Passwords & MFA";
        if (id === "box3") return "Module 3 Ransomware & Backups";
        if (id === "box4") return "Module 4 Protecting Sensitive Data";
      }
    }

    // Default: for non-Home routes or unknown ids, just show the id
    return id;
  }

  return (
    <aside className="sidenav">
      {items.map((k) => (
        <button
          key={k}
          type="button"
          className={`sidebtn ${selected === k ? "active" : ""}`}
          onClick={() => onSelect(k)}
        >
          {getLabel(k)}
        </button>
      ))}
    </aside>
  );
}
