import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import Loader from "../../../components/common/Loader/Loader";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import { ROUTES } from "../../../constants/route.constants";
import {
  useGetPurchasesQuery,
  useGetSupplierSummariesQuery,
  useCreatePurchaseMutation,
  useDeletePurchaseMutation,
  useGetSuppliersQuery,
  useGetImportsQuery,
} from "../purchasesApi";
import { useGetProductsQuery } from "../../products/productsApi";
import PurchaseDialog from "../components/PurchaseDialog";
import "../purchases.css";

export default function PurchasesPage() {
  const { activeCompany } = useActiveCompany();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [activeTab, setActiveTab] = useState("INVOICES"); // "INVOICES" | "SUPPLIERS"
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierCountryFilter, setSupplierCountryFilter] = useState("");
  const [initialSupplierId, setInitialSupplierId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // for viewing line items

  // Data queries
  const { data: suppliers = [] } = useGetSuppliersQuery(activeCompany?.id, {
    skip: !activeCompany?.id,
  });

  const {
    data: supplierSummaries = [],
    isLoading: isSummariesLoading,
    refetch: refetchSummaries,
  } = useGetSupplierSummariesQuery(activeCompany?.id, {
    skip: !activeCompany?.id,
  });

  const { data: importsData } = useGetImportsQuery(
    { companyId: activeCompany?.id, page: 0, size: 200 },
    { skip: !activeCompany?.id }
  );
  const importList = importsData?.records || [];

  const { data: productsData } = useGetProductsQuery(
    { companyId: activeCompany?.id, page: 0, size: 200 },
    { skip: !activeCompany?.id }
  );
  const productList = productsData?.records || [];

  const { data, isLoading, isFetching, error, refetch } = useGetPurchasesQuery(
    {
      companyId: activeCompany?.id,
      page: Math.max(page - 1, 0),
      size: pageSize,
      search: search.trim(),
      supplierId: supplierFilter,
      transactionType: typeFilter,
      status: statusFilter,
    },
    { skip: !activeCompany?.id }
  );

  const [createPurchase, createState] = useCreatePurchaseMutation();
  const [deletePurchase] = useDeletePurchaseMutation();

  const purchases = data?.records || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Totals calculations
  const totalTaxable = purchases.reduce((sum, p) => sum + Number(p.taxableAmount || 0), 0);
  const totalTax = purchases.reduce(
    (sum, p) => sum + Number(p.cgstAmount || 0) + Number(p.sgstAmount || 0) + Number(p.igstAmount || 0),
    0
  );
  const totalGrand = purchases.reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
  const totalBalance = Math.max(totalGrand - totalPaid, 0);

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSavePurchase = async (payload) => {
    try {
      await createPurchase(payload).unwrap();
      setCreateModalOpen(false);
      setInitialSupplierId(null);
      refetch();
      refetchSummaries();
    } catch {
      // Handled by mutation / dialog
    }
  };

  const handleDelete = async (p) => {
    if (window.confirm(`Delete purchase invoice "${p.purchaseNumber}"? This will also automatically reverse and deduct stock from warehouse inventory.`)) {
      try {
        await deletePurchase(p.id).unwrap();
        refetch();
        refetchSummaries();
      } catch (err) {
        alert(err?.data?.message || "Failed to delete purchase invoice");
      }
    }
  };

  const handleViewSupplierInvoices = (sId) => {
    setSupplierFilter(sId);
    setPage(1);
    setActiveTab("INVOICES");
  };

  const handleNewPurchaseForSupplier = (sId) => {
    setInitialSupplierId(sId);
    setCreateModalOpen(true);
  };

  const activeSupplierObj = suppliers.find((s) => s.id === supplierFilter);

  const filteredSuppliers = supplierSummaries.filter((s) => {
    const matchSearch =
      !supplierSearch.trim() ||
      (s.supplierName && s.supplierName.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (s.phone && s.phone.includes(supplierSearch)) ||
      (s.gstin && s.gstin.toLowerCase().includes(supplierSearch.toLowerCase()));
    const matchCountry =
      !supplierCountryFilter ||
      (s.country && s.country.toLowerCase() === supplierCountryFilter.toLowerCase());
    return matchSearch && matchCountry;
  });

  return (
    <div className="purchase-page">
      {/* Executive Header Banner */}
      <div className="purchase-header-banner">
        <div className="purchase-header-banner__left">
          <div className="purchase-header-chip">
            <span className="live-dot-amber" /> PURCHASES, SUPPLIERS &amp; INVENTORY INFLOW
          </div>
          <h1 className="purchase-header-banner__title">Purchase Invoices &amp; Supplier Accounts</h1>
          <p className="purchase-header-banner__desc">
            Supplier-wise purchase history, China factory imports (LCL), GST input claims, and automated warehouse inventory inflow
          </p>
        </div>
        <div className="purchase-header-banner__actions">
          <Link to={ROUTES.IMPORTS} className="btn-imports-link">
            <span>🚢</span>
            <span>China Imports (LCL)</span>
          </Link>
          <button
            type="button"
            className="btn-record-purchase-glow"
            onClick={() => {
              setInitialSupplierId(null);
              setCreateModalOpen(true);
            }}
            disabled={!activeCompany}
          >
            <span>+</span>
            <span>Record Purchase Invoice</span>
          </button>
        </div>
      </div>

      {!activeCompany && (
        <div className="product-global-notice">
          <span>ℹ Please select an active company workspace from the top bar to record and view purchases.</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="purchase-kpi-grid">
        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #2563eb" }}>
          <span className="kpi-label">Invoices Count</span>
          <span className="kpi-val">{totalCount}</span>
          <span className="kpi-sub">Total recorded vouchers</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #0f766e" }}>
          <span className="kpi-label">Total Taxable Value</span>
          <span className="kpi-val" style={{ color: "#0f766e" }}>{formatCurrency(totalTaxable)}</span>
          <span className="kpi-sub">Before GST &amp; additional charges</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #7c3aed" }}>
          <span className="kpi-label">Total GST Tax Input</span>
          <span className="kpi-val" style={{ color: "#7c3aed" }}>{formatCurrency(totalTax)}</span>
          <span className="kpi-sub">CGST + SGST + IGST claimed</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #059669" }}>
          <span className="kpi-label">Grand Invoiced Value</span>
          <span className="kpi-val" style={{ color: "#059669" }}>{formatCurrency(totalGrand)}</span>
          <span className="kpi-sub">Total billed amount</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #dc2626" }}>
          <span className="kpi-label">Outstanding Balance</span>
          <span className="kpi-val" style={{ color: totalBalance > 0 ? "#dc2626" : "#059669" }}>
            {formatCurrency(totalBalance)}
          </span>
          <span className="kpi-sub">Pending vendor payments</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div className="purchase-tabs-segmented">
          <button
            type="button"
            className={`purchase-tab-segment ${activeTab === "INVOICES" ? "active" : ""}`}
            onClick={() => setActiveTab("INVOICES")}
          >
            <span className="tab-icon">📑</span>
            <span>All Purchase Invoices</span>
            <span className="tab-count">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`purchase-tab-segment ${activeTab === "SUPPLIERS" ? "active" : ""}`}
            onClick={() => setActiveTab("SUPPLIERS")}
          >
            <span className="tab-icon">👥</span>
            <span>Supplier-wise Purchase History &amp; Balances</span>
            <span className="tab-count">{supplierSummaries.length}</span>
          </button>
        </div>
      </div>

      {activeTab === "SUPPLIERS" ? (
        /* ========================================================
           TAB 2: SUPPLIER-WISE PURCHASE HISTORY & STATEMENTS
           ======================================================== */
        <div>
          {/* Supplier Filters */}
          <div className="purchase-toolbar" style={{ marginBottom: "0.85rem" }}>
            <div className="purchase-toolbar__left">
              <div className="product-search-box">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  className="product-search-input"
                  placeholder="Search supplier name, contact, phone, GSTIN..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                />
                {supplierSearch && (
                  <button type="button" className="search-clear-btn" onClick={() => setSupplierSearch("")}>×</button>
                )}
              </div>

              <select
                className="product-select-filter"
                value={supplierCountryFilter}
                onChange={(e) => setSupplierCountryFilter(e.target.value)}
              >
                <option value="">All Regions</option>
                <option value="China">🇨🇳 China Suppliers (Factory Direct)</option>
                <option value="India">🇮🇳 Domestic Suppliers (India)</option>
              </select>
            </div>
            <span className="product-count-badge">
              {filteredSuppliers.length} Supplier{filteredSuppliers.length === 1 ? "" : "s"}
            </span>
          </div>

          {isSummariesLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Loader size="md" />
              <p style={{ marginTop: 8, color: "#64748b", fontSize: 13 }}>Loading supplier history summaries...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", border: "1px dashed #cbd5e1", borderRadius: 8 }}>
              <span style={{ fontSize: "2rem" }}>👥</span>
              <h3 style={{ margin: "8px 0 4px", fontSize: "1rem", color: "#0f172a" }}>No Suppliers Found</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Suppliers will appear here once registered or when purchase invoices are recorded.</p>
            </div>
          ) : (
            <div className="supplier-history-grid">
              {filteredSuppliers.map((s) => {
                const isChina = s.country?.toLowerCase() === "china";
                const outstanding = Number(s.outstandingDueInr || 0);
                const hasDue = outstanding > 0;

                return (
                  <div key={s.supplierId} className="supplier-history-card">
                    <div className="supplier-card-header">
                      <div className="supplier-brand-row">
                        <div className="supplier-avatar-chip">
                          {(s.supplierName || "S").charAt(0).toUpperCase()}
                        </div>
                        <div className="supplier-info-main">
                          <strong>{s.supplierName}</strong>
                          <small>
                            {s.contactPerson ? `👤 ${s.contactPerson}` : ""}
                            {s.phone ? ` • 📞 ${s.phone}` : ""}
                          </small>
                          {s.gstin && <small style={{ fontFamily: "monospace", color: "#0284c7" }}>GSTIN: {s.gstin}</small>}
                        </div>
                      </div>
                      <span className={`supplier-country-badge ${isChina ? "supplier-country-badge--china" : "supplier-country-badge--india"}`}>
                        {isChina ? "🇨🇳 China" : "🇮🇳 Domestic"}
                      </span>
                    </div>

                    {/* KPI Strip */}
                    <div className="supplier-kpi-strip">
                      <div className="supplier-kpi-item">
                        <span className="label">Invoices</span>
                        <span className="val">{s.totalInvoices} Bills</span>
                      </div>
                      <div className="supplier-kpi-item">
                        <span className="label">Total Billed</span>
                        <span className="val text-primary">{formatCurrency(s.totalPurchasedInr)}</span>
                        {isChina && Number(s.totalPurchasedRmb || 0) > 0 && (
                          <small style={{ color: "#d97706", fontSize: "0.65rem", fontWeight: 700 }}>
                            ¥{Number(s.totalPurchasedRmb).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                          </small>
                        )}
                      </div>
                      <div className="supplier-kpi-item">
                        <span className="label">Volume</span>
                        <span className="val">{s.totalBoxes || 0} Boxes</span>
                        {Number(s.totalCbm || 0) > 0 && (
                          <small style={{ color: "#64748b", fontSize: "0.65rem" }}>
                            {Number(s.totalCbm).toFixed(3)} CBM
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Payable Row */}
                    <div className="supplier-payable-row">
                      <span>
                        Paid: <strong style={{ color: "#16a34a" }}>{formatCurrency(s.totalPaidInr)}</strong>
                      </span>
                      <span>
                        Due:{" "}
                        <strong className="outstanding-val" style={{ color: hasDue ? "#dc2626" : "#16a34a" }}>
                          {hasDue ? formatCurrency(outstanding) : "✓ Settled"}
                        </strong>
                      </span>
                    </div>

                    {s.lastPurchaseDate && (
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        🕒 Last purchase: <strong>{s.lastPurchaseDate}</strong>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="supplier-actions-row">
                      <button
                        type="button"
                        className="btn-view-supplier-invoices"
                        onClick={() => handleViewSupplierInvoices(s.supplierId)}
                      >
                        <span>📜</span>
                        <span>View Invoices ({s.totalInvoices})</span>
                      </button>
                      <button
                        type="button"
                        className="btn-new-purchase-for-supplier"
                        onClick={() => handleNewPurchaseForSupplier(s.supplierId)}
                      >
                        <span>+</span>
                        <span>New Purchase</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           TAB 1: ALL PURCHASE INVOICES
           ======================================================== */
        <div>
          {/* Active Supplier Filter Banner */}
          {activeSupplierObj && (
            <div className="active-supplier-filter-chip">
              <span>
                🔍 Filtered by Supplier: <strong>{activeSupplierObj.tradeName || activeSupplierObj.partyName}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSupplierFilter("");
                  setPage(1);
                }}
                title="Show all suppliers"
              >
                ✕ (Clear)
              </button>
            </div>
          )}

          {/* Filter & Search Toolbar */}
          <div className="purchase-toolbar">
            <div className="purchase-toolbar__left">
              <div className="product-search-box">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  className="product-search-input"
                  placeholder="Search by invoice #, bill #, remarks..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
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
              >
                ×
              </button>
            )}
          </div>

          <select
            className="product-select-filter"
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tradeName || s.partyName} ({s.country || "Domestic"})
              </option>
            ))}
          </select>

          <select
            className="product-select-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types (GST &amp; Non-GST)</option>
            <option value="GST">GST Invoice</option>
            <option value="NON_GST">NON-GST Bill</option>
          </select>

          <select
            className="product-select-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <span className="product-count-badge">
          {totalCount} Purchase{totalCount === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <ErrorMessage style={{ marginBottom: "12px" }}>
          {error?.data?.message || error?.error || "Error loading purchases."}
        </ErrorMessage>
      )}

      {/* Main Purchases Table */}
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "120px" }}>Invoice #</th>
              <th>Date</th>
              <th>Supplier / Vendor</th>
              <th style={{ minWidth: "220px" }}>Purchased Products / Items</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Taxable (₹)</th>
              <th style={{ textAlign: "right" }}>GST Tax (₹)</th>
              <th style={{ textAlign: "right" }}>Grand Total (₹)</th>
              <th style={{ textAlign: "right" }}>Balance (₹)</th>
              <th>Import Link</th>
              <th>Status</th>
              <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: "40px 0" }}>
                  <Loader size="md" />
                  <p style={{ marginTop: 8, color: "#64748b", fontSize: 13 }}>Loading purchase invoices...</p>
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={12} className="product-empty-row">
                  No purchase invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const due = Math.max(Number(p.grandTotal || 0) - Number(p.paidAmount || 0), 0);
                const taxSum = Number(p.cgstAmount || 0) + Number(p.sgstAmount || 0) + Number(p.igstAmount || 0);
                const isPaid = due <= 0;
                const isPartial = !isPaid && Number(p.paidAmount || 0) > 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: "#0f172a", fontFamily: "monospace", fontSize: "12px" }}>
                        {p.purchaseNumber}
                      </strong>
                      {p.supplierInvoiceNumber && (
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          Bill: {p.supplierInvoiceNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "11px", color: "#475569" }}>
                      {p.purchaseDate}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "12px" }}>
                        {p.supplierName || "—"}
                      </div>
                      {p.supplierCountry && p.supplierCountry !== "India" && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#b45309",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            display: "inline-block",
                            marginTop: "2px",
                          }}
                        >
                          🌐 {p.supplierCountry}
                        </span>
                      )}
                    </td>
                    {/* Purchased Products / Items Cell */}
                    <td>
                      {p.items && p.items.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {p.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.quantity} PCS
                              </span>
                              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                {item.productName || item.productCode || "Product"}
                              </span>
                              {item.productCode && item.productName && (
                                <small style={{ color: "#64748b", fontFamily: "monospace", fontSize: "10px" }}>
                                  ({item.productCode})
                                </small>
                              )}
                            </div>
                          ))}
                          {p.items.length > 1 && (
                            <small style={{ color: "#64748b", fontSize: "10px" }}>
                              Total {p.items.reduce((acc, i) => acc + Number(i.quantity || 0), 0)} units ({p.items.length} items)
                            </small>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>No items recorded</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: p.transactionType === "GST" ? "#eff6ff" : "#f1f5f9",
                          color: p.transactionType === "GST" ? "#1d4ed8" : "#475569",
                          border: `1px solid ${p.transactionType === "GST" ? "#bfdbfe" : "#cbd5e1"}`,
                        }}
                      >
                        {p.transactionType || "GST"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "12px" }}>
                      {formatCurrency(p.taxableAmount)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "11px", color: "#64748b" }}>
                      <div>{formatCurrency(taxSum)}</div>
                      {Number(p.igstAmount || 0) > 0 ? (
                        <small style={{ fontSize: "9px", color: "#7c3aed" }}>IGST: {formatCurrency(p.igstAmount)}</small>
                      ) : (
                        <small style={{ fontSize: "9px", color: "#475569" }}>
                          C+S: {formatCurrency(Number(p.cgstAmount || 0) + Number(p.sgstAmount || 0))}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(p.grandTotal)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "11px" }}>
                      <div style={{ color: due > 0 ? "#dc2626" : "#16a34a", fontWeight: due > 0 ? 600 : 400 }}>
                        {formatCurrency(due)}
                      </div>
                      <small
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: isPaid ? "#16a34a" : isPartial ? "#d97706" : "#dc2626",
                        }}
                      >
                        {isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid"}
                      </small>
                    </td>
                    <td>
                      {p.importNumber ? (
                        <Link
                          to={ROUTES.IMPORTS}
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#d97706",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          🚢 {p.importNumber}
                        </Link>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: p.status === "CONFIRMED" ? "#f0fdf4" : "#fef2f2",
                          color: p.status === "CONFIRMED" ? "#16a34a" : "#dc2626",
                          border: `1px solid ${p.status === "CONFIRMED" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                      >
                        {p.status || "CONFIRMED"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "4px" }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          title="View Invoice Items"
                          onClick={() => setSelectedInvoice(p)}
                        >
                          👁
                        </button>
                        <button
                          type="button"
                          className="table-action-btn table-action-btn--delete"
                          title="Delete Invoice"
                          onClick={() => handleDelete(p)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="product-pagination">
        <span className="pagination-info">
          Page {page} of {totalPages} ({totalCount} total purchases)
        </span>
        <div className="pagination-controls">
          <button
            type="button"
            className="btn btn--secondary btn--xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--xs"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>
      </div>
      )}

      {/* Create Purchase Modal Dialog */}
      {createModalOpen && (
        <PurchaseDialog
          companyId={activeCompany?.id}
          suppliers={suppliers}
          imports={importList}
          products={productList}
          initialSupplierId={initialSupplierId}
          isLoading={createState.isLoading}
          error={createState.error}
          onClose={() => {
            setCreateModalOpen(false);
            setInitialSupplierId(null);
          }}
          onSave={handleSavePurchase}
        />
      )}

      {/* View Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="access-modal-backdrop">
          <div className="product-modal-dialog" style={{ width: "min(96vw, 850px)" }}>
            <div className="product-modal-head">
              <div>
                <p className="access-kicker">Purchase Invoice Summary</p>
                <h2>{selectedInvoice.purchaseNumber}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="product-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Header Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginBottom: 16,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                    Supplier / Vendor
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedInvoice.supplierName || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                    Purchase Date
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedInvoice.purchaseDate || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                    Supplier Bill Ref
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedInvoice.supplierInvoiceNumber || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                    Transaction Type
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedInvoice.transactionType || "GST"}</strong>
                </div>
                {selectedInvoice.importNumber && (
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: 10, textTransform: "uppercase" }}>
                      China Import Ref
                    </span>
                    <strong style={{ color: "#d97706" }}>🚢 {selectedInvoice.importNumber}</strong>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px", color: "#1e293b" }}>
                Itemized Product Lines ({selectedInvoice.items?.length || 0})
              </h4>
              <table className="purchase-items-table" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Product Code &amp; Name</th>
                    <th style={{ textAlign: "right" }}>Qty (PCS)</th>
                    <th style={{ textAlign: "center" }}>Boxes (Auto)</th>
                    <th style={{ textAlign: "right" }}>Rate ({selectedInvoice.currencyCode === "CNY" ? "¥" : "₹"})</th>
                    <th style={{ textAlign: "right" }}>Disc (%)</th>
                    <th style={{ textAlign: "right" }}>Taxable ({selectedInvoice.currencyCode === "CNY" ? "¥" : "₹"})</th>
                    {Number(selectedInvoice.otherCharges || 0) > 0 && (
                      <th style={{ textAlign: "right" }}>Landed Cost ₹/PC</th>
                    )}
                    <th style={{ textAlign: "right" }}>Total ({selectedInvoice.currencyCode === "CNY" ? "¥" : "₹"})</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item, idx) => {
                    const ppb = Number(item.piecesPerBox || 1);
                    const qty = Number(item.quantity || 0);
                    const calculatedBoxes = item.boxCount != null ? Number(item.boxCount) : (ppb > 0 ? (qty % ppb === 0 ? qty / ppb : Number((qty / ppb).toFixed(2))) : 0);
                    const landed = item.unitLandedCost != null && Number(item.unitLandedCost) > 0 ? Number(item.unitLandedCost) : null;
                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <strong>{item.productName || item.productCode || "Custom Item"}</strong>
                          {item.productCode && (
                            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
                              {item.productCode} (1 Box = {ppb} PCS)
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                          {item.quantity} PCS
                        </td>
                        <td style={{ textAlign: "center", fontSize: 11, color: "#1e3a8a" }}>
                          📦 {calculatedBoxes} Boxes
                          <div style={{ fontSize: 10, color: "#64748b" }}>({qty} ÷ {ppb}/box)</div>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(item.rate)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>{item.discountPercent || 0}%</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(item.taxableAmount)}</td>
                        {Number(selectedInvoice.otherCharges || 0) > 0 && (
                          <td style={{ textAlign: "right", fontFamily: "monospace", color: "#065f46", fontWeight: 700 }}>
                            {landed ? `₹${Number(landed).toFixed(2)}/pc` : "—"}
                          </td>
                        )}
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Invoice Summary Box */}
              <div className="invoice-summary-box">
                <div className="invoice-summary-row">
                  <span>Taxable Amount:</span>
                  <strong style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.taxableAmount)}</strong>
                </div>
                {Number(selectedInvoice.cgstAmount || 0) > 0 && (
                  <div className="invoice-summary-row">
                    <span>CGST:</span>
                    <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.cgstAmount)}</span>
                  </div>
                )}
                {Number(selectedInvoice.sgstAmount || 0) > 0 && (
                  <div className="invoice-summary-row">
                    <span>SGST:</span>
                    <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.sgstAmount)}</span>
                  </div>
                )}
                {Number(selectedInvoice.igstAmount || 0) > 0 && (
                  <div className="invoice-summary-row">
                    <span>IGST:</span>
                    <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.igstAmount)}</span>
                  </div>
                )}
                {Number(selectedInvoice.otherCharges || 0) !== 0 && (
                  <div className="invoice-summary-row">
                    <span>Other Charges / Freight:</span>
                    <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.otherCharges)}</span>
                  </div>
                )}
                {Number(selectedInvoice.roundOff || 0) !== 0 && (
                  <div className="invoice-summary-row">
                    <span>Round Off:</span>
                    <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.roundOff)}</span>
                  </div>
                )}
                <div className="invoice-summary-row total-row">
                  <span>Grand Total:</span>
                  <strong style={{ fontFamily: "monospace", color: "#059669" }}>
                    {formatCurrency(selectedInvoice.grandTotal)}
                  </strong>
                </div>
                <div className="invoice-summary-row" style={{ marginTop: 4, color: "#16a34a" }}>
                  <span>Paid Amount:</span>
                  <span style={{ fontFamily: "monospace" }}>{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="invoice-summary-row" style={{ color: "#dc2626", fontWeight: 600 }}>
                  <span>Outstanding Balance:</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {formatCurrency(
                      Math.max(Number(selectedInvoice.grandTotal || 0) - Number(selectedInvoice.paidAmount || 0), 0)
                    )}
                  </span>
                </div>
              </div>

              {selectedInvoice.remarks && (
                <div style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
                  <strong>Remarks:</strong> {selectedInvoice.remarks}
                </div>
              )}
            </div>

            <div className="product-modal-actions">
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

