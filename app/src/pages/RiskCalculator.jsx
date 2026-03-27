import React from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function RiskCalculator() {
  const navigate = useNavigate();

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Risk Assessment Tool</h2>
          <p className="security-tools-sub">
            Use this lightweight NIST-aligned tool to estimate likelihood,
            impact, and overall risk without needing a backend.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/riskplanningtools")}
        >
          ← Back to Risk & Planning Tools
        </button>
      </div>

      <div
        style={{
          width: "100%",
          height: "80vh",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        }}
      >
        <iframe
          src="/risk_assessment_tool.html"
          title="Risk Assessment Tool"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#fff",
          }}
        />
      </div>
    </ContentPanel>
  );
}