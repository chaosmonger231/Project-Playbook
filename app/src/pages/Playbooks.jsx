import React from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";

export default function Playbooks() {
  const navigate = useNavigate();

  // You can swap these icons with your real assets
  const playbooks = [
    { id: "pb1", title: "Playbook 1", path: "/playbook1", icon: "/images/playbookImage1.png" },
    { id: "pb2", title: "Impact Calculator Playbook", path: "/playbook2", icon: "/images/playbookImage2.png" },
    { id: "pb3", title: "Detection & Response Playbook", path: "/playbook3", icon: "/images/playbookImage3.png" },
    { id: "pb4", title: "Playbook 4", path: "/playbook4", icon: "/images/playbookImage1.png" },
    { id: "pb5", title: "Playbook 5", path: "/playbook5", icon: "/images/playbookImage2.png" },
  ];

  return (
    <ContentPanel>
      <div className="playbooks-head">
        <div>
          <h2 className="playbooks-title">Playbooks</h2>
          <p className="playbooks-sub">
            Select a playbook to open tools, guidance, and checklists.
          </p>
        </div>

        <button
          type="button"
          className="playbooks-back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </div>

      <div className="playbooks-grid">
        {playbooks.map((pb) => (
          <button
            key={pb.id}
            type="button"
            className="playbooks-iconcard"
            onClick={() => navigate(pb.path)}
          >
            <img src={pb.icon} alt={pb.title} className="playbooks-icon" />
            <div className="playbooks-label">{pb.title}</div>
          </button>
        ))}
      </div>
    </ContentPanel>
  );
}