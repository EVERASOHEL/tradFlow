import { useState, useEffect } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useGetSubcategoriesQuery } from "../productsApi";
import Packaging3DViewer from "./Packaging3DViewer";

export default function ProductDialog({
  draft,
  onClose,
  onSave,
  isLoading,
  error,
  isAdmin,
  activeCompany,
  categories = [],
  units = [],
  taxRates = [],
}) {
  const isEditing = Boolean(draft?.id);
  const [activeTab, setActiveTab] = useState("general");
  const [isGlobal, setIsGlobal] = useState(draft?.isGlobal ?? (!activeCompany && isAdmin));
  const [selectedCategoryId, setSelectedCategoryId] = useState(draft?.categoryId || "");

  const existingSpecs = draft?.specifications || {};
  const existingElec = existingSpecs.electricalSpecifications || {};
  const existingPhys = existingSpecs.physicalConstruction || {};
  const existingVar = existingSpecs.variantInformation || {};
  const existingApp = existingSpecs.application || {};
  const existingPkg = existingSpecs.packagingConfiguration || existingSpecs.packagingAndDimensions || {};
  const existingBoxDim = existingPkg.boxDimensions || {
    length: existingPkg.boxLength,
    width: existingPkg.boxWidth,
    height: existingPkg.boxHeight,
    unit: existingPkg.boxDimensionUnit || existingPkg.dimensionUnit || "cm",
  };
  const existingPieceDim = existingPkg.pieceDimensions || {
    length: existingPkg.pieceLength,
    width: existingPkg.pieceWidth,
    height: existingPkg.pieceHeight,
    unit: existingPkg.dimensionUnit || "cm",
    weightUnit: existingPkg.weightUnit || "kg",
  };

  const [boxLength, setBoxLength] = useState(existingBoxDim.length ?? existingPkg.boxLength ?? "");
  const [boxWidth, setBoxWidth] = useState(existingBoxDim.width ?? existingPkg.boxWidth ?? "");
  const [boxHeight, setBoxHeight] = useState(existingBoxDim.height ?? existingPkg.boxHeight ?? "");
  const [piecesPerBox, setPiecesPerBox] = useState(existingPkg.piecesPerBox ?? "");

  const calculatedCbm =
    boxLength && boxWidth && boxHeight
      ? (Number(boxLength) * Number(boxWidth) * Number(boxHeight)) / 1000000
      : 0;

  const [applicationsText, setApplicationsText] = useState(
    Array.isArray(existingApp.applications) ? existingApp.applications.join(", ") : ""
  );

  const { data: subcategories = [] } = useGetSubcategoriesQuery(
    {
      categoryId: selectedCategoryId,
      companyId: isGlobal ? undefined : activeCompany?.id,
    },
    { skip: !selectedCategoryId }
  );

  useEffect(() => {
    if (draft?.categoryId) {
      setSelectedCategoryId(draft.categoryId);
    }
  }, [draft?.categoryId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData);

    // Build applications list
    const applicationsList = values.applicationsList
      ? values.applicationsList
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const bL = values.boxLength ? Number(values.boxLength) : null;
    const bW = values.boxWidth ? Number(values.boxWidth) : null;
    const bH = values.boxHeight ? Number(values.boxHeight) : null;
    const boxCbmVal = bL && bW && bH ? Number(((bL * bW * bH) / 1000000).toFixed(4)) : null;

    // Construct specifications JSONB matching exact user structure
    const specifications = {
      electricalSpecifications: {
        ratedCurrent: values.ratedCurrent ? Number(values.ratedCurrent) : null,
        ratedCurrentUnit: values.ratedCurrentUnit || "A",
        numberOfPoles: values.numberOfPoles ? Number(values.numberOfPoles) : null,
        poleConfiguration: values.poleConfiguration?.trim() || null,
        coilVoltage: values.coilVoltage ? Number(values.coilVoltage) : null,
        coilVoltageUnit: values.coilVoltageUnit || "V AC",
        ratedVoltage: values.ratedVoltage ? Number(values.ratedVoltage) : null,
        ratedVoltageUnit: values.ratedVoltageUnit || "V AC",
        utilizationCategory: values.utilizationCategory?.trim() || null,
      },
      physicalConstruction: {
        contactMaterial: values.contactMaterial?.trim() || null,
        silverContent: values.silverContent ? Number(values.silverContent) : null,
        silverContentUnit: values.silverContentUnit || "%",
        mountingType: values.mountingType?.trim() || null,
        constructionType: values.constructionType?.trim() || null,
      },
      packagingConfiguration: {
        piecesPerBox: values.piecesPerBox ? Number(values.piecesPerBox) : null,
        boxDimensions: {
          length: bL,
          width: bW,
          height: bH,
          unit: values.boxDimensionUnit || "cm",
          cbm: boxCbmVal,
        },
        boxGrossWeight: values.boxGrossWeight ? Number(values.boxGrossWeight) : null,
        weightUnit: values.weightUnit || "kg",
        pieceNetWeight: values.pieceNetWeight ? Number(values.pieceNetWeight) : null,
        pieceDimensions: {
          length: values.pieceLength ? Number(values.pieceLength) : null,
          width: values.pieceWidth ? Number(values.pieceWidth) : null,
          height: values.pieceHeight ? Number(values.pieceHeight) : null,
          unit: values.pieceDimensionUnit || "cm",
        },
      },
      variantInformation: {
        series: values.series?.trim() || null,
        variant: values.variant?.trim() || null,
        productType: values.productType?.trim() || null,
      },
      application: {
        primaryApplication: values.primaryApplication?.trim() || null,
        applications: applicationsList,
      },
    };

    const payload = {
      companyId: isGlobal ? null : (activeCompany?.id || null),
      productCode: values.productCode?.trim(),
      productName: values.productName?.trim(),
      categoryId: values.categoryId || null,
      subcategoryId: values.subcategoryId || null,
      unitId: values.unitId || null,
      taxRateId: values.taxRateId || null,
      brand: values.brand?.trim() || null,
      modelNo: values.modelNo?.trim() || null,
      partNumber: values.partNumber?.trim() || null,
      hsnCode: values.hsnCode?.trim() || null,
      purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : 0,
      sellingPrice: values.sellingPrice ? Number(values.sellingPrice) : 0,
      minimumSellingPrice: values.minimumSellingPrice ? Number(values.minimumSellingPrice) : 0,
      reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : 0,
      minimumStock: values.minimumStock ? Number(values.minimumStock) : 0,
      maximumStock: values.maximumStock ? Number(values.maximumStock) : null,
      description: values.description?.trim() || null,
      active: values.active === "on",
      specifications,
    };

    onSave(payload);
  };

  return (
    <div className="access-modal-backdrop">
      <form className="product-modal-dialog" style={{ width: "min(94vw, 840px)" }} onSubmit={handleSubmit}>
        <div className="product-modal-head">
          <div>
            <p className="access-kicker">Catalog &amp; Specifications</p>
            <h2>{isEditing ? `Edit: ${draft.productName || draft.productCode}` : "New Product Entry"}</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        {error && (
          <ErrorMessage style={{ marginBottom: "14px" }}>
            {error?.data?.message || error?.error || "Unable to save product."}
          </ErrorMessage>
        )}

        {isAdmin && !isEditing && (
          <div className="global-master-banner" style={{ marginBottom: "12px" }}>
            <div>
              <label className="product-checkbox-label" style={{ color: "#5b21b6" }}>
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                />
                <strong>Save as Global Master</strong>
              </label>
              <span className="banner-text">
                {isGlobal
                  ? "Accessible across all companies in TradeFlow."
                  : `Exclusive to ${activeCompany?.companyName || "the active company"}.`}
              </span>
            </div>
          </div>
        )}

        {/* Dialog Tab Navigation */}
        <div className="master-tabs" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            📦 Core &amp; Commercial
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "electrical" ? "active" : ""}`}
            onClick={() => setActiveTab("electrical")}
          >
            ⚡ Electrical Specs
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "physical" ? "active" : ""}`}
            onClick={() => setActiveTab("physical")}
          >
            🏗 Physical Construction
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "apps" ? "active" : ""}`}
            onClick={() => setActiveTab("apps")}
          >
            🎯 Variants &amp; Applications
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "packaging" ? "active" : ""}`}
            onClick={() => setActiveTab("packaging")}
          >
            📦 Packaging &amp; Box Logistics
          </button>
        </div>

        {/* Tab 1: Core & Commercial */}
        <div style={{ display: activeTab === "general" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="productCode">Product Code *</label>
              <input
                id="productCode"
                name="productCode"
                defaultValue={draft.productCode}
                required
                maxLength={50}
                placeholder="e.g. VEX-CJX2-F115-3P"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="productName">Product Name *</label>
              <input
                id="productName"
                name="productName"
                defaultValue={draft.productName}
                required
                maxLength={200}
                placeholder="e.g. VEXON CJX2-F115 3P AC Contactor"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="categoryId">Category</label>
              <select
                id="categoryId"
                name="categoryId"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}){c.isGlobal ? " [Global]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="subcategoryId">Subcategory</label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                defaultValue={draft.subcategoryId || ""}
                disabled={!selectedCategoryId}
              >
                <option value="">-- Select Subcategory --</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}){s.isGlobal ? " [Global]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="unitId">Unit of Measure</label>
              <select id="unitId" name="unitId" defaultValue={draft.unitId || ""}>
                <option value="">-- Select Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortCode}){u.isGlobal ? " [Global]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="taxRateId">GST / Tax Rate</label>
              <select id="taxRateId" name="taxRateId" defaultValue={draft.taxRateId || ""}>
                <option value="">-- Select Tax Rate --</option>
                {taxRates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.gstRate}% GST){t.isGlobal ? " [Global]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Identifiers & Hardware */}
            <div className="product-dialog-field">
              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                name="brand"
                defaultValue={draft.brand || ""}
                maxLength={100}
                placeholder="e.g. VEXON"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="modelNo">Model Number</label>
              <input
                id="modelNo"
                name="modelNo"
                defaultValue={draft.modelNo || ""}
                maxLength={100}
                placeholder="e.g. CJX2-F115"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="partNumber">Part Number</label>
              <input
                id="partNumber"
                name="partNumber"
                defaultValue={draft.partNumber || ""}
                maxLength={100}
                placeholder="e.g. CJX2-F115-3P-B"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="hsnCode">HSN / SAC Code</label>
              <input
                id="hsnCode"
                name="hsnCode"
                defaultValue={draft.hsnCode || ""}
                maxLength={20}
                placeholder="e.g. 85364900"
              />
            </div>

            {/* Pricing */}
            <div className="product-dialog-field">
              <label htmlFor="purchasePrice">Purchase Price (₹)</label>
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.purchasePrice ?? 0}
                placeholder="0.00"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="sellingPrice">Selling Price (₹)</label>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.sellingPrice ?? 0}
                placeholder="0.00"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="minimumSellingPrice">Min Selling Price (₹)</label>
              <input
                id="minimumSellingPrice"
                name="minimumSellingPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.minimumSellingPrice ?? 0}
                placeholder="0.00"
              />
            </div>

            {/* Inventory Controls */}
            <div className="product-dialog-field">
              <label htmlFor="reorderLevel">Reorder Level</label>
              <input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.reorderLevel ?? 0}
                placeholder="0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="minimumStock">Minimum Stock</label>
              <input
                id="minimumStock"
                name="minimumStock"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.minimumStock ?? 0}
                placeholder="0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="maximumStock">Maximum Stock</label>
              <input
                id="maximumStock"
                name="maximumStock"
                type="number"
                step="0.01"
                min="0"
                defaultValue={draft.maximumStock ?? ""}
                placeholder="Optional"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="description">Description &amp; Overview</label>
              <textarea
                id="description"
                name="description"
                defaultValue={draft.description || ""}
                placeholder="Product overview, compliance statements, or catalog notes..."
              />
            </div>

            <div className="product-dialog-field full-width">
              <label className="product-checkbox-label">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  defaultChecked={draft.active ?? true}
                />
                Active Item in Catalog
              </label>
            </div>
          </div>
        </div>

        {/* Tab 2: Electrical Specifications */}
        <div style={{ display: activeTab === "electrical" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="ratedCurrent">Rated Current</label>
              <input
                id="ratedCurrent"
                name="ratedCurrent"
                type="number"
                step="0.1"
                defaultValue={existingElec.ratedCurrent ?? ""}
                placeholder="e.g. 115.0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="ratedCurrentUnit">Rated Current Unit</label>
              <input
                id="ratedCurrentUnit"
                name="ratedCurrentUnit"
                defaultValue={existingElec.ratedCurrentUnit || "A"}
                placeholder="e.g. A"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="numberOfPoles">Number of Poles</label>
              <input
                id="numberOfPoles"
                name="numberOfPoles"
                type="number"
                defaultValue={existingElec.numberOfPoles ?? ""}
                placeholder="e.g. 3"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="poleConfiguration">Pole Configuration</label>
              <input
                id="poleConfiguration"
                name="poleConfiguration"
                defaultValue={existingElec.poleConfiguration || ""}
                placeholder="e.g. 3P"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="coilVoltage">Coil Voltage</label>
              <input
                id="coilVoltage"
                name="coilVoltage"
                type="number"
                step="0.1"
                defaultValue={existingElec.coilVoltage ?? ""}
                placeholder="e.g. 220.0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="coilVoltageUnit">Coil Voltage Unit</label>
              <input
                id="coilVoltageUnit"
                name="coilVoltageUnit"
                defaultValue={existingElec.coilVoltageUnit || "V AC"}
                placeholder="e.g. V AC"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="ratedVoltage">Rated Voltage</label>
              <input
                id="ratedVoltage"
                name="ratedVoltage"
                type="number"
                step="0.1"
                defaultValue={existingElec.ratedVoltage ?? ""}
                placeholder="e.g. 415.0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="ratedVoltageUnit">Rated Voltage Unit</label>
              <input
                id="ratedVoltageUnit"
                name="ratedVoltageUnit"
                defaultValue={existingElec.ratedVoltageUnit || "V AC"}
                placeholder="e.g. V AC"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="utilizationCategory">Utilization Category</label>
              <input
                id="utilizationCategory"
                name="utilizationCategory"
                defaultValue={existingElec.utilizationCategory || ""}
                placeholder="e.g. AC-3"
              />
            </div>
          </div>
        </div>

        {/* Tab 3: Physical Construction */}
        <div style={{ display: activeTab === "physical" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="contactMaterial">Contact Material</label>
              <input
                id="contactMaterial"
                name="contactMaterial"
                defaultValue={existingPhys.contactMaterial || ""}
                placeholder="e.g. Silver Alloy"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="silverContent">Silver Content</label>
              <input
                id="silverContent"
                name="silverContent"
                type="number"
                step="0.1"
                defaultValue={existingPhys.silverContent ?? ""}
                placeholder="e.g. 30.0"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="silverContentUnit">Silver Content Unit</label>
              <input
                id="silverContentUnit"
                name="silverContentUnit"
                defaultValue={existingPhys.silverContentUnit || "%"}
                placeholder="e.g. %"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="mountingType">Mounting Type</label>
              <input
                id="mountingType"
                name="mountingType"
                defaultValue={existingPhys.mountingType || ""}
                placeholder="e.g. Panel Mount"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="constructionType">Construction Type</label>
              <input
                id="constructionType"
                name="constructionType"
                defaultValue={existingPhys.constructionType || ""}
                placeholder="e.g. Electromagnetic AC Contactor"
              />
            </div>
          </div>
        </div>

        {/* Tab 4: Variants & Applications */}
        <div style={{ display: activeTab === "apps" ? "contents" : "none" }}>
          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="series">Series</label>
              <input
                id="series"
                name="series"
                defaultValue={existingVar.series || ""}
                placeholder="e.g. CJX2-F"
              />
            </div>

            <div className="product-dialog-field">
              <label htmlFor="variant">Variant</label>
              <input
                id="variant"
                name="variant"
                defaultValue={existingVar.variant || ""}
                placeholder="e.g. B"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="productType">Product Type</label>
              <input
                id="productType"
                name="productType"
                defaultValue={existingVar.productType || ""}
                placeholder="e.g. AC Contactor"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="primaryApplication">Primary Application</label>
              <input
                id="primaryApplication"
                name="primaryApplication"
                defaultValue={existingApp.primaryApplication || ""}
                placeholder="e.g. Three Phase Motor Control"
              />
            </div>

            <div className="product-dialog-field full-width">
              <label htmlFor="applicationsList">Target Applications (comma-separated)</label>
              <textarea
                id="applicationsList"
                name="applicationsList"
                rows={3}
                value={applicationsText}
                onChange={(e) => setApplicationsText(e.target.value)}
                placeholder="Industrial Control Panels, Motor Control Panels, Agricultural Panels, Pump Control Panels, Compressor Control, HVAC Control"
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>
                Enter comma-separated target equipment or panel types.
              </small>
            </div>
          </div>
        </div>

        {/* Tab 5: Packaging & Box Logistics */}
        <div style={{ display: activeTab === "packaging" ? "contents" : "none" }}>
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#1e293b", fontWeight: 700 }}>
              📦 Master Box / Carton Logistics Configuration
            </h4>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
              Configure how this product is packed for procurement &amp; China imports. TradeFlow uses this configuration to automatically calculate box counts, CBM volume, gross weight, and agent logistics charges when creating purchase invoices.
            </p>
          </div>

          <div className="product-modal-grid">
            <div className="product-dialog-field">
              <label htmlFor="piecesPerBox">Pieces Per Box / Carton *</label>
              <input
                id="piecesPerBox"
                name="piecesPerBox"
                type="number"
                min="1"
                step="1"
                value={piecesPerBox}
                onChange={(e) => setPiecesPerBox(e.target.value)}
                placeholder="e.g. 50 (12A) or 10 (115A)"
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>Number of individual pieces packed per carton</small>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="boxGrossWeight">Box Gross Weight *</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  id="boxGrossWeight"
                  name="boxGrossWeight"
                  type="number"
                  step="0.01"
                  defaultValue={existingPkg.boxGrossWeight ?? ""}
                  placeholder="e.g. 18.5"
                  style={{ flex: 1 }}
                />
                <select name="weightUnit" defaultValue={existingPkg.weightUnit || "kg"} style={{ width: "75px" }}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
              <small style={{ color: "#64748b", fontSize: "11px" }}>Total gross weight of 1 carton packed</small>
            </div>

            <div className="product-dialog-field full-width">
              <label>Box Dimensions (L × W × H) &amp; CBM</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 90px", gap: "8px" }}>
                <div>
                  <input
                    id="boxLength"
                    name="boxLength"
                    type="number"
                    step="0.1"
                    value={boxLength}
                    onChange={(e) => setBoxLength(e.target.value)}
                    placeholder="Length"
                  />
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Length</span>
                </div>
                <div>
                  <input
                    id="boxWidth"
                    name="boxWidth"
                    type="number"
                    step="0.1"
                    value={boxWidth}
                    onChange={(e) => setBoxWidth(e.target.value)}
                    placeholder="Width"
                  />
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Width</span>
                </div>
                <div>
                  <input
                    id="boxHeight"
                    name="boxHeight"
                    type="number"
                    step="0.1"
                    value={boxHeight}
                    onChange={(e) => setBoxHeight(e.target.value)}
                    placeholder="Height"
                  />
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Height</span>
                </div>
                <div>
                  <select name="boxDimensionUnit" defaultValue={existingBoxDim.unit || "cm"}>
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="inch">inch</option>
                  </select>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Unit</span>
                </div>
              </div>
            </div>

            <div className="product-dialog-field full-width">
              <div style={{ display: "flex", gap: "16px", background: "#f1f5f9", padding: "10px 14px", borderRadius: "6px", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Calculated Volume Per Box:</span>
                  <strong style={{ fontSize: "14px", color: "#0284c7", fontFamily: "monospace" }}>
                    {calculatedCbm > 0 ? `${calculatedCbm.toFixed(4)} CBM (m³)` : "0.0000 CBM"}
                  </strong>
                </div>
                {Number(piecesPerBox) > 0 && calculatedCbm > 0 && (
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Volume Per Piece:</span>
                    <strong style={{ fontSize: "14px", color: "#059669", fontFamily: "monospace" }}>
                      {(calculatedCbm / Number(piecesPerBox)).toFixed(6)} CBM / pc
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div className="product-dialog-field full-width" style={{ marginTop: "8px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Individual Piece Specifications (Optional)
              </h4>
            </div>

            <div className="product-dialog-field">
              <label htmlFor="pieceNetWeight">Piece Net Weight</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  id="pieceNetWeight"
                  name="pieceNetWeight"
                  type="number"
                  step="0.01"
                  defaultValue={existingPkg.pieceNetWeight ?? ""}
                  placeholder="e.g. 0.35"
                  style={{ flex: 1 }}
                />
                <select name="pieceWeightUnit" defaultValue={existingPieceDim.weightUnit || "kg"} style={{ width: "75px" }}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <div className="product-dialog-field">
              <label>Piece Dimensions (L × W × H)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 70px", gap: "6px" }}>
                <input
                  name="pieceLength"
                  type="number"
                  step="0.1"
                  defaultValue={existingPieceDim.length ?? ""}
                  placeholder="L"
                />
                <input
                  name="pieceWidth"
                  type="number"
                  step="0.1"
                  defaultValue={existingPieceDim.width ?? ""}
                  placeholder="W"
                />
                <input
                  name="pieceHeight"
                  type="number"
                  step="0.1"
                  defaultValue={existingPieceDim.height ?? ""}
                  placeholder="H"
                />
                <select name="pieceDimensionUnit" defaultValue={existingPieceDim.unit || "cm"}>
                  <option value="cm">cm</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>

            {/* Live Interactive 3D Packaging Model */}
            <div className="product-dialog-field full-width" style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                  📦 3D Interactive Carton Visualization
                </strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Real-time proportional 3D model with X-Ray piece breakdown
                </span>
              </div>
              <Packaging3DViewer
                length={boxLength}
                width={boxWidth}
                height={boxHeight}
                piecesPerBox={piecesPerBox}
                boxGrossWeight={existingPkg.boxGrossWeight}
                weightUnit={existingPkg.weightUnit || "kg"}
                productCode={draft.productCode || "PROD-SAMPLE"}
                productName={draft.productName || "Product"}
                viewerHeight="320px"
              />
            </div>
          </div>
        </div>

        <div className="product-modal-foot">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
