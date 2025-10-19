import "./Sidebar.css";

export default function Sidebar({ selected, onSelect }) {
  const items = ["box1", "box2", "box3", "box4"];

  return (
    <aside className="sidenav">
      {items.map((k) => (
        <button
          key={k}
          type="button"
          className={`sidebtn ${selected === k ? "active" : ""}`}
          onClick={() => onSelect(k)}
        >
          {k}
        </button>
      ))}
    </aside>
  );
}
