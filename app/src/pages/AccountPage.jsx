import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../auth/firebase";
import { regenerateOrgJoinCode } from "../auth/userProfile";
import AccountTile from "../components/AccountTile";
import "./AccountPage.css";

function Modal({ title, value, setValue, onCancel, onSave, saving, type = "text" }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <input
          className="modal-input"
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const goHome = () => navigate("/", { replace: true });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(""); // auth email display
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  const [orgId, setOrgId] = useState("");
  const [orgJoinCode, setOrgJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState(""); // "name" | "email" | "orgName" | "department"
  const [modalTitle, setModalTitle] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalType, setModalType] = useState("text");

  const normalizedRole = (role || "").toLowerCase();
  const isCoordinator = normalizedRole === "coordinator" || normalizedRole === "manager";
  const isParticipant = normalizedRole === "participant";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setError("");

        // Load user profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setDisplayName(data.displayName || user.displayName || "");
          setOrgName(data.orgName || "");
          setRole(data.role || "");
          setDepartment(data.department || "");

          const foundOrgId = data.orgId || "";
          setOrgId(foundOrgId);

          // Load joinCode from org doc (source of truth)
          if (foundOrgId) {
            const orgRef = doc(db, "orgs", foundOrgId);
            const orgSnap = await getDoc(orgRef);
            setOrgJoinCode(orgSnap.exists() ? (orgSnap.data().joinCode || "") : "");
          } else {
            setOrgJoinCode("");
          }
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

  const openModal = (field) => {
    setError("");
    setCopied(false);

    setModalField(field);
    setModalOpen(true);

    if (field === "name") {
      setModalTitle("Edit Name");
      setModalValue(displayName);
      setModalType("text");
    } else if (field === "orgName") {
      setModalTitle("Edit Organization Name");
      setModalValue(orgName);
      setModalType("text");
    } else if (field === "department") {
      setModalTitle("Edit Department / Team");
      setModalValue(department);
      setModalType("text");
    }
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
    setModalField("");
    setModalTitle("");
    setModalValue("");
  };

  const saveModal = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setBusy(true);
    setError("");

    try {
      const trimmed = modalValue.trim();

      // Update local UI state
      if (modalField === "name") setDisplayName(trimmed);
      if (modalField === "orgName") setOrgName(trimmed);
      if (modalField === "department") setDepartment(trimmed);

      // Persist to Firestore profile
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          displayName: modalField === "name" ? trimmed : displayName.trim(),
          orgName: modalField === "orgName" ? trimmed : orgName.trim(),
          department: modalField === "department" ? trimmed : department.trim(),
        },
        { merge: true }
      );

      closeModal();
    } catch (e) {
      const msg =
        e?.message === "EMAIL_UPDATE_REQUIRES_RELOGIN"
          ? "Email change requires re-login. Sign out and sign back in, then try again."
          : e?.message === "EMAIL_REQUIRED"
          ? "Please enter an email."
          : "Failed to save changes.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const copyOrgJoinCode = async () => {
    if (!orgJoinCode) return;
    try {
      await navigator.clipboard.writeText(orgJoinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const regenJoinCode = async () => {
    if (!orgId) return;
    setBusy(true);
    setError("");

    try {
      const newCode = await regenerateOrgJoinCode(orgId);
      setOrgJoinCode(newCode);
    } catch (e) {
      console.error(e);
      setError("Failed to generate a new join code.");
    } finally {
      setBusy(false);
    }
  };

  const joinCodeSubtitle = useMemo(() => {
    if (!orgId) return "No organization linked.";
    if (!orgJoinCode) return "No join code yet. Click Regenerate.";
    return `Join code: ${orgJoinCode} (${copied ? "copied!" : "click to copy"})`;
  }, [orgId, orgJoinCode, copied]);

  const handleRoleClick = () => {
    alert("Role changes are managed by the organization.");
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

  return (
    <div className="account-page">
      <div className="account-card">
        <h1>Account</h1>
        <p className="muted">View and update your account information.</p>

        {error && <p className="error">{error}</p>}

        <div className="account-grid">
          <AccountTile
            title="Name"
            subtitle={displayName || "Tap to set your name"}
            onClick={() => openModal("name")}
          />

          <AccountTile
            title="Email"
            subtitle={email || "No email on file"}
            clickable={false}
            center
          />

          <AccountTile
            title="Organization"
            subtitle={orgName || "Organization not set"}
            onClick={isCoordinator ? () => openModal("orgName") : undefined}
            clickable={isCoordinator}
            center={!isCoordinator}
          />

          <AccountTile
            title="Role"
            subtitle={role || "Role not set"}
            onClick={handleRoleClick}
          />

          {/* Coordinator-only join code + regen */}
          {isCoordinator && (
            <AccountTile
              title="Organization Join Code"
              subtitle={joinCodeSubtitle}
              onClick={orgJoinCode ? copyOrgJoinCode : undefined}
              clickable={!!orgJoinCode}
            />
          )}

          <AccountTile
            title="Department / Team"
            subtitle={department || "Tap to add department/team (optional)"}
            onClick={() => openModal("department")}
          />
        </div>

        {/* Coordinator: regen button + video */}
        {isCoordinator && (
          <>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button className="btn" onClick={regenJoinCode} disabled={busy || !orgId}>
                {busy ? "Working…" : "Regenerate Join Code"}
              </button>
              <button className="btn primary" onClick={goHome} disabled={busy}>
                Done
              </button>
            </div>

            <div style={{ marginTop: 40, textAlign: "center" }}>
              <h2 style={{ marginBottom: 16 }}>How to invite others</h2>

              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                  overflow: "hidden",
                  maxWidth: "800px",
                  margin: "0 auto",
                  borderRadius: 12,
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="How to invite others"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                  }}
                />
              </div>

              <p className="muted" style={{ marginTop: 12 }}>
                Share your organization join code with participants. They enter it during onboarding.
              </p>
            </div>
          </>
        )}

        {/* Participant: no video */}
        {isParticipant && (
          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={goHome} disabled={busy}>
              Done
            </button>
          </div>
        )}

        {modalOpen && (
          <Modal
            title={modalTitle}
            value={modalValue}
            setValue={setModalValue}
            onCancel={closeModal}
            onSave={saveModal}
            saving={busy}
            type={modalType}
          />
        )}
      </div>
    </div>
  );
}