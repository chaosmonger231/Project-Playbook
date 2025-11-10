import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const t = e.target;
      if (
        sheetRef.current && !sheetRef.current.contains(t) &&
        btnRef.current && !btnRef.current.contains(t)
      ) setOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="hambox">
      <button
        ref={btnRef}
        className={`hambtn ${open ? "is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span className="hamburger-icon" aria-hidden="true">
          <span className="bar bar1" />
          <span className="bar bar2" />
          <span className="bar bar3" />
        </span>
      </button>

      {open && (
        <div className="menu-sheet" role="menu" ref={sheetRef}>
          <Link role="menuitem" className="menu-item" to="/account"  onClick={() => setOpen(false)}>Account</Link>
          <Link role="menuitem" className="menu-item" to="/settings" onClick={() => setOpen(false)}>Settings</Link>
          <Link role="menuitem" className="menu-item" to="/help"     onClick={() => setOpen(false)}>Help / Docs</Link>
        </div>
      )}
    </div>
  );
}
