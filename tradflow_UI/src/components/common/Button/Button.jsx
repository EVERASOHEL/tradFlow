import "./Button.css";

const VARIANT_CLASS = {
  primary:   "btn btn--primary",
  secondary: "btn btn--secondary",
  ghost:     "btn btn--ghost",
};

const SIZE_CLASS = {
  sm: "btn--sm",
  md: "btn--md",
};

export default function Button({
  children,
  variant  = "primary",
  size     = "md",
  type     = "button",
  isLoading = false,
  disabled  = false,
  fullWidth = false,
  className = "",
  ...rest
}) {
  const base    = VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary;
  const sizeCls = SIZE_CLASS[size] ?? "";

  return (
    <button
      type={type}
      className={[base, sizeCls, fullWidth ? "btn--full" : "", className].filter(Boolean).join(" ")}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className={isLoading ? "btn__label btn__label--loading" : "btn__label"}>
        {children}
      </span>
    </button>
  );
}
