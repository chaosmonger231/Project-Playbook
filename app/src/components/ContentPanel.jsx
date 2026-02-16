export default function ContentPanel({
  children,
  className = "",
  padding = "normal",   // "normal" | "tight"
  minHeight = null
}) {
  const classes = [
    "content-panel",
    padding === "tight" ? "content-panel--tight" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const style = minHeight ? { minHeight } : undefined;

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}