import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import { useGetCompaniesQuery } from "../companiesApi";
import { useLogoutMutation } from "../../auth/authApi";
import Button from "../../../components/common/Button/Button";
import { ROUTES } from "../../../constants/route.constants";
import "./CompanySelectionPage.css";

function getRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.responseObj)) return data.responseObj;
  return [];
}

export default function CompanySelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCompany, selectCompany } = useActiveCompany();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [search, setSearch] = useState("");

  const { data: companiesData, isLoading } = useGetCompaniesQuery({ page: 0, size: 500 });
  const companies = getRecords(companiesData).filter((c) => c.active !== false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) =>
      [c.companyCode, c.companyName, c.tradeName, c.city, c.gstin, c.pan]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [companies, search]);

  const handleSelectCompany = (company) => {
    selectCompany(company);
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  const userRole = Array.isArray(user?.roles)
    ? (user.roles[0]?.name || user.roles[0]?.code || user.roles[0] || "User")
    : "User";

  return (
    <div className="company-selection-page">
      {/* Top Navigation Bar */}
      <header className="selection-header">
        <div className="selection-brand">
          <span className="selection-brand__mark">TF</span>
          <div className="selection-brand__text">
            <span className="brand-name">TradeFlow</span>
            <small className="brand-tag">FINANCIAL OS &amp; ERP</small>
          </div>
        </div>

        <div className="selection-user-menu">
          <div className="selection-user-info">
            <strong>{user?.fullName || user?.username || "Authenticated User"}</strong>
            <span className="selection-role-pill">{userRole}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            isLoading={isLoggingOut}
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="selection-main">
        <div className="selection-card">
          <div className="selection-heading">
            <span className="selection-kicker">Workspace Launcher</span>
            <h1>Select Working Company</h1>
            <p>
              Choose the entity you want to access. Your ledgers, reports, and vouchers will be scoped to this company.
            </p>
          </div>

          {/* Search Toolbar */}
          <div className="selection-search-bar">
            <div className="selection-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="selection-search-input"
                placeholder="Search by company name, code, city, GSTIN, PAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  className="selection-search-clear"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>
            <span className="selection-count">
              Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "company" : "companies"}
            </span>
          </div>

          {/* Company Grid / Table */}
          <div className="selection-list-container">
            {isLoading ? (
              <div className="selection-loading">
                <div className="selection-spinner" />
                <span>Loading available companies...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="selection-empty">
                <p>No matching companies found for "{search}"</p>
                <button
                  type="button"
                  className="selection-reset-btn"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="selection-grid">
                {filtered.map((company) => {
                  const isCurrent = activeCompany?.id === company.id;
                  return (
                    <div
                      key={company.id}
                      className={`selection-company-card ${isCurrent ? "selection-company-card--current" : ""}`}
                      onClick={() => handleSelectCompany(company)}
                    >
                      <div className="selection-card-header">
                        <span className="selection-code-pill">{company.companyCode}</span>
                        {company.city && (
                          <span className="selection-city-pill">{company.city}</span>
                        )}
                        {isCurrent && (
                          <span className="selection-active-indicator">● Current</span>
                        )}
                      </div>

                      <div className="selection-card-body">
                        <strong className="selection-company-name" title={company.companyName}>
                          {company.companyName}
                        </strong>
                        {company.tradeName && (
                          <span className="selection-trade-name">{company.tradeName}</span>
                        )}

                        <div className="selection-tax-meta">
                          {company.gstin && (
                            <span className="selection-tax-item">
                              <small>GSTIN:</small> {company.gstin}
                            </span>
                          )}
                          {company.pan && (
                            <span className="selection-tax-item">
                              <small>PAN:</small> {company.pan}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="selection-card-action">
                        <button
                          type="button"
                          className="selection-open-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCompany(company);
                          }}
                        >
                          <span>Open Workspace</span>
                          <span className="arrow">→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

