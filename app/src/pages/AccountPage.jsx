// src/pages/AccountPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../auth/firebase";
import AccountTile from "../components/AccountTile";
import "./AccountPage.css";

export default function AccountPage() {
  const navigate = useNavigate();
  const goHome = () => navigate("/", { replace: true });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("");
  const [joinOrgCode, setJoinOrgCode] = useState("");
  const [department, setDepartment] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // which field is currently open in the edit panel
  const [editingField, setEditingField] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDraft, setEditDraft] = useState("");

  // Load user + user doc, but wait for Firebase auth to initialise
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setDisplayName(data.displayName || user.displayName || "");
          setOrgName(data.orgName || "");
          setRole(data.role || "");
          setJoinOrgCode(data.joinOrgCode || "");
          setDepartment(data.department || "");
          setInviteCode(data.inviteCode || "");
        } else {
          setDisplayName(user.displayName || "");
        }

        setEmail(user.email || "");
      } catch (e) {
        console.error(e);
        setError("Failed to load account info.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  const normalizedRole = (role || "").toLowerCase();
  const isCoordinator =
    normalizedRole === "coordinator" || normalizedRole === "manager";
  const hasOrg = !!orgName.trim();

  const handleSaveToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setError("");

    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          displayName: displayName.trim(),
          orgName: orgName.trim(),
          role: role.trim(), // not edited here, but persisted
          joinOrgCode: joinOrgCode.trim(),
          department: department.trim(),
          inviteCode: inviteCode.trim(),
        },
        { merge: true }
      );

      setEditingField(null);
      goHome();
    } catch (e) {
      console.error(e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-card">
          <p>Loading account…</p>
        </div>
      </div>
    );
  }

  // local edit helpers (edit panel only updates local state)
  const openEditor = (fieldKey, label, currentValue) => {
    setEditingField(fieldKey);
    setEditLabel(label);
    setEditDraft(currentValue || "");
  };

  const closeEditor = () => {
    setEditingField(null);
    setEditLabel("");
    setEditDraft("");
  };

  const applyEditor = () => {
    switch (editingField) {
      case "name":
        setDisplayName(editDraft);
        break;
      case "org":
        setOrgName(editDraft);
        break;
      case "joinOrgCode":
        setJoinOrgCode(editDraft);
        break;
      case "department":
        setDepartment(editDraft);
        break;
      case "inviteCode":
        setInviteCode(editDraft);
        break;
      default:
        break;
    }
    closeEditor();
  };

  const handleRoleClick = () => {
    alert(
      "To change roles, please contact a site administrator or your organization manager."
    );
  };

  const generateInviteCode = () => {
    if (!inviteCode) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      setInviteCode(code);
    }
    openEditor("inviteCode", "Invite Code", inviteCode || "");
  };

  return (
    <div className="account-page">
      <div className="account-card">
        <h1>Account</h1>
        <p className="muted">
          View and update your account information. More settings coming soon.
        </p>

        {error && <p className="error">{error}</p>}

        {/* 3×2 responsive grid of tiles */}
        <div className="account-grid">
          <AccountTile
            title="Name"
            subtitle={displayName || "Tap to add your name"}
            onClick={() => openEditor("name", "Name", displayName)}
          />

          <AccountTile
            title="Email"
            subtitle={email || "No email on file"}
            clickable={false}
            center={true}
          />

          <AccountTile
            title="Organization"
            subtitle={orgName || "Tap to add an organization"}
            onClick={() => openEditor("org", "Organization", orgName)}
          />

          <AccountTile
            title="Role"
            subtitle={role || "Role not set (contact administrator)"}
            onClick={handleRoleClick}
          />

          {!isCoordinator && (
            <AccountTile
              title="Join Organization (invite code)"
              subtitle={
                joinOrgCode || "Tap to enter an invite code from your manager"
              }
              onClick={() =>
                openEditor(
                  "joinOrgCode",
                  "Join Organization (invite code)",
                  joinOrgCode
                )
              }
            />
          )}

          {isCoordinator && (
            <AccountTile
              title="Create Invite Code"
              subtitle={
                hasOrg
                  ? inviteCode
                    ? `Invite code: ${inviteCode}`
                    : "Tap to generate an invite code for your organization"
                  : "Add an organization before creating an invite code"
              }
              onClick={hasOrg ? generateInviteCode : undefined}
              clickable={hasOrg}
            />
          )}

          <AccountTile
            title="Department / Team"
            subtitle={
              department || "Tap to add your department or team (optional)"
            }
            onClick={() =>
              openEditor("department", "Department / Team", department)
            }
          />
        </div>

        {/* Edit panel – updates local state only */}
        {editingField && (
          <div className="edit-panel">
            <h2>Edit {editLabel}</h2>
            <input
              type="text"
              className="edit-input"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
            />
            <div className="row edit-buttons">
              <button
                type="button"
                className="btn primary"
                onClick={applyEditor}
              >
                Save
              </button>
              <button
                type="button"
                className="btn"
                onClick={closeEditor}
              >
                Cancel
              </button>
            </div>
            <p className="edit-hint">
              Changes here update this page only. To save them to your account,
              use the main Save button below.
            </p>
          </div>
        )}

        <div className="row buttons-row">
          <button
            className="btn primary"
            onClick={handleSaveToFirestore}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="btn" onClick={goHome} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
