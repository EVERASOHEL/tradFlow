import { useState, useEffect } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useGetSubcategoriesQuery } from "../productsApi";

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
  const [isGlobal, setIsGlobal] = useState(draft?.isGlobal ?? (!activeCompany && isAdmin));
  const [selectedCategoryId, setSelectedCategoryId] = useState(draft?.categoryId || "");

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
    };

    onSave(payload);
  };

  return (
    <div className="access-modal-backdrop">
      <form className="product-modal-dialog" onSubmit={handleSubmit}>
        <div className="product-modal-head">
          <div>
            <p className="access-kicker">Catalog &amp; Inventory</p>
            <h2>{isEditing ? "Edit Product" : "New Product"}</h2>
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
          <div className="global-master-banner">
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
                  ? "This product will be accessible to all companies across TradeFlow."
                  : `This product will belong exclusively to ${activeCompany?.companyName || "the active company"}.`}
              </span>
            </div>
          </div>
        )}

        <div className="product-modal-grid">
          {/* General Information */}
          <div className="product-dialog-field">
            <label htmlFor="productCode">Product Code *</label>
            <input
              id="productCode"
              name="productCode"
              defaultValue={draft.productCode}
              required
              maxLength={50}
              placeholder="e.g. IT-PRD-001"
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
              placeholder="e.g. HP LaserJet Pro M404dn"
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

          {/* Product Attributes */}
          <div className="product-dialog-field">
            <label htmlFor="brand">Brand</label>
            <input
              id="brand"
              name="brand"
              defaultValue={draft.brand || ""}
              maxLength={100}
              placeholder="e.g. HP, Dell, Philips"
            />
          </div>

          <div className="product-dialog-field">
            <label htmlFor="modelNo">Model Number</label>
            <input
              id="modelNo"
              name="modelNo"
              defaultValue={draft.modelNo || ""}
              maxLength={100}
              placeholder="e.g. M404DN"
            />
          </div>

          <div className="product-dialog-field">
            <label htmlFor="partNumber">Part Number</label>
            <input
              id="partNumber"
              name="partNumber"
              defaultValue={draft.partNumber || ""}
              maxLength={100}
              placeholder="e.g. W1A53A"
            />
          </div>

          <div className="product-dialog-field">
            <label htmlFor="hsnCode">HSN / SAC Code</label>
            <input
              id="hsnCode"
              name="hsnCode"
              defaultValue={draft.hsnCode || ""}
              maxLength={20}
              placeholder="e.g. 844332"
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
            <label htmlFor="minimumSellingPrice">Minimum Selling Price (₹)</label>
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
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              defaultValue={draft.description || ""}
              placeholder="Product notes, specifications..."
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
              Active Product
            </label>
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

