// src/pages/TeamManagement.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import "./TeamManagement.css";

const TABS = [
  { key: "members", label: "Members" },
  { key: "training", label: "Training" },
  { key: "attestations", label: "Attestations" },
  { key: "insights", label: "Insights" },
];

export default function TeamManagement() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("members");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Placeholder stats (wire later)
  const stats = useMemo(
    () => [
      { label: "Total Members", value: "—" },
      { label: "Coordinators", value: "—" },
      { label: "Participants", value: "—" },
      { label: "Join Code", value: "—" },
    ],
    []
  );

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
            onClick={() => alert("Under construction: for now, share the Join Code from Account to add members.")}
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
            className="tm-btn tm-btn-danger-soft"
            onClick={() => alert("Export CSV feature coming soon")}
          >
            Export CSV
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

      {/* Stats */}
      <div className="tm-stats">
        {stats.map((s) => (
          <div key={s.label} className="tm-stat">
            <div className="tm-stat-label">{s.label}</div>
            <div className="tm-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tm-tab ${tab === t.key ? "tm-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
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
        {tab === "attestations" && <AttestationsPanel />}
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
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Placeholder rows (wire later)
  const rows = [
    {
      id: "u1",
      name: "Alex Rivera",
      email: "alex@example.com",
      role: "participant",
      status: "active",
      training: "—",
      attestations: "—",
    },
    {
      id: "u2",
      name: "Jordan Kim",
      email: "jordan@example.com",
      role: "coordinator",
      status: "active",
      training: "—",
      attestations: "—",
    },
    {
      id: "u3",
      name: "Taylor Singh",
      email: "taylor@example.com",
      role: "participant",
      status: "invited",
      training: "—",
      attestations: "—",
    },
  ];

  // Filters (placeholder logic for now)
  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
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
      </div>

      {/* Controls */}
      <div className="tm-members-controls">
        <div className="tm-search">
          <div className="tm-label">Search</div>
          <input
            className="tm-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

      {/* Table */}
      <div className="tm-table">
        <div className="tm-row tm-row-head tm-row-members">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Training</div>
          <div>Attestations</div>
          <div className="tm-align-right">Actions</div>
        </div>

        {filtered.map((r) => (
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
            <div className="tm-muted">{r.attestations}</div>
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
        ))}
      </div>

      <div className="tm-hint">
        Tip: “Training” and “Attestations” will become live once we wire lesson
        tracking + attestation logs.
      </div>
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

function AttestationsPanel() {
  return (
    <div className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Saved Attestations</div>
          <div className="tm-card-sub">
            Audit history for compliance (name + timestamp + playbook +
            responses).
          </div>
        </div>

        <button
          type="button"
          className="tm-btn tm-btn-ghost"
          onClick={() => alert("Wire filters/export later")}
        >
          Filters / Export
        </button>
      </div>

      <div className="tm-empty">
        No attestations found yet. When a user submits an attestation, it will
        appear here.
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
            Dashboard view of training adoption and compliance activity (wire data next).
          </div>
        </div>
      </div>

      <div className="tm-empty">
        Placeholder: charts + summary stats will appear here once data is connected.
      </div>
    </div>
  );
}

/* ---------------- Drawer ---------------- */

function RightDrawer({ open, title, onClose, children }) {
  const closeBtnRef = React.useRef(null);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Focus close button when opening
  React.useEffect(() => {
    if (open) {
      // next tick so element exists
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
          <div className="tm-v">—</div>
        </div>
        <div className="tm-kv">
          <div className="tm-k">In progress</div>
          <div className="tm-v">—</div>
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