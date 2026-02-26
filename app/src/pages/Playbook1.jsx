import ContentPanel from "../components/ContentPanel";

export default function Playbook1() {
  return (
    <ContentPanel>
      <div>
        <h2>Playbook 1</h2>
        <p style={{ marginBottom: "12px" }}>
          This playbook is under construction test3.
        </p>
        <div style={{ height: "70vh" }}>
          <iframe
            src="/Playbook1.html"
            title="Under Construction"
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>
    </ContentPanel>
  );
}

