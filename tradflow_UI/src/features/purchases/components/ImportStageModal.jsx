import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useLazyGetMarketRatesQuery } from "../purchasesApi";

const STAGES = [
  { id: "order", label: "1. Order & RMB", icon: "📋" },
  { id: "production", label: "2. Factory Production", icon: "🏭" },
  { id: "shipping", label: "3. LCL Shipping", icon: "🚢" },
  { id: "customs", label: "4. Customs & Landed Cost", icon: "🛃" },
  { id: "warehouse", label: "5. Warehouse Receipt", icon: "📦" },
];

export default function ImportStageModal({
  shipment,
  onClose,
  onSave,
  isLoading,
  error,
  suppliers = [],
  companyId,
}) {
  const isEditing = Boolean(shipment?.id);
  const [activeStage, setActiveStage] = useState("order");

  // Local live calculator states
  const [totalRmb, setTotalRmb] = useState(shipment?.totalRmb || shipment?.rmbPrice || "");
  const [exchangeRate, setExchangeRate] = useState(shipment?.exchangeRate || "14.30");
  const [agentCharges, setAgentCharges] = useState(shipment?.agentCharges ?? "");
  const [totalBoxes, setTotalBoxes] = useState(shipment?.totalBoxes || "");
  const [advancePercent, setAdvancePercent] = useState(shipment?.advancePercentage || "30");
  const [silverRate, setSilverRate] = useState(shipment?.silverRate ?? "");
  const [copperRate, setCopperRate] = useState(shipment?.copperRate ?? "");
  const [transportationExpense, setTransportationExpense] = useState(shipment?.transportationExpense || 0);
  const [importExpense, setImportExpense] = useState(shipment?.totalImportExpense || 0);

  // Live market rate querying
  const [fetchMarketRates, { isFetching: isFetchingRates }] = useLazyGetMarketRatesQuery();
  const [ratesFetchStatus, setRatesFetchStatus] = useState(null);

  const handleFetchLiveRates = async () => {
    try {
      const res = await fetchMarketRates(true).unwrap();
      if (res) {
        if (res.exchangeRate) setExchangeRate(String(res.exchangeRate));
        if (res.silverRate) setSilverRate(String(res.silverRate));
        if (res.copperRate) setCopperRate(String(res.copperRate));
        setRatesFetchStatus({
          type: "success",
          msg: `Live rates applied (${res.lastUpdated || "today"}). 1¥ = ₹${res.exchangeRate} | Silver: ₹${Number(res.silverRate).toLocaleString("en-IN")}/kg | Copper: ₹${Number(res.copperRate).toLocaleString("en-IN")}/kg`,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch live rates from API:", err);
      setRatesFetchStatus({
        type: "error",
        msg: "Unable to reach market rate feed. Please enter rates manually or try again.",
      });
    }
  };

  // Derived calculations
  const rmbVal = Number(totalRmb || 0);
  const exRateVal = Number(exchangeRate || 0);
  const agentChargesVal = Number(agentCharges || 0);
  const advPercentVal = Number(advancePercent || 0);
  const transportVal = Number(transportationExpense || 0);
  const importExpVal = Number(importExpense || 0);

  const totalPurchaseInr = rmbVal * exRateVal;
  const advanceAmount = totalPurchaseInr * (advPercentVal / 100);
  const landedCost = totalPurchaseInr + agentChargesVal + transportVal + importExpVal;

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const v = Object.fromEntries(formData);

    const payload = {
      companyId,
      importNumber: v.importNumber?.trim(),
      supplierId: v.supplierId || null,
      orderDate: v.orderDate || null,
      currencyCode: v.currencyCode || "CNY",
      rmbPrice: v.rmbPrice ? Number(v.rmbPrice) : rmbVal,
      exchangeRate: exRateVal,
      totalRmb: rmbVal,
      totalPurchaseValue: totalPurchaseInr,
      agentFeeBasis: null,
      agentRate: null,
      agentRatePerRmb: null,
      agentCharges: agentChargesVal,
      totalBoxes: v.totalBoxes ? Number(v.totalBoxes) : (Number(totalBoxes) || 0),
      silverRate: silverRate ? Number(silverRate) : (v.silverRate ? Number(v.silverRate) : null),
      copperRate: copperRate ? Number(copperRate) : (v.copperRate ? Number(v.copperRate) : null),
      advancePercentage: advPercentVal,
      advanceAmount: advanceAmount,
      productionReadyDate: v.productionReadyDate || null,
      packingListDate: v.packingListDate || null,
      goodsLoadingDate: v.goodsLoadingDate || null,
      portArrivalDate: v.portArrivalDate || null,
      warehouseArrivalDate: v.warehouseArrivalDate || null,
      customsStatus: v.customsStatus || null,
      holdReason: v.holdReason?.trim() || null,
      transportationExpense: transportVal,
      totalImportExpense: importExpVal,
      landedCost: landedCost,
      status: v.status || "ORDERED",
      remarks: v.remarks?.trim() || null,
    };

    onSave(payload);
  };

  return (
    <div className="access-modal-backdrop">
      <form className="product-modal-dialog" style={{ width: "min(94vw, 840px)" }} onSubmit={handleSubmit}>
        <div className="product-modal-head">
          <div>
            <p className="access-kicker">China Factory Sourcing (LCL Tracking)</p>
            <h2>{isEditing ? `Update Shipment: ${shipment.importNumber}` : "Book New China Import Shipment"}</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        {error && (
          <ErrorMessage style={{ marginBottom: "12px" }}>
            {error?.data?.message || error?.error || "Unable to save import shipment."}
          </ErrorMessage>
        )}

        {/* Live Currency & Landed Costing Banner */}
        <div className="import-calc-banner">
          <div className="calc-metric-box">
            <label>Total RMB</label>
            <strong>¥{rmbVal.toLocaleString()}</strong>
          </div>
          <div className="calc-metric-box">
            <label>Purchase Value (INR)</label>
            <strong style={{ color: "#2563eb" }}>{formatCurrency(totalPurchaseInr)}</strong>
          </div>
          <div className="calc-metric-box">
            <label>Agent Comm.</label>
            <strong>{formatCurrency(agentChargesVal)}</strong>
          </div>
          <div className="calc-metric-box">
            <label>30% Advance (INR)</label>
            <strong style={{ color: "#d97706" }}>{formatCurrency(advanceAmount)}</strong>
          </div>
          <div className="calc-metric-box">
            <label>Total Landed Cost</label>
            <strong style={{ color: "#059669" }}>{formatCurrency(landedCost)}</strong>
          </div>
        </div>

        {/* Multi-stage Navigation Buttons */}
        <div className="import-step-nav">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`import-step-btn ${activeStage === s.id ? "active" : ""}`}
              onClick={() => setActiveStage(s.id)}
            >
              <span className="import-step-num">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Stage 1: Order & RMB Budget */}
        <div style={{ display: activeStage === "order" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            {/* Live Today Rates Bar */}
            <div style={{
              gridColumn: "1 / -1",
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "6px"
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚡ Today&apos;s Live Market &amp; Forex Rates</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>
                    Live Feed
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "3px" }}>
                  Fetches live CNY to INR forex and COMEX commodities (Silver &amp; Copper converted to ₹/kg) to auto-populate fields.
                </div>
              </div>
              <button
                type="button"
                onClick={handleFetchLiveRates}
                disabled={isFetchingRates}
                style={{
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: isFetchingRates ? "#94a3b8" : "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isFetchingRates ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  transition: "background 0.2s ease"
                }}
              >
                {isFetchingRates ? "⏳ Fetching Live Rates..." : "⚡ Fetch Live Today Rates"}
              </button>
            </div>

            {ratesFetchStatus && (
              <div style={{
                gridColumn: "1 / -1",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: ratesFetchStatus.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: ratesFetchStatus.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${ratesFetchStatus.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}>
                <span style={{ fontWeight: 500 }}>{ratesFetchStatus.msg}</span>
                <button
                  type="button"
                  onClick={() => setRatesFetchStatus(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold", fontSize: "14px", padding: "0 4px" }}
                >
                  ×
                </button>
              </div>
            )}

            <div className="product-dialog-field">
              <label htmlFor="importNumber">Shipment / Import Ref No *</label>
              <input
                id="importNumber"
                name="importNumber"
                defaultValue={shipment?.importNumber || `IMP-${Date.now().toString().slice(-6)}`}
                required
                placeholder="e.g. IMP-2026-001"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="supplierId">China Supplier / Factory *</label>
              <select id="supplierId" name="supplierId" defaultValue={shipment?.supplierId || ""}>
                <option value="">-- Select Factory --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.partyName} ({s.country || "China"})
                  </option>
                ))}
              </select>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="orderDate">Order Placement Date</label>
              <input
                id="orderDate"
                name="orderDate"
                type="date"
                defaultValue={shipment?.orderDate || new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="currencyCode">Billing Currency</label>
              <input
                id="currencyCode"
                name="currencyCode"
                defaultValue={shipment?.currencyCode || "CNY"}
                readOnly
                style={{ background: "#f1f5f9" }}
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="totalRmb">Total Order RMB (¥) *</label>
              <input
                id="totalRmb"
                name="totalRmb"
                type="number"
                step="0.01"
                value={totalRmb}
                onChange={(e) => setTotalRmb(e.target.value)}
                placeholder="e.g. 25000.00"
                required
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="exchangeRate" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Exchange Rate (INR per RMB) *</span>
                {exchangeRate && <span style={{ fontSize: "10.5px", color: "#16a34a", fontWeight: 600 }}>1¥ = ₹{exchangeRate}</span>}
              </label>
              <input
                id="exchangeRate"
                name="exchangeRate"
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="e.g. 14.30"
                required
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="agentCharges">Agent Commission / Fee (₹)</label>
              <input
                id="agentCharges"
                name="agentCharges"
                type="number"
                step="0.01"
                value={agentCharges}
                onChange={(e) => setAgentCharges(e.target.value)}
                placeholder="e.g. 15000.00"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="totalBoxes">Total Cargo Boxes / Cartons</label>
              <input
                id="totalBoxes"
                name="totalBoxes"
                type="number"
                step="1"
                value={totalBoxes}
                onChange={(e) => setTotalBoxes(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="advancePercentage">Advance Paid (%)</label>
              <input
                id="advancePercentage"
                name="advancePercentage"
                type="number"
                step="1"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="silverRate" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Silver Benchmark Rate (₹/kg)</span>
                {silverRate && <span style={{ fontSize: "10.5px", color: "#475569", fontWeight: 600 }}>₹{Number(silverRate).toLocaleString("en-IN")}/kg</span>}
              </label>
              <input
                id="silverRate"
                name="silverRate"
                type="number"
                step="0.01"
                value={silverRate}
                onChange={(e) => setSilverRate(e.target.value)}
                placeholder="e.g. 92000.00"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="copperRate" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Copper Benchmark Rate (₹/kg)</span>
                {copperRate && <span style={{ fontSize: "10.5px", color: "#b45309", fontWeight: 600 }}>₹{Number(copperRate).toLocaleString("en-IN")}/kg</span>}
              </label>
              <input
                id="copperRate"
                name="copperRate"
                type="number"
                step="0.01"
                value={copperRate}
                onChange={(e) => setCopperRate(e.target.value)}
                placeholder="e.g. 840.00"
              />
            </div>
          </div>
        </div>

        {/* Stage 2: Factory Production */}
        <div style={{ display: activeStage === "production" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="productionReadyDate">Production Completion Date</label>
              <input
                id="productionReadyDate"
                name="productionReadyDate"
                type="date"
                defaultValue={shipment?.productionReadyDate || ""}
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Date when factory finishes manufacturing batch.</small>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="packingListDate">Packing List &amp; Invoice Date</label>
              <input
                id="packingListDate"
                name="packingListDate"
                type="date"
                defaultValue={shipment?.packingListDate || ""}
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Date commercial invoice and carton list are ready.</small>
            </div>
          </div>
        </div>

        {/* Stage 3: LCL Shipping & Port */}
        <div style={{ display: activeStage === "shipping" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="goodsLoadingDate">LCL Container Loading Date</label>
              <input
                id="goodsLoadingDate"
                name="goodsLoadingDate"
                type="date"
                defaultValue={shipment?.goodsLoadingDate || ""}
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Loaded in China consolidation warehouse/port.</small>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="portArrivalDate">Indian Port Expected Arrival</label>
              <input
                id="portArrivalDate"
                name="portArrivalDate"
                type="date"
                defaultValue={shipment?.portArrivalDate || ""}
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Nhava Sheva, Mundra, or destination port.</small>
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="transportationExpense">Sea Freight &amp; LCL Carting (₹)</label>
              <input
                id="transportationExpense"
                name="transportationExpense"
                type="number"
                step="0.01"
                value={transportationExpense}
                onChange={(e) => setTransportationExpense(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Stage 4: Customs Clearance & Landed Cost */}
        <div style={{ display: activeStage === "customs" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="customsStatus">Indian Customs Clearance Status</label>
              <select id="customsStatus" name="customsStatus" defaultValue={shipment?.customsStatus || "PENDING"}>
                <option value="PENDING">PENDING (Awaiting Bill of Entry)</option>
                <option value="IN_ASSESSMENT">IN_ASSESSMENT (Duty assessment)</option>
                <option value="DUTY_PAID">DUTY_PAID (Customs duty deposited)</option>
                <option value="CLEARED">CLEARED (Out of Charge granted)</option>
                <option value="ON_HOLD">ON_HOLD (Inspection / Query)</option>
              </select>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="totalImportExpense">Total Customs Duty &amp; Port Fees (₹)</label>
              <input
                id="totalImportExpense"
                name="totalImportExpense"
                type="number"
                step="0.01"
                value={importExpense}
                onChange={(e) => setImportExpense(e.target.value)}
                placeholder="0.00"
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Basic Customs Duty, IGST, Port handling, CHA.</small>
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="holdReason">Hold / Inspection Reason (if any)</label>
              <input
                id="holdReason"
                name="holdReason"
                defaultValue={shipment?.holdReason || ""}
                placeholder="Customs query, document mismatch, or examination notes..."
              />
            </div>
          </div>
        </div>

        {/* Stage 5: Warehouse Delivery & Remarks */}
        <div style={{ display: activeStage === "warehouse" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="warehouseArrivalDate">Warehouse Delivery Date</label>
              <input
                id="warehouseArrivalDate"
                name="warehouseArrivalDate"
                type="date"
                defaultValue={shipment?.warehouseArrivalDate || ""}
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="status">Overall Shipment Status</label>
              <select id="status" name="status" defaultValue={shipment?.status || "ORDERED"}>
                <option value="ORDERED">ORDERED (Factory order placed)</option>
                <option value="IN_PRODUCTION">IN_PRODUCTION (Manufacturing)</option>
                <option value="SHIPPED">SHIPPED (In Sea Transit / LCL)</option>
                <option value="PORT_ARRIVED">PORT_ARRIVED (Arrived at Port)</option>
                <option value="CUSTOMS_CLEARING">CUSTOMS_CLEARING (Customs in progress)</option>
                <option value="WAREHOUSE_RECEIVED">WAREHOUSE_RECEIVED (In stock)</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="remarks">Remarks &amp; Supplier Notes</label>
              <textarea
                id="remarks"
                name="remarks"
                defaultValue={shipment?.remarks || ""}
                placeholder="Container marks, carton counts, Bill of Lading numbers..."
              />
            </div>
          </div>
        </div>

        <div className="product-modal-foot">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? "Save Stage Updates" : "Book Shipment"}
          </Button>
        </div>
      </form>
    </div>
  );
}

