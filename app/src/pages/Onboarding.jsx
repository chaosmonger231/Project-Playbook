import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../auth/firebase";
import { createOrg, upsertUserProfile } from "../auth/userProfile";
import "./Onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [role, setRole] = useState(""); // default
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [orgType, setOrgType] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");

  // Get current user from Firebase Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not logged in, send them to login
        navigate("/login", { replace: true });
        return;
      }
      setCurrentUser(user);

      // prefill name from auth profile if available
      if (user.displayName) {
        setName(user.displayName);
      }

      setLoadingUser(false);
    });

    return () => unsub();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      setError("No logged-in user found.");
      return;
    }

    if (!role) {
      setError("Please select a role.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!orgName.trim()) {
      setError("Please enter your organization name.");
      return;
    }

    if (!orgType) {
      setError("Please select an organization type.");
      return;
    }

    setSaving(true);

    try {
      // For now: always create a new org doc when onboarding.
      const orgId = await createOrg({
        name: orgName.trim(),
        type: orgType,
        employeeCount: employeeCount ? Number(employeeCount) : null,
        createdBy: currentUser.uid,
      });

      // IMPORTANT: just these canonical field names:
      await upsertUserProfile(currentUser, {
        displayName: name.trim(),
        role,
        orgId,
        orgName: orgName.trim(),
        department: department.trim(),
        onboardingComplete: true,
      });

      // After successful onboarding, go to Home ("/")
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Something went wrong saving your info. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <p>Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h2>Welcome to Project Playbook</h2>
        <p className="onboarding-muted">
          Please tell us a bit about your role and organization.
        </p>

        {error && <p className="onboarding-error">{error}</p>}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Name */}
          <div className="onboarding-field">
            <h3>Name</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Role selection */}
          <div className="onboarding-field">
            <h3>Role</h3>
            <div className="role-buttons">
              <button
                type="button"
                onClick={() => setRole("coordinator")}
                className={
                  role === "coordinator"
                    ? "role-button role-button--active"
                    : "role-button"
                }
              >
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => setRole("participant")}
                className={
                  role === "participant"
                    ? "role-button role-button--active"
                    : "role-button"
                }
              >
                Participant
              </button>
            </div>
            <small className="onboarding-help">
              (Later, participants may be invited directly by coordinators.)
            </small>
          </div>

          {/* Org name */}
          <div className="onboarding-field">
            <h3>Organization Name</h3>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Evergreen Elementary School"
            />
            <small className="onboarding-help">
              In the future, this can also search existing organizations.
            </small>
          </div>

          {/* Department / Team */}
          <div className="onboarding-field">
            <h3>Department / Team (optional)</h3>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. IT, Operations, 5th Grade Team"
            />
          </div>

          {/* Org type */}
          <div className="onboarding-field">
            <h3>Organization Type</h3>
            <div className="onboarding-radio-group">
              <label>
                <input
                  type="radio"
                  name="orgType"
                  value="k12"
                  checked={orgType === "k12"}
                  onChange={(e) => setOrgType(e.target.value)}
                />{" "}
                K–12 Education
              </label>
              <label>
                <input
                  type="radio"
                  name="orgType"
                  value="local_gov"
                  checked={orgType === "local_gov"}
                  onChange={(e) => setOrgType(e.target.value)}
                />{" "}
                Local Government Agency
              </label>
              <label>
                <input
                  type="radio"
                  name="orgType"
                  value="small_business"
                  checked={orgType === "small_business"}
                  onChange={(e) => setOrgType(e.target.value)}
                />{" "}
                Small Business / Private Entity
              </label>
              <label>
                <input
                  type="radio"
                  name="orgType"
                  value="individual"
                  checked={orgType === "individual"}
                  onChange={(e) => setOrgType(e.target.value)}
                />{" "}
                Individual
              </label>
            </div>
          </div>

          {/* Employee count (optional) */}
          <div className="onboarding-field">
            <h3>Approximate Employee Count (optional)</h3>
            <input
              type="number"
              min="0"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              placeholder="e.g. 25"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="onboarding-submit"
          >
            {saving ? "Saving..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
