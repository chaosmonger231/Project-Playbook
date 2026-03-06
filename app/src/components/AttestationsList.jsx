import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

function formatDate(ts) {
  if (!ts) return "—";
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  } catch {
    return "—";
  }
}

function getReadinessValue(data) {
  if (typeof data?.readinessScore === "number") return data.readinessScore;
  if (typeof data?.readiness?.score === "number") return data.readiness.score;
  return null;
}

export default function AttestationsList() {
  const { profile } = useUser();
  const orgId = profile?.orgId;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  useEffect(() => {
    async function loadAttestations() {
      if (!orgId) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const q = query(
          collection(db, "orgs", orgId, "attestations"),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const snap = await getDocs(q);

        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setRows(items);
      } catch (err) {
        console.error("Failed to load attestations:", err);
        setError(err.message || "Failed to load attestations.");
      } finally {
        setLoading(false);
      }
    }

    loadAttestations();
  }, [orgId]);

  async function handleDownload(row) {
    try {
      setWorkingId(row.id);

      const directUrl =
        row?.pdf?.downloadUrl ||
        row?.pdf?.publicUrl ||
        row?.pdf?.url ||
        "";

      if (directUrl) {
        window.open(directUrl, "_blank", "noopener,noreferrer");
        return;
      }

      alert("Download is not wired yet. The report is ready, but no downloadable URL is stored yet.");
    } catch (err) {
      console.error("Download failed:", err);
      alert(err.message || "Download failed.");
    } finally {
      setWorkingId("");
    }
  }

  function renderActionCell(row) {
    const pdfStatus = row?.pdf?.status || "none";

    if (pdfStatus === "ready") {
      return (
        <button
          type="button"
          className="tm-btn tm-btn-ghost"
          onClick={() => handleDownload(row)}
          disabled={workingId === row.id}
        >
          {workingId === row.id ? "Preparing..." : "Download PDF"}
        </button>
      );
    }

    if (pdfStatus === "pending") {
      return <span className="tm-muted">Generating...</span>;
    }

    if (pdfStatus === "failed") {
      return <span className="tm-muted" style={{ color: "crimson" }}>Failed</span>;
    }

    return <span className="tm-muted">Unavailable</span>;
  }

  if (loading) {
    return (
      <section className="tm-card">
        <div className="tm-empty">Loading latest submissions...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tm-card">
        <div className="tm-empty" style={{ color: "crimson" }}>
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="tm-card">
      <div className="tm-card-head">
        <div>
          <div className="tm-card-title">Saved Attestations</div>
          <div className="tm-card-sub">Showing latest 10 submissions.</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="tm-empty">No attestations found yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Submission ID</th>
                <th style={thStyle}>Readiness</th>
                <th style={thStyle}>PDF Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const readiness = getReadinessValue(row);
                const pdfStatus = row?.pdf?.status || "none";

                return (
                  <tr key={row.id}>
                    <td style={tdStyle}>{formatDate(row.createdAt)}</td>
                    <td style={tdStyle}>{row.id}</td>
                    <td style={tdStyle}>
                      {readiness !== null ? `${readiness}%` : "—"}
                    </td>
                    <td style={tdStyle}>{pdfStatus}</td>
                    <td style={tdStyle}>{renderActionCell(row)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #dbe3ea",
  background: "#f5f8fc",
  fontWeight: 600,
  fontSize: "0.95rem",
};

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #e6edf5",
  verticalAlign: "top",
};