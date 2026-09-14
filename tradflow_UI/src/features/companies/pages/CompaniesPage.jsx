import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import { ROUTES } from "../../../constants/route.constants";
import { useCreateCompanyMutation, useDeleteCompanyMutation, useGetCompaniesQuery, useUpdateCompanyMutation } from "../companiesApi";
import "../companies.css";

function getRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.responseObj)) return data.responseObj;
  return [];
}

const EMPTY = {
  companyCode: "",
  companyName: "",
  tradeName: "",
  gstin: "",
  pan: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateId: "",
  pincode: "",
  country: "India",
  currencyCode: "INR",
  financialYearStart: "",
  active: true,
};

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { selectCompany } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ company: "", state: "", city: "" });
  const pageSize = 50;

  const handleLaunchCompany = (company) => {
    selectCompany(company);
    navigate(ROUTES.DASHBOARD);
  };

  const { data, isLoading, error, refetch } = useGetCompaniesQuery({
    page: Math.max(page - 1, 0),
    size: pageSize,
    company: filters.company,
    state: filters.state,
    city: filters.city,
  });

  const companies = getRecords(data);
  const recordsTotal = Number(data?.totalCount ?? data?.count ?? data?.total ?? data?.totalElements ?? companies.length ?? 0);
  const [createCompany, createState] = useCreateCompanyMutation();
  const [updateCompany, updateState] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();

  const companyOptions = useMemo(() => Array.from(new Set(companies.map((company) => company.companyName).filter(Boolean))).sort(), [companies]);
  const stateOptions = useMemo(() => Array.from(new Set(companies.map((company) => String(company.stateId ?? company.state ?? "")).filter(Boolean))).sort(), [companies]);
  const cityOptions = useMemo(() => Array.from(new Set(companies.map((company) => company.city).filter(Boolean))).sort(), [companies]);

  const hasActiveFilters = Boolean(filters.company || filters.state || filters.city);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;

    return companies.filter((company) =>
      [company.companyCode, company.companyName, company.tradeName, company.city, company.country, company.email, String(company.stateId ?? company.state ?? "")]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [companies, search]);

  const totalPages = Math.max(1, Math.ceil((recordsTotal || filtered.length) / pageSize));
  const safePage = Math.min(page, totalPages);

  const handleSave = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...values,
      stateId: values.stateId ? Number(values.stateId) : null,
      active: values.active === "on",
      financialYearStart: values.financialYearStart || null,
    };

    try {
      if (draft?.id) {
        await updateCompany({ id: draft.id, ...payload }).unwrap();
      } else {
        await createCompany(payload).unwrap();
      }
      setDraft(null);
      setPage(1);
      refetch();
    } catch {
      // Error is displayed in the dialog through the mutation error prop.
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deactivate this company? This will mark it as inactive.")) {
      await deleteCompany(id).unwrap();
      setPage(1);
      refetch();
    }
  };

  return (
    <div className="company-page">
      {/* Page Header */}
      <div className="company-page-heading">
        <div>
          <p className="access-kicker">Settings / Companies</p>
          <h1>Companies</h1>
        </div>
        <Button size="sm" onClick={() => setDraft(EMPTY)}>
          + Create company
        </Button>
      </div>

      {/* Toolbar: Search, Filters & Counter */}
      <div className="company-toolbar">
        <div className="company-toolbar__left">
          <div className="company-search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="company-search-input"
              placeholder="Search by code, company, trade name, city..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            className={`company-filter-toggle-btn ${filterOpen ? "company-filter-toggle-btn--active" : ""}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <span className="filter-icon" aria-hidden="true">⚙</span>
            <span>Filters</span>
            {hasActiveFilters && <span className="filter-count-badge">Active</span>}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="company-filter-reset-link"
              onClick={() => {
                setFilters({ company: "", state: "", city: "" });
                setPage(1);
              }}
            >
              Reset filters
            </button>
          )}
        </div>
        <div className="company-toolbar__right">
          <span className="company-count-badge">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "company" : "companies"}
          </span>
          <button
            type="button"
            className="company-refresh-btn"
            onClick={refetch}
            title="Refresh directory"
            aria-label="Refresh directory"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {filterOpen && (
        <div className="company-filter-panel">
          <div className="company-filter-panel__header">
            <span className="filter-panel-title">Filter by Attributes</span>
            <button
              type="button"
              className="filter-panel-close"
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>
          <div className="company-filter-grid">
            <label className="filter-control">
              <span className="filter-control__label">Company</span>
              <select
                className="filter-control__select"
                value={filters.company}
                onChange={(event) => setFilters({ ...filters, company: event.target.value })}
              >
                <option value="">All companies</option>
                {companyOptions.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              <span className="filter-control__label">State ID</span>
              <select
                className="filter-control__select"
                value={filters.state}
                onChange={(event) => setFilters({ ...filters, state: event.target.value })}
              >
                <option value="">All states</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              <span className="filter-control__label">City</span>
              <select
                className="filter-control__select"
                value={filters.city}
                onChange={(event) => setFilters({ ...filters, city: event.target.value })}
              >
                <option value="">All cities</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <div className="filter-actions">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => {
                  setFilters({ company: "", state: "", city: "" });
                  setPage(1);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  setPage(1);
                  setFilterOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      <ErrorMessage>
        {error?.data?.message || error?.error || createState.error?.data?.message || updateState.error?.data?.message || ""}
      </ErrorMessage>

      {/* Main Table Card */}
      <section className="company-card">
        {isLoading ? (
          <p className="access-empty" style={{ padding: "40px", textAlign: "center" }}>Loading companies...</p>
        ) : filtered.length === 0 ? (
          <p className="access-empty" style={{ padding: "40px", textAlign: "center" }}>No companies found matching criteria.</p>
        ) : (
          <div className="company-table-wrap">
            <table className="company-table">
              <thead>
                <tr>
                  <th className="col-code">Code</th>
                  <th className="col-name">Company</th>
                  <th className="col-trade">Trade Name</th>
                  <th className="col-email">Email</th>
                  <th className="col-phone">Phone</th>
                  <th className="col-city">City</th>
                  <th className="col-state">State</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => (
                  <tr key={company.id}>
                    <td className="col-code">
                      <code>{company.companyCode}</code>
                    </td>
                    <td className="col-name">
                      <button
                        type="button"
                        className="company-name-link"
                        onClick={() => handleLaunchCompany(company)}
                        title="Open and work in this company workspace"
                      >
                        <span>{company.companyName}</span>
                        <span className="company-link-arrow">↗</span>
                      </button>
                    </td>
                    <td className="col-trade">{company.tradeName || "—"}</td>
                    <td className="col-email">{company.email || "—"}</td>
                    <td className="col-phone">{company.phone || "—"}</td>
                    <td className="col-city">{company.city || "—"}</td>
                    <td className="col-state">{company.stateId ?? company.state ?? "—"}</td>
                    <td className="col-status">
                      <span className={`company-status-pill ${company.active ? "company-status-pill--active" : "company-status-pill--inactive"}`}>
                        {company.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="company-action-btn company-action-btn--primary"
                        onClick={() => handleLaunchCompany(company)}
                        title="Open workspace for this company"
                      >
                        Launch
                      </button>
                      <button
                        type="button"
                        className="company-action-btn"
                        onClick={() => setDraft(company)}
                        title="Edit company profile"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="company-action-btn company-action-btn--danger"
                        onClick={() => handleDelete(company.id)}
                        title="Deactivate company"
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

        {/* Integrated Pagination Footer */}
        {filtered.length > 0 && (
          <div className="company-table-footer">
            <div className="company-pagination-info">
              Showing <strong>{(safePage - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(safePage * pageSize, recordsTotal || filtered.length)}</strong> of{" "}
              <strong>{recordsTotal || filtered.length}</strong> companies
            </div>
            <div className="company-pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                ← Previous
              </button>
              <span className="pagination-pages">
                Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal Dialog */}
      {draft && (
        <CompanyDialog
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={handleSave}
          isLoading={createState.isLoading || updateState.isLoading}
          error={createState.error || updateState.error}
        />
      )}
    </div>
  );
}

function CompanyDialog({ draft, onClose, onSave, isLoading, error }) {
  return (
    <div className="access-modal-backdrop">
      <form className="company-modal-dialog" onSubmit={onSave}>
        <div className="company-modal-head">
          <div>
            <p className="access-kicker">Company profile</p>
            <h2>{draft?.id ? "Edit company" : "Create company"}</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>

        {error && (
          <ErrorMessage style={{ marginBottom: "14px" }}>
            {error?.data?.message || error?.error || "Unable to save company."}
          </ErrorMessage>
        )}

        <div className="company-dialog-grid">
          <div className="company-dialog-field">
            <label htmlFor="companyCode">Company Code *</label>
            <input id="companyCode" name="companyCode" defaultValue={draft.companyCode} required maxLength={30} placeholder="e.g. COMP001" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="companyName">Company Name *</label>
            <input id="companyName" name="companyName" defaultValue={draft.companyName} required maxLength={200} placeholder="Full Legal Name" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="tradeName">Trade Name</label>
            <input id="tradeName" name="tradeName" defaultValue={draft.tradeName} maxLength={200} placeholder="Operating/Brand Name" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" defaultValue={draft.email} type="email" maxLength={150} placeholder="accounts@example.com" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={draft.phone} maxLength={20} placeholder="+91-..." />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="gstin">GSTIN</label>
            <input id="gstin" name="gstin" defaultValue={draft.gstin} maxLength={15} placeholder="15-digit GSTIN" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="pan">PAN</label>
            <input id="pan" name="pan" defaultValue={draft.pan} maxLength={10} placeholder="10-digit PAN" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" defaultValue={draft.city} maxLength={100} placeholder="City" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="stateId">State ID</label>
            <input id="stateId" name="stateId" defaultValue={draft.stateId ?? ""} type="number" placeholder="State code or ID" />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="pincode">Pincode</label>
            <input id="pincode" name="pincode" defaultValue={draft.pincode} maxLength={10} placeholder="Postal Pincode" />
          </div>

          <div className="company-dialog-field full-width">
            <label htmlFor="addressLine1">Address Line 1</label>
            <input id="addressLine1" name="addressLine1" defaultValue={draft.addressLine1} maxLength={255} placeholder="Street address" />
          </div>

          <div className="company-dialog-field full-width">
            <label htmlFor="addressLine2">Address Line 2</label>
            <input id="addressLine2" name="addressLine2" defaultValue={draft.addressLine2} maxLength={255} placeholder="Suite, floor, etc." />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="country">Country</label>
            <input id="country" name="country" defaultValue={draft.country ?? "India"} maxLength={100} />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="currencyCode">Currency</label>
            <input id="currencyCode" name="currencyCode" defaultValue={draft.currencyCode ?? "INR"} maxLength={10} />
          </div>

          <div className="company-dialog-field">
            <label htmlFor="financialYearStart">Financial Year Start</label>
            <input id="financialYearStart" name="financialYearStart" defaultValue={draft.financialYearStart ?? ""} type="date" />
          </div>

          <div className="company-dialog-field" style={{ justifyContent: "center" }}>
            <label className="company-dialog-checkbox">
              <input type="checkbox" name="active" defaultChecked={draft.active !== false} />
              Active status
            </label>
          </div>
        </div>

        <div className="company-modal-actions">
          <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" isLoading={isLoading}>
            {draft?.id ? "Save changes" : "Create company"}
          </Button>
        </div>
      </form>
    </div>
  );
}
