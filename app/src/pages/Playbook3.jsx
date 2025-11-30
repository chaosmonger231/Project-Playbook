import React from "react";

export default function Playbook3() {
  return (
    <div className="box">
      <h2>Ransomware Playbook (Playbook 3)</h2>
      <p style={{ marginBottom: "12px" }}>
        This page loads the detailed ransomware detection and response playbook.
      </p>
      <div style={{ height: "70vh" }}>
        <iframe
          src="/Playbook3.html"
          title="Ransomware Detection & Response Playbook"
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
}
