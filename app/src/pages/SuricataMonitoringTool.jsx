import React from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function SuricataMonitoringTool() {
  const navigate = useNavigate();

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Suricata Monitoring Tool</h2>
          <p className="security-tools-sub">
            Review a lightweight overview of Suricata, including what it does,
            why it matters, and example network-focused monitoring ideas.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/securitymonitoringtools")}
        >
          ← Back to Security Monitoring Tools
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
          src="/suricata_monitoring_tool.html"
          title="Suricata Monitoring Tool"
          style={{
            width: "100%",
            height: "4200px",
            border: "none",
            background: "#fff",
            display: "block",
            borderRadius: "20px",
          }}
        />
      </div>
    </ContentPanel>
  );
}