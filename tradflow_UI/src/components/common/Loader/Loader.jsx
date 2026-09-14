import "./Loader.css";

export default function Loader({ label = "Loading" }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__mark" aria-hidden="true" />
      <span className="loader__label">{label}</span>
    </div>
  );
}
