import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";
import "./CyberNewsPanel.css";

export default function CyberNewsPanel({ variant = "default" }) {
  const { firebaseUser, loading: authLoading } = useUser();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      if (authLoading) return;

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

        if (!cancelled) {
          setNews(items);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Unable to load cyber news right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      cancelled = true;
    };
  }, [authLoading, firebaseUser]);

  const featuredLoopItems = useMemo(() => {
    if (!news.length) return [];
    return [...news, ...news];
  }, [news]);

  if (variant === "featured") {
    return (
      <section className="cybernews-featured">
        <div className="cybernews-featured__head">
          <h2 className="cybernews-featured__title">
            <span className="cybernews-featured__title-main">Cybersecurity News</span>
            <span className="cybernews-featured__title-divider">|</span>
            <span className="cybernews-featured__title-sub">
              Relevant Cybersecurity News. Updated Weekly
            </span>
          </h2>
        </div>

        {(authLoading || loading) && (
          <div className="cybernews-featured__state">Loading news...</div>
        )}

        {!authLoading && !firebaseUser && (
          <div className="cybernews-featured__state">
            Sign in to view cyber news.
          </div>
        )}

        {!authLoading && firebaseUser && !loading && err && (
          <div className="cybernews-featured__error">{err}</div>
        )}

        {!authLoading && firebaseUser && !loading && !err && news.length > 0 && (
          <div className="cybernews-featured__viewport">
            <div className="cybernews-featured__track">
              {featuredLoopItems.map((item, index) => {
                const dateLabel = item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString()
                  : "—";

                const content = (
                  <>
                    <div
                      className="cybernews-featured__card-title"
                      title={item.title || "Untitled article"}
                    >
                      {item.title || "Untitled article"}
                    </div>

                    <div
                      className="cybernews-featured__card-meta"
                      title={`${item.source || "Unknown source"} • ${dateLabel}`}
                    >
                      <span className="cybernews-featured__meta-source">
                        {item.source || "Unknown source"}
                      </span>
                      <span className="cybernews-featured__meta-sep">•</span>
                      <span className="cybernews-featured__meta-date">
                        {dateLabel}
                      </span>
                    </div>
                  </>
                );

                return (
                  <React.Fragment key={`${item.id}-${index}`}>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cybernews-featured__card"
                        title={item.title || "Untitled article"}
                      >
                        {content}
                      </a>
                    ) : (
                      <div
                        className="cybernews-featured__card"
                        title={item.title || "Untitled article"}
                      >
                        {content}
                      </div>
                    )}

                    {index !== featuredLoopItems.length - 1 && (
                      <span className="cybernews-featured__between" aria-hidden="true">
                        |
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {!authLoading &&
          firebaseUser &&
          !loading &&
          !err &&
          news.length === 0 && (
            <div className="cybernews-featured__state">
              No cyber news is available right now.
            </div>
          )}
      </section>
    );
  }

  return (
    <aside className="news-panel">
      <h3 className="news-title">Cybersecurity News</h3>

      {(authLoading || loading) && <div className="news-state">Loading…</div>}

      {!authLoading && !firebaseUser && (
        <div className="news-state">Sign in to view cyber news.</div>
      )}

      {!authLoading && firebaseUser && !loading && err && (
        <div className="news-error">{err}</div>
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
                      className="news-link"
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