import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import { useGetCompaniesQuery } from "../companiesApi";
import { useAuth } from "../../../hooks/useAuth";
import { ROUTES } from "../../../constants/route.constants";
import "./CompanyDropdown.css";

function getRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.responseObj)) return data.responseObj;
  return [];
}

export default function CompanyDropdown() {
  const { user } = useAuth();
  const { activeCompany, selectCompany } = useActiveCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const { data: companiesData, isLoading } = useGetCompaniesQuery({ page: 0, size: 100 });
  const companies = getRecords(companiesData);

  // Set initial active company if none is set yet
  useEffect(() => {
    if (!activeCompany && companies.length > 0) {
      selectCompany(companies[0]);
    }
  }, [activeCompany, companies, selectCompany]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) =>
      [c.companyCode, c.companyName, c.tradeName, c.city]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [companies, search]);

  const displayName = activeCompany?.companyName || "Select Company";
  const displayCode = activeCompany?.companyCode || "";

  const isAdmin = Array.isArray(user?.roles)
    ? user.roles.some((r) => String(r?.code || r?.name || r).toUpperCase().includes("ADMIN"))
    : false;

  return (
    <div className="company-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`company-dropdown-btn ${isOpen ? "company-dropdown-btn--open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Switch active company workspace"
      >
        <span className="company-dropdown-dot" />
        <span className="company-dropdown-text">
          {displayCode ? <span className="company-dropdown-code">{displayCode}</span> : null}
          <strong>{displayName}</strong>
        </span>
        <svg
          className={`company-dropdown-arrow ${isOpen ? "company-dropdown-arrow--up" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="company-dropdown-menu">
          <div className="company-dropdown-header">
            <span className="company-dropdown-heading">Select Working Company</span>
            {companies.length > 0 && (
              <span className="company-dropdown-count">{companies.length} accessible</span>
            )}
          </div>

          <div className="company-dropdown-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="company-dropdown-search"
              placeholder="Search companies by code, name, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                className="company-dropdown-search-clear"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="company-dropdown-list">
            {isLoading ? (
              <div className="company-dropdown-empty">Loading companies...</div>
            ) : filtered.length === 0 ? (
              <div className="company-dropdown-empty">No companies found</div>
            ) : (
              filtered.map((company) => {
                const isCurrent = activeCompany?.id === company.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    className={`company-dropdown-item ${isCurrent ? "company-dropdown-item--active" : ""}`}
                    onClick={() => {
                      selectCompany(company);
                      setIsOpen(false);
                      setSearch("");
                    }}
                  >
                    <div className="company-dropdown-item-meta">
                      <span className="company-item-code">{company.companyCode}</span>
                      <strong className="company-item-name">{company.companyName}</strong>
                      {company.city && <span className="company-item-city"> • {company.city}</span>}
                    </div>
                    {isCurrent && <span className="company-dropdown-check">✓ Active</span>}
                  </button>
                );
              })
            )}
          </div>

          {isAdmin && (
            <div className="company-dropdown-footer">
              <Link
                to={ROUTES.SETTINGS_COMPANIES}
                className="company-dropdown-manage-link"
                onClick={() => setIsOpen(false)}
              >
                Manage all companies →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

