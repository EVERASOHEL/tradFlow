import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import "../stock.css";

export default function StockAdjustmentDialog({
  onClose,
  onSave,
  isLoading,
  error,
  products = [],
  companyId,
}) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [movementType, setMovementType] = useState("ADJUSTMENT"); // IN, OUT, ADJUSTMENT
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const currentStock = Number(selectedProduct?.currentStock || 0);

  // Projected stock
  const projectedStock =
    movementType === "IN"
      ? currentStock + Number(quantity || 0)
      : movementType === "OUT"
      ? Math.max(currentStock - Number(quantity || 0), 0)
      : Number(quantity || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId) {
      alert("Please select a product");
      return;
    }
    if (Number(quantity) < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    onSave({
      productId,
      companyId,
      movementType,
      quantity: Number(quantity),
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="stock-modal-overlay" onClick={onClose}>
      <div className="stock-modal" onClick={(e) => e.stopPropagation()}>
        <header className="stock-modal__header">
          <div className="stock-modal__header-left">
            <span className="stock-modal__icon">⚖️</span>
            <div>
              <h2 className="stock-modal__title">Manual Stock Adjustment</h2>
              <p className="stock-modal__sub">
                Calibrate physical inventory count, log transit damages, or manual corrections
              </p>
            </div>
          </div>
          <button type="button" className="stock-modal__close" onClick={onClose}>
            ✕
          </button>
        </header>

        {error && <ErrorMessage message={error?.data?.message || "Failed to adjust stock"} />}

        <form onSubmit={handleSubmit} className="stock-modal__form">
          <div className="stock-form-group">
            <label>Select Product *</label>
            <select
              className="stock-select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName || p.name} ({p.productCode || p.code || p.sku || "PROD"}) — Stock: {p.currentStock || 0} PCS
                </option>
              ))}
            </select>
          </div>

          <div className="stock-form-group">
            <label>Adjustment Action *</label>
            <div className="stock-type-selector">
              <button
                type="button"
                className={`stock-type-pill ${movementType === "IN" ? "active-in" : ""}`}
                onClick={() => setMovementType("IN")}
              >
                📥 Add Stock (IN)
              </button>
              <button
                type="button"
                className={`stock-type-pill ${movementType === "OUT" ? "active-out" : ""}`}
                onClick={() => setMovementType("OUT")}
              >
                📤 Deduct (OUT)
              </button>
              <button
                type="button"
                className={`stock-type-pill ${movementType === "ADJUSTMENT" ? "active-adj" : ""}`}
                onClick={() => setMovementType("ADJUSTMENT")}
              >
                ⚖️ Set Count (ADJUST)
              </button>
            </div>
          </div>

          <div className="stock-form-group">
            <label>
              {movementType === "ADJUSTMENT"
                ? "New Exact Physical Stock (PCS) *"
                : movementType === "IN"
                ? "Quantity to Add (PCS) *"
                : "Quantity to Deduct (PCS) *"}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="stock-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="stock-projection-card">
            <div className="proj-col">
              <span>Current Stock</span>
              <strong>{currentStock} PCS</strong>
            </div>
            <div className="proj-arrow">➔</div>
            <div className="proj-col">
              <span>Projected New Stock</span>
              <strong className="text-primary">{projectedStock} PCS</strong>
            </div>
          </div>

          <div className="stock-form-group">
            <label>Reason / Audit Note</label>
            <textarea
              className="stock-textarea"
              rows="2"
              placeholder="e.g. Physical inventory count calibration, warehouse audit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <footer className="stock-modal__footer">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Confirm Stock Update
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
