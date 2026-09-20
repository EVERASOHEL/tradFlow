import { useState, useMemo, useEffect } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { useCreateCustomerMutation } from "../salesApi";
import "../sales.css";

const GST_RATES = [0, 5, 12, 18, 28];

const DEFAULT_ACTIVE_CUSTOMERS = [
  {
    id: "cust-apex-01",
    partyName: "Apex Electricals & Automation Ltd",
    gstin: "07AAAAA0000A1Z5",
    state: "Delhi",
    phone: "+91 98765 43210",
    email: "orders@apexelectricals.in",
    active: true,
    partyType: "CUSTOMER",
  },
  {
    id: "cust-shreeji-02",
    partyName: "Shreeji Power & Controls (Local Retail)",
    gstin: "24BBBBB1111B1Z2",
    state: "Gujarat",
    phone: "+91 98250 12345",
    email: "sales@shreejitraders.com",
    active: true,
    partyType: "CUSTOMER",
  },
  {
    id: "cust-vtech-03",
    partyName: "V-Tech Switchgears Pvt Ltd",
    gstin: "06CCCCC2222C1Z8",
    state: "Haryana",
    phone: "+91 97110 55443",
    email: "contact@vtechswitchgears.com",
    active: true,
    partyType: "CUSTOMER",
  },
  {
    id: "cust-metro-04",
    partyName: "Metro Electric Corporation",
    gstin: "27DDDDD3333D1Z4",
    state: "Maharashtra",
    phone: "+91 98200 98765",
    email: "billing@metroelectric.in",
    active: true,
    partyType: "CUSTOMER",
  },
];

export default function SaleDialog({
  onClose,
  onSave,
  isLoading,
  error,
  customers = [],
  products = [],
  company,
}) {
  const [saleNumber, setSaleNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [transactionType, setTransactionType] = useState("GST"); // 'GST' or 'NON_GST'
  const [gstRate, setGstRate] = useState(18); // Invoice-level uniform GST rate

  // Quick-Add Customer State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustState, setNewCustState] = useState("Delhi");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [localCustomCustomers, setLocalCustomCustomers] = useState([]);

  const [createCustomerMutation, { isLoading: isCreatingCust }] = useCreateCustomerMutation();

  // Combine API customers + local added customers + fallback defaults
  const activeCustomers = useMemo(() => {
    const apiFiltered = customers.filter(
      (c) => c.active !== false && (c.partyType === "CUSTOMER" || !c.partyType)
    );
    const combined = [...localCustomCustomers, ...apiFiltered];
    if (combined.length > 0) return combined;
    return DEFAULT_ACTIVE_CUSTOMERS;
  }, [customers, localCustomCustomers]);

  const [customerId, setCustomerId] = useState(activeCustomers[0]?.id || "");
  const [remarks, setRemarks] = useState("");
  const [otherCharges, setOtherCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Keep customerId synced to an active customer
  useEffect(() => {
    if (!customerId && activeCustomers.length > 0) {
      setCustomerId(activeCustomers[0].id);
    }
  }, [activeCustomers, customerId]);

  const [items, setItems] = useState([
    {
      productId: products[0]?.id || "",
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || products[0]?.purchasePrice || 0,
      discountPercent: 0,
    },
  ]);

  // Sync products if products load after mount
  useEffect(() => {
    if (products.length > 0 && items.length === 1 && !items[0].productId) {
      setItems([
        {
          productId: products[0].id,
          quantity: 1,
          unitPrice: products[0].sellingPrice || products[0].purchasePrice || 0,
          discountPercent: 0,
        },
      ]);
    }
  }, [products]);

  // Selected customer details
  const selectedCustomer = useMemo(
    () => activeCustomers.find((c) => c.id === customerId) || activeCustomers[0],
    [activeCustomers, customerId]
  );

  // Determine if Inter-State (IGST) or Intra-State (CGST+SGST)
  const isInterState = useMemo(() => {
    if (transactionType !== "GST") return false;
    const companyGstin = company?.gstin || "";
    const customerGstin = selectedCustomer?.gstin || "";
    if (companyGstin.length >= 2 && customerGstin.length >= 2) {
      return companyGstin.substring(0, 2) !== customerGstin.substring(0, 2);
    }
    if (company?.state && selectedCustomer?.state) {
      return company.state.trim().toLowerCase() !== selectedCustomer.state.trim().toLowerCase();
    }
    return false;
  }, [transactionType, company, selectedCustomer]);

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || "",
        quantity: 1,
        unitPrice: defaultProd?.sellingPrice || defaultProd?.purchasePrice || 0,
        discountPercent: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          item.unitPrice = prod.sellingPrice || prod.purchasePrice || 0;
        }
      }
      next[index] = item;
      return next;
    });
  };

  // Quick add customer submit
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert("Please enter customer name");
      return;
    }

    try {
      if (company?.id) {
        const res = await createCustomerMutation({
          companyId: company.id,
          partyName: newCustName.trim(),
          gstin: newCustGstin.trim() || null,
          phone: newCustPhone.trim() || null,
          address: newCustState.trim(),
          partyType: "CUSTOMER",
          active: true,
        }).unwrap();

        const created = res?.data || res;
        if (created?.id) {
          setLocalCustomCustomers((prev) => [created, ...prev]);
          setCustomerId(created.id);
        }
      } else {
        const localCust = {
          id: `cust-custom-${Date.now()}`,
          partyName: newCustName.trim(),
          gstin: newCustGstin.trim() || "Unregistered",
          state: newCustState,
          phone: newCustPhone.trim(),
          active: true,
          partyType: "CUSTOMER",
        };
        setLocalCustomCustomers((prev) => [localCust, ...prev]);
        setCustomerId(localCust.id);
      }

      setNewCustName("");
      setNewCustGstin("");
      setNewCustPhone("");
      setShowAddCustomerModal(false);
    } catch {
      // Fallback local addition if network / company is offline
      const localCust = {
        id: `cust-custom-${Date.now()}`,
        partyName: newCustName.trim(),
        gstin: newCustGstin.trim() || "Unregistered",
        state: newCustState,
        phone: newCustPhone.trim(),
        active: true,
        partyType: "CUSTOMER",
      };
      setLocalCustomCustomers((prev) => [localCust, ...prev]);
      setCustomerId(localCust.id);
      setNewCustName("");
      setNewCustGstin("");
      setNewCustPhone("");
      setShowAddCustomerModal(false);
    }
  };

  // Calculations using uniform invoice-level gstRate
  const calculatedItems = useMemo(() => {
    const effectiveTaxRate = transactionType === "GST" ? Number(gstRate || 0) : 0;

    return items.map((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const gross = qty * price;
      const discPct = Number(item.discountPercent || 0);
      const discAmt = (gross * discPct) / 100;
      const taxable = Math.max(gross - discAmt, 0);

      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;
      let totalTax = 0;

      if (transactionType === "GST") {
        totalTax = (taxable * effectiveTaxRate) / 100;
        if (isInterState) {
          igstAmt = totalTax;
        } else {
          cgstAmt = totalTax / 2;
          sgstAmt = totalTax / 2;
        }
      }

      const lineTotal = taxable + totalTax;

      return {
        ...item,
        taxRate: effectiveTaxRate,
        grossAmount: gross,
        discountAmount: discAmt,
        taxableAmount: taxable,
        cgstAmount: cgstAmt,
        sgstAmount: sgstAmt,
        igstAmount: igstAmt,
        totalTax,
        lineTotal,
      };
    });
  }, [items, transactionType, gstRate, isInterState]);

  const subtotal = calculatedItems.reduce((s, it) => s + it.grossAmount, 0);
  const totalDiscount = calculatedItems.reduce((s, it) => s + it.discountAmount, 0);
  const totalTaxable = calculatedItems.reduce((s, it) => s + it.taxableAmount, 0);
  const totalCgst = calculatedItems.reduce((s, it) => s + it.cgstAmount, 0);
  const totalSgst = calculatedItems.reduce((s, it) => s + it.sgstAmount, 0);
  const totalIgst = calculatedItems.reduce((s, it) => s + it.igstAmount, 0);
  const totalTaxAmount = totalCgst + totalSgst + totalIgst;

  const rawGrandTotal = totalTaxable + totalTaxAmount + Number(otherCharges || 0) + Number(roundOff || 0);
  const grandTotal = Math.max(rawGrandTotal, 0);
  const balanceAmount = Math.max(grandTotal - Number(paidAmount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      alert("Please select an active customer");
      return;
    }
    if (items.some((it) => !it.productId || Number(it.quantity) <= 0)) {
      alert("Please ensure each line item has a valid product and quantity > 0");
      return;
    }

    const effectiveTaxRate = transactionType === "GST" ? Number(gstRate || 0) : 0;

    const payload = {
      invoiceNumber: saleNumber,
      saleNumber,
      invoiceDate: saleDate,
      saleDate,
      customerId,
      customerName: selectedCustomer?.partyName || selectedCustomer?.name,
      customerGstin: selectedCustomer?.gstin,
      transactionType,
      otherCharges: Number(otherCharges || 0),
      roundOff: Number(roundOff || 0),
      paidAmount: Number(paidAmount || 0),
      remarks: remarks.trim() || null,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discountPercent: Number(it.discountPercent || 0),
        taxRate: effectiveTaxRate,
      })),
    };

    onSave(payload);
  };

  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="sale-modal-overlay" onClick={onClose}>
      <div className="sale-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sale-modal__header">
          <div className="sale-modal__header-left">
            <span className="sale-modal__icon">🧾</span>
            <div>
              <h2 className="sale-modal__title">Create Sales Invoice</h2>
              <p className="sale-modal__sub">
                Issue a GST tax invoice or Non-GST commercial sale with automated real-time stock deduction
              </p>
            </div>
          </div>
          <button type="button" className="sale-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {error && <ErrorMessage message={error?.data?.message || "Failed to create sales invoice"} />}

        <form onSubmit={handleSubmit} className="sale-modal__form">
          {/* Section 1: Invoice Header Info */}
          <div className="sale-card">
            <div className="sale-card__header">
              <h3>Invoice &amp; Transaction Details</h3>
              <div className="sale-type-toggle">
                <button
                  type="button"
                  className={`sale-type-btn ${transactionType === "GST" ? "active" : ""}`}
                  onClick={() => setTransactionType("GST")}
                >
                  🇮🇳 GST Sales Invoice
                </button>
                <button
                  type="button"
                  className={`sale-type-btn ${transactionType === "NON_GST" ? "active" : ""}`}
                  onClick={() => setTransactionType("NON_GST")}
                >
                  📄 Non-GST Sales (Zero-Tax)
                </button>
              </div>
            </div>

            <div className="sale-grid-4">
              <div className="sale-form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  className="sale-input"
                  value={saleNumber}
                  onChange={(e) => setSaleNumber(e.target.value)}
                  required
                />
              </div>

              <div className="sale-form-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  className="sale-input"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>

              <div className="sale-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>Active Customer *</label>
                  <button
                    type="button"
                    className="btn-quick-add-cust"
                    onClick={() => setShowAddCustomerModal(true)}
                  >
                    + New Customer
                  </button>
                </div>
                <select
                  className="sale-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  {activeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.partyName || c.name} {c.gstin ? `(${c.gstin})` : "(Unregistered)"}
                    </option>
                  ))}
                </select>
              </div>

              {transactionType === "GST" ? (
                <div className="sale-form-group">
                  <label>GST Rate (Applied to all items) *</label>
                  <select
                    className="sale-select"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}% GST Rate
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="sale-form-group">
                  <label>Tax Treatment</label>
                  <div className="sale-badge-display">
                    <span className="badge-pill badge-pill--teal">
                      🚫 Non-GST Commercial (0% Tax Applied)
                    </span>
                  </div>
                </div>
              )}

              {transactionType === "GST" && (
                <div className="sale-form-group" style={{ gridColumn: "span 4" }}>
                  <label>Tax Treatment &amp; Jurisdiction</label>
                  <div className="sale-badge-display">
                    {isInterState ? (
                      <span className="badge-pill badge-pill--purple">
                        🌐 Inter-State IGST ({gstRate}%) — Different State
                      </span>
                    ) : (
                      <span className="badge-pill badge-pill--blue">
                        🏢 Intra-State CGST ({gstRate / 2}%) + SGST ({gstRate / 2}%) — Same State
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="sale-card">
            <div className="sale-card__header">
              <h3>
                Sold Products ({items.length})
                <span className="sale-card__stock-note">
                  📦 Stock will be automatically deducted from inventory
                </span>
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                + Add Product
              </Button>
            </div>

            <div className="sale-table-container">
              <table className="sale-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "36%" }}>Product &amp; Available Stock</th>
                    <th style={{ width: "14%" }}>Qty (PCS)</th>
                    <th style={{ width: "16%" }}>Unit Price (₹)</th>
                    <th style={{ width: "14%" }}>Discount (%)</th>
                    <th style={{ width: "14%" }}>Taxable (₹)</th>
                    <th style={{ width: "16%" }}>Total (₹)</th>
                    <th style={{ width: "4%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const currentStock = Number(prod?.currentStock || 0);
                    const isLowStock = Number(item.quantity) > currentStock;

                    return (
                      <tr key={index}>
                        <td>
                          <select
                            className="sale-select"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                            required
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.productName || p.name} ({p.productCode || p.code || p.sku || "PROD"})
                              </option>
                            ))}
                          </select>
                          <div className="sale-item-stock-info">
                            <span
                              className={`stock-indicator ${
                                currentStock <= 0
                                  ? "stock-out"
                                  : isLowStock
                                  ? "stock-warning"
                                  : "stock-ok"
                              }`}
                            >
                              Current Stock: {currentStock} PCS
                            </span>
                            {isLowStock && (
                              <span className="stock-alert-pill">⚠️ Exceeds Available</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="sale-input"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            required
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="sale-input"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                            required
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="sale-input"
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleItemChange(index, "discountPercent", e.target.value)
                            }
                          />
                        </td>

                        <td className="cell-num">{formatINR(item.taxableAmount)}</td>

                        <td className="cell-num font-bold">{formatINR(item.lineTotal)}</td>

                        <td>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-line"
                              title="Remove item"
                              onClick={() => handleRemoveItem(index)}
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Totals & Summary */}
          <div className="sale-bottom-layout">
            <div className="sale-remarks-panel">
              <label>Remarks / Payment Notes</label>
              <textarea
                className="sale-textarea"
                rows="4"
                placeholder="e.g., Payment terms 30 days, dispatch via transport, vehicle number..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="sale-summary-card">
              <div className="summary-row">
                <span>Subtotal (Gross Value):</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>

              {totalDiscount > 0 && (
                <div className="summary-row text-success">
                  <span>Product Discounts:</span>
                  <span>- {formatINR(totalDiscount)}</span>
                </div>
              )}

              <div className="summary-row highlight">
                <span>Taxable Goods Value:</span>
                <strong>{formatINR(totalTaxable)}</strong>
              </div>

              {transactionType === "GST" && (
                <>
                  {!isInterState ? (
                    <>
                      <div className="summary-row">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span>{formatINR(totalCgst)}</span>
                      </div>
                      <div className="summary-row">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span>{formatINR(totalSgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="summary-row">
                      <span>IGST ({gstRate}%):</span>
                      <span>{formatINR(totalIgst)}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Total GST Amount ({gstRate}%):</span>
                    <strong>{formatINR(totalTaxAmount)}</strong>
                  </div>
                </>
              )}

              <div className="summary-row">
                <span>Freight / Extra Charges (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  className="sale-summary-input"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                />
              </div>

              <div className="summary-row">
                <span>Round Off (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  className="sale-summary-input"
                  value={roundOff}
                  onChange={(e) => setRoundOff(e.target.value)}
                />
              </div>

              <div className="summary-divider" />

              <div className="summary-row grand-total-row">
                <span>Grand Total (INR):</span>
                <span className="grand-total-amount">{formatINR(grandTotal)}</span>
              </div>

              <div className="summary-row">
                <span>Paid Amount (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  className="sale-summary-input"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>

              <div className="summary-row due-row">
                <span>Balance Due:</span>
                <strong className={balanceAmount > 0 ? "text-danger" : "text-success"}>
                  {formatINR(balanceAmount)}
                </strong>
              </div>
            </div>
          </div>

          <footer className="sale-modal__footer">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {transactionType === "GST" ? "Generate GST Tax Invoice" : "Generate Non-GST Invoice"}
            </Button>
          </footer>
        </form>

        {/* Inline Quick Add Customer Modal */}
        {showAddCustomerModal && (
          <div className="quick-cust-overlay" onClick={() => setShowAddCustomerModal(false)}>
            <div className="quick-cust-modal" onClick={(e) => e.stopPropagation()}>
              <div className="quick-cust-header">
                <h4>+ Add New Active Customer</h4>
                <button type="button" onClick={() => setShowAddCustomerModal(false)}>✕</button>
              </div>
              <form onSubmit={handleQuickAddCustomer} className="quick-cust-form">
                <div className="sale-form-group">
                  <label>Customer / Firm Name *</label>
                  <input
                    type="text"
                    className="sale-input"
                    placeholder="e.g. Acme Electric Works"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                  />
                </div>
                <div className="sale-form-group">
                  <label>GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="sale-input"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={newCustGstin}
                    onChange={(e) => setNewCustGstin(e.target.value)}
                  />
                </div>
                <div className="sale-form-group">
                  <label>State / Region</label>
                  <select
                    className="sale-select"
                    value={newCustState}
                    onChange={(e) => setNewCustState(e.target.value)}
                  >
                    <option value="Delhi">Delhi (07)</option>
                    <option value="Gujarat">Gujarat (24)</option>
                    <option value="Maharashtra">Maharashtra (27)</option>
                    <option value="Haryana">Haryana (06)</option>
                    <option value="Uttar Pradesh">Uttar Pradesh (09)</option>
                    <option value="Rajasthan">Rajasthan (08)</option>
                    <option value="Karnataka">Karnataka (29)</option>
                    <option value="Tamil Nadu">Tamil Nadu (33)</option>
                  </select>
                </div>
                <div className="sale-form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    className="sale-input"
                    placeholder="+91 ..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCustomerModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isCreatingCust}>
                    Save Customer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
