import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import ContentPanel from "../components/ContentPanel";
import AttestationsList from "../components/AttestationsList";
import ParticipantTrainingPanel from "../components/ParticipantTrainingPanel";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import moduleRegistry from "../learningContent/moduleRegistry.json";
import "./TeamManagement.css";

const COORDINATOR_TABS = [
  { key: "members", label: "Members" },
  { key: "training", label: "Training" },
  { key: "attestations", label: "Attestations" },
  { key: "insights", label: "Insights" },
];

const PARTICIPANT_TABS = [{ key: "training", label: "Training Dashboard" }];

const CATEGORY_META = {
  general: {
    label: "General",
    className: "tm-module-category-general",
  },
  education: {
    label: "Education",
    className: "tm-module-category-education",
  },
  small_business: {
    label: "Small Business",
    className: "tm-module-category-small-business",
  },
  local_gov: {
    label: "Local Government",
    className: "tm-module-category-local-government",
  },
};

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

function getStatusMeta(status) {
  switch (status) {
    case "completed":
      return { symbol: "✓", className: "tm-status-completed", label: "Completed" };
    case "in_progress":
      return { symbol: "◐", className: "tm-status-in-progress", label: "In Progress" };
    case "not_started":
    default:
      return { symbol: "—", className: "tm-status-not-started", label: "Not Started" };
  }
}

function getMatrixSummary(rows, modules) {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  rows.forEach((row) => {
    modules.forEach((module) => {
      const status = row.statuses?.[module.id] || "not_started";
      if (status === "completed") completed += 1;
      else if (status === "in_progress") inProgress += 1;
      else notStarted += 1;
    });
  });

  return { completed, inProgress, notStarted };
}

function normalizeRole(rawRole) {
  return rawRole === "coordinator" ? "coordinator" : "participant";
}

function normalizeStatus(rawStatus) {
  return rawStatus === "invited" || rawStatus === "disabled" || rawStatus === "active"
    ? rawStatus
    : "active";
}

function getAllRegistryModules() {
  const registryModules = moduleRegistry.modules || [];

  return registryModules.map((module) => ({
    id: module.moduleId,
    label: module.title,
    shortLabel: module.shortLabel || module.title || module.moduleId,
    description: module.synopsis || "",
    category: module.category || "general",
    allowedOrgTypes: module.allowedOrgTypes || ["all"],
  }));
}

function canAccessByOrgType(module, orgType) {
  const allowed = (module.allowedOrgTypes || []).map((value) =>
    String(value).toLowerCase()
  );
  const normalizedOrgType = String(orgType || "").toLowerCase();

  if (allowed.includes("all")) return true;
  if (!normalizedOrgType) return false;

  return allowed.includes(normalizedOrgType);
}

function getVisibleModulesForMode({ allModules, trainingMode, activeCampaign, orgType }) {
  if (trainingMode === "controlled") {
    const assignedIds = Array.isArray(activeCampaign?.moduleIds)
      ? activeCampaign.moduleIds
      : [];

    return allModules.filter((module) => assignedIds.includes(module.id));
  }

  return allModules.filter((module) => canAccessByOrgType(module, orgType));
}

async function loadTrainingProgressForUser(userId, visibleModules) {
  const progressEntries = await Promise.all(
    visibleModules.map(async (module) => {
      const progressRef = doc(db, "users", userId, "trainingProgress", module.id);
      const progressSnap = await getDoc(progressRef);

      if (!progressSnap.exists()) {
        return [module.id, "not_started"];
      }

      const progressData = progressSnap.data() || {};
      const rawStatus = progressData.status;

      if (
        rawStatus === "completed" ||
        rawStatus === "in_progress" ||
        rawStatus === "not_started"
      ) {
        return [module.id, rawStatus];
      }

      if (progressData.completed === true) {
        return [module.id, "completed"];
      }

      if ((progressData.percentComplete || 0) > 0) {
        return [module.id, "in_progress"];
      }

      return [module.id, "not_started"];
    })
  );

  return Object.fromEntries(progressEntries);
}

function getAllowedTabs(isCoordinator) {
  return isCoordinator ? COORDINATOR_TABS : PARTICIPANT_TABS;
}

function getSafeTab(searchParams, isCoordinator) {
  const allowedTabs = getAllowedTabs(isCoordinator);
  const allowedKeys = allowedTabs.map((t) => t.key);
  const raw = (searchParams.get("tab") || "").trim();

  if (allowedKeys.includes(raw)) return raw;
  return isCoordinator ? "members" : "training";
}

function getPreparednessLabel(percentCompleted) {
  if (percentCompleted >= 85) {
    return {
      title: "Strong coverage",
      description: "Most assigned training has been completed across your organization.",
      tone: "good",
    };
  }

  if (percentCompleted >= 60) {
    return {
      title: "Improving coverage",
      description: "Training progress is moving in the right direction, but some gaps remain.",
      tone: "medium",
    };
  }

  if (percentCompleted >= 30) {
    return {
      title: "Moderate risk",
      description: "A meaningful portion of the organization still needs training attention.",
      tone: "warning",
    };
  }

  return {
    title: "Needs attention",
    description: "Training coverage is currently low and follow-up is recommended.",
    tone: "danger",
  };
}

export default function TeamManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, role: contextRole } = useUser();

  const role = profile?.role || contextRole || "participant";
  const isCoordinator = role === "coordinator";
  const tabs = useMemo(() => getAllowedTabs(isCoordinator), [isCoordinator]);

  const [tab, setTab] = useState(() => getSafeTab(searchParams, isCoordinator));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const next = getSafeTab(searchParams, isCoordinator);
    setTab((prev) => (prev === next ? prev : next));
  }, [searchParams, isCoordinator]);

  useEffect(() => {
    const safeTab = getSafeTab(searchParams, isCoordinator);
    const currentParam = (searchParams.get("tab") || "").trim();

    if (currentParam !== safeTab) {
      setSearchParams({ tab: safeTab }, { replace: true });
    }
  }, [searchParams, setSearchParams, isCoordinator]);

  useEffect(() => {
    if (!isCoordinator && drawerOpen) {
      setDrawerOpen(false);
      setSelectedMember(null);
    }
  }, [isCoordinator, drawerOpen]);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  }

  return (
    <ContentPanel>
      <div className="tm-head">
        <div className="tm-head-left">
          <h2 className="tm-title">
            {isCoordinator ? "Team Management" : "Training Dashboard"}
          </h2>
          <p className="tm-sub">
            {isCoordinator
              ? "Manage members, view training progress, and review saved attestations."
              : "View your assigned lessons and current progress."}
          </p>
        </div>

        <div className="tm-head-right">
          {isCoordinator && (
            <>
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
            </>
          )}

          <button
            type="button"
            className="tm-btn tm-btn-link"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>
        </div>
      </div>

      <div className="tm-tabs">
        {tabs.map((t) => (
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

      <div className="tm-panel">
        {tab === "members" && isCoordinator && (
          <MembersPanel
            onManage={(member) => {
              setSelectedMember(member);
              setDrawerOpen(true);
            }}
          />
        )}

        {tab === "training" &&
          (isCoordinator ? <TrainingPanel /> : <ParticipantTrainingPanel />)}

        {tab === "attestations" && isCoordinator && <AttestationsList />}
        {tab === "insights" && isCoordinator && <InsightsPanel />}
      </div>

      {isCoordinator && (
        <RightDrawer
          open={drawerOpen}
          title="Member Details"
          onClose={() => setDrawerOpen(false)}
        >
          <MemberDetails member={selectedMember} />
        </RightDrawer>
      )}
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

          return {
            id: memberDoc.id,
            name: d.displayName || d.name || "—",
            email: d.email || "—",
            role: normalizeRole(d.role),
            status: normalizeStatus(d.status),
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
      !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);

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
  const { orgId, orgType = "education" } = useUser();

  const [queryText, setQueryText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [trainingMode, setTrainingMode] = React.useState("organization");
  const [activeCampaign, setActiveCampaign] = React.useState(null);

  const allModules = React.useMemo(() => getAllRegistryModules(), []);

  const visibleModules = React.useMemo(() => {
    return getVisibleModulesForMode({
      allModules,
      trainingMode,
      activeCampaign,
      orgType,
    });
  }, [allModules, trainingMode, activeCampaign, orgType]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrainingRows() {
      if (!orgId) {
        if (isMounted) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError("");
        }

        const settingsRef = doc(db, "orgs", orgId, "settings", "training");
        const settingsSnap = await getDoc(settingsRef);

        let mode = "organization";

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data() || {};
          mode = settingsData.trainingMode || "organization";
        }

        let campaign = null;

        if (mode === "controlled") {
          const playbooksRef = collection(db, "orgs", orgId, "playbooks");
          const playbooksQuery = query(playbooksRef, where("isActive", "==", true));
          const playbooksSnap = await getDocs(playbooksQuery);

          if (!playbooksSnap.empty) {
            const campaignDoc = playbooksSnap.docs[0];
            campaign = {
              id: campaignDoc.id,
              ...campaignDoc.data(),
            };
          }
        }

        const modulesForRows = getVisibleModulesForMode({
          allModules,
          trainingMode: mode,
          activeCampaign: campaign,
          orgType,
        });

        const usersQuery = query(collection(db, "users"), where("orgId", "==", orgId));
        const usersSnap = await getDocs(usersQuery);

        const participantDocs = usersSnap.docs.filter((userDoc) => {
          const d = userDoc.data() || {};
          return normalizeRole(d.role) === "participant";
        });

        const loadedRows = await Promise.all(
          participantDocs.map(async (userDoc) => {
            const d = userDoc.data();
            const statuses = await loadTrainingProgressForUser(userDoc.id, modulesForRows);

            const completed = modulesForRows.filter(
              (module) => statuses[module.id] === "completed"
            ).length;

            return {
              id: userDoc.id,
              name: d.displayName || d.name || "—",
              email: d.email || "—",
              role: normalizeRole(d.role),
              status: normalizeStatus(d.status),
              assigned: modulesForRows.length,
              completed,
              statuses,
            };
          })
        );

        loadedRows.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        if (!isMounted) return;

        setTrainingMode(mode);
        setActiveCampaign(campaign);
        setRows(loadedRows);
      } catch (err) {
        console.error("Failed to load training progress", err);

        if (!isMounted) return;

        setError("Could not load training progress.");
        setRows([]);
        setActiveCampaign(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrainingRows();

    return () => {
      isMounted = false;
    };
  }, [orgId, orgType, allModules]);

  const filteredRows = React.useMemo(() => {
    const q = queryText.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusFilter === "all") return true;

      return visibleModules.some(
        (module) => (row.statuses?.[module.id] || "not_started") === statusFilter
      );
    });
  }, [rows, queryText, statusFilter, visibleModules]);

  const summary = React.useMemo(
    () => getMatrixSummary(filteredRows, visibleModules),
    [filteredRows, visibleModules]
  );

  return (
    <div className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Training Progress</div>
          <div className="tm-card-sub">
            View lesson completion across your organization by learner and module.
          </div>
        </div>
      </div>

      <div className="tm-training-summary">
        <div className="tm-training-stat">
          <div className="tm-training-stat-value">{filteredRows.length}</div>
          <div className="tm-training-stat-label">Learners shown</div>
        </div>

        <div className="tm-training-stat">
          <div className="tm-training-stat-value">{visibleModules.length}</div>
          <div className="tm-training-stat-label">Modules shown</div>
        </div>

        <div className="tm-training-stat">
          <div className="tm-training-stat-value">{summary.completed}</div>
          <div className="tm-training-stat-label">Completed cells</div>
        </div>

        <div className="tm-training-stat">
          <div className="tm-training-stat-value">{summary.inProgress}</div>
          <div className="tm-training-stat-label">In progress cells</div>
        </div>

        <div className="tm-training-stat">
          <div className="tm-training-stat-value">{summary.notStarted}</div>
          <div className="tm-training-stat-label">Not started cells</div>
        </div>
      </div>

      <div className="tm-training-toolbar">
        <div className="tm-training-toolbar-left">
          <div className="tm-training-control">
            <div className="tm-label">Search Learner</div>
            <input
              className="tm-input"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search learner name…"
            />
          </div>

          <div className="tm-training-control tm-training-control-small">
            <div className="tm-label">Status Filter</div>
            <select
              className="tm-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
        </div>

        <div className="tm-training-legend-wrap">
          <div className="tm-training-legend">
            <span className="tm-legend-item">
              <span className="tm-legend-dot tm-legend-completed" />
              Completed
            </span>
            <span className="tm-legend-item">
              <span className="tm-legend-dot tm-legend-progress" />
              In Progress
            </span>
            <span className="tm-legend-item">
              <span className="tm-legend-dot tm-legend-not-started" />
              Not Started
            </span>
          </div>

          <div className="tm-module-legend">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <span key={key} className="tm-module-legend-item">
                <span className={`tm-module-legend-swatch ${meta.className}`} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="tm-empty">Loading training progress...</div>}
      {!loading && error && <div className="tm-empty">{error}</div>}

      {!loading && !error && (
        <>
          <div className="tm-training-scroll">
            <table className="tm-training-table">
              <thead>
                <tr>
                  <th className="tm-training-col-learner tm-training-th-sticky-left-1">
                    Learner
                  </th>
                  <th className="tm-training-col-progress tm-training-th-sticky-left-2">
                    Progress
                  </th>

                  {visibleModules.map((module) => {
                    const categoryMeta =
                      CATEGORY_META[module.category] || CATEGORY_META.general;

                    return (
                      <th
                        key={module.id}
                        title={module.label}
                        className={`tm-training-module-th ${categoryMeta.className}`}
                      >
                        <div className="tm-training-module-head">
                          <span className="tm-training-module-short">
                            {module.shortLabel}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2 + visibleModules.length}
                      className="tm-training-empty-cell"
                    >
                      No learners matched your training filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td
                        className="tm-training-learner-cell tm-training-td-sticky-left-1"
                        title={row.name}
                      >
                        <div className="tm-training-learner-name">{row.name}</div>
                      </td>

                      <td className="tm-training-progress-cell tm-training-td-sticky-left-2">
                        <span className="tm-training-progress-pill">
                          {row.completed}/{row.assigned}
                        </span>
                      </td>

                      {visibleModules.map((module) => {
                        const status = row.statuses?.[module.id] || "not_started";
                        const meta = getStatusMeta(status);

                        return (
                          <td
                            key={`${row.id}-${module.id}`}
                            className="tm-training-status-cell"
                            title={`${row.name} — ${module.label}: ${meta.label}`}
                          >
                            <span className={`tm-status-badge ${meta.className}`}>
                              {meta.symbol}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="tm-hint">
            The Training tab follows the same assignment logic as Lessons:
            organization-based mode shows general plus org-specific lessons, and
            controlled mode shows only the active campaign’s selected modules.
          </div>
        </>
      )}
    </div>
  );
}

function InsightsPanel() {
  const { orgId, orgType = "education" } = useUser();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [trainingMode, setTrainingMode] = React.useState("organization");
  const [activeCampaign, setActiveCampaign] = React.useState(null);

  const allModules = React.useMemo(() => getAllRegistryModules(), []);

  const visibleModules = React.useMemo(() => {
    return getVisibleModulesForMode({
      allModules,
      trainingMode,
      activeCampaign,
      orgType,
    });
  }, [allModules, trainingMode, activeCampaign, orgType]);

  useEffect(() => {
    let isMounted = true;

    async function loadInsightsRows() {
      if (!orgId) {
        if (isMounted) {
          setRows([]);
          setLoading(false);
          setError("No organization found.");
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError("");
        }

        const settingsRef = doc(db, "orgs", orgId, "settings", "training");
        const settingsSnap = await getDoc(settingsRef);

        let mode = "organization";

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data() || {};
          mode = settingsData.trainingMode || "organization";
        }

        let campaign = null;

        if (mode === "controlled") {
          const playbooksRef = collection(db, "orgs", orgId, "playbooks");
          const playbooksQuery = query(playbooksRef, where("isActive", "==", true));
          const playbooksSnap = await getDocs(playbooksQuery);

          if (!playbooksSnap.empty) {
            const campaignDoc = playbooksSnap.docs[0];
            campaign = {
              id: campaignDoc.id,
              ...campaignDoc.data(),
            };
          }
        }

        const modulesForRows = getVisibleModulesForMode({
          allModules,
          trainingMode: mode,
          activeCampaign: campaign,
          orgType,
        });

        const usersQuery = query(collection(db, "users"), where("orgId", "==", orgId));
        const usersSnap = await getDocs(usersQuery);

        const participantDocs = usersSnap.docs.filter((userDoc) => {
          const d = userDoc.data() || {};
          return normalizeRole(d.role) === "participant";
        });

        const loadedRows = await Promise.all(
          participantDocs.map(async (userDoc) => {
            const d = userDoc.data();
            const statuses = await loadTrainingProgressForUser(userDoc.id, modulesForRows);

            const completed = modulesForRows.filter(
              (module) => statuses[module.id] === "completed"
            ).length;

            const inProgress = modulesForRows.filter(
              (module) => statuses[module.id] === "in_progress"
            ).length;

            const notStarted = Math.max(
              modulesForRows.length - completed - inProgress,
              0
            );

            return {
              id: userDoc.id,
              name: d.displayName || d.name || "—",
              email: d.email || "—",
              assigned: modulesForRows.length,
              completed,
              inProgress,
              notStarted,
              statuses,
            };
          })
        );

        loadedRows.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        if (!isMounted) return;

        setTrainingMode(mode);
        setActiveCampaign(campaign);
        setRows(loadedRows);
      } catch (err) {
        console.error("Failed to load insights", err);

        if (!isMounted) return;

        setError("Could not load insights.");
        setRows([]);
        setActiveCampaign(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInsightsRows();

    return () => {
      isMounted = false;
    };
  }, [orgId, orgType, allModules]);

  const totalLearners = rows.length;
  const totalModules = visibleModules.length;
  const totalAssignedCells = totalLearners * totalModules;

  const completionSummary = useMemo(
    () => getMatrixSummary(rows, visibleModules),
    [rows, visibleModules]
  );

  const percentCompleted =
    totalAssignedCells > 0
      ? Math.round((completionSummary.completed / totalAssignedCells) * 100)
      : 0;

  const percentInProgress =
    totalAssignedCells > 0
      ? Math.round((completionSummary.inProgress / totalAssignedCells) * 100)
      : 0;

  const percentNotStarted =
    totalAssignedCells > 0
      ? Math.max(100 - percentCompleted - percentInProgress, 0)
      : 0;

  const preparedness = getPreparednessLabel(percentCompleted);

  const learnerNeedsSupport = useMemo(() => {
    return [...rows]
      .sort((a, b) => {
        const aPercent = a.assigned > 0 ? a.completed / a.assigned : 0;
        const bPercent = b.assigned > 0 ? b.completed / b.assigned : 0;

        if (aPercent !== bPercent) return aPercent - bPercent;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5)
      .map((row) => ({
        ...row,
        completionPercent:
          row.assigned > 0 ? Math.round((row.completed / row.assigned) * 100) : 0,
      }));
  }, [rows]);

  const moduleAttention = useMemo(() => {
    const items = visibleModules.map((module) => {
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;

      rows.forEach((row) => {
        const status = row.statuses?.[module.id] || "not_started";
        if (status === "completed") completed += 1;
        else if (status === "in_progress") inProgress += 1;
        else notStarted += 1;
      });

      const total = rows.length;
      const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: module.id,
        label: module.label,
        completed,
        inProgress,
        notStarted,
        total,
        completionPercent,
      };
    });

    return items
      .sort((a, b) => {
        if (a.completionPercent !== b.completionPercent) {
          return a.completionPercent - b.completionPercent;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 6);
  }, [visibleModules, rows]);

  const campaignModeLabel =
    trainingMode === "controlled" ? "Controlled" : "Organization-Based";

  return (
    <div className="tm-card tm-insights-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Insights</div>
          <div className="tm-card-sub">
            A question-driven view of your organization’s training readiness.
          </div>
        </div>
      </div>

      {loading && <div className="tm-empty">Loading insights...</div>}
      {!loading && error && <div className="tm-empty">{error}</div>}

      {!loading && !error && (
        <div className="tm-insights-layout">
          <section className="tm-insight-section">
            <div className="tm-insight-question-row">
              <div>
                <h3 className="tm-insight-question">How prepared are we?</h3>
                <p className="tm-insight-answer">
                  Based on assigned training completion, your organization is currently in
                  <strong> {preparedness.title.toLowerCase()}</strong>.
                </p>
              </div>

              <div className={`tm-readiness-chip tm-readiness-chip--${preparedness.tone}`}>
                {preparedness.title}
              </div>
            </div>

            <div className="tm-insight-summary-line">
              <span>Training Mode: {campaignModeLabel}</span>
              <span>•</span>
              <span>Learners: {totalLearners}</span>
              <span>•</span>
              <span>Modules: {totalModules}</span>
              <span>•</span>
              <span>Assigned training cells: {totalAssignedCells}</span>
            </div>

            <div className="tm-insight-kpis">
              <div className="tm-insight-kpi">
                <div className="tm-insight-kpi-value">{percentCompleted}%</div>
                <div className="tm-insight-kpi-label">Completed</div>
              </div>

              <div className="tm-insight-kpi">
                <div className="tm-insight-kpi-value">{completionSummary.completed}</div>
                <div className="tm-insight-kpi-label">Completed Cells</div>
              </div>

              <div className="tm-insight-kpi">
                <div className="tm-insight-kpi-value">{completionSummary.inProgress}</div>
                <div className="tm-insight-kpi-label">In Progress</div>
              </div>

              <div className="tm-insight-kpi">
                <div className="tm-insight-kpi-value">{completionSummary.notStarted}</div>
                <div className="tm-insight-kpi-label">Not Started</div>
              </div>
            </div>

            <div className="tm-insight-panel-grid tm-insight-panel-grid--two">
              <div className="tm-insight-panel">
                <div className="tm-insight-panel-title">Training Coverage</div>
                <div className="tm-insight-panel-sub">
                  A simple breakdown of completed, in-progress, and not-started training.
                </div>

                <div className="tm-insight-stacked-bar" aria-label="Training coverage">
                  <div
                    className="tm-insight-stacked-segment tm-segment-completed"
                    style={{ width: `${percentCompleted}%` }}
                    title={`Completed: ${percentCompleted}%`}
                  />
                  <div
                    className="tm-insight-stacked-segment tm-segment-in-progress"
                    style={{ width: `${percentInProgress}%` }}
                    title={`In Progress: ${percentInProgress}%`}
                  />
                  <div
                    className="tm-insight-stacked-segment tm-segment-not-started"
                    style={{ width: `${percentNotStarted}%` }}
                    title={`Not Started: ${percentNotStarted}%`}
                  />
                </div>

                <div className="tm-insight-legend">
                  <span className="tm-insight-legend-item">
                    <span className="tm-insight-legend-dot tm-segment-completed" />
                    Completed ({percentCompleted}%)
                  </span>
                  <span className="tm-insight-legend-item">
                    <span className="tm-insight-legend-dot tm-segment-in-progress" />
                    In Progress ({percentInProgress}%)
                  </span>
                  <span className="tm-insight-legend-item">
                    <span className="tm-insight-legend-dot tm-segment-not-started" />
                    Not Started ({percentNotStarted}%)
                  </span>
                </div>
              </div>

              <div className="tm-insight-panel">
                <div className="tm-insight-panel-title">What this means</div>
                <div className="tm-insight-panel-sub">
                  Training completion is a readiness signal, not a guarantee of security.
                </div>

                <div className="tm-insight-callout">
                  <strong>{preparedness.title}:</strong> {preparedness.description}
                </div>

                <div className="tm-insight-mini-list">
                  <div className="tm-insight-mini-item">
                    <span className="tm-insight-mini-label">Completed percentage</span>
                    <span className="tm-insight-mini-value">{percentCompleted}%</span>
                  </div>
                  <div className="tm-insight-mini-item">
                    <span className="tm-insight-mini-label">Learners tracked</span>
                    <span className="tm-insight-mini-value">{totalLearners}</span>
                  </div>
                  <div className="tm-insight-mini-item">
                    <span className="tm-insight-mini-label">Visible modules</span>
                    <span className="tm-insight-mini-value">{totalModules}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="tm-insight-section">
            <h3 className="tm-insight-question">Who needs more training?</h3>
            <p className="tm-insight-answer">
              These learners currently have the lowest completion rates among assigned
              modules.
            </p>

            <div className="tm-insight-panel">
              <div className="tm-insight-bar-list">
                {learnerNeedsSupport.length === 0 ? (
                  <div className="tm-empty">No learner data available yet.</div>
                ) : (
                  learnerNeedsSupport.map((learner) => (
                    <div key={learner.id} className="tm-insight-bar-row">
                      <div className="tm-insight-bar-head">
                        <span className="tm-insight-bar-title">{learner.name}</span>
                        <span className="tm-insight-bar-value">
                          {learner.completed}/{learner.assigned} ({learner.completionPercent}%)
                        </span>
                      </div>

                      <div className="tm-insight-bar-track">
                        <div
                          className="tm-insight-bar-fill"
                          style={{ width: `${learner.completionPercent}%` }}
                        />
                      </div>

                      <div className="tm-insight-bar-meta">
                        <span>In Progress: {learner.inProgress}</span>
                        <span>Not Started: {learner.notStarted}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="tm-insight-section">
            <h3 className="tm-insight-question">Which modules need attention?</h3>
            <p className="tm-insight-answer">
              These are the modules with the lowest completion rates across your learners.
            </p>

            <div className="tm-insight-panel">
              <div className="tm-insight-bar-list">
                {moduleAttention.length === 0 ? (
                  <div className="tm-empty">No module data available yet.</div>
                ) : (
                  moduleAttention.map((module) => (
                    <div key={module.id} className="tm-insight-bar-row">
                      <div className="tm-insight-bar-head">
                        <span className="tm-insight-bar-title">{module.label}</span>
                        <span className="tm-insight-bar-value">
                          {module.completed}/{module.total} ({module.completionPercent}%)
                        </span>
                      </div>

                      <div className="tm-insight-bar-track">
                        <div
                          className="tm-insight-bar-fill tm-insight-bar-fill--module"
                          style={{ width: `${module.completionPercent}%` }}
                        />
                      </div>

                      <div className="tm-insight-bar-meta">
                        <span>In Progress: {module.inProgress}</span>
                        <span>Not Started: {module.notStarted}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="tm-insight-section">
            <h3 className="tm-insight-question">Detailed reference</h3>
            <p className="tm-insight-answer">
              Use the Training tab for the full learner-by-module matrix and status table.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

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
    <div className="tm-drawer-overlay" onMouseDown={onClose} role="presentation">
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