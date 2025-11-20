import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../auth/firebase";
import { createOrg, upsertUserProfile } from "../auth/userProfile";

export default function Onboarding() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [role, setRole] = useState("coordinator"); // default for now
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");

  // Get current user from Firebase Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not logged in, send them to login
        navigate("/login");
        return;
      }
      setCurrentUser(user);
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
      // Later, you can add "search existing org" behavior.
      const orgId = await createOrg({
        name: orgName.trim(),
        type: orgType,
        employeeCount: employeeCount ? Number(employeeCount) : null,
        createdBy: currentUser.uid,
      });

      await upsertUserProfile(currentUser, {
        role,
        orgId,
        organizationName: orgName.trim(),
        onboardingComplete: true,
      });

      // After successful onboarding, go to Home ("/")
      navigate("/");
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Something went wrong saving your info. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser) {
    return <p>Loading your account…</p>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Welcome to Project Playbook</h2>
      <p>Please tell us a bit about your role and organization.</p>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        {/* Role selection */}
        <div style={{ marginBottom: "1rem" }}>
          <h3>Role</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setRole("coordinator")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                border: role === "coordinator" ? "2px solid black" : "1px solid #ccc",
                background: role === "coordinator" ? "#ddd" : "#f9f9f9",
                cursor: "pointer",
              }}
            >
              Coordinator
            </button>
            <button
              type="button"
              onClick={() => setRole("participant")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                border: role === "participant" ? "2px solid black" : "1px solid #ccc",
                background: role === "participant" ? "#ddd" : "#f9f9f9",
                cursor: "pointer",
              }}
            >
              Participant
            </button>
          </div>
          <small style={{ display: "block", marginTop: "0.25rem" }}>
            (Later, participants may be invited directly by coordinators.)
          </small>
        </div>

        {/* Org name */}
        <div style={{ marginBottom: "1rem" }}>
          <h3>Organization Name</h3>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Evergreen Elementary School"
            style={{ width: "100%", padding: "0.5rem" }}
          />
          <small style={{ display: "block", marginTop: "0.25rem" }}>
            In the future, this can also search existing organizations.
          </small>
        </div>

        {/* Org type */}
        <div style={{ marginBottom: "1rem" }}>
          <h3>Organization Type</h3>
          <div style={{ display: "grid", gap: "0.5rem" }}>
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
        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Approximate Employee Count (optional)</h3>
          <input
            type="number"
            min="0"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            placeholder="e.g. 25"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Save and Continue"}
        </button>
      </form>
    </div>
  );
}
