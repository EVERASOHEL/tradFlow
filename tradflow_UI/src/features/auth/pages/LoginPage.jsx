import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AuthLayout from "../../../components/layout/AuthLayout";
import LoginForm from "../components/LoginForm";
import { useLoginMutation } from "../authApi";
import { normalizeApiError } from "../../../services/api/apiErrorHandler";
import { selectSessionExpiredNotice } from "../authSelectors";
import { ROUTES } from "../../../constants/route.constants";

function normalizeRoleName(role) {
  if (!role) {
    return "";
  }

  if (typeof role === "object") {
    return String(role.code ?? role.name ?? role.role ?? "");
  }

  return String(role);
}

function isAdminUserFromRoles(roles) {
  return Array.isArray(roles)
    ? roles.some((role) => normalizeRoleName(role).toUpperCase().includes("ADMIN"))
    : false;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [submitError, setSubmitError] = useState("");
  const sessionExpiredNotice = useSelector(selectSessionExpiredNotice);

  async function handleSubmit(values) {
    setSubmitError("");
    try {
      const response = await login({ username: values.username, password: values.password }).unwrap();
      const payload = response?.responseObj ?? response?.data ?? response;
      const nextRoute = isAdminUserFromRoles(payload?.roles)
        ? ROUTES.SETTINGS_OVERVIEW
        : ROUTES.SELECT_COMPANY;

      navigate(nextRoute, { replace: true });
    } catch (err) {
      setSubmitError(normalizeApiError(err).message);
    }
  }

  return (
    <AuthLayout
      variant="login"
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      subtitle="Use the username and password issued by your company admin."
    >
      {sessionExpiredNotice && !submitError ? (
        <p className="auth-form__footnote" style={{ marginBottom: "var(--space-4)" }}>
          You were signed out because your session expired. Please sign in again.
        </p>
      ) : null}
      <LoginForm onSubmit={handleSubmit} isSubmitting={isLoading} submitError={submitError} />
    </AuthLayout>
  );
}
