import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function RansomwareResponsePlaybook() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const resizeIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const newHeight = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.offsetHeight,
        doc.body.clientHeight,
        doc.documentElement.clientHeight
      );

      iframe.style.height = `${newHeight}px`;
    } catch (error) {
      console.error("Unable to resize iframe:", error);
    }
  };

  return (
    <ContentPanel>
      <div className="security-tools-head">
        <div>
          <h2 className="security-tools-title">Ransomware Response Playbook</h2>
          <p className="security-tools-sub">
            Review ransomware-specific response guidance for containment,
            communication, reporting, ransom decision rules, and recovery.
          </p>
        </div>

        <button
          type="button"
          className="security-tools-back"
          onClick={() => navigate("/playbooks")}
        >
          ← Back to Incident Response &amp; Operations
        </button>
      </div>

      <div
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        }}
      >
        <iframe
          ref={iframeRef}
          src="/ransomware_response_playbook.html"
          title="Ransomware Response Playbook"
          onLoad={resizeIframe}
          style={{
            width: "100%",
            height: "1000px",
            border: "none",
            display: "block",
            overflow: "hidden",
          }}
          scrolling="no"
        />
      </div>
    </ContentPanel>
  );
}