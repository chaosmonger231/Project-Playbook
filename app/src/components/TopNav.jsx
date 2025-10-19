import { NavLink } from "react-router-dom";
import SignOutButton from "../components/SignOutButton.jsx";
import "./TopNav.css"

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="brand">Project Playbook</div>
      <nav className="links">
        <NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Home</NavLink>
        <NavLink to="/graphs" className={({isActive}) => isActive ? "active" : ""}>Graphs</NavLink>
        <NavLink to="/train"  className={({isActive}) => isActive ? "active" : ""}>Train</NavLink>
        <NavLink to="/data"   className={({isActive}) => isActive ? "active" : ""}>Data</NavLink>
      </nav>
           
      <div className="actions">
        <SignOutButton className="signout-btn" />
      </div>
      
    </header>
  );
}
