import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout";
import ResetPasswordForm from "../components/ResetPasswordForm";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useResetPasswordMutation } from "../authApi";
import { normalizeApiError } from "../../../services/api/apiErrorHandler";
import { ROUTES } from "../../../constants/route.constants";
import "../auth.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(values) {
    setSubmitError("");
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      setDone(true);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 1800);
    } catch (err) {
      setSubmitError(normalizeApiError(err).message);
    }
  }

  if (!token) {
    return (
      <AuthLayout eyebrow="Account recovery" title="Reset link invalid">
        <ErrorMessage>
          This reset link is missing or malformed. Request a new one from the sign-in page.
        </ErrorMessage>
        <p className="auth-form__footnote" style={{ marginTop: "var(--space-5)" }}>
          <Link to={ROUTES.FORGOT_PASSWORD}>Request a new link</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Account recovery" title="Choose a new password">
      {done ? (
        <div className="auth-form__success">Password updated. Redirecting you to sign in…</div>
      ) : (
        <ResetPasswordForm onSubmit={handleSubmit} isSubmitting={isLoading} submitError={submitError} />
      )}
    </AuthLayout>
  );
}
