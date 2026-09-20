import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useLogoutMutation } from "../../auth/authApi";
import Button from "../../../components/common/Button/Button";
import { ROUTES } from "../../../constants/route.constants";
import CompanyDropdown from "../../companies/components/CompanyDropdown";
import "../access.css";

const navItems = [
  {
    to: ROUTES.SETTINGS_OVERVIEW,
    label: "Overview",
    end: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: ROUTES.SETTINGS_USERS,
    label: "Users",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: ROUTES.SETTINGS_ROLES,
    label: "Roles",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    to: ROUTES.SETTINGS_PERMISSIONS,
    label: "Permissions",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    to: ROUTES.SETTINGS_COMPANIES,
    label: "Companies",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function AccessLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [logout, { isLoading }] = useLogoutMutation();

  const userInitial = (user?.fullName || user?.username || "A")[0].toUpperCase();
  const userRole = Array.isArray(user?.roles)
    ? (user.roles[0]?.name || user.roles[0]?.code || user.roles[0] || "User")
    : "Administrator";

  const isAdmin = Array.isArray(user?.roles)
    ? user.roles.some((r) => String(r?.code || r?.name || r).toUpperCase().includes("ADMIN"))
    : false;

  const isProducts = location.pathname.startsWith(ROUTES.PRODUCTS);
  const isPurchases = location.pathname.startsWith(ROUTES.PURCHASES);
  const isImports = location.pathname.startsWith(ROUTES.IMPORTS);
  const isSales = location.pathname.startsWith(ROUTES.SALES);
  const isStock = location.pathname.startsWith(ROUTES.STOCK);

  let crumbSegment = "Settings";
  let crumbActive = "User & Access Management";

  if (isProducts) {
    crumbSegment = "Workspace";
    crumbActive = "Inventory & Products Catalog";
  } else if (isPurchases) {
    crumbSegment = "Workspace";
    crumbActive = "Purchases & Vendor Invoices";
  } else if (isImports) {
    crumbSegment = "Workspace";
    crumbActive = "China Imports & LCL Logistics";
  } else if (isSales) {
    crumbSegment = "Workspace";
    crumbActive = "Sales & Invoicing (GST / Non-GST)";
  } else if (isStock) {
    crumbSegment = "Workspace";
    crumbActive = "Stock & Inventory Management";
  } else if (location.pathname === ROUTES.SETTINGS_USERS) {
    crumbActive = "Users Directory";
  } else if (location.pathname === ROUTES.SETTINGS_ROLES) {
    crumbActive = "Roles & Access Control";
  } else if (location.pathname === ROUTES.SETTINGS_PERMISSIONS) {
    crumbActive = "System Permissions";
  } else if (location.pathname === ROUTES.SETTINGS_COMPANIES) {
    crumbActive = "Company Master";
  }

  return (
    <div className="access-shell">
      {/* Sidebar */}
      <aside className="access-sidebar">
        <Link className="access-brand" to={ROUTES.DASHBOARD}>
          <span className="access-brand__mark">TF</span>
          <div className="access-brand__text">
            <span className="brand-name">TradeFlow</span>
            <small className="brand-tag">ACCOUNTING &amp; ERP</small>
          </div>
        </Link>

        <div className="access-sidebar__nav">
          <div className="access-sidebar__section">
            <span className="access-sidebar__label">Workspace</span>
            <Link className="access-side-link" to={ROUTES.DASHBOARD}>
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </span>
              <span>Dashboard</span>
            </Link>
            <NavLink
              className={({ isActive }) =>
                `access-side-link${isActive ? " access-side-link--active" : ""}`
              }
              to={ROUTES.PRODUCTS}
            >
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span>Products</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `access-side-link${isActive ? " access-side-link--active" : ""}`
              }
              to={ROUTES.STOCK}
            >
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <span>Stock &amp; Inventory</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `access-side-link${isActive ? " access-side-link--active" : ""}`
              }
              to={ROUTES.PURCHASES}
            >
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span>Purchases</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `access-side-link${isActive ? " access-side-link--active" : ""}`
              }
              to={ROUTES.SALES}
            >
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span>Sales &amp; Invoices</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `access-side-link${isActive ? " access-side-link--active" : ""}`
              }
              to={ROUTES.IMPORTS}
            >
              <span className="side-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                  <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
                  <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
                  <line x1="12" y1="1" x2="12" y2="5" />
                </svg>
              </span>
              <span>China Imports (LCL)</span>
            </NavLink>
          </div>

          {isAdmin && (
            <div className="access-sidebar__section">
              <span className="access-sidebar__label">Settings &amp; Access</span>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `access-side-link${isActive ? " access-side-link--active" : ""}`
                  }
                  to={item.to}
                >
                  <span className="side-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="access-sidebar__footer">
          <span className="access-help-icon">?</span>
          <div className="footer-meta">
            <strong>Need assistance?</strong>
            <small>Contact administrator</small>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="access-workspace">
        <header className="access-topbar">
          <div className="access-breadcrumb">
            <span className="crumb-segment">{crumbSegment}</span>
            <span className="crumb-separator">/</span>
            <strong className="crumb-active">{crumbActive}</strong>
          </div>

          <div className="access-topbar__actions">
            <CompanyDropdown />

            <div className="access-user">
              <span className="access-user__avatar">{userInitial}</span>
              <div className="access-user__info">
                <strong>{user?.fullName || user?.username || "Admin User"}</strong>
                <small>{userRole}</small>
              </div>
            </div>

            <Button variant="ghost" className="btn-signout" isLoading={isLoading} onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="access-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}