export default function Playbook2() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2>Playbook 2 – Impact Calculator</h2>
      <p style={{ maxWidth: "700px", fontSize: "0.95rem", marginTop: "0.25rem" }}>
        This tool helps you grade the operational, financial, safety,
        legal/regulatory, and reputational impact of key failure points using
        an ISO 31000-style impact matrix.
      </p>

      <div style={{ marginTop: "1rem", flex: 1 }}>
        <iframe
          src="/risk-calculator.html"
          title="Playbook 2 – Impact Calculator"
          style={{
            width: "100%",
            height: "80vh",
            border: "1px solid #d1d5db",
            borderRadius: "0.75rem",
            background: "#ffffff",
          }}
        />
      </div>
    </div>
  );
}