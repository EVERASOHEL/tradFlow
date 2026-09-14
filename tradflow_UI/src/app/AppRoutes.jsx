import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ProtectedRoute from "../components/guards/ProtectedRoute";
import AdminRoute from "../components/guards/AdminRoute";
import { ROUTES } from "../constants/route.constants";
import UsersPage from "../features/users/pages/UsersPage";
import AccessLayout from "../features/access/components/AccessLayout";
import AccessOverviewPage from "../features/access/pages/AccessOverviewPage";
import RolesPage from "../features/access/pages/RolesPage";
import PermissionsPage from "../features/access/pages/PermissionsPage";
import CompaniesPage from "../features/companies/pages/CompaniesPage";
import CompanySelectionPage from "../features/companies/pages/CompanySelectionPage";
import ProductsPage from "../features/products/pages/ProductsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.SELECT_COMPANY} element={<CompanySelectionPage />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route element={<AdminRoute />}>
          <Route element={<AccessLayout />}>
            <Route path={ROUTES.SETTINGS_OVERVIEW} element={<AccessOverviewPage />} />
            <Route path={ROUTES.SETTINGS_USERS} element={<UsersPage />} />
            <Route path={ROUTES.SETTINGS_ROLES} element={<RolesPage />} />
            <Route path={ROUTES.SETTINGS_PERMISSIONS} element={<PermissionsPage />} />
            <Route path={ROUTES.SETTINGS_COMPANIES} element={<CompaniesPage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
          </Route>
          <Route path={ROUTES.USERS} element={<Navigate to={ROUTES.SETTINGS_USERS} replace />} />
        </Route>
        {/* Every future protected feature route (company, product, sales…)
            goes inside this same <ProtectedRoute> element. */}
      </Route>

      <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.SETTINGS_OVERVIEW} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.SETTINGS_OVERVIEW} replace />} />
    </Routes>
  );
}
