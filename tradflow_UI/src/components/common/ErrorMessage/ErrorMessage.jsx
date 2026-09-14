import "./ErrorMessage.css";

export default function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <div className="error-banner" role="alert">
      {children}
    </div>
  );
}
