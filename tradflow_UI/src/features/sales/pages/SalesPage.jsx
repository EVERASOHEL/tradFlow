import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import Loader from "../../../components/common/Loader/Loader";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import {
  useGetSalesQuery,
  useGetCustomersQuery,
  useCreateSaleMutation,
  useCancelSaleMutation,
} from "../salesApi";
import { useGetProductsQuery } from "../../products/productsApi";
import SaleDialog from "../components/SaleDialog";
import SaleInvoiceViewDialog from "../components/SaleInvoiceViewDialog";
import "../sales.css";

export default function SalesPage() {
  const { activeCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, GST, NON_GST
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Queries
  const { data: customers = [] } = useGetCustomersQuery(activeCompany?.id, {
    skip: !activeCompany?.id,
  });

  const { data: productsData } = useGetProductsQuery(
    { companyId: activeCompany?.id, page: 0, size: 300 },
    { skip: !activeCompany?.id }
  );
  const products = productsData?.records || [];

  const { data, isLoading, error, refetch } = useGetSalesQuery(
    {
      companyId: activeCompany?.id,
      transactionType: activeTab === "ALL" ? "" : activeTab,
      status: statusFilter,
      search: search.trim(),
      page: Math.max(page - 1, 0),
      size: pageSize,
    },
    { skip: !activeCompany?.id }
  );

  const [createSale, { isLoading: isCreating, error: createError }] = useCreateSaleMutation();
  const [cancelSale, { isLoading: isCancelling }] = useCancelSaleMutation();

  const sales = data?.records || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Totals calculations
  const totalVolume = sales.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
  const gstSalesList = sales.filter((s) => s.transactionType === "GST");
  const nonGstSalesList = sales.filter((s) => s.transactionType === "NON_GST");
  const gstSalesVolume = gstSalesList.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
  const nonGstSalesVolume = nonGstSalesList.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
  const totalGstCollected = sales.reduce(
    (sum, s) =>
      sum +
      (s.totalTaxAmount !== undefined
        ? Number(s.totalTaxAmount)
        : Number(s.cgstAmount || 0) + Number(s.sgstAmount || 0) + Number(s.igstAmount || 0)),
    0
  );
  const totalOutstanding = sales.reduce(
    (sum, s) =>
      sum +
      Number(s.outstandingAmount !== undefined ? s.outstandingAmount : s.balanceAmount || 0),
    0
  );

  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSaveSale = async (payload) => {
    try {
      await createSale({
        ...payload,
        companyId: activeCompany?.id,
      }).unwrap();
      setCreateModalOpen(false);
      refetch();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleCancelSale = async (sale) => {
    const invoiceNum = sale.invoiceNumber || sale.saleNumber;
    const totalUnits = sale.items?.reduce((s, it) => s + Number(it.quantity || 0), 0) || "all";
    const reason = window.prompt(
      `Cancel sales invoice "${invoiceNum}"?\n\nThis will automatically restore ${totalUnits} PCS of stock back into inventory.\n\nEnter cancellation reason:`
    );
    if (reason === null) return;

    try {
      await cancelSale({ id: sale.id, reason: reason || "Cancelled by user" }).unwrap();
      setSelectedSale(null);
      refetch();
    } catch (err) {
      alert(err?.data?.message || "Failed to cancel sale");
    }
  };

  return (
    <div className="sales-page">
      {/* Executive Header Banner */}
      <div className="sales-header-banner">
        <div className="sales-header-banner__left">
          <div className="sales-header-chip">
            <span className="live-dot" />
            ENTERPRISE OUTWARD BILLING
          </div>
          <h1 className="sales-header-banner__title">Sales &amp; Outward Invoicing</h1>
          <p className="sales-header-banner__desc">
            Dual-channel GST tax invoicing &amp; Non-GST commercial billing with automatic real-time stock reduction
          </p>
        </div>
        <div className="sales-header-banner__actions">
          <button
            type="button"
            className="btn-create-sale-glow"
            onClick={() => setCreateModalOpen(true)}
          >
            <span className="btn-icon">🧾</span>
            <span>+ Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Modern KPI Cards Grid */}
      <div className="sales-kpi-grid">
        <div className="sales-kpi-card sales-kpi-card--primary">
          <div className="kpi-top">
            <span className="kpi-title">Total Sales Revenue</span>
            <span className="kpi-badge kpi-badge--blue">All Channels</span>
          </div>
          <div className="kpi-value">{formatINR(totalVolume)}</div>
          <div className="kpi-meta">
            <span>{sales.length} Invoices Listed</span>
          </div>
        </div>

        <div className="sales-kpi-card sales-kpi-card--emerald">
          <div className="kpi-top">
            <span className="kpi-title">GST Tax Invoices</span>
            <span className="kpi-badge kpi-badge--emerald">🇮🇳 CGST / SGST / IGST</span>
          </div>
          <div className="kpi-value text-emerald">{formatINR(gstSalesVolume)}</div>
          <div className="kpi-meta">
            <span>{gstSalesList.length} Active Tax Invoices</span>
          </div>
        </div>

        <div className="sales-kpi-card sales-kpi-card--teal">
          <div className="kpi-top">
            <span className="kpi-title">Non-GST Commercial</span>
            <span className="kpi-badge kpi-badge--teal">📄 Zero-Tax / Export</span>
          </div>
          <div className="kpi-value text-teal">{formatINR(nonGstSalesVolume)}</div>
          <div className="kpi-meta">
            <span>{nonGstSalesList.length} Commercial Orders</span>
          </div>
        </div>

        <div className="sales-kpi-card sales-kpi-card--indigo">
          <div className="kpi-top">
            <span className="kpi-title">Total GST Collected</span>
            <span className="kpi-badge kpi-badge--indigo">Tax Liability</span>
          </div>
          <div className="kpi-value text-indigo">{formatINR(totalGstCollected)}</div>
          <div className="kpi-meta">
            <span>Input / Output Tax Tracking</span>
          </div>
        </div>

        <div className="sales-kpi-card sales-kpi-card--amber">
          <div className="kpi-top">
            <span className="kpi-title">Outstanding Receivables</span>
            <span className={`kpi-badge ${totalOutstanding > 0 ? "kpi-badge--rose" : "kpi-badge--emerald"}`}>
              {totalOutstanding > 0 ? "Pending Due" : "Settled"}
            </span>
          </div>
          <div className={`kpi-value ${totalOutstanding > 0 ? "text-rose" : "text-emerald"}`}>
            {formatINR(totalOutstanding)}
          </div>
          <div className="kpi-meta">
            <span>Total Uncollected Balance</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="sales-toolbar-box">
        <div className="sales-tabs-segmented">
          <button
            type="button"
            className={`sales-tab-segment ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("ALL");
              setPage(1);
            }}
          >
            <span className="tab-icon">📊</span>
            <span>All Sales</span>
            <span className="tab-count">{sales.length}</span>
          </button>
          <button
            type="button"
            className={`sales-tab-segment ${activeTab === "GST" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("GST");
              setPage(1);
            }}
          >
            <span className="tab-icon">🇮🇳</span>
            <span>GST Tax Invoices</span>
            <span className="tab-count">{gstSalesList.length}</span>
          </button>
          <button
            type="button"
            className={`sales-tab-segment ${activeTab === "NON_GST" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("NON_GST");
              setPage(1);
            }}
          >
            <span className="tab-icon">📄</span>
            <span>Non-GST Sales</span>
            <span className="tab-count">{nonGstSalesList.length}</span>
          </button>
        </div>

        <div className="sales-filters-row">
          <div className="sales-search-field">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search invoice number, customer, GSTIN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="sales-filter-dropdown"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {error && <ErrorMessage message={error?.data?.message || "Failed to load sales data"} />}

      {isLoading ? (
        <div className="sales-loader-wrap">
          <Loader />
        </div>
      ) : sales.length === 0 ? (
        <div className="sales-empty-card">
          <div className="empty-badge">🧾</div>
          <h3 className="empty-title">No Sales Invoices Found</h3>
          <p className="empty-desc">
            Issue your first GST Tax Invoice or Non-GST commercial sale. When you create an invoice, stock is automatically reduced from your inventory and recorded in the movement audit ledger.
          </p>

          <div className="empty-features-grid">
            <div className="feature-item">
              <span className="f-icon">⚡</span>
              <div>
                <strong>Automatic Stock Reduction</strong>
                <small>Every sale deducts PCS from product current stock</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="f-icon">🇮🇳</span>
              <div>
                <strong>Smart GST Calculation</strong>
                <small>Auto intra-state (CGST+SGST) vs inter-state (IGST)</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="f-icon">📋</span>
              <div>
                <strong>Full Audit Ledger</strong>
                <small>Cancellation restores stock and logs reverse movement</small>
              </div>
            </div>
          </div>

          <div className="empty-action-buttons">
            <button
              type="button"
              className="btn-empty-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              + Create First Sales Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="sales-table-card">
          <div className="table-responsive">
            <table className="sales-grid-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Taxable Value</th>
                  <th>GST Amount</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isGst = sale.transactionType === "GST";
                  const invoiceNum = sale.invoiceNumber || sale.saleNumber;
                  const invoiceDt = sale.invoiceDate || sale.saleDate;
                  const taxAmt =
                    sale.totalTaxAmount !== undefined
                      ? sale.totalTaxAmount
                      : Number(sale.cgstAmount || 0) +
                        Number(sale.sgstAmount || 0) +
                        Number(sale.igstAmount || 0);
                  const dueAmt =
                    sale.outstandingAmount !== undefined
                      ? sale.outstandingAmount
                      : sale.balanceAmount;

                  const custName = sale.customerName || "Customer";
                  const custInit = custName[0]?.toUpperCase() || "C";

                  return (
                    <tr
                      key={sale.id}
                      className={sale.status === "CANCELLED" ? "row-cancelled" : ""}
                    >
                      <td>
                        <strong className="invoice-num" onClick={() => setSelectedSale(sale)}>
                          {invoiceNum}
                        </strong>
                      </td>
                      <td>{invoiceDt}</td>
                      <td>
                        <span
                          className={`badge-pill ${
                            isGst ? "badge-pill--blue" : "badge-pill--teal"
                          }`}
                        >
                          {isGst ? "🇮🇳 GST" : "📄 Non-GST"}
                        </span>
                      </td>
                      <td>
                        <div className="customer-avatar-cell">
                          <span className="avatar-chip">{custInit}</span>
                          <div className="customer-info">
                            <strong>{custName}</strong>
                            <small>{sale.customerGstin || "Unregistered"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="cell-num">{formatINR(sale.taxableAmount)}</td>
                      <td className="cell-num">{formatINR(taxAmt)}</td>
                      <td className="cell-num font-bold text-primary">{formatINR(sale.grandTotal)}</td>
                      <td className="cell-num text-emerald">{formatINR(sale.paidAmount)}</td>
                      <td className="cell-num">
                        <span
                          className={
                            Number(dueAmt) > 0 ? "text-rose font-bold" : "text-muted"
                          }
                        >
                          {formatINR(dueAmt)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-badge--${
                            sale.status === "COMPLETED" || sale.status === "CONFIRMED"
                              ? "success"
                              : sale.status === "CANCELLED"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          <span className="status-dot" />
                          {sale.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn-action-view"
                            title="View Invoice"
                            onClick={() => setSelectedSale(sale)}
                          >
                            👁 View
                          </button>
                          {sale.status !== "CANCELLED" && (
                            <button
                              type="button"
                              className="btn-action-cancel"
                              title="Cancel invoice & restore stock"
                              onClick={() => handleCancelSale(sale)}
                            >
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="sales-pagination">
              <span className="pagination-info">
                Showing {sales.length} of {totalCount} invoices
              </span>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="page-current">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      {createModalOpen && (
        <SaleDialog
          onClose={() => setCreateModalOpen(false)}
          onSave={handleSaveSale}
          isLoading={isCreating}
          error={createError}
          customers={customers}
          products={products}
          company={activeCompany}
        />
      )}

      {/* View Dialog */}
      {selectedSale && (
        <SaleInvoiceViewDialog
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onCancelSale={handleCancelSale}
          isCancelling={isCancelling}
        />
      )}
    </div>
  );
}
