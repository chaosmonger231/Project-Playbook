import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../auth/firebase";
import { createOrg, upsertUserProfile, joinOrgByCode } from "../auth/userProfile";
import "./Onboarding.css";

const ORG_TYPES = [
  { key: "small_business", label: "Small Business / Private Company" },
  { key: "local_gov", label: "Local Government / Public Agency" },
  { key: "education", label: "Education" },
];

const EMPLOYEE_RANGES = [
  { key: "1-10", label: "1–10" },
  { key: "11-50", label: "11–50" },
  { key: "51-200", label: "51–200" },
  { key: "201-1000", label: "201–1,000" },
  { key: "1000+", label: "1,000+" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auth/user state
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [role, setRole] = useState(""); // "coordinator" | "participant"
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [orgType, setOrgType] = useState(""); // stable key
  const [employeeRange, setEmployeeRange] = useState(""); // stable key

  // Participants join existing org via code
  const inviteCodeFromUrl = (searchParams.get("code") || "").trim();
  const [inviteCode, setInviteCode] = useState(inviteCodeFromUrl);

  // For coordinators: show the org join code after creation
  const [createdJoinCode, setCreatedJoinCode] = useState("");

  // Helpful: if code exists, default role to participant
  useEffect(() => {
    if (inviteCodeFromUrl) setRole("participant");
  }, [inviteCodeFromUrl]);

  // Listen for Firebase Auth user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      setCurrentUser(user);

      if (user.displayName) setName(user.displayName);
      setLoadingUser(false);
    });

    return () => unsub();
  }, [navigate]);

  const isCoordinator = role === "coordinator";
  const isParticipant = role === "participant";

  const canSubmit = useMemo(() => {
    if (!currentUser) return false;
    if (!role) return false;
    if (!name.trim()) return false;

    if (isCoordinator) {
      if (!orgName.trim()) return false;
      if (!orgType) return false;
      return true;
    }

    if (isParticipant) {
      if (!inviteCode.trim()) return false;
      return true;
    }

    return false;
  }, [currentUser, role, name, isCoordinator, isParticipant, orgName, orgType, inviteCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!currentUser) return setError("No logged-in user found.");
    if (!role) return setError("Please select a role.");
    if (!name.trim()) return setError("Please enter your name.");

    setSaving(true);

    try {
      let orgId = null;
      let resolvedOrgName = "";
      let resolvedOrgType = "";
      let resolvedEmployeeRange = "";
      let resolvedJoinCode = "";

      if (role === "coordinator") {
        if (!orgName.trim()) throw new Error("ORG_NAME_REQUIRED");
        if (!orgType) throw new Error("ORG_TYPE_REQUIRED");

        const created = await createOrg({
          name: orgName.trim(),
          orgType,
          employeeRange: employeeRange || null,
          createdBy: currentUser.uid,
        });

        orgId = created.orgId;
        resolvedJoinCode = created.joinCode;

        resolvedOrgName = orgName.trim();
        resolvedOrgType = orgType;
        resolvedEmployeeRange = employeeRange || "";

        // optional: show it briefly on the page before redirect
        setCreatedJoinCode(created.joinCode);
      }

      if (role === "participant") {
        const code = inviteCode.trim();
        if (!code) throw new Error("INVITE_CODE_REQUIRED");

        const joined = await joinOrgByCode(code);

        orgId = joined.orgId;
        resolvedOrgName = joined.orgName || "";
        resolvedOrgType = joined.orgType || "";
        resolvedEmployeeRange = joined.employeeRange || "";
        resolvedJoinCode = joined.joinCode || code.trim().toUpperCase();
      }

      if (!orgId) throw new Error("ORG_RESOLUTION_FAILED");

      await upsertUserProfile(currentUser, {
        displayName: name.trim(),
        role,
        orgId,
        orgName: resolvedOrgName,
        department: department.trim(),
        orgType: resolvedOrgType,
        employeeRange: resolvedEmployeeRange,
        joinCode: resolvedJoinCode,
        onboardingComplete: true,
        onboardingVersion: 2,
      });

      // ✅ go Home for BOTH roles once everything is saved
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Onboarding save failed:", err);

      const msg =
        err?.message === "INVITE_CODE_REQUIRED"
          ? "Please enter an invite code."
          : err?.message === "ORG_NAME_REQUIRED"
          ? "Please enter your organization name."
          : err?.message === "ORG_TYPE_REQUIRED"
          ? "Please select an organization type."
          : err?.code === "ORG_NOT_FOUND" || err?.message === "ORG_NOT_FOUND"
          ? "That invite code wasn’t recognized."
          : "Something went wrong saving your info. Please try again.";

      setError(msg);
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
          Tell us about your role. Coordinators set up an organization. Participants join using an invite code.
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
              autoComplete="name"
            />
          </div>

          {/* Role selection */}
          <div className="onboarding-field">
            <h3>Role</h3>
            <div className="role-buttons">
              <button
                type="button"
                onClick={() => setRole("coordinator")}
                className={role === "coordinator" ? "role-button role-button--active" : "role-button"}
                disabled={saving}
              >
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => setRole("participant")}
                className={role === "participant" ? "role-button role-button--active" : "role-button"}
                disabled={saving}
              >
                Participant
              </button>
            </div>
          </div>

          {/* Participant join code */}
          {isParticipant && (
            <div className="onboarding-field">
              <h3>Invite Code</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter the code from your coordinator to proceed"
                autoComplete="off"
              />
              <small className="onboarding-help">
                Ask your coordinator for an invite code (or link/QR).
              </small>
            </div>
          )}

          {/* Coordinator-only org creation */}
          {isCoordinator && (
            <>
              <div className="onboarding-field">
                <h3>Organization Name</h3>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Evergreen Elementary School"
                  autoComplete="organization"
                />
              </div>

              <div className="onboarding-field">
                <h3>Department / Team (optional)</h3>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. IT, Operations, 5th Grade Team"
                  autoComplete="organization-title"
                />
              </div>

              <div className="onboarding-field">
                <h3>Organization Type</h3>
                <div className="onboarding-radio-group">
                  {ORG_TYPES.map((t) => (
                    <label key={t.key}>
                      <input
                        type="radio"
                        name="orgType"
                        value={t.key}
                        checked={orgType === t.key}
                        onChange={(e) => setOrgType(e.target.value)}
                        disabled={saving}
                      />{" "}
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="onboarding-field">
                <h3>Approximate Employee Count (optional)</h3>
                <select value={employeeRange} onChange={(e) => setEmployeeRange(e.target.value)} disabled={saving}>
                  <option value="">Select a range…</option>
                  {EMPLOYEE_RANGES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show join code after org creation */}
              {createdJoinCode && (
                <div className="onboarding-field">
                  <h3>Organization Join Code</h3>
                  <p className="onboarding-muted">
                    Share this code with participants so they can join your organization.
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={createdJoinCode} readOnly />
                    <button
                      type="button"
                      className="role-button"
                      onClick={() => navigator.clipboard.writeText(createdJoinCode)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={saving || !canSubmit} className="onboarding-submit">
            {saving ? "Saving..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
