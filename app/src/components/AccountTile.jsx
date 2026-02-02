// This component will be used to create the "buttons" inside the Accounts page
export default function AccountTile({
  title,
  subtitle,
  onClick,
  clickable = true,
  center = false,        // <-- boolean instead of "left" / "center"
}) {
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      type={clickable ? "button" : undefined}
      className={`account-tile ${
        clickable ? "account-tile--clickable" : "account-tile--static"
      } ${center ? "account-tile--center" : ""}`}  
      onClick={clickable ? onClick : undefined}
    >
      <div className="account-tile-title">{title}</div>
      <div className="account-tile-subtitle">{subtitle}</div>
    </Tag>
  );
}
