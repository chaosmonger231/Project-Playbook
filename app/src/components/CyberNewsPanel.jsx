import React from "react";

const demoNews = [
  {
    id: 1,
    title: "Ransomware attack disrupts regional hospital network",
    source: "CyberWire",
    date: "Nov 2025",
    link: "#",
  },
  {
    id: 2,
    title: "Phishing campaign targets local small businesses with fake invoices",
    source: "KrebsOnSecurity",
    date: "Nov 2025",
    link: "#",
  },
  {
    id: 3,
    title: "School district strengthens cybersecurity after data breach",
    source: "Local News",
    date: "Oct 2025",
    link: "#",
  },
  {
    id: 4,
    title: "City government hit by business email compromise, payroll briefly disrupted",
    source: "GovTech Daily",
    date: "Oct 2025",
    link: "#",
  },
  {
    id: 5,
    title: "New report shows 60% of ransomware victims are organizations under 250 employees",
    source: "VeriSecure Research",
    date: "Sep 2025",
    link: "#",
  },
  {
    id: 6,
    title: "IT manager stops wire transfer fraud after spotting unusual login location",
    source: "Security Weekly",
    date: "Sep 2025",
    link: "#",
  },
  {
    id: 7,
    title: "K–12 district rolls out mandatory phishing awareness training for staff",
    source: "EdTech News",
    date: "Aug 2025",
    link: "#",
  },
  {
    id: 8,
    title: "Local nonprofit recovers from cyberattack using offline backups",
    source: "Community Chronicle",
    date: "Aug 2025",
    link: "#",
  },
  {
    id: 9,
    title: "New state guidelines encourage small businesses to adopt basic cyber hygiene controls",
    source: "State Cyber Office",
    date: "Jul 2025",
    link: "#",
  },
  {
    id: 10,
    title: "Multi-factor authentication rollout blocks attempted account takeover at regional bank",
    source: "Infosec Journal",
    date: "Jul 2025",
    link: "#",
  },
];

export default function CyberNewsPanel() {
  return (
    <aside className="news-panel">
      <h3 className="news-title"
      style={{
        borderBottom: "2px solid #f97316",
        paddingBottom: "4px",
        marginBottom: "8px",
        }}
      >Cybersecurity News</h3>
      <ul className="news-list">
        {demoNews.map((item) => (
          <li key={item.id} className="news-item">
            <div className="news-item-headline">{item.title}</div>
            <div className="news-item-meta">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.date}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
