import "./Sidebar.css";

export default function Sidebar({
  selected,
  onSelect,
  items = [], // [{ id, label }]
  variant = "default", // default | tight | wide
}) {
  const variantClass =
    variant === "tight"
      ? "app-sidenav app-sidenav--tight"
      : variant === "wide"
      ? "app-sidenav app-sidenav--wide"
      : "app-sidenav";

  return (
    <aside className={variantClass}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sidebtn ${selected === item.id ? "active" : ""}`}
          onClick={() => onSelect?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}