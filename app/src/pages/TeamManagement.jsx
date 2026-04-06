import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import ContentPanel from "../components/ContentPanel";
import AttestationsList from "../components/AttestationsList";
import ParticipantTrainingPanel from "../components/ParticipantTrainingPanel";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import moduleRegistry from "../learningContent/moduleRegistry.json";
import "./TeamManagement.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

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
  local_government: {
    label: "Local Government",
    className: "tm-module-category-local-government",
  },
};

const ATTESTATION_SECTIONS = [
  {
    id: "program_training",
    title: "A. Program & Training",
    items: [
      { id: "program_adopted", label: "Cybersecurity program adopted" },
      { id: "employee_training", label: "Employee training conducted" },
    ],
  },
  {
    id: "incident_preparedness",
    title: "B. Incident Preparedness",
    items: [
      { id: "ir_plan_documented", label: "Incident response plan documented" },
      {
        id: "incident_reporting_procedure",
        label: "Incident reporting procedure defined",
      },
      {
        id: "ransomware_response_policy",
        label: "Ransomware response policy documented",
      },
      {
        id: "backup_recovery_plan",
        label: "Backup / recovery plan documented",
      },
    ],
  },
  {
    id: "access_protection",
    title: "C. Access & Protection",
    items: [
      {
        id: "mfa_enabled_key_accounts",
        label: "Multi-factor authentication enabled for key accounts",
      },
      {
        id: "critical_systems_updated",
        label: "Critical systems are updated regularly",
      },
      {
        id: "protective_security_tools",
        label: "Protective security tools are in place",
      },
    ],
  },
];

const INVITE_VIDEO_EMBED_URL = "https://www.youtube.com/embed/YOUR_VIDEO_ID";

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

function normalizeTrainingMode(rawMode) {
  return rawMode === "controlled" ? "controlled" : "organization";
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

function getVisibleModulesForMode({ allModules, trainingMode, campaignSource, orgType }) {
  if (trainingMode === "controlled") {
    const assignedIds = Array.isArray(campaignSource?.moduleIds)
      ? campaignSource.moduleIds
      : [];

    return allModules.filter((module) => assignedIds.includes(module.id));
  }

  return allModules.filter((module) => canAccessByOrgType(module, orgType));
}

function getSortableTime(campaign) {
  const endedAt =
    typeof campaign?.endedAt?.toMillis === "function" ? campaign.endedAt.toMillis() : 0;
  const createdAt =
    typeof campaign?.createdAt?.toMillis === "function" ? campaign.createdAt.toMillis() : 0;
  const startAt =
    typeof campaign?.startAt?.toDate === "function"
      ? campaign.startAt.toDate().getTime()
      : campaign?.startAt instanceof Date
      ? campaign.startAt.getTime()
      : 0;

  return Math.max(endedAt, createdAt, startAt, 0);
}

async function getCampaignContextForOrg(orgId) {
  const settingsRef = doc(db, "orgs", orgId, "settings", "training");
  const settingsSnap = await getDoc(settingsRef);

  let mode = "organization";

  if (settingsSnap.exists()) {
    const settingsData = settingsSnap.data() || {};
    mode = normalizeTrainingMode(settingsData.trainingMode);
  }

  const playbooksSnap = await getDocs(collection(db, "orgs", orgId, "playbooks"));
  const playbooks = playbooksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const activeCampaign = playbooks.find((pb) => pb.isActive === true) || null;

  const latestCompletedCampaign =
    [...playbooks]
      .filter((pb) => pb.isActive !== true)
      .sort((a, b) => getSortableTime(b) - getSortableTime(a))[0] || null;

  return {
    trainingMode: mode,
    activeCampaign,
    campaignContext: activeCampaign || latestCompletedCampaign || null,
  };
}

async function loadCampaignProgressForUser(userId, visibleModules, campaignId) {
  if (!campaignId || visibleModules.length === 0) {
    return {};
  }

  const progressEntries = await Promise.all(
    visibleModules.map(async (module) => {
      const progressRef = doc(
        db,
        "users",
        userId,
        "campaignProgress",
        campaignId,
        "modules",
        module.id
      );
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

      if (progressData.passed === true || progressData.completed === true) {
        return [module.id, "completed"];
      }

      if (
        Number(progressData.attempts || 0) > 0 ||
        Number(progressData.percentComplete || 0) > 0
      ) {
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

function getReadinessMeta(percent) {
  if (percent <= 50) {
    return { label: "Needs Attention", tone: "danger" };
  }
  if (percent <= 80) {
    return { label: "In Progress", tone: "warning" };
  }
  return { label: "Strong Coverage", tone: "good" };
}

function formatDateTime(value) {
  if (!value) return "—";

  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }

  return "—";
}

function buildAttestationSummary(attestation) {
  const answers = attestation?.answers || {};
  const sectionSummaries = ATTESTATION_SECTIONS.map((section) => {
    const checkedCount = section.items.filter((item) => !!answers[item.id]).length;
    const total = section.items.length;

    return {
      ...section,
      checkedCount,
      total,
      percent: total > 0 ? Math.round((checkedCount / total) * 100) : 0,
      items: section.items.map((item) => ({
        ...item,
        checked: !!answers[item.id],
      })),
    };
  });

  const totalItems = ATTESTATION_SECTIONS.flatMap((section) => section.items).length;
  const checkedCount = sectionSummaries.reduce(
    (sum, section) => sum + section.checkedCount,
    0
  );
  const readinessPercent =
    totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return {
    sectionSummaries,
    totalItems,
    checkedCount,
    readinessPercent,
  };
}

function buildSafeOrgFilePrefix(orgName) {
  return (orgName || "organization")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
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
  const [showInviteVideo, setShowInviteVideo] = useState(false);

  useEffect(() => {
    const next = getSafeTab(searchParams, isCoordinator);
    setTab((prev) => (prev === next ? prev : next));
  }, [searchParams, isCoordinator]);

  useEffect(() => {
    const safeTab = getSafeTab(searchParams, isCoordinator);
    const currentParam = (searchParams.get("tab") || "").trim();

    if (currentParam !== safeTab) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("tab", safeTab);
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isCoordinator]);

  useEffect(() => {
    if (!isCoordinator && drawerOpen) {
      setDrawerOpen(false);
      setSelectedMember(null);
    }
  }, [isCoordinator, drawerOpen]);

  useEffect(() => {
    if (showInviteVideo) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showInviteVideo]);

  useEffect(() => {
    if (!showInviteVideo) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setShowInviteVideo(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInviteVideo]);

  function handleTabChange(nextTab) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);

    if (nextTab !== "attestations") {
      nextParams.delete("memberId");
      nextParams.delete("memberEmail");
      nextParams.delete("memberName");
    }

    setTab(nextTab);
    setSearchParams(nextParams);
  }

  function handleViewMemberAttestations(member) {
    if (!member) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", "attestations");
    nextParams.set("memberId", member.id || "");
    nextParams.set("memberEmail", member.email || "");
    nextParams.set("memberName", member.name || "");

    setDrawerOpen(false);
    setSelectedMember(null);
    setTab("attestations");
    setSearchParams(nextParams);
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
                onClick={() => setShowInviteVideo(true)}
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
          <MemberDetails
            member={selectedMember}
            onViewAttestations={handleViewMemberAttestations}
          />
        </RightDrawer>
      )}

      {showInviteVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 9999,
          }}
          onClick={() => setShowInviteVideo(false)}
          role="presentation"
        >
          <div
            style={{
              position: "relative",
              width: "min(960px, 100%)",
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
              padding: "18px 18px 16px",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Invite member help video"
          >
            <button
              type="button"
              onClick={() => setShowInviteVideo(false)}
              aria-label="Close invite member video"
              style={{
                position: "absolute",
                top: "12px",
                right: "14px",
                width: "40px",
                height: "40px",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "24px",
                lineHeight: 1,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
              }}
            >
              ×
            </button>

            <div style={{ padding: "4px 44px 14px 4px" }}>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                How to Invite Members
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#475569",
                }}
              >
                Watch this quick walkthrough for inviting members to your organization.
              </div>
            </div>

            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: "18px",
                overflow: "hidden",
                background: "#0f172a",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <iframe
                width="100%"
                height="100%"
                src={INVITE_VIDEO_EMBED_URL}
                title="How to Invite Members"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </ContentPanel>
  );
}

function MembersPanel({ onManage }) {
  const { orgId, role, orgName, orgType = "education" } = useUser();

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

        const [{ trainingMode, campaignContext }, snap] = await Promise.all([
          getCampaignContextForOrg(orgId),
          getDocs(query(collection(db, "users"), where("orgId", "==", orgId))),
        ]);

        const visibleModules = getVisibleModulesForMode({
          allModules: getAllRegistryModules(),
          trainingMode,
          campaignSource: campaignContext,
          orgType,
        });

        const campaignId = campaignContext?.id || null;

        const members = await Promise.all(
          snap.docs.map(async (memberDoc) => {
            const d = memberDoc.data();
            const normalizedRole = normalizeRole(d.role);

            const statuses = await loadCampaignProgressForUser(
              memberDoc.id,
              visibleModules,
              campaignId
            );

            const total = visibleModules.length;
            const completed = visibleModules.filter(
              (module) => statuses[module.id] === "completed"
            ).length;

            return {
              id: memberDoc.id,
              name: d.displayName || d.name || "—",
              email: d.email || "—",
              role: normalizedRole,
              status: normalizeStatus(d.status),
              training: `${completed} / ${total} complete`,
              trainingCompleted: completed,
              trainingTotal: total,
            };
          })
        );

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
  }, [orgId, orgType]);

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
    const safeOrgName = buildSafeOrgFilePrefix(orgName);

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
                  <div><span className="tm-pill">{r.role}</span></div>
                  <div><span className="tm-pill">{r.status}</span></div>
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
  const [campaignContext, setCampaignContext] = React.useState(null);

  const allModules = React.useMemo(() => getAllRegistryModules(), []);

  const visibleModules = React.useMemo(() => {
    return getVisibleModulesForMode({
      allModules,
      trainingMode,
      campaignSource: campaignContext,
      orgType,
    });
  }, [allModules, trainingMode, campaignContext, orgType]);

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

        const { trainingMode: mode, activeCampaign: active, campaignContext: context } =
          await getCampaignContextForOrg(orgId);

        const modulesForRows = getVisibleModulesForMode({
          allModules,
          trainingMode: mode,
          campaignSource: context,
          orgType,
        });

        const campaignId = context?.id || null;

        const usersQuery = query(collection(db, "users"), where("orgId", "==", orgId));
        const usersSnap = await getDocs(usersQuery);

        const memberDocs = usersSnap.docs.filter((userDoc) => {
          const d = userDoc.data() || {};
          const normalizedRole = normalizeRole(d.role);
          return normalizedRole === "participant" || normalizedRole === "coordinator";
        });

        const loadedRows = await Promise.all(
          memberDocs.map(async (userDoc) => {
            const d = userDoc.data();
            const statuses = await loadCampaignProgressForUser(
              userDoc.id,
              modulesForRows,
              campaignId
            );

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
        setActiveCampaign(active);
        setCampaignContext(context);
        setRows(loadedRows);
      } catch (err) {
        console.error("Failed to load training progress", err);

        if (!isMounted) return;

        setError("Could not load training progress.");
        setRows([]);
        setActiveCampaign(null);
        setCampaignContext(null);
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
            <span className="tm-legend-item"><span className="tm-legend-dot tm-legend-completed" />Completed</span>
            <span className="tm-legend-item"><span className="tm-legend-dot tm-legend-progress" />In Progress</span>
            <span className="tm-legend-item"><span className="tm-legend-dot tm-legend-not-started" />Not Started</span>
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
                        <div className="tm-training-learner-name">
                          {row.name}
                          <span style={{ marginLeft: 8, opacity: 0.65, fontWeight: 500 }}>
                            ({row.role})
                          </span>
                        </div>
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
            controlled mode shows the selected modules from the campaign in view.
          </div>

          {!activeCampaign && campaignContext && (
            <div className="tm-hint">
              Showing the most recent completed campaign because there is no active campaign.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InsightsPanel() {
  const { orgId, orgType = "education", orgName } = useUser();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [trainingMode, setTrainingMode] = React.useState("organization");
  const [activeCampaign, setActiveCampaign] = React.useState(null);
  const [campaignContext, setCampaignContext] = React.useState(null);
  const [latestAttestation, setLatestAttestation] = React.useState(null);
  const [activeChart, setActiveChart] = React.useState("trainingOverview");

  const chartRef = useRef(null);
  const allModules = React.useMemo(() => getAllRegistryModules(), []);

  const visibleModules = React.useMemo(() => {
    return getVisibleModulesForMode({
      allModules,
      trainingMode,
      campaignSource: campaignContext,
      orgType,
    });
  }, [allModules, trainingMode, campaignContext, orgType]);

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

        const { trainingMode: mode, activeCampaign: active, campaignContext: context } =
          await getCampaignContextForOrg(orgId);

        const modulesForRows = getVisibleModulesForMode({
          allModules,
          trainingMode: mode,
          campaignSource: context,
          orgType,
        });

        const campaignId = context?.id || null;

        const usersQuery = query(collection(db, "users"), where("orgId", "==", orgId));
        const usersSnap = await getDocs(usersQuery);

        const memberDocs = usersSnap.docs.filter((userDoc) => {
          const d = userDoc.data() || {};
          const normalizedRole = normalizeRole(d.role);
          return normalizedRole === "participant" || normalizedRole === "coordinator";
        });

        const loadedRows = await Promise.all(
          memberDocs.map(async (userDoc) => {
            const d = userDoc.data();
            const statuses = await loadCampaignProgressForUser(
              userDoc.id,
              modulesForRows,
              campaignId
            );

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

            const completionPercent =
              modulesForRows.length > 0
                ? Math.round((completed / modulesForRows.length) * 100)
                : 0;

            return {
              id: userDoc.id,
              name: d.displayName || d.name || "—",
              email: d.email || "—",
              role: normalizeRole(d.role),
              assigned: modulesForRows.length,
              completed,
              inProgress,
              notStarted,
              statuses,
              completionPercent,
              isTrainingReady: completionPercent >= 80,
            };
          })
        );

        loadedRows.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        const attestationQuery = query(
          collection(db, "orgs", orgId, "attestations"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const attestationSnap = await getDocs(attestationQuery);
        const latestHb96 =
          attestationSnap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .find((item) => item.playbookId === "hb96") || null;

        if (!isMounted) return;

        setTrainingMode(mode);
        setActiveCampaign(active);
        setCampaignContext(context);
        setRows(loadedRows);
        setLatestAttestation(latestHb96);
      } catch (err) {
        console.error("Failed to load insights", err);

        if (!isMounted) return;

        setError("Could not load insights.");
        setRows([]);
        setActiveCampaign(null);
        setCampaignContext(null);
        setLatestAttestation(null);
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

  const completionSummary = useMemo(
    () => getMatrixSummary(rows, visibleModules),
    [rows, visibleModules]
  );

  const readyLearnersCount = useMemo(
    () => rows.filter((row) => row.isTrainingReady).length,
    [rows]
  );

  const trainingReadinessPercent =
    totalLearners > 0 && totalModules > 0
      ? Math.round((readyLearnersCount / totalLearners) * 100)
      : 0;

  const trainingReadinessMeta = getReadinessMeta(trainingReadinessPercent);

  const attestationSummary = useMemo(
    () => buildAttestationSummary(latestAttestation),
    [latestAttestation]
  );

  const attestationReadinessPercent = attestationSummary.readinessPercent;
  const attestationReadinessMeta = getReadinessMeta(attestationReadinessPercent);

  const learnerNeedsSupport = useMemo(() => {
    return [...rows]
      .sort((a, b) => {
        if (a.completionPercent !== b.completionPercent) {
          return a.completionPercent - b.completionPercent;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 7);
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
      .slice(0, 7);
  }, [visibleModules, rows]);

  const trainingOverviewChartData = useMemo(
    () => ({
      labels: ["Training Ready (80%+)", "Below 80%"],
      datasets: [
        {
          data: [readyLearnersCount, Math.max(totalLearners - readyLearnersCount, 0)],
          backgroundColor: ["#22c55e", "#e5e7eb"],
          borderColor: ["#16a34a", "#d1d5db"],
          borderWidth: 1,
        },
      ],
    }),
    [readyLearnersCount, totalLearners]
  );

  const learnerFollowUpChartData = useMemo(
    () => ({
      labels: learnerNeedsSupport.map((learner) => learner.name),
      datasets: [
        {
          label: "Completion %",
          data: learnerNeedsSupport.map((learner) => learner.completionPercent),
          backgroundColor: "#f59e0b",
          borderRadius: 8,
          barThickness: 20,
        },
      ],
    }),
    [learnerNeedsSupport]
  );

  const moduleGapsChartData = useMemo(
    () => ({
      labels: moduleAttention.map((module) => module.label),
      datasets: [
        {
          label: "Completion %",
          data: moduleAttention.map((module) => module.completionPercent),
          backgroundColor: "#2563eb",
          borderRadius: 8,
          barThickness: 20,
        },
      ],
    }),
    [moduleAttention]
  );

  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  const doughnutOptions = {
    ...chartOptionsBase,
    cutout: "68%",
    plugins: {
      ...chartOptionsBase.plugins,
      legend: {
        display: true,
        position: "bottom",
      },
    },
  };

  const horizontalBarOptions = {
    ...chartOptionsBase,
    indexAxis: "y",
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  function handleExportInsightsCsv() {
    const today = new Date().toISOString().slice(0, 10);
    const safeOrgName = buildSafeOrgFilePrefix(orgName);

    if (activeChart === "trainingOverview") {
      const rowsForCsv = [
        ["Metric", "Value"],
        ["Campaign Name", campaignContext?.title || "—"],
        ["Campaign ID", campaignContext?.id || "—"],
        ["Campaign Status", activeCampaign ? "Active" : "Fallback"],
        ["Total Learners", totalLearners],
        ["Modules", totalModules],
        ["Training Ready (80%+)", readyLearnersCount],
        ["Below 80%", Math.max(totalLearners - readyLearnersCount, 0)],
        ["Training Readiness %", trainingReadinessPercent],
      ];
      downloadCsv(`${safeOrgName}-insights-training-overview-${today}.csv`, rowsForCsv);
      return;
    }

    if (activeChart === "learnerFollowUp") {
      const rowsForCsv = [
        ["Learner", "Role", "Completed", "Assigned", "Completion %", "In Progress", "Not Started"],
        ...learnerNeedsSupport.map((learner) => [
          learner.name,
          learner.role,
          learner.completed,
          learner.assigned,
          learner.completionPercent,
          learner.inProgress,
          learner.notStarted,
        ]),
      ];
      downloadCsv(`${safeOrgName}-insights-learner-follow-up-${today}.csv`, rowsForCsv);
      return;
    }

    const rowsForCsv = [
      ["Module", "Completed", "Total Learners", "Completion %", "In Progress", "Not Started"],
      ...moduleAttention.map((module) => [
        module.label,
        module.completed,
        module.total,
        module.completionPercent,
        module.inProgress,
        module.notStarted,
      ]),
    ];
    downloadCsv(`${safeOrgName}-insights-module-gaps-${today}.csv`, rowsForCsv);
  }

  function handleDownloadChart() {
    const chart = chartRef.current;
    if (!chart || typeof chart.toBase64Image !== "function") return;

    const url = chart.toBase64Image("image/png", 1);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    const safeOrgName = buildSafeOrgFilePrefix(orgName);

    link.href = url;
    link.download = `${safeOrgName}-${activeChart}-${today}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const chartTitle =
    activeChart === "trainingOverview"
      ? "Training Overview"
      : activeChart === "learnerFollowUp"
      ? "Learner Follow-Up"
      : "Module Gaps";

  const chartDescription =
    activeChart === "trainingOverview"
      ? "This view shows how many learners have reached the 80% completion mark required to count as training ready."
      : activeChart === "learnerFollowUp"
      ? "This view highlights the learners currently furthest from the 80% readiness threshold."
      : "This view highlights the modules with the weakest completion rates across the organization.";

  const campaignModeLabel =
    trainingMode === "controlled" ? "Controlled" : "Organization-Based";

  const campaignStatusLabel = activeCampaign ? "Active Campaign" : campaignContext ? "Fallback Campaign" : "No Campaign";
  const campaignNameLabel = campaignContext?.title || "No campaign found";
  const campaignIdLabel = campaignContext?.id || "—";
  const campaignModuleCount = Array.isArray(campaignContext?.moduleIds)
    ? campaignContext.moduleIds.length
    : 0;

  return (
    <div className="tm-card tm-insights-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Insights</div>
          <div className="tm-card-sub">
            A visual snapshot of training readiness and current HB 96 alignment.
          </div>
        </div>
      </div>

      {loading && <div className="tm-empty">Loading insights...</div>}
      {!loading && error && <div className="tm-empty">{error}</div>}

      {!loading && !error && (
        <div className="tm-insights-layout">
          <section className="tm-insight-section">
            <div className="tm-insight-top-grid">
              <div className="tm-readiness-card">
                <div className="tm-readiness-card-head">
                  <div className="tm-readiness-card-title">Training Readiness</div>
                  <span
                    className="tm-info-badge"
                    title="Training readiness marks a learner as ready when they complete at least 80% of assigned lessons. The organization score reflects how many learners reached that threshold."
                  >
                    i
                  </span>
                </div>

                <div className="tm-readiness-card-value">
                  {trainingMode === "controlled" && totalModules === 0 ? "—" : `${trainingReadinessPercent}%`}
                </div>

                <div
                  className={`tm-readiness-chip tm-readiness-chip--${trainingReadinessMeta.tone}`}
                >
                  {trainingMode === "controlled" && totalModules === 0
                    ? "No Campaign Data"
                    : trainingReadinessMeta.label}
                </div>

                <div className="tm-readiness-card-meta">
                  {trainingMode === "controlled" && totalModules === 0
                    ? "No modules were found for the campaign currently in view."
                    : `${readyLearnersCount} of ${totalLearners} learners have reached the 80% mark.`}
                </div>
              </div>

              <div className="tm-readiness-card">
                <div className="tm-readiness-card-head">
                  <div className="tm-readiness-card-title">Attestation Readiness</div>
                  <span
                    className="tm-info-badge"
                    title="This score reflects self-attested readiness items marked in the current HB 96 readiness submission. It supports internal planning and tracking, not legal certification."
                  >
                    i
                  </span>
                </div>

                <div className="tm-readiness-card-value">{attestationReadinessPercent}%</div>

                <div
                  className={`tm-readiness-chip tm-readiness-chip--${attestationReadinessMeta.tone}`}
                >
                  {attestationReadinessMeta.label}
                </div>

                <div className="tm-readiness-card-meta">
                  {attestationSummary.checkedCount} of {attestationSummary.totalItems} attestation
                  items are checked.
                </div>
              </div>

              <div className="tm-guide-card">
                <div className="tm-guide-card-title">How to Read Readiness</div>

                <div className="tm-guide-row">
                  <span className="tm-guide-dot tm-guide-dot-danger" />
                  <span>0–50%</span>
                  <strong>Needs Attention</strong>
                </div>

                <div className="tm-guide-row">
                  <span className="tm-guide-dot tm-guide-dot-warning" />
                  <span>51–80%</span>
                  <strong>In Progress</strong>
                </div>

                <div className="tm-guide-row">
                  <span className="tm-guide-dot tm-guide-dot-good" />
                  <span>81–100%</span>
                  <strong>Strong Coverage</strong>
                </div>

                <div className="tm-guide-note">
                  Planning signal only. Use this as a quick snapshot, not a certification result.
                </div>
              </div>
            </div>

            <div className="tm-insight-summary-line">
              <span>Training Mode: {campaignModeLabel}</span>
              <span>•</span>
              <span>Campaign Status: {campaignStatusLabel}</span>
              <span>•</span>
              <span>Campaign Name: {campaignNameLabel}</span>
              <span>•</span>
              <span>Campaign ID: {campaignIdLabel}</span>
              <span>•</span>
              <span>Campaign Modules: {campaignModuleCount}</span>
              <span>•</span>
              <span>Visible Modules: {totalModules}</span>
              <span>•</span>
              <span>Learners: {totalLearners}</span>
              <span>•</span>
              <span>Completed Cells: {completionSummary.completed}</span>
              <span>•</span>
              <span>In Progress Cells: {completionSummary.inProgress}</span>
            </div>
          </section>

          <section className="tm-insight-section">
            <div className="tm-insight-chart-card">
              <div className="tm-insight-chart-head">
                <div>
                  <div className="tm-insight-chart-title">{chartTitle}</div>
                  <div className="tm-insight-chart-sub">{chartDescription}</div>
                </div>

                <div className="tm-insight-actions">
                  <button
                    type="button"
                    className="tm-btn tm-btn-ghost"
                    onClick={handleDownloadChart}
                  >
                    Download Chart
                  </button>

                  <button
                    type="button"
                    className="tm-btn tm-btn-ghost"
                    onClick={handleExportInsightsCsv}
                  >
                    Export Data
                  </button>
                </div>
              </div>

              <div className="tm-insight-view-tabs">
                <button
                  type="button"
                  className={`tm-insight-view-tab ${
                    activeChart === "trainingOverview" ? "tm-insight-view-tab-active" : ""
                  }`}
                  onClick={() => setActiveChart("trainingOverview")}
                >
                  Training Overview
                </button>

                <button
                  type="button"
                  className={`tm-insight-view-tab ${
                    activeChart === "learnerFollowUp" ? "tm-insight-view-tab-active" : ""
                  }`}
                  onClick={() => setActiveChart("learnerFollowUp")}
                >
                  Learner Follow-Up
                </button>

                <button
                  type="button"
                  className={`tm-insight-view-tab ${
                    activeChart === "moduleGaps" ? "tm-insight-view-tab-active" : ""
                  }`}
                  onClick={() => setActiveChart("moduleGaps")}
                >
                  Module Gaps
                </button>
              </div>

              <div className="tm-insight-chart-shell">
                {activeChart === "trainingOverview" && (
                  <Doughnut
                    ref={chartRef}
                    data={trainingOverviewChartData}
                    options={doughnutOptions}
                  />
                )}

                {activeChart === "learnerFollowUp" && (
                  <Bar
                    ref={chartRef}
                    data={learnerFollowUpChartData}
                    options={horizontalBarOptions}
                  />
                )}

                {activeChart === "moduleGaps" && (
                  <Bar
                    ref={chartRef}
                    data={moduleGapsChartData}
                    options={horizontalBarOptions}
                  />
                )}
              </div>
            </div>
          </section>

          <section className="tm-insight-section">
            <div className="tm-insight-question-row">
              <div>
                <h3 className="tm-insight-question">Readiness by Area</h3>
                <p className="tm-insight-answer">
                  Current self-attested HB 96 alignment grouped into the three readiness areas.
                </p>
              </div>

              <span
                className="tm-info-badge tm-info-badge-large"
                title="This section summarizes self-attested readiness areas based on the current HB 96 submission. It supports internal tracking and planning, not legal certification."
              >
                i
              </span>
            </div>

            <div className="tm-attestation-grid">
              {attestationSummary.sectionSummaries.map((section) => (
                <div key={section.id} className="tm-attestation-pane">
                  <div className="tm-attestation-pane-head">
                    <div className="tm-attestation-pane-title">{section.title}</div>
                    <div className="tm-attestation-pane-score">
                      {section.checkedCount}/{section.total}
                    </div>
                  </div>

                  <div className="tm-attestation-pane-progress">
                    <div
                      className="tm-attestation-pane-progress-fill"
                      style={{ width: `${section.percent}%` }}
                    />
                  </div>

                  <div className="tm-attestation-checklist">
                    {section.items.map((item) => (
                      <div key={item.id} className="tm-attestation-check-row">
                        <span
                          className={`tm-attestation-check ${
                            item.checked ? "tm-attestation-check--yes" : "tm-attestation-check--no"
                          }`}
                        >
                          {item.checked ? "✓" : "—"}
                        </span>
                        <span className="tm-attestation-check-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="tm-attestation-meta-strip">
              <div className="tm-attestation-meta-item">
                <span className="tm-attestation-meta-label">Attested by</span>
                <strong>{latestAttestation?.displayName || "—"}</strong>
              </div>

              <div className="tm-attestation-meta-item">
                <span className="tm-attestation-meta-label">Last updated</span>
                <strong>
                  {formatDateTime(
                    latestAttestation?.createdAt || latestAttestation?.createdAtUtcIso
                  )}
                </strong>
              </div>

              <div className="tm-attestation-meta-item">
                <span className="tm-attestation-meta-label">Submission</span>
                <strong>{latestAttestation?.id || "No current attestation"}</strong>
              </div>

              <div className="tm-attestation-meta-actions">
                <button
                  type="button"
                  className="tm-btn tm-btn-ghost"
                  onClick={() => window.location.assign("/securityreadiness")}
                >
                  Open Security Readiness
                </button>

                <button
                  type="button"
                  className="tm-btn tm-btn-ghost"
                  onClick={() => window.location.assign("/organization?tab=attestations")}
                >
                  View Attestation History
                </button>
              </div>
            </div>
          </section>

          {!activeCampaign && campaignContext && (
            <section className="tm-insight-section">
              <div className="tm-hint">
                Showing the most recent completed campaign because there is no active campaign.
              </div>
            </section>
          )}
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

function MemberDetails({ member, onViewAttestations }) {
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
            onClick={() => onViewAttestations?.(member)}
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