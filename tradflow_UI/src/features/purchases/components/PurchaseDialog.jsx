import { useState, useEffect, useMemo } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import ProductAutocomplete from "./ProductAutocomplete";
import Packaging3DViewer from "../../products/components/Packaging3DViewer";
import Container3DViewer from "../../products/components/Container3DViewer";
import "../purchases.css";

const extractPackaging = (p) => {
  const specs = p?.specifications || {};
  const pkg = specs.packagingConfiguration || specs.packagingAndDimensions || {};
  const boxDim = pkg.boxDimensions || {};
  const pieceDim = pkg.pieceDimensions || {};
  return {
    piecesPerBox: pkg.piecesPerBox || 1,
    length: pkg.boxLength || boxDim.length || null,
    width: pkg.boxWidth || boxDim.width || null,
    height: pkg.boxHeight || boxDim.height || null,
    dimensionUnit: pkg.boxDimensionUnit || boxDim.unit || pkg.dimensionUnit || "cm",
    netWeight: pkg.pieceNetWeight || pkg.netWeight || null,
    grossWeight: pkg.boxGrossWeight || pkg.grossWeight || null,
    weightUnit: pkg.boxWeightUnit || pkg.weightUnit || "kg",
  };
};

const createInitialItem = (p) => {
  const pkg = extractPackaging(p);
  const piecesPerBox = pkg.piecesPerBox || 1;
  const quantity = piecesPerBox;
  const boxCount = piecesPerBox > 0 ? (quantity % piecesPerBox === 0 ? quantity / piecesPerBox : Number((quantity / piecesPerBox).toFixed(2))) : 1;
  return {
    productId: p?.id || "",
    packagingType: "PIECE",
    piecesPerBox,
    boxCount,
    quantity,
    rate: p?.purchasePrice || 0,
    discountPercent: 0,
    discountAmount: 0,
    taxRate: 0,
    length: pkg.length,
    width: pkg.width,
    height: pkg.height,
    dimensionUnit: pkg.dimensionUnit,
    netWeight: pkg.netWeight,
    grossWeight: pkg.grossWeight,
    weightUnit: pkg.weightUnit,
  };
};

export default function PurchaseDialog({
  onClose,
  onSave,
  isLoading,
  error,
  suppliers = [],
  imports = [],
  products = [],
  companyId,
  initialSupplierId,
}) {
  const [purchaseNumber, setPurchaseNumber] = useState(`PUR-${Date.now().toString().slice(-6)}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState(initialSupplierId || suppliers[0]?.id || "");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  // Default to NON_GST per user requirement for factory purchases from China
  const [transactionType, setTransactionType] = useState("NON_GST");
  const [importId, setImportId] = useState("");
  const [currencyCode, setCurrencyCode] = useState("CNY");
  const [exchangeRate, setExchangeRate] = useState(14.50);

  // 3D Visualization states
  const [showContainer3D, setShowContainer3D] = useState(false);
  const [showCargo3D, setShowCargo3D] = useState(false);
  const [selected3DIndex, setSelected3DIndex] = useState(0);

  const [remarks, setRemarks] = useState("");

  const [items, setItems] = useState([createInitialItem(products[0])]);

  // China-to-warehouse logistics & landed cost expense
  const [otherCharges, setOtherCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Selected supplier & linked import
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const isChinaSupplier = !selectedSupplier || selectedSupplier.country === "China" || !selectedSupplier.gstin;

  useEffect(() => {
    if (selectedSupplier && selectedSupplier.country === "China") {
      setCurrencyCode("CNY");
      setTransactionType("NON_GST");
    }
  }, [selectedSupplier]);

  // When linked import changes, pre-fill shipment settings
  const handleImportChange = (id) => {
    setImportId(id);
    if (!id) return;
    const imp = imports.find((x) => x.id === id);
    if (imp) {
      if (imp.supplierId) setSupplierId(imp.supplierId);
      if (imp.currencyCode) setCurrencyCode(imp.currencyCode);
      if (imp.exchangeRate) setExchangeRate(Number(imp.exchangeRate));
      if (imp.supplierInvoiceNumber) setSupplierInvoiceNumber(imp.supplierInvoiceNumber);
      if (imp.totalImportExpense || imp.agentCharges) {
        const exp = Number(imp.totalImportExpense || 0) + Number(imp.agentCharges || 0) + Number(imp.transportationExpense || 0);
        if (exp > 0) setOtherCharges(exp);
      }
    }
  };

  const handleProductChange = (index, prodId) => {
    const p = products.find((x) => x.id === prodId);
    const pkg = extractPackaging(p);
    const updated = [...items];
    const prev = updated[index];
    const piecesPerBox = pkg.piecesPerBox || 1;
    const quantity = prev.quantity || piecesPerBox;
    const boxCount = piecesPerBox > 0 ? (quantity % piecesPerBox === 0 ? quantity / piecesPerBox : Number((quantity / piecesPerBox).toFixed(2))) : 0;

    updated[index] = {
      ...prev,
      productId: prodId,
      rate: p?.purchasePrice || 0,
      taxRate: transactionType === "GST" ? (p?.gstRate ?? 18) : 0,
      piecesPerBox,
      boxCount,
      quantity,
      packagingType: "PIECE",
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      dimensionUnit: pkg.dimensionUnit,
      netWeight: pkg.netWeight,
      grossWeight: pkg.grossWeight,
      weightUnit: pkg.weightUnit,
    };
    setItems(updated);
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === "quantity") {
      const qty = Number(value) || 0;
      item.quantity = value;
      const ppb = Number(item.piecesPerBox) || 1;
      item.boxCount = ppb > 0 ? (qty % ppb === 0 ? qty / ppb : Number((qty / ppb).toFixed(2))) : 0;
    } else {
      item[field] = value;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, createInitialItem(products[0])]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Intermediate Line & Cargo Calculations
  const calculatedItemsBase = useMemo(() => {
    return items.map((item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const discPercent = Number(item.discountPercent || 0);
      const gross = qty * rate;
      const discAmount = (gross * discPercent) / 100;
      const taxable = Math.max(gross - discAmount, 0);

      const taxRate = transactionType === "GST" ? Number(item.taxRate || 0) : 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (taxRate > 0) {
        if (isChinaSupplier) {
          igst = (taxable * taxRate) / 100;
        } else {
          const half = taxRate / 2;
          cgst = (taxable * half) / 100;
          sgst = (taxable * half) / 100;
        }
      }

      const total = taxable + cgst + sgst + igst;

      // Packaging, Box & CBM calculations
      const bL = Number(item.length || 0);
      const bW = Number(item.width || 0);
      const bH = Number(item.height || 0);
      const bGrossWt = Number(item.grossWeight || item.netWeight || 0);
      const boxCountNum = Number(item.boxCount || 0);

      const boxCbm = (bL > 0 && bW > 0 && bH > 0) ? (bL * bW * bH) / 1000000 : 0;
      const lineCbm = boxCbm * boxCountNum;
      const lineWeightKg = bGrossWt * boxCountNum;

      return {
        ...item,
        qty,
        rate,
        gross,
        discAmount,
        taxable,
        taxRate,
        cgst,
        sgst,
        igst,
        total,
        boxCbm,
        lineCbm,
        lineWeightKg,
      };
    });
  }, [items, transactionType, isChinaSupplier]);

  // Aggregate invoice totals
  const subtotal = calculatedItemsBase.reduce((sum, i) => sum + i.gross, 0);
  const totalDiscount = calculatedItemsBase.reduce((sum, i) => sum + i.discAmount, 0);
  const taxableAmount = calculatedItemsBase.reduce((sum, i) => sum + i.taxable, 0);
  const totalCgst = calculatedItemsBase.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = calculatedItemsBase.reduce((sum, i) => sum + i.sgst, 0);
  const totalIgst = calculatedItemsBase.reduce((sum, i) => sum + i.igst, 0);

  // Cargo Totals
  const totalBoxes = calculatedItemsBase.reduce((sum, i) => sum + Number(i.boxCount || 0), 0);
  const totalCbm = calculatedItemsBase.reduce((sum, i) => sum + i.lineCbm, 0);
  const totalWeightKg = calculatedItemsBase.reduce((sum, i) => sum + i.lineWeightKg, 0);
  const totalPiecesCount = calculatedItemsBase.reduce((sum, i) => sum + i.qty, 0);

  const otherChargesNum = Number(otherCharges || 0);
  const roundOffNum = Number(roundOff || 0);
  const exRate = Number(exchangeRate || 1);

  // Total product purchase cost in INR
  const totalPurchaseValueInr = currencyCode === "CNY" ? taxableAmount * exRate : taxableAmount;
  const expensePercentage = totalPurchaseValueInr > 0 ? (otherChargesNum / totalPurchaseValueInr) * 100 : 0;

  // Total Landed Cost (INR) = Product Value (INR) + China-to-Warehouse Logistics (INR) + Tax + RoundOff
  const totalLandedCostInr = totalPurchaseValueInr + totalCgst + totalSgst + totalIgst + otherChargesNum + roundOffNum;
  // If currency is CNY, RMB equivalent of total landed cost
  const landedRmbEquivalent = exRate > 0 ? totalLandedCostInr / exRate : taxableAmount;

  const grandTotal = totalLandedCostInr;
  const paidAmountNum = Number(paidAmount || 0);
  const outstandingAmount = Math.max(grandTotal - paidAmountNum, 0);

  const finalItems = useMemo(() => {
    const totalExtra = otherChargesNum;

    return calculatedItemsBase.map((item) => {
      const qty = item.qty || 1;
      // Line purchase value
      const lineCostInr = currencyCode === "CNY" ? item.taxable * exRate : item.taxable;
      const unitPurchaseCostInr = qty > 0 ? lineCostInr / qty : (currencyCode === "CNY" ? item.rate * exRate : item.rate);

      // Proportional allocated expense based on product purchase value
      const lineRatio = totalPurchaseValueInr > 0 ? lineCostInr / totalPurchaseValueInr : (taxableAmount > 0 ? item.taxable / taxableAmount : 0);
      const allocatedExpenseInr = totalExtra * lineRatio;
      const expensePerPieceInr = qty > 0 ? allocatedExpenseInr / qty : 0;

      // Landed product cost per piece (INR)
      const landedCostPerPieceInr = unitPurchaseCostInr + expensePerPieceInr;
      const landedProductCostInr = lineCostInr + allocatedExpenseInr;

      // Native currency equivalent
      const unitLandedCostNative = currencyCode === "CNY" ? (exRate > 0 ? landedCostPerPieceInr / exRate : item.rate) : landedCostPerPieceInr;

      return {
        ...item,
        lineCostInr,
        unitPurchaseCostInr,
        allocatedExpenseInr,
        expensePerPieceInr,
        landedCostPerPieceInr,
        landedProductCostInr,
        unitLandedCost: unitLandedCostNative,
        unitLandedCostInr: landedCostPerPieceInr,
      };
    });
  }, [calculatedItemsBase, otherChargesNum, totalPurchaseValueInr, taxableAmount, currencyCode, exchangeRate]);

  const currSymbol = currencyCode === "CNY" ? "¥" : "₹";
  const formatCur = (val, sym = currSymbol) =>
    `${sym}${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      companyId,
      purchaseNumber: purchaseNumber.trim(),
      purchaseDate,
      supplierId,
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || null,
      supplierInvoiceDate: supplierInvoiceDate || null,
      transactionType,
      currencyCode,
      rmbPrice: currencyCode === "CNY" ? taxableAmount : null,
      exchangeRate: currencyCode === "CNY" ? Number(exchangeRate) : 1.0,
      totalRmb: currencyCode === "CNY" ? taxableAmount : null,
      totalBoxes: Math.ceil(totalBoxes),
      totalCbm: Number(totalCbm.toFixed(4)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      importId: importId || null,
      otherCharges: otherChargesNum,
      roundOff: roundOffNum,
      grandTotal: Number(totalLandedCostInr.toFixed(2)),
      paidAmount: paidAmountNum,
      status: "CONFIRMED",
      remarks: remarks.trim() || null,
      items: finalItems.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        rate: Number(i.rate),
        discountPercent: Number(i.discountPercent),
        discountAmount: i.discAmount,
        taxRate: Number(i.taxRate),
        cgstAmount: i.cgst,
        sgstAmount: i.sgst,
        igstAmount: i.igst,
        taxableAmount: i.taxable,
        totalAmount: i.total,
        packagingType: "PIECE",
        piecesPerBox: Number(i.piecesPerBox || 1),
        boxCount: Number(i.boxCount || 0),
        totalPieces: Number(i.qty),
        length: i.length ? Number(i.length) : null,
        width: i.width ? Number(i.width) : null,
        height: i.height ? Number(i.height) : null,
        dimensionUnit: i.dimensionUnit || "cm",
        netWeight: i.netWeight ? Number(i.netWeight) : null,
        grossWeight: i.grossWeight ? Number(i.grossWeight) : null,
        weightUnit: i.weightUnit || "kg",
        totalCbm: Number(i.lineCbm.toFixed(4)),
        totalWeightKg: Number(i.lineWeightKg.toFixed(2)),
        unitLandedCost: Number(i.landedCostPerPieceInr.toFixed(2)),
      })),
    };

    onSave(payload);
  };

  return (
    <div className="access-modal-backdrop">
      <form className="product-modal-dialog" style={{ width: "min(98vw, 1200px)", maxHeight: "94vh" }} onSubmit={handleSubmit}>
        <div className="product-modal-head">
          <div>
            <p className="access-kicker">Purchases &amp; China Import Procurement</p>
            <h2>Create Purchase Invoice</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        {error && (
          <ErrorMessage style={{ marginBottom: "12px" }}>
            {error?.data?.message || error?.error || "Failed to create purchase invoice."}
          </ErrorMessage>
        )}

        {/* Header Configuration */}
        <div className="product-modal-grid" style={{ marginBottom: "12px" }}>
          <div className="product-dialog-field">
            <label>Purchase Ref No *</label>
            <input
              required
              value={purchaseNumber}
              onChange={(e) => setPurchaseNumber(e.target.value)}
              placeholder="e.g. PUR-2026-001"
            />
          </div>

          <div className="product-dialog-field">
            <label>Purchase Date *</label>
            <input
              required
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="product-dialog-field">
            <label>Supplier / Vendor *</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.partyName} ({s.country || "China"})
                </option>
              ))}
            </select>
          </div>

          <div className="product-dialog-field">
            <label>Transaction Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="NON_GST">NON-GST / Import (No Indian GST)</option>
              <option value="GST">GST Registered (Indian Domestic)</option>
            </select>
          </div>

          <div className="product-dialog-field">
            <label>Currency &amp; Forex</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                style={{ width: "90px" }}
              >
                <option value="CNY">CNY (¥)</option>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
              {currencyCode === "CNY" && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>1¥=₹</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    style={{ width: "100%", height: "34px", padding: "0 6px", fontSize: "12px" }}
                    placeholder="Rate"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="product-dialog-field">
            <label>Supplier Invoice No</label>
            <input
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-CN-9042"
            />
          </div>

          <div className="product-dialog-field">
            <label>Supplier Invoice Date</label>
            <input
              type="date"
              value={supplierInvoiceDate}
              onChange={(e) => setSupplierInvoiceDate(e.target.value)}
            />
          </div>

          <div className="product-dialog-field">
            <label>Link to China Import Shipment (LCL)</label>
            <select value={importId} onChange={(e) => handleImportChange(e.target.value)}>
              <option value="">-- None / Standalone Order --</option>
              {imports.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  {imp.importNumber} — {imp.supplierName || "China Shipment"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Proper Container View for CBM Goods */}
        <div className="cbm-container-view">
          <div className="cbm-container-header">
            <div className="cbm-container-title">
              <span style={{ fontSize: "16px" }}>🚢</span>
              <span>LCL Cargo Consolidation &amp; CBM Container View</span>
              <span className="cbm-container-badge">CBM Goods</span>
            </div>

            <button
              type="button"
              onClick={() => setShowContainer3D(!showContainer3D)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: showContainer3D ? "#0284c7" : "#ffffff",
                color: showContainer3D ? "#ffffff" : "#0284c7",
                border: "1.5px solid #38bdf8",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.15s ease",
              }}
            >
              <span>🚢</span>
              <span>{showContainer3D ? "Hide 3D Container View" : "3D Container Visualization (20ft / 40ft)"}</span>
            </button>
          </div>

          <div className="cbm-grid">
            <div className="cbm-card">
              <div className="cbm-card-top">
                <span className="cbm-card-label">Total Cartons (Auto)</span>
                <span className="cbm-card-icon">📦</span>
              </div>
              <span className="cbm-card-value text-blue">{totalBoxes.toFixed(1)} Boxes</span>
              <span className="cbm-card-sub">Packaging Units</span>
            </div>

            <div className="cbm-card">
              <div className="cbm-card-top">
                <span className="cbm-card-label">Total Volume (CBM)</span>
                <span className="cbm-card-icon">📐</span>
              </div>
              <span className="cbm-card-value" style={{ color: "#0284c7" }}>{totalCbm.toFixed(4)} m³</span>
              <span className="cbm-card-sub">Cubic Capacity</span>
            </div>

            <div className="cbm-card">
              <div className="cbm-card-top">
                <span className="cbm-card-label">Gross Weight</span>
                <span className="cbm-card-icon">⚖️</span>
              </div>
              <span className="cbm-card-value" style={{ color: "#b45309" }}>{totalWeightKg.toFixed(2)} kg</span>
              <span className="cbm-card-sub">Consolidation Wt</span>
            </div>

            <div className="cbm-card">
              <div className="cbm-card-top">
                <span className="cbm-card-label">Total Purchased</span>
                <span className="cbm-card-icon">🔢</span>
              </div>
              <span className="cbm-card-value text-emerald">{totalPiecesCount} Pieces</span>
              <span className="cbm-card-sub">Calculated PCS</span>
            </div>

            {currencyCode === "CNY" && (
              <div className="cbm-card">
                <div className="cbm-card-top">
                  <span className="cbm-card-label">Product Cost INR (@ {exchangeRate})</span>
                  <span className="cbm-card-icon">💰</span>
                </div>
                <span className="cbm-card-value" style={{ color: "#4f46e5" }}>
                  ₹{totalPurchaseValueInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="cbm-card-sub">Goods Purchase Val</span>
              </div>
            )}

            {otherChargesNum > 0 && (
              <div className="cbm-card" style={{ borderColor: "#fed7aa", background: "#fffaf5" }}>
                <div className="cbm-card-top">
                  <span className="cbm-card-label" style={{ color: "#c2410c" }}>Logistics Loading</span>
                  <span className="cbm-card-icon">🚚</span>
                </div>
                <span className="cbm-card-value" style={{ color: "#c2410c" }}>
                  {expensePercentage.toFixed(4)}%
                </span>
                <span className="cbm-card-sub" style={{ color: "#ea580c" }}>
                  ₹{otherChargesNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3D Shipping Container Space Utilization View (20ft / 40ft) */}
        {showContainer3D && (
          <Container3DViewer
            totalCbm={totalCbm}
            totalWeightKg={totalWeightKg}
            totalBoxes={totalBoxes}
            totalPieces={totalPiecesCount}
            defaultContainer="20FT"
            viewerHeight="380px"
            onClose={() => setShowContainer3D(false)}
          />
        )}

        {/* Collapsible 3D Logistics Carton Panel */}
        {showCargo3D && (
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", marginBottom: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <strong style={{ fontSize: "13px", color: "#1e3a8a" }}>
                  📦 3D Logistics Carton &amp; X-Ray Packing Preview
                </strong>
                {finalItems.length > 1 && (
                  <select
                    value={selected3DIndex}
                    onChange={(e) => setSelected3DIndex(Number(e.target.value))}
                    style={{ height: "26px", fontSize: "11px", padding: "0 6px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  >
                    {finalItems.map((item, idx) => {
                      const p = products.find((x) => x.id === item.productId);
                      return (
                        <option key={idx} value={idx}>
                          Item {idx + 1}: {p?.productCode || `Line ${idx + 1}`} ({item.piecesPerBox || 1} pcs/box)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              <button
                type="button"
                className="access-close"
                style={{ fontSize: "16px", padding: "2px 6px", height: "auto" }}
                onClick={() => setShowCargo3D(false)}
                title="Close 3D viewer"
              >
                ×
              </button>
            </div>

            {(() => {
              const activeItem = finalItems[selected3DIndex] || finalItems[0];
              const p = products.find((x) => x.id === activeItem?.productId);
              return (
                <Packaging3DViewer
                  length={activeItem?.length || 42}
                  width={activeItem?.width || 32}
                  height={activeItem?.height || 26}
                  dimensionUnit={activeItem?.dimensionUnit || "cm"}
                  piecesPerBox={activeItem?.piecesPerBox || 1}
                  boxGrossWeight={activeItem?.grossWeight || 0}
                  weightUnit={activeItem?.weightUnit || "kg"}
                  productCode={p?.productCode || "PROD-LINE"}
                  productName={p?.productName || "Contactor"}
                  viewerHeight="280px"
                />
              );
            })()}
          </div>
        )}

        {/* Line Items Table */}
        <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <strong style={{ fontSize: "13px", color: "#0f172a" }}>Purchased Products ({items.length})</strong>
          <Button size="sm" type="button" variant="ghost" onClick={handleAddItem}>
            + Add Product Line
          </Button>
        </div>

        <div className="purchase-items-table-wrapper" style={{ flexShrink: 0, width: "100%", overflowX: "auto" }}>
          <table className="purchase-items-table">
            <thead>
              <tr>
                <th style={{ minWidth: "260px" }}>Product Item *</th>
                <th style={{ width: "105px", textAlign: "center" }}>Quantity (PCS) *</th>
                <th style={{ width: "140px", textAlign: "center" }}>Boxes (Auto) &amp; CBM</th>
                <th style={{ minWidth: "160px", width: "165px", textAlign: "right" }}>Rate ({currSymbol}/PC) *</th>
                <th style={{ width: "70px", textAlign: "center" }}>Disc %</th>
                <th style={{ textAlign: "right", width: "115px" }}>Total ({currSymbol})</th>
                {currencyCode === "CNY" && (
                  <th style={{ textAlign: "right", width: "125px" }}>Product Cost INR (₹)</th>
                )}
                {otherChargesNum > 0 && (
                  <th style={{ textAlign: "center", width: "140px" }}>Allocated Exp (₹)</th>
                )}
                <th style={{ textAlign: "center", width: "145px" }}>Landed Cost ₹/PC</th>
                <th style={{ width: "40px", textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {finalItems.map((item, idx) => (
                <tr key={idx}>
                  {/* Product Autocomplete */}
                  <td>
                    <div className="table-control-slot" style={{ width: "100%" }}>
                      <ProductAutocomplete
                        products={products}
                        value={item.productId}
                        onChange={(prodId) => handleProductChange(idx, prodId)}
                        placeholder="Search code, name, brand..."
                      />
                    </div>
                    <div className="table-sub-slot" style={{ color: "#64748b" }}>
                      <span>Config: <strong>1 Box = {item.piecesPerBox || 1} PCS</strong></span>
                    </div>
                  </td>

                  {/* Quantity (PCS) - Clean 4-digit display without internal PCS */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "center" }}>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        style={{
                          width: "90px",
                          height: "36px",
                          padding: "0 8px",
                          fontSize: "13px",
                          textAlign: "center",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "1.5px solid #cbd5e1",
                        }}
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "center", color: "#059669", fontWeight: 700 }}>
                      <span>Pieces</span>
                    </div>
                  </td>

                  {/* Boxes (Auto) & CBM Popover */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "center" }}>
                      <div className="box-hover-wrapper">
                        <div className="box-pill-trigger">
                          <span>📦 {item.boxCount} Boxes</span>
                          <span className="box-pill-info-icon" title="Hover for packaging & CBM breakdown">ℹ️</span>
                        </div>
                        <div className="box-hover-popover">
                          <div className="box-popover-head">
                            <span className="box-popover-title">📦 {item.boxCount} Boxes</span>
                            <span style={{ fontSize: "10.5px", color: "#0284c7", fontWeight: 700 }}>
                              {item.lineCbm > 0 ? `${item.lineCbm.toFixed(4)} m³` : "0 CBM"}
                            </span>
                          </div>
                          <div className="box-popover-calc">
                            ({item.qty || 0} PCS ÷ {item.piecesPerBox || 1}/box)
                          </div>
                          <div className="box-popover-divider" />
                          <div className="box-popover-row">
                            <span>Dimensions:</span>
                            <strong>
                              {item.length || "—"}×{item.width || "—"}×{item.height || "—"} {item.dimensionUnit || "cm"}
                            </strong>
                          </div>
                          <div className="box-popover-row">
                            <span>Volume:</span>
                            <strong style={{ color: "#0284c7" }}>
                              {item.lineCbm > 0 ? `${item.lineCbm.toFixed(4)} CBM` : "0 CBM"}
                            </strong>
                          </div>
                          <div className="box-popover-row">
                            <span>Gross Weight:</span>
                            <strong style={{ color: "#b45309" }}>
                              {item.lineWeightKg > 0 ? `${item.lineWeightKg.toFixed(1)} kg` : "0 kg"}
                            </strong>
                          </div>
                          <div className="box-popover-divider" />
                          <button
                            type="button"
                            className="box-popover-3d-btn"
                            onClick={() => {
                              setSelected3DIndex(idx);
                              setShowCargo3D(true);
                            }}
                          >
                            <span>📦</span> 3D Preview
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "center", color: "#0284c7", fontWeight: 600 }}>
                      <span>{item.lineCbm > 0 ? `${item.lineCbm.toFixed(4)} CBM` : "0 CBM"}</span>
                    </div>
                  </td>

                  {/* Rate - Increased Width */}
                  <td style={{ minWidth: "160px", width: "165px" }}>
                    <div className="table-control-slot" style={{ width: "100%" }}>
                      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            position: "absolute",
                            left: "10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#64748b",
                            pointerEvents: "none",
                          }}
                        >
                          {currSymbol}
                        </span>
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          style={{
                            width: "100%",
                            minWidth: "140px",
                            height: "36px",
                            padding: "0 10px 0 24px",
                            fontSize: "13px",
                            textAlign: "right",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                          value={item.rate}
                          onChange={(e) => handleItemFieldChange(idx, "rate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "flex-end", color: "#64748b", fontFamily: "monospace" }}>
                      {currencyCode === "CNY" ? (
                        <span>₹{item.unitPurchaseCostInr.toFixed(2)}/pc</span>
                      ) : (
                        <span>Per Unit Rate</span>
                      )}
                    </div>
                  </td>

                  {/* Discount % */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        style={{
                          width: "60px",
                          height: "36px",
                          padding: "0 4px",
                          fontSize: "12px",
                          textAlign: "center",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: "6px",
                          fontWeight: 600,
                        }}
                        value={item.discountPercent}
                        onChange={(e) => handleItemFieldChange(idx, "discountPercent", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "center", color: "#94a3b8" }}>
                      <span>%</span>
                    </div>
                  </td>

                  {/* Total Currency */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "flex-end" }}>
                      <strong style={{ fontFamily: "monospace", fontSize: "13px", color: "#0f172a" }}>
                        {formatCur(item.taxable)}
                      </strong>
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "flex-end", color: "#94a3b8" }}>
                      <span>Taxable</span>
                    </div>
                  </td>

                  {/* Product Cost INR */}
                  {currencyCode === "CNY" && (
                    <td>
                      <div className="table-control-slot" style={{ justifyContent: "flex-end" }}>
                        <strong style={{ fontFamily: "monospace", fontSize: "13px", color: "#1e293b" }}>
                          ₹{item.lineCostInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div className="table-sub-slot" style={{ justifyContent: "flex-end", color: "#64748b", fontFamily: "monospace" }}>
                        <span>@ {exchangeRate}</span>
                      </div>
                    </td>
                  )}

                  {/* Allocated Expense */}
                  {otherChargesNum > 0 && (
                    <td>
                      <div className="table-control-slot" style={{ justifyContent: "center" }}>
                        <div className="allocated-expense-tag">
                          <span>₹{item.allocatedExpenseInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="table-sub-slot" style={{ justifyContent: "center", color: "#c2410c", fontFamily: "monospace" }}>
                        <span>(+₹{item.expensePerPieceInr.toFixed(2)}/pc)</span>
                      </div>
                    </td>
                  )}

                  {/* Landed Cost */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "center" }}>
                      <div className="landed-cost-badge">
                        <span>₹{item.landedCostPerPieceInr.toFixed(2)}/pc</span>
                      </div>
                    </div>
                    <div className="table-sub-slot" style={{ justifyContent: "center", color: "#065f46", fontFamily: "monospace" }}>
                      {currencyCode === "CNY" ? (
                        <span>({formatCur(item.unitLandedCost)}/pc)</span>
                      ) : (
                        <span>Unit Landed</span>
                      )}
                    </div>
                  </td>

                  {/* Remove Button */}
                  <td>
                    <div className="table-control-slot" style={{ justifyContent: "center" }}>
                      <button
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: "1px solid #fee2e2",
                          background: "#fef2f2",
                          color: "#dc2626",
                          cursor: items.length <= 1 ? "not-allowed" : "pointer",
                          opacity: items.length <= 1 ? 0.4 : 1,
                          fontSize: "18px",
                          fontWeight: "bold",
                          lineHeight: 1,
                          transition: "all 0.15s ease",
                        }}
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        title="Remove line"
                      >
                        ×
                      </button>
                    </div>
                    <div className="table-sub-slot" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Proportional Landed Cost Allocation Breakdown */}
        {otherChargesNum > 0 && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 14px",
              marginTop: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "12px", color: "#1e3a8a" }}>
                  ⚖️ Landed Cost Allocation (China-to-Warehouse Expense)
                </strong>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    padding: "1px 7px",
                    borderRadius: "4px",
                  }}
                >
                  Expense Loading: {expensePercentage.toFixed(4)}%
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Formula: ₹{otherChargesNum.toLocaleString("en-IN")} ÷ ₹{totalPurchaseValueInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })} × 100 = <strong>{expensePercentage.toFixed(4)}%</strong>
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "8px",
                background: "#ffffff",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "11px",
              }}
            >
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Total Purchase Cost (INR):</span>
                <strong style={{ color: "#1e293b", fontFamily: "monospace" }}>
                  ₹{totalPurchaseValueInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>China-to-Warehouse Expense:</span>
                <strong style={{ color: "#c2410c", fontFamily: "monospace" }}>
                  ₹{otherChargesNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Total Landed Goods Cost:</span>
                <strong style={{ color: "#059669", fontFamily: "monospace" }}>
                  ₹{(totalPurchaseValueInr + otherChargesNum).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Check Validation:</span>
                <span style={{ color: "#047857", fontWeight: 600 }}>
                  ₹{totalPurchaseValueInr.toLocaleString("en-IN")} + ₹{otherChargesNum.toLocaleString("en-IN")} = ₹{(totalPurchaseValueInr + otherChargesNum).toLocaleString("en-IN")} ✓
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Summary and Payments */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div className="product-dialog-field full-width">
              <label>Remarks &amp; Import Logistics Notes</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Customs clearance terms, packaging notes, port delivery details..."
              />
            </div>
          </div>

          <div className="premium-summary-card">
            <div className="premium-summary-head">
              <div className="premium-summary-title">
                <span>📑</span>
                <span>Settlement &amp; Landed Cost Breakdown</span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: "4px" }}>
                {currencyCode === "CNY" ? "CHINA IMPORT" : "DOMESTIC INR"}
              </span>
            </div>

            <div className="premium-summary-body">
              <div className="premium-summary-section">
                <div className="premium-summary-row">
                  <span>Subtotal ({currSymbol}):</span>
                  <span className="val">{formatCur(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="premium-summary-row" style={{ color: "#dc2626" }}>
                    <span>Total Discount:</span>
                    <span className="val" style={{ color: "#dc2626" }}>- {formatCur(totalDiscount)}</span>
                  </div>
                )}
                <div className="premium-summary-row">
                  <span>Taxable Goods Value:</span>
                  <span className="val">{formatCur(taxableAmount)}</span>
                </div>

                {transactionType === "GST" && (
                  <>
                    {isChinaSupplier ? (
                      <div className="premium-summary-row" style={{ color: "#2563eb" }}>
                        <span>IGST (Integrated Tax):</span>
                        <span className="val" style={{ color: "#2563eb" }}>{formatCur(totalIgst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="premium-summary-row">
                          <span>CGST:</span>
                          <span className="val">{formatCur(totalCgst)}</span>
                        </div>
                        <div className="premium-summary-row">
                          <span>SGST:</span>
                          <span className="val">{formatCur(totalSgst)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* China-to-Warehouse Logistics (₹) */}
              <div className="premium-logistics-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#9a3412" }}>
                    China-to-Warehouse Logistics (₹):
                  </span>
                  {expensePercentage > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#c2410c", background: "#ffedd5", padding: "1px 6px", borderRadius: "4px" }}>
                      Loading: {expensePercentage.toFixed(4)}%
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "10.5px", color: "#78350f" }}>Freight / Customs / Port Delivery:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#c2410c" }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: "110px",
                        textAlign: "right",
                        height: "28px",
                        fontWeight: 700,
                        fontSize: "12px",
                        borderColor: otherChargesNum > 0 ? "#f97316" : "#cbd5e1",
                        background: "#ffffff",
                        borderRadius: "4px",
                        padding: "0 6px",
                      }}
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Round Off */}
              <div className="premium-summary-row">
                <span>Round Off ({currencyCode === "CNY" ? "₹" : currSymbol}):</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{currencyCode === "CNY" ? "₹" : currSymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{
                      width: "95px",
                      textAlign: "right",
                      height: "26px",
                      fontSize: "11.5px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      padding: "0 6px",
                    }}
                    value={roundOff}
                    onChange={(e) => setRoundOff(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total Landed Cost (₹ INR) Highlight */}
              <div className="premium-hero-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#166534", letterSpacing: "0.03em" }}>
                    Total Landed Cost (₹ INR):
                  </span>
                  <span className="premium-hero-val">
                    ₹{totalLandedCostInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#15803d", marginTop: "2px" }}>
                  {otherChargesNum > 0
                    ? `Includes ₹${otherChargesNum.toLocaleString("en-IN")} logistics distributed to all items`
                    : "Base goods cost converted at live exchange rate"}
                </div>
              </div>

              {/* Dual Currency Split for China Imports */}
              {currencyCode === "CNY" && (
                <div className="premium-payable-split">
                  <div>
                    <span className="label">Supplier Payable (¥ CNY)</span>
                    <span className="amount" style={{ color: "#1e3a8a" }}>
                      ¥{taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="label">Total Landed (¥ Equiv)</span>
                    <span className="amount" style={{ color: "#475569" }}>
                      ¥{landedRmbEquivalent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Paid Amount */}
              <div className="premium-summary-row" style={{ marginTop: "2px" }}>
                <span>Paid Amount ({currencyCode === "CNY" ? "₹" : currSymbol}):</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{currencyCode === "CNY" ? "₹" : currSymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{
                      width: "95px",
                      textAlign: "right",
                      height: "26px",
                      fontSize: "11.5px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      padding: "0 6px",
                    }}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Outstanding Due */}
              <div
                className="premium-outstanding-row"
                style={{ color: outstandingAmount > 0 ? "#dc2626" : "#059669" }}
              >
                <span>Outstanding Due ({currencyCode === "CNY" ? "₹" : currSymbol}):</span>
                <span style={{ fontFamily: "monospace", fontSize: "14px" }}>
                  {currencyCode === "CNY"
                    ? `₹${outstandingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : formatCur(outstandingAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="product-modal-foot">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Record Purchase Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
