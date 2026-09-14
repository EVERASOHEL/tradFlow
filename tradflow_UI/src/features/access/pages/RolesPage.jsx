import { useMemo, useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import {
  useCreateRoleMutation,
  useDeactivateRoleMutation,
  useGetPermissionsQuery,
  useGetRoleQuery,
  useGetRolesQuery,
  useUpdateRoleMutation,
} from "../accessApi";

function records(data) {
  return Array.isArray(data) ? data : data?.content ?? data?.data ?? [];
}

const EMPTY = { code: "", name: "", description: "", active: true };

export default function RolesPage() {
  const { data, isLoading, error }    = useGetRolesQuery();
  const { data: permissionsData }     = useGetPermissionsQuery();
  const [createRole, createState]     = useCreateRoleMutation();
  const [updateRole, updateState]     = useUpdateRoleMutation();
  const [deactivateRole]              = useDeactivateRoleMutation();
  const [draft, setDraft]             = useState(null);
  const [viewingRoleId, setViewingId] = useState(null);
  const [search, setSearch]           = useState("");

  const allRoles   = records(data);
  const permissions = records(permissionsData);

  const { data: roleDetail, isLoading: roleDetailLoading, error: roleDetailError } =
    useGetRoleQuery(viewingRoleId, { skip: !viewingRoleId });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allRoles;
    return allRoles.filter((r) =>
      [r.name, r.code, r.description]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term))
    );
  }, [allRoles, search]);

  const save = async (event) => {
    event.preventDefault();
    const values  = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...values, active: values.active === "on" };
    try {
      if (draft.id) await updateRole({ id: draft.id, ...payload }).unwrap();
      else          await createRole(payload).unwrap();
      setDraft(null);
    } catch { /* errors shown in dialog */ }
  };

  return (
    <>
      {/* ── Heading ── */}
      <div className="access-page-heading">
        <div>
          <p className="access-kicker">Settings / Access groups</p>
          <h1>Roles</h1>
          <p>Group permissions into clear, reusable access profiles.</p>
        </div>
        <Button size="sm" onClick={() => setDraft(EMPTY)}>
          + Create role
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="access-toolbar">
        <div style={{ position: "relative", flex: "1", maxWidth: "340px" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="access-search"
            style={{ paddingLeft: 32, width: "100%" }}
            placeholder="Search roles by name, code, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search roles"
          />
        </div>
        <span className="access-toolbar__meta">
          <strong>{filtered.length}</strong> of {allRoles.length} roles
        </span>
      </div>

      {/* ── Table card ── */}
      <section className="management-card">
        <ErrorMessage>{error?.data?.message || error?.error || ""}</ErrorMessage>

        {isLoading ? (
          <p className="access-empty">Loading roles…</p>
        ) : filtered.length === 0 ? (
          <p className="access-empty">
            {search ? "No roles match your search." : "No roles found."}
          </p>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Role Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((role, idx) => (
                  <tr key={role.id}>
                    <td style={{ color: "#94a3b8", fontSize: 11, width: 36 }}>{idx + 1}</td>
                    <td><strong>{role.name}</strong></td>
                    <td><code>{role.code}</code></td>
                    <td style={{ color: "#64748b", maxWidth: 260 }}>
                      {role.description || <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td>
                      <button
                        className="permission-count-button"
                        onClick={() => setViewingId(role.id)}
                        title="View permissions"
                      >
                        {role.permissions?.length ?? 0}&nbsp;
                        <span aria-hidden="true">→</span>
                      </button>
                    </td>
                    <td>
                      <span className={role.active
                        ? "access-status access-status--active"
                        : "access-status access-status--inactive"}>
                        {role.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="management-action" onClick={() => setViewingId(role.id)}>
                        View
                      </button>
                      <button className="management-action" onClick={() => setDraft(role)}>
                        Edit
                      </button>
                      <button
                        className="management-action management-action--danger"
                        onClick={() => {
                          if (window.confirm(`Deactivate role "${role.name}"?`))
                            deactivateRole(role.id);
                        }}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Role form dialog ── */}
      {draft && (
        <RoleDialog
          draft={draft}
          permissions={permissions}
          onClose={() => setDraft(null)}
          onSave={save}
          isLoading={createState.isLoading || updateState.isLoading}
        />
      )}

      {/* ── Permissions viewer ── */}
      {viewingRoleId && (
        <RolePermissionsDialog
          role={roleDetail}
          permissions={permissions}
          isLoading={roleDetailLoading}
          error={roleDetailError}
          onClose={() => setViewingId(null)}
        />
      )}
    </>
  );
}

/* ── Create / Edit dialog ─────────────────────────────────── */
function RoleDialog({ draft, onClose, onSave, isLoading }) {
  return (
    <div className="access-modal-backdrop">
      <form className="access-modal" onSubmit={onSave}>
        <div className="access-modal__head">
          <div>
            <p className="access-kicker">Access profile</p>
            <h2>{draft.id ? "Edit role" : "Create role"}</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label>
          Role code *
          <input name="code" defaultValue={draft.code} required maxLength={100} placeholder="e.g. ACCOUNTANT" />
        </label>
        <label>
          Role name *
          <input name="name" defaultValue={draft.name} required maxLength={150} placeholder="e.g. Accountant" />
        </label>
        <label>
          Description
          <textarea name="description" defaultValue={draft.description} rows={3} placeholder="Brief description of this role's purpose" />
        </label>
        <label className="access-checkbox">
          <input type="checkbox" name="active" defaultChecked={draft.active !== false} />
          Active
        </label>

        <div className="access-modal__actions">
          <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" isLoading={isLoading}>
            {draft.id ? "Save changes" : "Create role"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ── Permissions viewer dialog ───────────────────────────── */
function RolePermissionsDialog({ role, permissions, isLoading, error, onClose }) {
  const assigned = role?.permissions ?? [];
  const byCode   = new Map(permissions.map((p) => [p.code, p]));

  const grouped = assigned.reduce((acc, perm) => {
    const code     = typeof perm === "string" ? perm : perm.code;
    const resolved = typeof perm === "object" ? perm : byCode.get(code);
    const module   = resolved?.module || code?.split("_")[0] || "OTHER";
    (acc[module] ||= []).push({
      code,
      name:        resolved?.name        || code,
      description: resolved?.description || "",
    });
    return acc;
  }, {});

  return (
    <div className="access-modal-backdrop">
      <section className="access-modal permission-detail-modal" aria-labelledby="rpd-title">
        <div className="access-modal__head">
          <div>
            <p className="access-kicker">Associated access</p>
            <h2 id="rpd-title">{role?.name || "Role permissions"}</h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Permissions inherited by this role.
            </p>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {isLoading ? (
          <p className="access-empty">Loading permissions…</p>
        ) : error ? (
          <ErrorMessage>{error?.data?.message || error?.error || "Unable to load permissions."}</ErrorMessage>
        ) : assigned.length === 0 ? (
          <p className="access-empty">This role has no permissions assigned.</p>
        ) : (
          <div className="permission-detail__groups">
            {Object.entries(grouped).map(([module, items]) => (
              <div className="permission-detail__group" key={module}>
                <div className="permission-detail__module">
                  {module}
                  <span>{items.length}</span>
                </div>
                {items.map((p) => (
                  <div className="permission-detail__item" key={p.code}>
                    <span className="permission-detail__check">✓</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.code}
                        {p.description ? ` · ${p.description}` : ""}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="access-modal__actions">
          <Button size="sm" variant="secondary" type="button" onClick={onClose}>Close</Button>
        </div>
      </section>
    </div>
  );
}