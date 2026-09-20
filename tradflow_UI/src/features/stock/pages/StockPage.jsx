import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import Loader from "../../../components/common/Loader/Loader";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import {
  useGetStockSummaryQuery,
  useGetStockMovementsQuery,
  useAdjustStockMutation,
} from "../stockApi";
import StockAdjustmentDialog from "../components/StockAdjustmentDialog";
import "../stock.css";

export default function StockPage() {
  const { activeCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState("INVENTORY"); // INVENTORY, LEDGER
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  // Queries
  const {
    data: stockItems = [],
    isLoading: isStockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useGetStockSummaryQuery(
    {
      companyId: activeCompany?.id,
      search: search.trim(),
      lowStockOnly,
    },
    { skip: !activeCompany?.id }
  );

  const {
    data: movements = [],
    isLoading: isLedgerLoading,
    error: ledgerError,
    refetch: refetchLedger,
  } = useGetStockMovementsQuery(
    {
      companyId: activeCompany?.id,
      movementType: ledgerTypeFilter,
      page: Math.max(ledgerPage - 1, 0),
      size: 50,
    },
    { skip: !activeCompany?.id }
  );

  const [adjustStock, { isLoading: isAdjusting, error: adjustError }] = useAdjustStockMutation();

  // Metrics
  const totalProducts = stockItems.length;
  const totalUnits = stockItems.reduce((s, it) => s + Number(it.currentStock || 0), 0);
  const totalValuation = stockItems.reduce((s, it) => s + Number(it.stockValuation || 0), 0);
  const lowStockCount = stockItems.filter((it) => it.isLowStock).length;
  const outOfStockCount = stockItems.filter((it) => Number(it.currentStock || 0) <= 0).length;

  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSaveAdjustment = async (payload) => {
    try {
      await adjustStock(payload).unwrap();
      setAdjustModalOpen(false);
      refetchStock();
      refetchLedger();
    } catch {
      // Handled by mutation error
    }
  };

  return (
    <div className="stock-page">
      {/* Compact Executive Header Banner */}
      <div className="stock-header-banner">
        <div className="stock-header-banner__left">
          <div className="stock-header-chip">
            <span className="live-dot-emerald" /> LIVE INVENTORY &amp; WAREHOUSE SYNC
          </div>
          <h1 className="stock-header-banner__title">Stock &amp; Inventory Management</h1>
          <p className="stock-header-banner__desc">
            Live stock tracking, automated deduction across GST &amp; Non-GST sales, purchase receipts, and audit trail
          </p>
        </div>
        <div className="stock-header-banner__right">
          <button
            type="button"
            className="btn-adjust-glow"
            onClick={() => setAdjustModalOpen(true)}
          >
            <span>⚖️</span>
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* High-Density KPI Cards */}
      <div className="stock-kpi-grid">
        <div className="stock-kpi-card stock-kpi-card--primary">
          <div className="stock-kpi-top">
            <span className="stock-kpi-title">Active SKUs</span>
            <span className="stock-kpi-badge stock-kpi-badge--blue">Tracked</span>
          </div>
          <strong className="stock-kpi-val">{totalProducts}</strong>
          <span className="stock-kpi-meta">Catalog Products</span>
        </div>

        <div className="stock-kpi-card stock-kpi-card--emerald">
          <div className="stock-kpi-top">
            <span className="stock-kpi-title">Stock on Hand</span>
            <span className="stock-kpi-badge stock-kpi-badge--emerald">Physical</span>
          </div>
          <strong className="stock-kpi-val text-emerald">{totalUnits.toLocaleString()} PCS</strong>
          <span className="stock-kpi-meta">Available for sale</span>
        </div>

        <div className="stock-kpi-card stock-kpi-card--teal">
          <div className="stock-kpi-top">
            <span className="stock-kpi-title">Inventory Valuation</span>
            <span className="stock-kpi-badge stock-kpi-badge--teal">Cost</span>
          </div>
          <strong className="stock-kpi-val text-teal">{formatINR(totalValuation)}</strong>
          <span className="stock-kpi-meta">Landed unit cost basis</span>
        </div>

        <div className="stock-kpi-card stock-kpi-card--amber">
          <div className="stock-kpi-top">
            <span className="stock-kpi-title">Low Stock</span>
            <span className="stock-kpi-badge stock-kpi-badge--amber">Reorder</span>
          </div>
          <strong className="stock-kpi-val" style={{ color: lowStockCount > 0 ? "#ea580c" : "#15803d" }}>
            {lowStockCount} Products
          </strong>
          <span className="stock-kpi-meta">Below threshold</span>
        </div>

        <div className="stock-kpi-card stock-kpi-card--rose">
          <div className="stock-kpi-top">
            <span className="stock-kpi-title">Out of Stock</span>
            <span className="stock-kpi-badge stock-kpi-badge--rose">0 Units</span>
          </div>
          <strong className="stock-kpi-val" style={{ color: outOfStockCount > 0 ? "#e11d48" : "#64748b" }}>
            {outOfStockCount} Products
          </strong>
          <span className="stock-kpi-meta">Zero inventory level</span>
        </div>
      </div>

      {/* Compact Toolbar & Segmented Tabs */}
      <div className="stock-toolbar-box">
        <div className="stock-tabs-segmented">
          <button
            type="button"
            className={`stock-tab-segment ${activeTab === "INVENTORY" ? "active" : ""}`}
            onClick={() => setActiveTab("INVENTORY")}
          >
            <span className="tab-icon">📦</span>
            <span>Live Stock Inventory</span>
            <span className="tab-count">{stockItems.length}</span>
          </button>
          <button
            type="button"
            className={`stock-tab-segment ${activeTab === "LEDGER" ? "active" : ""}`}
            onClick={() => setActiveTab("LEDGER")}
          >
            <span className="tab-icon">📋</span>
            <span>Movement Audit Ledger</span>
            <span className="tab-count">{movements.length}</span>
          </button>
        </div>

        {activeTab === "INVENTORY" ? (
          <div className="stock-filters-row">
            <div className="stock-search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search code, product name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="stock-checkbox-compact">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span>⚠️ Low Stock Only</span>
            </label>
          </div>
        ) : (
          <div className="stock-filters-row">
            <select
              className="stock-filter-select-compact"
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
            >
              <option value="">All Movements</option>
              <option value="IN">📥 Inward (Purchases / Additions)</option>
              <option value="OUT">📤 Outward (GST &amp; Non-GST Sales)</option>
              <option value="ADJUSTMENT">⚖️ Manual Adjustments</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab View */}
      {activeTab === "INVENTORY" ? (
        <div className="stock-tab-content">
          {stockError && (
            <ErrorMessage message={stockError?.data?.message || "Failed to load stock data"} />
          )}

          {isStockLoading ? (
            <div className="stock-loader-wrap">
              <Loader />
            </div>
          ) : stockItems.length === 0 ? (
            <div className="stock-empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Add products to your catalog or import purchases to begin tracking live inventory.</p>
            </div>
          ) : (
            <div className="stock-table-card">
              <div className="table-responsive">
                <table className="stock-grid-table">
                  <thead>
                    <tr>
                      <th>Product &amp; Code</th>
                      <th>Category</th>
                      <th className="cell-num">Current Stock</th>
                      <th>Status</th>
                      <th className="cell-num">Reorder Limit</th>
                      <th className="cell-num">Unit Cost</th>
                      <th className="cell-num">Total Valuation</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map((item) => {
                      const stock = Number(item.currentStock || 0);
                      const isZero = stock <= 0;
                      const isLow = item.isLowStock;

                      return (
                        <tr key={item.productId} className={isZero ? "row-out-stock" : ""}>
                          <td>
                            <div className="stock-product-cell">
                              <div className="stock-product-chip">
                                {(item.productName || "P").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div>
                                  <span className="stock-sku-badge">{item.productCode}</span>
                                  <strong>{item.productName}</strong>
                                </div>
                                {item.sku && <small className="text-muted">SKU: {item.sku}</small>}
                              </div>
                            </div>
                          </td>
                          <td>{item.category || "—"}</td>
                          <td className="cell-num">
                            <strong className="stock-num-val">{stock.toLocaleString()} {item.unitOfMeasure || "PCS"}</strong>
                          </td>
                          <td>
                            {isZero ? (
                              <span className="stock-badge-dot stock-badge--out">
                                <span className="dot" /> Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="stock-badge-dot stock-badge--low">
                                <span className="dot" /> Low Stock
                              </span>
                            ) : (
                              <span className="stock-badge-dot stock-badge--normal">
                                <span className="dot" /> In Stock
                              </span>
                            )}
                          </td>
                          <td className="cell-num">{item.reorderLevel ? `${item.reorderLevel} ${item.unitOfMeasure || "PCS"}` : "—"}</td>
                          <td className="cell-num">{formatINR(item.purchasePrice)}</td>
                          <td className="cell-num font-bold text-teal">{formatINR(item.stockValuation)}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="btn-quick-adjust-sm"
                              onClick={() => setAdjustModalOpen(true)}
                              title="Calibrate or adjust stock"
                            >
                              <span>⚖️</span>
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Stock Movement Ledger */
        <div className="stock-tab-content">
          {ledgerError && (
            <ErrorMessage message={ledgerError?.data?.message || "Failed to load audit ledger"} />
          )}

          {isLedgerLoading ? (
            <div className="stock-loader-wrap">
              <Loader />
            </div>
          ) : movements.length === 0 ? (
            <div className="stock-empty-state">
              <div className="empty-icon">📋</div>
              <h3>No stock movements recorded yet</h3>
              <p>Purchases, GST/Non-GST sales, and manual adjustments will automatically generate an immutable audit trail here.</p>
            </div>
          ) : (
            <div className="stock-table-card">
              <div className="table-responsive">
                <table className="stock-grid-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Product</th>
                      <th>Movement Type</th>
                      <th>Reference / Invoice</th>
                      <th className="cell-num">Quantity</th>
                      <th className="cell-num">Stock Before</th>
                      <th className="cell-num">Stock After</th>
                      <th>User</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mov) => {
                      const isOut = mov.movementType === "OUT";
                      const isIn = mov.movementType === "IN";

                      return (
                        <tr key={mov.id}>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {mov.movementDate ? new Date(mov.movementDate).toLocaleString("en-IN") : "—"}
                          </td>
                          <td>
                            <strong>{mov.productName}</strong>
                            <div className="text-muted" style={{ fontSize: "0.725rem" }}>
                              {mov.productCode}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`mov-badge mov-badge--${
                                isIn ? "in" : isOut ? "out" : "adj"
                              }`}
                            >
                              {isIn ? "📥 Inward (from Supplier)" : isOut ? "📤 Outward (to Customer)" : "⚖️ Adjustment (Warehouse)"}
                            </span>
                          </td>
                          <td>
                            <strong>{mov.referenceType}</strong>
                            {mov.referenceNumber && (
                              <span className="ref-number"> ({mov.referenceNumber})</span>
                            )}
                          </td>
                          <td className={`cell-num font-bold ${isIn ? "text-emerald" : isOut ? "text-rose" : "text-primary"}`}>
                            {isIn ? `+${mov.quantity}` : isOut ? `-${mov.quantity}` : `${mov.quantity}`} PCS
                          </td>
                          <td className="cell-num">{mov.stockBefore} PCS</td>
                          <td className="cell-num font-bold">{mov.stockAfter} PCS</td>
                          <td>{mov.performedByName || "System"}</td>
                          <td className="notes-col" title={mov.notes || ""}>
                            {mov.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Dialog */}
      {adjustModalOpen && (
        <StockAdjustmentDialog
          onClose={() => setAdjustModalOpen(false)}
          onSave={handleSaveAdjustment}
          isLoading={isAdjusting}
          error={adjustError}
          products={stockItems.map((it) => ({
            id: it.productId,
            name: it.productName,
            productName: it.productName,
            code: it.productCode,
            productCode: it.productCode,
            sku: it.sku,
            currentStock: it.currentStock,
          }))}
          companyId={activeCompany?.id}
        />
      )}
    </div>
  );
}
