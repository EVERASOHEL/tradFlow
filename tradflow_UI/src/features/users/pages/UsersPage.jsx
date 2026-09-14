import { useMemo, useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import UserForm from "../components/UserForm";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
} from "../usersApi";
import { useGetRolesQuery } from "../../access/accessApi";
import "../users.css";

/* ── helpers ─────────────────────────────────────────────────── */
function getRecords(data) {
  return Array.isArray(data)
    ? data
    : data?.content ?? data?.users ?? data?.data ?? [];
}

function resolveRole(user, roles) {
  const assigned = user.roles ?? user.role;
  const role = Array.isArray(assigned) ? assigned[0] : assigned;
  if (role && typeof role === "object") return role;
  return roles.find((r) => r.id === role || r.code === role) ?? null;
}

function statusLabel(user) {
  if (user.accountLocked) return "Locked";
  return user.active ? "Active" : "Inactive";
}

function statusClass(user) {
  if (user.accountLocked) return "user-status user-status--locked";
  return user.active ? "user-status user-status--active" : "user-status user-status--inactive";
}

function roleBadgeClass(role) {
  const code = String(role?.code || "").toLowerCase();
  if (code.includes("admin"))      return "role-badge role-badge--admin";
  if (code.includes("accountant")) return "role-badge role-badge--accountant";
  if (code.includes("manager"))    return "role-badge role-badge--manager";
  if (code.includes("staff"))      return "role-badge role-badge--staff";
  return "role-badge role-badge--default";
}

function initials(user) {
  return (user.fullName || user.username || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function permissionCount(user, role) {
  return Array.isArray(user.permissions)
    ? user.permissions.length
    : Array.isArray(role?.permissions)
    ? role.permissions.length
    : 0;
}

/* ── Component ───────────────────────────────────────────────── */
export default function UsersPage() {
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error, refetch } = useGetUsersQuery();
  const { data: rolesData }                 = useGetRolesQuery();
  const [createUser, createState]           = useCreateUserMutation();
  const [updateUser, updateState]           = useUpdateUserMutation();
  const [deleteUser]                        = useDeleteUserMutation();

  const users = getRecords(data);
  const roles = getRecords(rolesData);

  /* filtering */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const role = resolveRole(u, roles);
      if (term) {
        const haystack = [
          u.username, u.email, u.fullName,
          role?.name, role?.code,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (roleFilter) {
        const rc = role?.code ?? role?.id ?? "";
        if (String(rc) !== roleFilter) return false;
      }
      if (statusFilter === "active")   return !u.accountLocked && u.active;
      if (statusFilter === "inactive") return !u.accountLocked && !u.active;
      if (statusFilter === "locked")   return Boolean(u.accountLocked);
      return true;
    });
  }, [users, roles, search, roleFilter, statusFilter]);

  const handleSubmit = async (payload) => {
    try {
      if (editingUser) await updateUser(payload).unwrap();
      else             await createUser(payload).unwrap();
      setShowForm(false);
      setEditingUser(null);
    } catch { /* errors rendered inside UserForm */ }
  };

  const handleDeactivate = async (user) => {
    const action = user.active ? "Deactivate" : "Activate";
    if (window.confirm(`${action} user "${user.fullName || user.username}"?`)) {
      await deleteUser(user.id).unwrap().catch(() => {});
    }
  };

  const openCreate = () => { setEditingUser(null); setShowForm(true); };
  const openEdit   = (u) => { setEditingUser(u);   setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditingUser(null); };

  return (
    <div className="users-page">
      {/* ── Heading ── */}
      <div className="users-page-heading">
        <div>
          <p className="access-kicker">Settings / Users</p>
          <h1>User &amp; Access Management</h1>
          <p>Manage users, assign roles and control access for your organisation.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add user
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="users-toolbar">
        {/* search */}
        <div className="users-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="users-search-input"
            placeholder="Search by name, email, username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
          {search && (
            <button className="users-search-clear" onClick={() => setSearch("")} aria-label="Clear">×</button>
          )}
        </div>

        {/* role filter */}
        <select
          className="users-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.code ?? r.id}>{r.name}</option>
          ))}
        </select>

        {/* status filter */}
        <select
          className="users-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="locked">Locked</option>
        </select>

        <span className="users-toolbar-meta">
          <strong>{filtered.length}</strong> of {users.length} users
        </span>

        <button
          className="users-refresh-btn"
          onClick={refetch}
          title="Refresh"
          aria-label="Refresh directory"
        >
          ↻
        </button>
      </div>

      <ErrorMessage>{error?.data?.message || error?.error || ""}</ErrorMessage>

      {/* ── Table card ── */}
      <section className="users-card" aria-label="User directory">
        {isLoading ? (
          <p className="users-empty-state">Loading users…</p>
        ) : filtered.length === 0 ? (
          <p className="users-empty-state">
            {search || roleFilter || statusFilter
              ? "No users match the current filters."
              : "No users found. Add a user to get started."}
          </p>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="col-serial">#</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const role = resolveRole(user, roles);
                  const pc   = permissionCount(user, role);
                  return (
                    <tr key={user.id}>
                      <td className="col-serial">{idx + 1}</td>

                      <td>
                        <span className="user-cell">
                          <span className="user-avatar">{initials(user)}</span>
                          <span className="user-cell-meta">
                            <strong>{user.fullName || "Unnamed"}</strong>
                            <small>{user.email}</small>
                          </span>
                        </span>
                      </td>

                      <td>
                        <span className="username-pill">{user.username || "—"}</span>
                      </td>

                      <td>
                        <span className={roleBadgeClass(role)}>
                          {role?.name || role?.code || "No role"}
                        </span>
                      </td>

                      <td>
                        <span className="perm-count-btn">
                          {pc}&nbsp;<small style={{ fontWeight: 400, color: "#7c3aed" }}>perms</small>
                        </span>
                      </td>

                      <td>
                        <span className={statusClass(user)}>
                          <span className="user-status__dot" />
                          {statusLabel(user)}
                        </span>
                      </td>

                      <td>
                        <span className="users-action-group">
                          <button
                            className="user-action-btn"
                            onClick={() => openEdit(user)}
                            aria-label={`Edit ${user.fullName || user.username}`}
                          >
                            Edit
                          </button>
                          <button
                            className={user.active
                              ? "user-action-btn user-action-btn--danger"
                              : "user-action-btn user-action-btn--success"}
                            onClick={() => handleDeactivate(user)}
                            aria-label={`${user.active ? "Deactivate" : "Activate"} ${user.fullName || user.username}`}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* footer info */}
        {!isLoading && users.length > 0 && (
          <div className="users-table-footer">
            <span className="users-table-footer-info">
              Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
            </span>
          </div>
        )}
      </section>

      {/* ── Form modal ── */}
      {showForm && (
        <div className="user-form-backdrop">
          <div className="user-form-dialog">
            <UserForm
              user={editingUser}
              onCancel={closeForm}
              onSubmit={handleSubmit}
              isLoading={createState.isLoading || updateState.isLoading}
              error={createState.error || updateState.error}
            />
          </div>
        </div>
      )}
    </div>
  );
}
