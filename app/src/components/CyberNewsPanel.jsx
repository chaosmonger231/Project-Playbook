// CyberNewsPanel.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase"; // <-- CHANGE THIS PATH to wherever your firebase config file lives

export default function CyberNewsPanel() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      setLoading(true);
      setErr("");

      try {
        const q = query(
          collection(db, "cyberNews"),
          orderBy("publishedAt", "desc"),
          limit(10)
        );

        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        if (!cancelled) setNews(items);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Unable to load cyber news right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="news-panel">
      <h3
        className="news-title"
        style={{
          borderBottom: "2px solid #f97316",
          paddingBottom: "4px",
          marginBottom: "8px",
        }}
      >
        Cybersecurity News
      </h3>

      {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}

      {!loading && err && (
        <div style={{ color: "#f97316", fontSize: "0.9rem" }}>{err}</div>
      )}

      {!loading && !err && (
        <ul className="news-list">
          {news.map((item) => {
            const dateLabel = item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString()
              : "—";

            return (
              <li key={item.id} className="news-item">
                <div className="news-item-headline">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                      }}
                      title="Open article"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </div>

                <div className="news-item-meta">
                  <span>{item.source || "Unknown"}</span>
                  <span>•</span>
                  <span>{dateLabel}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
