import Button from "../../../components/common/Button/Button";
import "../sales.css";

export default function SaleInvoiceViewDialog({ sale, onClose, onCancelSale, isCancelling }) {
  if (!sale) return null;

  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const isGst = sale.transactionType === "GST";
  const items = sale.items || [];

  const invoiceNum = sale.invoiceNumber || sale.saleNumber;
  const invoiceDt = sale.invoiceDate || sale.saleDate;
  const dueAmt = sale.outstandingAmount !== undefined ? sale.outstandingAmount : sale.balanceAmount;

  return (
    <div className="sale-modal-overlay" onClick={onClose}>
      <div className="sale-modal sale-modal--view" onClick={(e) => e.stopPropagation()}>
        <header className="sale-modal__header">
          <div className="sale-modal__header-left">
            <span className="sale-modal__icon">📄</span>
            <div>
              <h2 className="sale-modal__title">
                Sales Invoice: {invoiceNum}
                <span
                  className={`status-badge status-badge--${
                    sale.status === "COMPLETED" || sale.status === "CONFIRMED"
                      ? "success"
                      : sale.status === "CANCELLED"
                      ? "danger"
                      : "warning"
                  }`}
                  style={{ marginLeft: 12, verticalAlign: "middle" }}
                >
                  {sale.status}
                </span>
                <span
                  className={`badge-pill ${
                    isGst ? "badge-pill--blue" : "badge-pill--teal"
                  }`}
                  style={{ marginLeft: 8, verticalAlign: "middle" }}
                >
                  {isGst ? "GST Sales" : "Non-GST Sales"}
                </span>
              </h2>
              <p className="sale-modal__sub">
                Date: {invoiceDt} | Customer: {sale.customerName} (
                {sale.customerGstin || "Unregistered"})
              </p>
            </div>
          </div>
          <button type="button" className="sale-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="sale-view-content">
          <div className="sale-view-grid">
            <div className="sale-view-col">
              <h4>Billed To (Customer)</h4>
              <p><strong>{sale.customerName}</strong></p>
              <p>GSTIN: {sale.customerGstin || "Unregistered"}</p>
              <p>State: {sale.placeOfSupply || "N/A"}</p>
            </div>
            <div className="sale-view-col">
              <h4>Invoice Summary</h4>
              <p>Invoice #: <strong>{invoiceNum}</strong></p>
              <p>Invoice Date: {invoiceDt}</p>
              <p>Type: <strong>{isGst ? "Tax Invoice (GST)" : "Commercial Invoice (Non-GST)"}</strong></p>
            </div>
            <div className="sale-view-col">
              <h4>Payment Status</h4>
              <p>Grand Total: <strong>{formatINR(sale.grandTotal)}</strong></p>
              <p>Paid Amount: {formatINR(sale.paidAmount)}</p>
              <p>Balance Due: <strong className={Number(dueAmt) > 0 ? "text-danger" : "text-success"}>{formatINR(dueAmt)}</strong></p>
            </div>
          </div>

          <div className="sale-view-table-container">
            <table className="sale-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>HSN</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Taxable Value</th>
                  {isGst && <th>GST Rate</th>}
                  {isGst && <th>GST Amount</th>}
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const gstAmount =
                    Number(item.cgstAmount || 0) +
                    Number(item.sgstAmount || 0) +
                    Number(item.igstAmount || 0);
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{item.productName}</strong>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)" }}>
                          {item.productCode}
                        </div>
                      </td>
                      <td>{item.hsnCode || "—"}</td>
                      <td>{item.quantity} PCS</td>
                      <td>{formatINR(item.unitPrice)}</td>
                      <td>{formatINR(item.taxableAmount)}</td>
                      {isGst && <td>{item.taxRate}%</td>}
                      {isGst && <td>{formatINR(gstAmount)}</td>}
                      <td><strong>{formatINR(item.totalAmount !== undefined ? item.totalAmount : item.lineTotal)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sale-view-summary-wrap">
            <div className="sale-view-totals">
              <div className="view-tot-row">
                <span>Taxable Goods Value:</span>
                <strong>{formatINR(sale.taxableAmount)}</strong>
              </div>
              {isGst && (
                <>
                  {Number(sale.cgstAmount || 0) > 0 && (
                    <div className="view-tot-row">
                      <span>CGST:</span>
                      <span>{formatINR(sale.cgstAmount)}</span>
                    </div>
                  )}
                  {Number(sale.sgstAmount || 0) > 0 && (
                    <div className="view-tot-row">
                      <span>SGST:</span>
                      <span>{formatINR(sale.sgstAmount)}</span>
                    </div>
                  )}
                  {Number(sale.igstAmount || 0) > 0 && (
                    <div className="view-tot-row">
                      <span>IGST:</span>
                      <span>{formatINR(sale.igstAmount)}</span>
                    </div>
                  )}
                  <div className="view-tot-row">
                    <span>Total Tax:</span>
                    <strong>{formatINR(sale.totalTaxAmount)}</strong>
                  </div>
                </>
              )}
              {Number(sale.otherCharges || 0) > 0 && (
                <div className="view-tot-row">
                  <span>Other Charges:</span>
                  <span>{formatINR(sale.otherCharges)}</span>
                </div>
              )}
              {Number(sale.roundOff || 0) !== 0 && (
                <div className="view-tot-row">
                  <span>Round Off:</span>
                  <span>{formatINR(sale.roundOff)}</span>
                </div>
              )}
              <div className="view-tot-divider" />
              <div className="view-tot-row view-tot-grand">
                <span>Grand Total:</span>
                <span className="grand-val">{formatINR(sale.grandTotal)}</span>
              </div>
            </div>
          </div>

          {sale.remarks && (
            <div className="sale-view-remarks">
              <strong>Notes / Remarks:</strong> {sale.remarks}
            </div>
          )}
        </div>

        <footer className="sale-modal__footer">
          {sale.status !== "CANCELLED" && onCancelSale && (
            <Button
              type="button"
              variant="danger"
              isLoading={isCancelling}
              onClick={() => onCancelSale(sale)}
            >
              Cancel Sale &amp; Restore Stock
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}

