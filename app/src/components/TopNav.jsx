import { NavLink } from "react-router-dom";
import SignOutButton from "../components/SignOutButton.jsx";
import HamburgerMenu from "../components/Hamburger.jsx";
import TopNavAnnouncement from "./TopNavAnnouncement.jsx";
import CurrentUserName from "./CurrentUserName.jsx";
import "./TopNav.css";

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <HamburgerMenu />

        <div className="brand">
          <img
            src="/images/projectplayboooklogov2.png"
            alt="Project Playbook logo"
            style={{ height: "56px", width: "148px" }}
          />
        </div>

        <nav className="links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>

          <NavLink
            to="/lessons"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Lessons
          </NavLink>
        </nav>
      </div>

      <div className="topnav-middle">
        <TopNavAnnouncement />
      </div>

      <div className="actions topnav-right">
        <SignOutButton className="signout-btn" />
      </div>
    </header>
  );
}