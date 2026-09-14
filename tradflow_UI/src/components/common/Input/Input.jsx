import { forwardRef } from "react";
import "./Input.css";

// forwardRef so react-hook-form's register() can attach directly to the
// underlying <input>.
const Input = forwardRef(function Input(
  { label, id, error, hint, endAdornment, ...rest },
  ref
) {
  return (
    <div className="field">
      {label ? (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className={`field__control${error ? " field__control--error" : ""}`}>
        <input ref={ref} id={id} className="field__input" {...rest} />
        {endAdornment ? <div className="field__adornment">{endAdornment}</div> : null}
      </div>
      {error ? (
        <p className="field__message field__message--error">{error}</p>
      ) : hint ? (
        <p className="field__message">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
