import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/route.constants";

function normalizeRoleName(role) {
  if (!role) {
    return "";
  }

  if (typeof role === "object") {
    return String(role.code ?? role.name ?? role.role ?? "");
  }

  return String(role);
}

export default function AdminRoute() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.some((role) => {
    const roleName = normalizeRoleName(role).toUpperCase();
    return roleName === "ADMIN" || roleName.includes("ADMIN");
  });

  if (!isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}