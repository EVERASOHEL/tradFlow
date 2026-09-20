import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import Loader from "../../../components/common/Loader/Loader";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import {
  useGetImportsQuery,
  useCreateImportMutation,
  useUpdateImportStageMutation,
  useDeleteImportMutation,
  useGetSuppliersQuery,
  useGetMarketRatesQuery,
} from "../purchasesApi";
import ImportStageModal from "../components/ImportStageModal";
import "../purchases.css";

export default function ImportsPage() {
  const { activeCompany } = useActiveCompany();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [activeShipment, setActiveShipment] = useState(null); // For edit/stepper
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Queries
  const { data: suppliers = [] } = useGetSuppliersQuery(activeCompany?.id);
  const { data, isLoading, isFetching, error, refetch } = useGetImportsQuery({
    companyId: activeCompany?.id,
    page: Math.max(page - 1, 0),
    size: pageSize,
    search: search.trim(),
    status: statusFilter,
  }, { skip: !activeCompany?.id });

  const [createImport, createState] = useCreateImportMutation();
  const [updateImportStage, updateState] = useUpdateImportStageMutation();
  const [deleteImport] = useDeleteImportMutation();
  const { data: marketRates, isFetching: isFetchingRates, refetch: refetchRates } = useGetMarketRatesQuery(false);

  const shipments = data?.records || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Quick KPI calculations
  const totalRmbSum = shipments.reduce((sum, s) => sum + Number(s.totalRmb || s.rmbPrice || 0), 0);
  const totalLandedCostSum = shipments.reduce((sum, s) => sum + Number(s.landedCost || 0), 0);

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSaveShipment = async (payload) => {
    try {
      if (activeShipment?.id) {
        await updateImportStage({ id: activeShipment.id, ...payload }).unwrap();
      } else {
        await createImport(payload).unwrap();
      }
      setActiveShipment(null);
      setCreateModalOpen(false);
      refetch();
    } catch {
      // Handled in modal
    }
  };

  const handleDelete = async (shipment) => {
    if (window.confirm(`Delete import shipment record "${shipment.importNumber}"?`)) {
      try {
        await deleteImport(shipment.id).unwrap();
        refetch();
      } catch (err) {
        alert(err?.data?.message || "Failed to delete import shipment");
      }
    }
  };

  const getStageBadgeClass = (st) => {
    const s = String(st || "").toUpperCase();
    if (s === "ORDERED") return "stage-badge--ordered";
    if (s === "IN_PRODUCTION") return "stage-badge--production";
    if (s === "SHIPPED") return "stage-badge--shipped";
    if (s === "PORT_ARRIVED") return "stage-badge--port";
    if (s === "CUSTOMS_CLEARING") return "stage-badge--customs";
    if (s === "WAREHOUSE_RECEIVED") return "stage-badge--warehouse";
    if (s === "COMPLETED") return "stage-badge--completed";
    return "stage-badge--ordered";
  };

  return (
    <div className="purchase-page">
      {/* Page Header */}
      <div className="purchase-page-heading">
        <div>
          <p className="access-kicker">International Sourcing &amp; Logistics</p>
          <h1>China Imports &amp; LCL Shipments</h1>
        </div>
        <div className="heading-actions">
          <Button size="sm" onClick={() => setCreateModalOpen(true)} disabled={!activeCompany}>
            + Book Import Shipment
          </Button>
        </div>
      </div>

      {!activeCompany && (
        <div className="product-global-notice">
          <span>ℹ Please select an active company workspace from the top bar to track China import shipments.</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="purchase-kpi-grid">
        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #2563eb" }}>
          <span className="kpi-label">Active Shipments</span>
          <span className="kpi-val">{totalCount}</span>
          <span className="kpi-sub">LCL cargo in transit/pipeline</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #d97706" }}>
          <span className="kpi-label">Total RMB Committed</span>
          <span className="kpi-val" style={{ color: "#d97706" }}>¥{totalRmbSum.toLocaleString()}</span>
          <span className="kpi-sub">Order billing in Chinese Yuan</span>
        </div>

        <div className="purchase-kpi-card" style={{ borderLeft: "3px solid #059669" }}>
          <span className="kpi-label">Total Landed Value</span>
          <span className="kpi-val" style={{ color: "#059669" }}>{formatCurrency(totalLandedCostSum)}</span>
          <span className="kpi-sub">Goods + Agent + Freight + Duty</span>
        </div>
      </div>

      {/* Live Market Benchmark Rates Ticker */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 16px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
            <span style={{ fontSize: "14px" }}>⚡</span>
            <span>Today&apos;s Live Benchmark Rates:</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
            <span style={{ color: "#64748b" }}>Forex (CNY/INR):</span>
            <span style={{ fontWeight: 700, color: "#16a34a" }}>
              1¥ = ₹{marketRates?.exchangeRate ? Number(marketRates.exchangeRate).toFixed(2) : "14.30"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
            <span style={{ color: "#64748b" }}>Silver Benchmark:</span>
            <span style={{ fontWeight: 700, color: "#334155" }}>
              ₹{marketRates?.silverRate ? Number(marketRates.silverRate).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "92,000"} / kg
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
            <span style={{ color: "#64748b" }}>Copper Benchmark:</span>
            <span style={{ fontWeight: 700, color: "#b45309" }}>
              ₹{marketRates?.copperRate ? Number(marketRates.copperRate).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "840"} / kg
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "12px",
            background: marketRates?.status === "LIVE" ? "#dcfce7" : "#f1f5f9",
            color: marketRates?.status === "LIVE" ? "#15803d" : "#475569",
            textTransform: "uppercase"
          }}>
            {marketRates?.status || "LIVE"}
          </span>
          <button
            type="button"
            onClick={() => refetchRates()}
            disabled={isFetchingRates}
            title="Refresh live benchmark rates"
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "5px",
              cursor: isFetchingRates ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#334155"
            }}
          >
            {isFetchingRates ? "⏳ Updating..." : "🔄 Refresh Rates"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__left">
          <div className="product-search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="product-search-input"
              placeholder="Search by import ref, supplier, remarks..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Stages</option>
            <option value="ORDERED">Ordered</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="SHIPPED">Shipped (Sea LCL)</option>
            <option value="PORT_ARRIVED">Port Arrived</option>
            <option value="CUSTOMS_CLEARING">Customs Clearance</option>
            <option value="WAREHOUSE_RECEIVED">Warehouse Received</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <span className="product-count-badge">
          {totalCount} Shipment{totalCount === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <ErrorMessage style={{ marginBottom: "12px" }}>
          {error?.data?.message || error?.error || "Error loading shipments."}
        </ErrorMessage>
      )}

      {/* High-Density Pipeline Table */}
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "130px" }}>Import Ref</th>
              <th>China Supplier / Factory</th>
              <th>Order Date</th>
              <th style={{ textAlign: "right" }}>Total RMB (¥)</th>
              <th style={{ textAlign: "right" }}>Ex. Rate</th>
              <th style={{ textAlign: "right" }}>Purchase (₹)</th>
              <th style={{ textAlign: "right" }}>Landed Cost (₹)</th>
              <th>Shipping Date</th>
              <th>Port Arrival</th>
              <th>Customs Status</th>
              <th style={{ textAlign: "center" }}>Pipeline Stage</th>
              <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: "40px 0" }}>
                  <Loader />
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", padding: "36px 0", color: "#64748b" }}>
                  No China import shipments found. Click <strong>+ Book Import Shipment</strong> to initiate your first order.
                </td>
              </tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id}>
                  <td className="product-code-col">
                    <span
                      style={{ cursor: "pointer", color: "#2563eb", textDecoration: "underline" }}
                      onClick={() => setActiveShipment(s)}
                    >
                      {s.importNumber}
                    </span>
                    {s.totalBoxes > 0 && (
                      <span style={{ display: "block", fontSize: "10px", color: "#0284c7", fontWeight: 600 }}>
                        📦 {s.totalBoxes} Boxes
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{s.supplierName || "—"}</strong>
                    {s.supplierCountry && <small style={{ color: "#64748b", display: "block", fontSize: "10px" }}>{s.supplierCountry}</small>}
                  </td>
                  <td>{s.orderDate || "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                    ¥{Number(s.totalRmb || s.rmbPrice || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#64748b" }}>
                    {s.exchangeRate ? Number(s.exchangeRate).toFixed(2) : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                    {formatCurrency(s.totalPurchaseValue)}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                    {formatCurrency(s.landedCost)}
                    {Number(s.agentCharges || 0) > 0 && (
                      <small style={{ display: "block", fontSize: "10px", color: "#9a3412", fontWeight: 500 }}>
                        Agent Fee: {formatCurrency(s.agentCharges)}
                      </small>
                    )}
                  </td>
                  <td>{s.goodsLoadingDate || "—"}</td>
                  <td>{s.portArrivalDate || "—"}</td>
                  <td>
                    {s.customsStatus ? (
                      <span className="badge-gst">{s.customsStatus}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`stage-badge ${getStageBadgeClass(s.status)}`}>
                      {s.status || "ORDERED"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="table-btn-spec"
                        title="Update shipment stage"
                        onClick={() => setActiveShipment(s)}
                      >
                        🚚 Update
                      </button>
                      <button
                        type="button"
                        className="table-btn-icon danger"
                        title="Delete shipment"
                        onClick={() => handleDelete(s)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="product-pagination">
        <div>
          Showing {shipments.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} shipments
          {isFetching && <span style={{ marginLeft: "8px", fontStyle: "italic" }}>(refreshing...)</span>}
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Stepper Modal */}
      {(createModalOpen || activeShipment) && (
        <ImportStageModal
          shipment={activeShipment}
          onClose={() => {
            setActiveShipment(null);
            setCreateModalOpen(false);
          }}
          onSave={handleSaveShipment}
          isLoading={createState.isLoading || updateState.isLoading}
          error={createState.error || updateState.error}
          suppliers={suppliers}
          companyId={activeCompany?.id}
        />
      )}
    </div>
  );
}

