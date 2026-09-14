import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { useForgotPasswordMutation } from "../authApi";
import { normalizeApiError } from "../../../services/api/apiErrorHandler";
import { ROUTES } from "../../../constants/route.constants";
import "../auth.css";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitError, setSubmitError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(values) {
    setSubmitError("");
    try {
      await forgotPassword({ username: values.username }).unwrap();
      setSentTo(values.username);
    } catch (err) {
      setSubmitError(normalizeApiError(err).message);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the username on your account and we'll send a reset link."
    >
      {sentTo ? (
        <div className="auth-form__success">
          If an account exists for {sentTo}, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <ForgotPasswordForm onSubmit={handleSubmit} isSubmitting={isLoading} submitError={submitError} />
      )}
      <p className="auth-form__footnote" style={{ marginTop: "var(--space-5)" }}>
        <Link to={ROUTES.LOGIN}>Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
