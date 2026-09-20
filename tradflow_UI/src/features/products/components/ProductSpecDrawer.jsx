import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import Packaging3DViewer from "./Packaging3DViewer";

export default function ProductSpecDrawer({ product, onClose, onEdit }) {
  const [tab, setTab] = useState("specs");
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const specs = product.specifications || {};
  const electrical = specs.electricalSpecifications || {};
  const physical = specs.physicalConstruction || {};
  const variant = specs.variantInformation || {};
  const application = specs.application || {};
  const appList = Array.isArray(application.applications) ? application.applications : [];
  const pkg = specs.packagingConfiguration || specs.packagingAndDimensions || {};
  const boxDim = pkg.boxDimensions || {
    length: pkg.boxLength,
    width: pkg.boxWidth,
    height: pkg.boxHeight,
    unit: pkg.boxDimensionUnit || pkg.dimensionUnit || "cm",
    cbm: pkg.boxCbm,
  };
  const pieceDim = pkg.pieceDimensions || {
    length: pkg.pieceLength,
    width: pkg.pieceWidth,
    height: pkg.pieceHeight,
    unit: pkg.dimensionUnit || "cm",
    weightUnit: pkg.weightUnit || "kg",
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fullJson = JSON.stringify(
    {
      productCode: product.productCode,
      productName: product.productName,
      globalMaster: product.isGlobal,
      category: product.categoryName || "—",
      subcategory: product.subcategoryName || "—",
      unitOfMeasure: product.unitShortCode || product.unitName || "—",
      gstTaxRate: product.gstRate ?? 0,
      taxType: "GST",
      brand: product.brand || null,
      modelNumber: product.modelNo || null,
      partNumber: product.partNumber || null,
      hsnSacCode: product.hsnCode || null,
      purchasePrice: Number(product.purchasePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      minimumSellingPrice: Number(product.minimumSellingPrice || 0),
      reorderLevel: Number(product.reorderLevel || 0),
      minimumStock: Number(product.minimumStock || 0),
      maximumStock: product.maximumStock ? Number(product.maximumStock) : null,
      ...specs,
      description: product.description || "",
      active: product.active ?? true,
    },
    null,
    2
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(fullJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="spec-drawer-backdrop" onClick={onClose}>
      <div className="spec-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="spec-drawer__header">
          <div>
            <div className="spec-drawer__tags">
              <span className="spec-code-badge">{product.productCode}</span>
              <span className={`scope-badge ${product.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                {product.isGlobal ? "Global Master" : product.companyName || "Company Scoped"}
              </span>
              <span className="spec-cat-badge">
                {product.categoryName} {product.subcategoryName ? `› ${product.subcategoryName}` : ""}
              </span>
            </div>
            <h2 className="spec-drawer__title">{product.productName}</h2>
            {product.brand && (
              <span className="spec-drawer__brand">
                Brand: <strong>{product.brand}</strong>
                {product.modelNo && ` | Model: ${product.modelNo}`}
                {product.partNumber && ` | Part No: ${product.partNumber}`}
              </span>
            )}
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close drawer">
            ×
          </button>
        </div>

        {/* Commercial & Stock Quick Strip */}
        <div className="spec-kpi-strip">
          <div className="spec-kpi-item">
            <span className="kpi-label">Selling Price</span>
            <strong className="kpi-value text-emerald">{formatCurrency(product.sellingPrice)}</strong>
            <small className="kpi-sub">Min: {formatCurrency(product.minimumSellingPrice)}</small>
          </div>
          <div className="spec-kpi-item">
            <span className="kpi-label">Purchase Price</span>
            <strong className="kpi-value">{formatCurrency(product.purchasePrice)}</strong>
            <small className="kpi-sub">HSN: {product.hsnCode || "—"}</small>
          </div>
          <div className="spec-kpi-item">
            <span className="kpi-label">GST Rate</span>
            <strong className="kpi-value text-blue">{product.gstRate != null ? `${product.gstRate}%` : "—"}</strong>
            <small className="kpi-sub">Unit: {product.unitShortCode || product.unitName || "PCS"}</small>
          </div>
          <div className="spec-kpi-item">
            <span className="kpi-label">Reorder Level</span>
            <strong className="kpi-value text-amber">{product.reorderLevel ?? 0}</strong>
            <small className="kpi-sub">Min: {product.minimumStock ?? 0} | Max: {product.maximumStock ?? "—"}</small>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="spec-drawer__tabs">
          <button
            type="button"
            className={`spec-tab-btn ${tab === "specs" ? "active" : ""}`}
            onClick={() => setTab("specs")}
          >
            ⚡ Technical Specifications
          </button>
          <button
            type="button"
            className={`spec-tab-btn ${tab === "apps" ? "active" : ""}`}
            onClick={() => setTab("apps")}
          >
            🏭 Applications &amp; Variants
          </button>
          <button
            type="button"
            className={`spec-tab-btn ${tab === "json" ? "active" : ""}`}
            onClick={() => setTab("json")}
          >
            {`{ }`} JSON Schema
          </button>
        </div>

        {/* Drawer Content */}
        <div className="spec-drawer__body">
          {tab === "specs" && (
            <div className="spec-section-stack">
              {/* Electrical Specifications Table */}
              <div className="spec-card">
                <div className="spec-card__title">
                  <span>⚡ Electrical Specifications</span>
                  {electrical.utilizationCategory && (
                    <span className="spec-chip spec-chip--blue">Category: {electrical.utilizationCategory}</span>
                  )}
                </div>
                <div className="spec-param-grid">
                  <div className="spec-param-row">
                    <span className="param-name">Rated Current</span>
                    <strong className="param-val">
                      {electrical.ratedCurrent != null ? `${electrical.ratedCurrent} ${electrical.ratedCurrentUnit || "A"}` : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Number of Poles</span>
                    <strong className="param-val">{electrical.numberOfPoles ?? "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Pole Configuration</span>
                    <strong className="param-val">{electrical.poleConfiguration || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Coil Voltage</span>
                    <strong className="param-val">
                      {electrical.coilVoltage != null ? `${electrical.coilVoltage} ${electrical.coilVoltageUnit || "V AC"}` : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Rated Operational Voltage</span>
                    <strong className="param-val">
                      {electrical.ratedVoltage != null ? `${electrical.ratedVoltage} ${electrical.ratedVoltageUnit || "V AC"}` : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Utilization Category</span>
                    <strong className="param-val">{electrical.utilizationCategory || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Physical Construction Table */}
              <div className="spec-card">
                <div className="spec-card__title">
                  <span>🏗 Physical Construction &amp; Materials</span>
                </div>
                <div className="spec-param-grid">
                  <div className="spec-param-row">
                    <span className="param-name">Contact Material</span>
                    <strong className="param-val">{physical.contactMaterial || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Silver Content</span>
                    <strong className="param-val">
                      {physical.silverContent != null ? `${physical.silverContent} ${physical.silverContentUnit || "%"}` : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Mounting Type</span>
                    <strong className="param-val">{physical.mountingType || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Construction Type</span>
                    <strong className="param-val">{physical.constructionType || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Packaging & Logistics Box Config */}
              <div className="spec-card">
                <div className="spec-card__title">
                  <span>📦 Packaging &amp; Box Logistics</span>
                  {pkg.piecesPerBox && (
                    <span className="spec-chip spec-chip--blue">
                      {pkg.piecesPerBox} PCS / Box
                    </span>
                  )}
                </div>
                <div className="spec-param-grid">
                  <div className="spec-param-row">
                    <span className="param-name">Pieces Per Carton</span>
                    <strong className="param-val">{pkg.piecesPerBox ? `${pkg.piecesPerBox} PCS` : "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Box Dimensions (L×W×H)</span>
                    <strong className="param-val">
                      {boxDim.length && boxDim.width && boxDim.height
                        ? `${boxDim.length} × ${boxDim.width} × ${boxDim.height} ${boxDim.unit || "cm"}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Box Volume (CBM)</span>
                    <strong className="param-val" style={{ color: "#0284c7" }}>
                      {boxDim.cbm != null ? `${boxDim.cbm} m³` : "—"}
                    </strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Box Gross Weight</span>
                    <strong className="param-val">
                      {pkg.boxGrossWeight != null ? `${pkg.boxGrossWeight} ${pkg.weightUnit || "kg"}` : "—"}
                    </strong>
                  </div>
                  {(pieceDim.length || pkg.pieceNetWeight) && (
                    <>
                      <div className="spec-param-row">
                        <span className="param-name">Piece Net Weight</span>
                        <strong className="param-val">
                          {pkg.pieceNetWeight != null ? `${pkg.pieceNetWeight} ${pieceDim.weightUnit || "kg"}` : "—"}
                        </strong>
                      </div>
                      <div className="spec-param-row">
                        <span className="param-name">Piece Dimensions</span>
                        <strong className="param-val">
                          {pieceDim.length && pieceDim.width && pieceDim.height
                            ? `${pieceDim.length} × ${pieceDim.width} × ${pieceDim.height} ${pieceDim.unit || "cm"}`
                            : "—"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Interactive 3D Model Display */}
                <div style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", display: "block", marginBottom: "8px" }}>
                    📦 Interactive 3D Logistics Carton &amp; Packing Breakdown
                  </span>
                  <Packaging3DViewer
                    length={boxDim.length || 42}
                    width={boxDim.width || 32}
                    height={boxDim.height || 26}
                    dimensionUnit={boxDim.unit || "cm"}
                    piecesPerBox={pkg.piecesPerBox || 1}
                    boxGrossWeight={pkg.boxGrossWeight || 0}
                    weightUnit={pkg.weightUnit || "kg"}
                    productCode={product.productCode}
                    productName={product.productName}
                    viewerHeight="280px"
                  />
                </div>
              </div>

              {/* Description & Engineering Notes */}
              {product.description && (
                <div className="spec-card">
                  <div className="spec-card__title">
                    <span>📝 Product Description &amp; Technical Notes</span>
                  </div>
                  <p className="spec-description">{product.description}</p>
                </div>
              )}
            </div>
          )}

          {tab === "apps" && (
            <div className="spec-section-stack">
              {/* Variant Details */}
              <div className="spec-card">
                <div className="spec-card__title">
                  <span>🏷 Variant Information</span>
                </div>
                <div className="spec-param-grid">
                  <div className="spec-param-row">
                    <span className="param-name">Series</span>
                    <strong className="param-val">{variant.series || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Variant</span>
                    <strong className="param-val">{variant.variant || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">Product Type</span>
                    <strong className="param-val">{variant.productType || "—"}</strong>
                  </div>
                  <div className="spec-param-row">
                    <span className="param-name">HSN / SAC Code</span>
                    <strong className="param-val font-mono">{product.hsnCode || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="spec-card">
                <div className="spec-card__title">
                  <span>🎯 Primary Application &amp; Target Panels</span>
                </div>
                {application.primaryApplication && (
                  <div style={{ marginBottom: "12px" }}>
                    <span className="param-name" style={{ display: "block", marginBottom: "4px" }}>Primary Purpose:</span>
                    <div className="primary-app-banner">
                      <strong>{application.primaryApplication}</strong>
                    </div>
                  </div>
                )}

                <span className="param-name" style={{ display: "block", marginBottom: "8px" }}>Approved Panel &amp; Equipment Types:</span>
                {appList.length > 0 ? (
                  <div className="app-chips-wrap">
                    {appList.map((app, idx) => (
                      <span key={idx} className="spec-chip spec-chip--app">
                        ✓ {app}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>No specific applications specified.</span>
                )}
              </div>
            </div>
          )}

          {tab === "json" && (
            <div className="spec-json-container">
              <div className="spec-json-toolbar">
                <span style={{ fontSize: "11px", color: "#64748b" }}>Exact JSON representation matching product schema</span>
                <button type="button" className="btn-copy-json" onClick={handleCopyJson}>
                  {copied ? "✓ Copied!" : "📋 Copy JSON"}
                </button>
              </div>
              <pre className="spec-json-view">
                <code>{fullJson}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="spec-drawer__footer">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              ✏ Edit Product
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

