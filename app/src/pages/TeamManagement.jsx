// src/pages/TeamManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import ContentPanel from "../components/ContentPanel";
import AttestationsList from "../components/AttestationsList";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import "./TeamManagement.css";

const TABS = [
  { key: "members", label: "Members" },
  { key: "training", label: "Training" },
  { key: "attestations", label: "Attestations" },
  { key: "insights", label: "Insights" },
];

// --- helpers ---
function isValidTabKey(key) {
  return TABS.some((t) => t.key === key);
}

function getInitialTabFromSearchParams(searchParams) {
  const raw = (searchParams.get("tab") || "").trim();
  if (isValidTabKey(raw)) return raw;
  return "members";
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename, rows) {
  const csvContent = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function getTrainingCounts(userData) {
  const completed =
    userData?.trainingCompletedCount ??
    userData?.training?.completedCount ??
    userData?.training?.completed ??
    0;

  const total =
    userData?.trainingTotalCount ??
    userData?.training?.totalCount ??
    userData?.training?.total ??
    0;

  return {
    completed: Number.isFinite(Number(completed)) ? Number(completed) : 0,
    total: Number.isFinite(Number(total)) ? Number(total) : 0,
  };
}

function formatTrainingSummary(userData) {
  const { completed, total } = getTrainingCounts(userData);
  return `${completed} / ${total} complete`;
}

export default function TeamManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(() => getInitialTabFromSearchParams(searchParams));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const next = getInitialTabFromSearchParams(searchParams);
    setTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  }

  return (
    <ContentPanel>
      {/* Header */}
      <div className="tm-head">
        <div className="tm-head-left">
          <h2 className="tm-title">Team Management</h2>
          <p className="tm-sub">
            Manage members, view training progress, and review saved attestations.
          </p>
        </div>

        <div className="tm-head-right">
          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={() =>
              alert(
                "Under construction: for now, share the Join Code from Account to add members."
              )
            }
          >
            + Invite Member
          </button>

          <button
            type="button"
            className="tm-btn tm-btn-ghost"
            onClick={() => navigate("/account")}
          >
            Get Join Code
          </button>

          <button
            type="button"
            className="tm-btn tm-btn-link"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tm-tab ${tab === t.key ? "tm-tab-active" : ""}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="tm-panel">
        {tab === "members" && (
          <MembersPanel
            onManage={(member) => {
              setSelectedMember(member);
              setDrawerOpen(true);
            }}
          />
        )}

        {tab === "training" && <TrainingPanel />}
        {tab === "attestations" && <AttestationsList />}
        {tab === "insights" && <InsightsPanel />}
      </div>

      {/* Drawer */}
      <RightDrawer
        open={drawerOpen}
        title="Member Details"
        onClose={() => setDrawerOpen(false)}
      >
        <MemberDetails member={selectedMember} />
      </RightDrawer>
    </ContentPanel>
  );
}

function MembersPanel({ onManage }) {
  const { orgId, role, orgName } = useUser();

  const [queryText, setQueryText] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  useEffect(() => {
    async function loadMembers() {
      if (!orgId) {
        setRows([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const q = query(collection(db, "users"), where("orgId", "==", orgId));
        const snap = await getDocs(q);

        const members = snap.docs.map((memberDoc) => {
          const d = memberDoc.data();

          const normalizedRole =
            d.role === "coordinator" ? "coordinator" : "participant";

          const normalizedStatus =
            d.status === "invited" || d.status === "disabled" || d.status === "active"
              ? d.status
              : "active";

          return {
            id: memberDoc.id,
            name: d.displayName || d.name || "—",
            email: d.email || "—",
            role: normalizedRole,
            status: normalizedStatus,
            training: formatTrainingSummary(d),
            trainingCompleted:
              d?.trainingCompletedCount ??
              d?.training?.completedCount ??
              d?.training?.completed ??
              0,
            trainingTotal:
              d?.trainingTotalCount ??
              d?.training?.totalCount ??
              d?.training?.total ??
              0,
          };
        });

        members.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setRows(members);
      } catch (err) {
        console.error("Failed to load members", err);
        setError("Could not load organization members.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [orgId]);

  const filtered = rows.filter((r) => {
    const q = queryText.trim().toLowerCase();

    const matchesQuery =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || r.role === roleFilter;
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  const activeCount = rows.filter((r) => r.status === "active").length;
  const invitedCount = rows.filter((r) => r.status === "invited").length;

  function handleExportMembersCsv() {
    if (role !== "coordinator") {
      alert("Only coordinators can export member data.");
      return;
    }

    const header = ["Name", "Email", "Role", "Status", "Training"];
    const body = filtered.map((member) => [
      member.name,
      member.email,
      member.role,
      member.status,
      member.training,
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const safeOrgName = (orgName || "organization")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    downloadCsv(`${safeOrgName}-members-${today}.csv`, [header, ...body]);
  }

  return (
    <div className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Organization Members</div>
          <div className="tm-card-sub">
            View who’s in your organization, manage roles, and monitor basic
            progress signals.
          </div>
        </div>

        {role === "coordinator" && (
          <button
            type="button"
            className="tm-btn tm-btn-danger-soft"
            onClick={handleExportMembersCsv}
            disabled={loading || filtered.length === 0}
            title={
              filtered.length === 0
                ? "No filtered members to export"
                : "Export the currently filtered member list"
            }
          >
            Export Filtered CSV
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="tm-members-controls">
        <div className="tm-search">
          <div className="tm-label">Search</div>
          <input
            className="tm-input"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search name or email…"
          />
        </div>

        <div className="tm-filter">
          <div className="tm-label">Role</div>
          <select
            className="tm-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="coordinator">Coordinator</option>
            <option value="participant">Participant</option>
          </select>
        </div>

        <div className="tm-filter">
          <div className="tm-label">Status</div>
          <select
            className="tm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="tm-mini">
          <div className="tm-label">Quick</div>
          <div className="tm-mini-row">
            <span className="tm-mini-pill">Active: {activeCount}</span>
            <span className="tm-mini-pill">Invited: {invitedCount}</span>
          </div>
        </div>
      </div>

      {loading && <div className="tm-empty">Loading members...</div>}
      {!loading && error && <div className="tm-empty">{error}</div>}

      {!loading && !error && (
        <>
          <div className="tm-table">
            <div className="tm-row tm-row-head tm-row-members">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Training</div>
              <div className="tm-align-right">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="tm-empty">No members matched your search.</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="tm-row tm-row-members">
                  <div className="tm-strong">{r.name}</div>
                  <div className="tm-muted">{r.email}</div>
                  <div>
                    <span className="tm-pill">{r.role}</span>
                  </div>
                  <div>
                    <span className="tm-pill">{r.status}</span>
                  </div>
                  <div className="tm-muted">{r.training}</div>
                  <div className="tm-align-right">
                    <button
                      type="button"
                      className="tm-link"
                      onClick={() => onManage(r)}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="tm-hint">
            Tip: the export downloads only the members currently visible under your
            active search and filters.
          </div>
        </>
      )}
    </div>
  );
}

function TrainingPanel() {
  return (
    <div className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Training Progress</div>
          <div className="tm-card-sub">
            Show lesson completion per member and per module (placeholder now).
          </div>
        </div>
      </div>

      <div className="tm-empty">
        Nothing yet. Once lessons completion tracking is wired, you’ll see
        progress here.
      </div>
    </div>
  );
}

function InsightsPanel() {
  return (
    <div className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Insights</div>
          <div className="tm-card-sub">
            Dashboard view of training adoption and compliance activity (wire
            data next).
          </div>
        </div>
      </div>

      <div className="tm-empty">
        Placeholder: charts + summary stats will appear here once data is
        connected.
      </div>
    </div>
  );
}

/* ---------------- Drawer ---------------- */

function RightDrawer({ open, title, onClose, children }) {
  const closeBtnRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="tm-drawer-overlay"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="tm-drawer"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
      >
        <div className="tm-drawer-head">
          <div className="tm-drawer-title">{title}</div>

          <button
            ref={closeBtnRef}
            type="button"
            className="tm-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="tm-drawer-body">{children}</div>
      </div>
    </div>
  );
}

function MemberDetails({ member }) {
  if (!member) {
    return <div className="tm-empty">Select a member to view details.</div>;
  }

  const prettyRole =
    member.role === "coordinator" ? "Coordinator" : "Participant";

  return (
    <div className="tm-member">
      <div className="tm-member-top">
        <div className="tm-avatar" aria-hidden="true">
          {member.name?.[0] || "?"}
        </div>

        <div className="tm-member-meta">
          <div className="tm-member-name">{member.name}</div>
          <div className="tm-member-email">{member.email}</div>
          <div className="tm-member-badges">
            <span className="tm-badge">{prettyRole}</span>
            <span className="tm-badge tm-badge-muted">{member.status}</span>
          </div>
        </div>
      </div>

      <div className="tm-divider" />

      <div className="tm-section">
        <div className="tm-section-title">Quick Actions</div>

        <div className="tm-action-grid">
          <button
            type="button"
            className="tm-btn tm-btn-ghost"
            onClick={() => alert("Promote/demote later")}
          >
            Change Role
          </button>

          <button
            type="button"
            className="tm-btn tm-btn-ghost"
            onClick={() => alert("Disable/enable later")}
          >
            Disable Member
          </button>

          <button
            type="button"
            className="tm-btn tm-btn-ghost"
            onClick={() => alert("View attestations later")}
          >
            View Attestations
          </button>
        </div>
      </div>

      <div className="tm-section">
        <div className="tm-section-title">Training</div>
        <div className="tm-kv">
          <div className="tm-k">Completed</div>
          <div className="tm-v">{member.trainingCompleted ?? 0}</div>
        </div>
        <div className="tm-kv">
          <div className="tm-k">Total assigned</div>
          <div className="tm-v">{member.trainingTotal ?? 0}</div>
        </div>
        <div className="tm-kv">
          <div className="tm-k">Summary</div>
          <div className="tm-v">{member.training}</div>
        </div>
      </div>

      <div className="tm-section">
        <div className="tm-section-title">Attestations</div>
        <div className="tm-kv">
          <div className="tm-k">Last submission</div>
          <div className="tm-v">—</div>
        </div>
        <div className="tm-kv">
          <div className="tm-k">Total submissions</div>
          <div className="tm-v">—</div>
        </div>
      </div>
    </div>
  );
}