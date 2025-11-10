import { useNavigate } from "react-router-dom";
import "./AccountPage.css";


export default function AccountPage() {
   const navigate = useNavigate();
   const goHome = () => navigate("/", { replace: true }); 

    return (
        <div className="account-page">
        <div className="account-card">
            <h1>Account</h1>
            <p className="muted">Hello, world test test (more settings coming soon)</p>

        <div className="grid">
          <label>
            Display name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Photo URL
            <input type="url" placeholder="https://…" />
          </label>
          <label>
            Create Organization
            <input type="text" placeholder="Organization Name" />
          </label>
          <label>
            Join Organization
            <input type="text" placeholder="Join Existing Organization" />
          </label>
        </div>

        {/* add more functionalatiy to the button aside from just going Home*/}
        <div className="row">
          <button className="btn primary" onClick={goHome}>Save</button>
          <button className="btn" onClick={goHome}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
