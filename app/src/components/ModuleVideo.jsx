// src/components/ModuleVideo.jsx
export default function ModuleVideo({
  videoId,
  title = "Module overview video",
  maxWidth = 480,
}) {
  const src = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div
      style={{
        margin: "8px auto 16px",
        width: "100%",
        maxWidth: "480px",
      }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%", // 16:9
          height: 0,
          overflow: "hidden",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
        }}
      >
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
