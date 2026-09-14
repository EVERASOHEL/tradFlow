import { useMemo, useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import {
  useCreatePermissionMutation,
  useDeactivatePermissionMutation,
  useGetPermissionsQuery,
  useUpdatePermissionMutation,
} from "../accessApi";

function records(data) {
  return Array.isArray(data) ? data : data?.content ?? data?.data ?? [];
}

const EMPTY = { code: "", name: "", module: "", description: "", active: true };

export default function PermissionsPage() {
  const { data, isLoading, error }            = useGetPermissionsQuery();
  const permissions                           = records(data);
  const [createPermission, createState]       = useCreatePermissionMutation();
  const [updatePermission, updateState]       = useUpdatePermissionMutation();
  const [deactivatePermission]                = useDeactivatePermissionMutation();
  const [draft, setDraft]                     = useState(null);
  const [search, setSearch]                   = useState("");
  const [moduleFilter, setModuleFilter]       = useState("");
  const [statusFilter, setStatusFilter]       = useState("");

  /* derive module list for filter */
  const moduleList = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.module).filter(Boolean))).sort(),
    [permissions]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return permissions.filter((p) => {
      if (term && ![p.code, p.name, p.module, p.description].filter(Boolean).some((v) =>
        v.toLowerCase().includes(term)
      )) return false;
      if (moduleFilter && p.module !== moduleFilter) return false;
      if (statusFilter === "active")   return p.active !== false;
      if (statusFilter === "inactive") return p.active === false;
      return true;
    });
  }, [permissions, search, moduleFilter, statusFilter]);

  const save = async (event) => {
    event.preventDefault();
    const values  = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...values, active: values.active === "on" };
    try {
      if (draft.id) await updatePermission({ id: draft.id, ...payload }).unwrap();
      else          await createPermission(payload).unwrap();
      setDraft(null);
    } catch { /* errors shown in dialog */ }
  };

  return (
    <>
      {/* ── Heading ── */}
      <div className="access-page-heading">
        <div>
          <p className="access-kicker">Settings / Capabilities</p>
          <h1>Permissions</h1>
          <p>Define the capabilities that roles can grant across TradeFlow.</p>
        </div>
        <Button size="sm" onClick={() => setDraft(EMPTY)}>
          + Create permission
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="access-toolbar">
        {/* search */}
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
            placeholder="Search by code, name or module…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search permissions"
          />
        </div>

        {/* module filter */}
        <select
          className="users-filter-select"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          aria-label="Filter by module"
          style={{ height: 34, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#334155", fontSize: 12, outline: "none" }}
        >
          <option value="">All modules</option>
          {moduleList.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* status filter */}
        <select
          className="users-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          style={{ height: 34, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#334155", fontSize: 12, outline: "none" }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <span className="access-toolbar__meta">
          <strong>{filtered.length}</strong> of {permissions.length} permissions
        </span>
      </div>

      <ErrorMessage>{error?.data?.message || error?.error || ""}</ErrorMessage>

      {/* ── Dense flat table ── */}
      <section className="management-card">
        {isLoading ? (
          <p className="access-empty">Loading permissions…</p>
        ) : filtered.length === 0 ? (
          <p className="access-empty">
            {search || moduleFilter || statusFilter
              ? "No permissions match the current filters."
              : "No permissions found."}
          </p>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Module</th>
                  <th>Permission Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: "#94a3b8", fontSize: 11, width: 36 }}>{idx + 1}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}>
                        {item.module || "—"}
                      </span>
                    </td>
                    <td><strong>{item.name}</strong></td>
                    <td><code>{item.code}</code></td>
                    <td style={{ color: "#64748b", maxWidth: 280, fontSize: 11 }}>
                      {item.description || <span style={{ color: "#cbd5e1" }}>No description</span>}
                    </td>
                    <td>
                      <span className={item.active !== false
                        ? "access-status access-status--active"
                        : "access-status access-status--inactive"}>
                        {item.active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="management-action" onClick={() => setDraft(item)}>
                        Edit
                      </button>
                      <button
                        className="management-action management-action--danger"
                        onClick={() => {
                          if (window.confirm(`Deactivate permission "${item.name}"?`))
                            deactivatePermission(item.id);
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

      {/* ── Dialog ── */}
      {draft && (
        <PermissionDialog
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={save}
          isLoading={createState.isLoading || updateState.isLoading}
          moduleList={moduleList}
        />
      )}
    </>
  );
}

/* ── Create / Edit dialog ─────────────────────────────────── */
function PermissionDialog({ draft, onClose, onSave, isLoading, moduleList }) {
  return (
    <div className="access-modal-backdrop">
      <form className="access-modal" onSubmit={onSave}>
        <div className="access-modal__head">
          <div>
            <p className="access-kicker">Capability definition</p>
            <h2>{draft.id ? "Edit permission" : "Create permission"}</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label>
          Permission code *
          <input name="code" defaultValue={draft.code} required maxLength={100} placeholder="e.g. USER_CREATE" />
        </label>
        <label>
          Permission name *
          <input name="name" defaultValue={draft.name} required maxLength={150} placeholder="e.g. Create User" />
        </label>
        <label>
          Module *
          <input
            name="module"
            list="perm-module-list"
            defaultValue={draft.module}
            required
            maxLength={50}
            placeholder="e.g. USER"
          />
          <datalist id="perm-module-list">
            {moduleList.map((m) => <option key={m} value={m} />)}
          </datalist>
        </label>
        <label>
          Description
          <textarea name="description" defaultValue={draft.description} rows={3} placeholder="What does this permission allow?" />
        </label>
        <label className="access-checkbox">
          <input type="checkbox" name="active" defaultChecked={draft.active !== false} />
          Active
        </label>

        <div className="access-modal__actions">
          <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" isLoading={isLoading}>
            {draft.id ? "Save changes" : "Create permission"}
          </Button>
        </div>
      </form>
    </div>
  );
}