import "./LearningButton.css";

/**
 * LearningButton
 *
 * Reusable CTA button for starting / continuing learning modules
 *
 * Props:
 * - label (string): text inside the button
 * - onClick (function): click handler
 * - disabled (boolean): disables the button
 * - ariaLabel (string): accessibility label (optional)
 */
export default function LearningButton({
  label = "Start Learning",
  onClick,
  disabled = false,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      className="learning-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
    >
      {/* shadow layer */}
      <span className="learning-btn__shadow" />

      {/* edge layer */}
      <span className="learning-btn__edge" />

      {/* front / clickable surface */}
      <span className="learning-btn__front">
        <span className="learning-btn__text">{label}</span>

        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="learning-btn__icon"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          />
        </svg>
      </span>
    </button>
  );
}
