import React from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function IncidentResponsePlanning() {
  const navigate = useNavigate();

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">
            Incident Response Planning Playbook
          </h2>
          <p className="security-tools-sub">
            Review a planning-focused guide inspired by CISA to understand what
            an incident response plan should include before an incident occurs.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/playbooks")}
        >
          ← Back to Playbooks
        </button>
      </div>

      <div
        style={{
          width: "100%",
          
          background: "#fff",
          borderRadius: "20px",
          overflow: "visible",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        }}
      >
        <iframe
          src="/incident_response_planning_playbook.html"
          title="Incident Response Planning Playbook"
          style={{
            width: "100%",
            height: "3400px",
            border: "none",
            background: "#fff",
            display: "block",
          }}
          scrolling="no"
        />
      </div>
    </ContentPanel>
  );
}