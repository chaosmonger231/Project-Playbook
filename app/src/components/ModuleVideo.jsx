import { useEffect, useState } from "react";

const API_BASE = "https://e71s0lsvsd.execute-api.us-east-1.amazonaws.com/prod";

export default function ModuleVideo({
  video,
  title = "Module overview video",
  maxWidth = 480,
}) {
  const [signedUrl, setSignedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSignedUrl() {
      if (!video || video.provider !== "s3" || !video.key) {
        setSignedUrl("");
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/signed-url?key=${encodeURIComponent(video.key)}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch signed URL: ${res.status}`);
        }

        const data = await res.json();

        if (isMounted) {
          setSignedUrl(data.url || "");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load video.");
          setSignedUrl("");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [video]);

  if (!video) return null;

  const wrapperStyle = {
    margin: "8px auto 16px",
    width: "100%",
    maxWidth: `${maxWidth}px`,
  };

  const frameStyle = {
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    background: "#000",
  };

  if (video.provider === "youtube" && video.videoId) {
    const src = `https://www.youtube.com/embed/${video.videoId}`;

    return (
      <div style={wrapperStyle}>
        <div style={frameStyle}>
          <iframe
            src={src}
            title={title}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "0",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (video.provider === "s3" && video.key) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            overflow: "hidden",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            background: "#000",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "24px",
                color: "#fff",
                textAlign: "center",
              }}
            >
              Loading video...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "24px",
                color: "#fff",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          ) : signedUrl ? (
            <video
              controls
              preload="metadata"
              style={{
                width: "100%",
                display: "block",
              }}
            >
              <source src={signedUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}