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

  function getLabel(id) {
    if (isHome) {
      // HOME TAB ONLY
      if (role === "coordinator") {
        // Coordinator labels on Home
        if (id === "box1") return "Overview";
        if (id === "box2") return "Actions & Invites";
        if (id === "box3") return "Playbook";
      } else {
        // Participant (or no role) labels on Home
        if (id === "box1") return "Overview";
        if (id === "box2") return "My Training";
        if (id === "box3") return "My Results";
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