import React, { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

export default function CyberNewsPanel() {
  // Rename context loading to authLoading locally
  const { firebaseUser, loading: authLoading } = useUser();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      // Wait until auth/profile finishes initializing
      if (authLoading) return;

      // If not signed in, don't query Firestore
      if (!firebaseUser) {
        if (!cancelled) {
          setLoading(false);
          setNews([]);
        }
        return;
      }

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
  }, [authLoading, firebaseUser]);

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

      {(authLoading || loading) && <div style={{ opacity: 0.8 }}>Loading…</div>}

      {!authLoading && !firebaseUser && (
        <div style={{ opacity: 0.8, fontSize: "0.9rem" }}>
          Sign in to view cyber news.
        </div>
      )}

      {!authLoading && firebaseUser && !loading && err && (
        <div style={{ color: "#f97316", fontSize: "0.9rem" }}>{err}</div>
      )}

      {!authLoading && firebaseUser && !loading && !err && (
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
                        color: "#f97316",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
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