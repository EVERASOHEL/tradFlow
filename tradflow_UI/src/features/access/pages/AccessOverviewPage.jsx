import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/route.constants";
import { useGetRolesQuery, useGetPermissionsQuery } from "../accessApi";
import { useGetUsersQuery } from "../../users/usersApi";

function list(value) {
  return Array.isArray(value) ? value : value?.content ?? value?.data ?? [];
}

export default function AccessOverviewPage() {
  const { data: usersData,       isLoading: uL } = useGetUsersQuery();
  const { data: rolesData,       isLoading: rL } = useGetRolesQuery();
  const { data: permissionsData, isLoading: pL } = useGetPermissionsQuery();

  const users       = list(usersData);
  const roles       = list(rolesData);
  const permissions = list(permissionsData);
  const activeUsers = users.filter((u) => u.active && !u.accountLocked).length;
  const activeRoles = roles.filter((r) => r.active !== false).length;

  return (
    <>
      {/* ── Heading ── */}
      <div className="access-page-heading">
        <div>
          <p className="access-kicker">Settings / Overview</p>
          <h1>User &amp; Access Management</h1>
          <p>Manage users, roles, and system permissions from one secure workspace.</p>
        </div>
        <Link
          to={ROUTES.SETTINGS_USERS}
          className="btn btn--primary btn--sm"
        >
          Manage users →
        </Link>
      </div>

      {/* ── KPI tiles ── */}
      <div className="access-stat-grid" style={{ marginBottom: 20 }}>
        <StatTile
          label="Total Users"
          value={uL ? "…" : users.length}
          note={uL ? "" : `${activeUsers} active`}
          accent="#2563eb"
          bg="#eff6ff"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />
        <StatTile
          label="Active Users"
          value={uL ? "…" : activeUsers}
          note={uL ? "" : `${users.length - activeUsers} inactive/locked`}
          accent="#15803d"
          bg="#f0fdf4"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />
        <StatTile
          label="Roles Configured"
          value={rL ? "…" : roles.length}
          note={rL ? "" : `${activeRoles} active`}
          accent="#6d28d9"
          bg="#f5f3ff"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
        />
        <StatTile
          label="Permissions"
          value={pL ? "…" : permissions.length}
          note={pL ? "" : "Available capabilities"}
          accent="#b45309"
          bg="#fffbeb"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          }
        />
      </div>

      {/* ── Recent panels ── */}
      <div className="access-overview-grid">

        {/* Recent users */}
        <div className="access-card access-recent-card">
          <div className="access-card__heading">
            <div>
              <p className="access-kicker">Directory</p>
              <h2>Recent Users</h2>
            </div>
            <Link to={ROUTES.SETTINGS_USERS} style={{ color: "#2563eb", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
              View all
            </Link>
          </div>
          {users.length === 0 ? (
            <p className="access-empty" style={{ padding: "16px 0" }}>No users yet.</p>
          ) : (
            users.slice(0, 6).map((u) => (
              <div className="access-list-row" key={u.id}>
                <span className="access-list-avatar">
                  {(u.fullName || u.username || "U")[0].toUpperCase()}
                </span>
                <span className="access-list-main" style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {u.fullName || u.username}
                  </strong>
                  <small style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {u.email}
                  </small>
                </span>
                <span className={u.active && !u.accountLocked
                  ? "access-status access-status--active"
                  : "access-status access-status--inactive"}>
                  {u.accountLocked ? "Locked" : u.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent roles */}
        <div className="access-card access-recent-card">
          <div className="access-card__heading">
            <div>
              <p className="access-kicker">Access groups</p>
              <h2>Roles</h2>
            </div>
            <Link to={ROUTES.SETTINGS_ROLES} style={{ color: "#2563eb", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
              View all
            </Link>
          </div>
          {roles.length === 0 ? (
            <p className="access-empty" style={{ padding: "16px 0" }}>No roles yet.</p>
          ) : (
            roles.slice(0, 6).map((r) => (
              <div className="access-list-row" key={r.id}>
                <span className="access-list-icon" style={{ borderRadius: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                <span className="access-list-main" style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.name}</strong>
                  <small>{r.description || r.code}</small>
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "#6d28d9",
                  background: "#f5f3ff", border: "1px solid #ddd6fe",
                  padding: "2px 6px", borderRadius: 5,
                }}>
                  {r.permissions?.length ?? 0} perms
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent permissions */}
        <div className="access-card access-recent-card">
          <div className="access-card__heading">
            <div>
              <p className="access-kicker">Capabilities</p>
              <h2>Permissions</h2>
            </div>
            <Link to={ROUTES.SETTINGS_PERMISSIONS} style={{ color: "#2563eb", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
              View all
            </Link>
          </div>
          {permissions.length === 0 ? (
            <p className="access-empty" style={{ padding: "16px 0" }}>No permissions yet.</p>
          ) : (
            permissions.slice(0, 6).map((p) => (
              <div className="access-list-row" key={p.id}>
                <span className="access-list-icon access-list-icon--dark" style={{ borderRadius: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <span className="access-list-main" style={{ flex: 1, minWidth: 0 }}>
                  <strong>{p.name}</strong>
                  <small>{p.description || p.code}</small>
                </span>
                {p.module && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "#1d4ed8",
                    background: "#eff6ff", padding: "2px 6px", borderRadius: 4,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {p.module}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Security banner ── */}
      <section className="access-security-banner">
        <span className="access-security-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <div>
          <p className="access-kicker">Security status</p>
          <h2>Access controls are centralized</h2>
          <p>Permissions are inherited through roles. Keep assignments focused and review access regularly.</p>
        </div>
        <span className="access-status access-status--active" style={{ marginLeft: "auto" }}>Protected</span>
      </section>
    </>
  );
}

/* ── Stat tile ───────────────────────────────────────────── */
function StatTile({ label, value, note, accent, bg, icon }) {
  return (
    <div className="access-stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="access-stat-icon" style={{ background: bg, color: accent }}>
        {icon}
      </span>
      <div>
        <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <strong style={{ fontSize: 24 }}>{value}</strong>
        <small style={{ color: "#94a3b8" }}>{note}</small>
      </div>
    </div>
  );
}