import { useEffect, useRef, useState } from "react";
import ContentPanel from "../components/ContentPanel";

export default function Playbook1() {
  const iframeRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const intervalRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(1400);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function updateIframeHeight() {
      try {
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const body = doc.body;
        const html = doc.documentElement;

        const newHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          body.clientHeight,
          html.scrollHeight,
          html.offsetHeight,
          html.clientHeight
        );

        setIframeHeight((prev) => {
          const next = newHeight + 24;
          return prev !== next ? next : prev;
        });
      } catch (err) {
        console.error("Unable to resize iframe:", err);
      }
    }

    function handleLoad() {
      updateIframeHeight();

      try {
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }

        resizeObserverRef.current = new ResizeObserver(() => {
          updateIframeHeight();
        });

        resizeObserverRef.current.observe(doc.body);
        resizeObserverRef.current.observe(doc.documentElement);

        doc.addEventListener("input", updateIframeHeight);
        doc.addEventListener("change", updateIframeHeight);
        doc.addEventListener("click", updateIframeHeight);

        window.addEventListener("resize", updateIframeHeight);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(updateIframeHeight, 500);

        iframe._cleanup = () => {
          resizeObserverRef.current?.disconnect();
          resizeObserverRef.current = null;

          doc.removeEventListener("input", updateIframeHeight);
          doc.removeEventListener("change", updateIframeHeight);
          doc.removeEventListener("click", updateIframeHeight);

          window.removeEventListener("resize", updateIframeHeight);

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        };
      } catch (err) {
        console.error("Resize observer setup failed:", err);
      }
    }

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      if (iframe._cleanup) iframe._cleanup();
    };
  }, []);

  return (
    <ContentPanel>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <p
          style={{
            marginBottom: "10px",
            marginTop: "1px",
            color: "#0ba906",
            fontWeight: 600,
          }}
        >
          Use this calculator to estimate organizational impact and planning
          considerations.
        </p>

        <div
          style={{
            border: "1px solid #0158da",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <iframe
            ref={iframeRef}
            src="/risk-calculator.html"
            title="Impact Calculator"
            scrolling="no"
            style={{
              width: "100%",
              height: `${iframeHeight}px`,
              border: "none",
              display: "block",
              overflow: "hidden",
              background: "#fff",
            }}
          />
        </div>
      </div>
    </ContentPanel>
  );
}