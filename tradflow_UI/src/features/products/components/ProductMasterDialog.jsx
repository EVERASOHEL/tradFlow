import { useState } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import {
  useCreateCategoryMutation,
  useCreateSubcategoryMutation,
  useCreateUnitMutation,
  useCreateTaxRateMutation,
  useGetSubcategoriesQuery,
} from "../productsApi";

export default function ProductMasterDialog({
  onClose,
  isAdmin,
  activeCompany,
  categories = [],
  units = [],
  taxRates = [],
  refetchCategories,
  refetchUnits,
  refetchTaxRates,
}) {
  const [activeTab, setActiveTab] = useState("categories");
  const [isGlobal, setIsGlobal] = useState(isAdmin);
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || "");
  const [errorMsg, setErrorMsg] = useState("");

  const [createCategory, catState] = useCreateCategoryMutation();
  const [createSubcategory, subcatState] = useCreateSubcategoryMutation();
  const [createUnit, unitState] = useCreateUnitMutation();
  const [createTaxRate, taxState] = useCreateTaxRateMutation();

  const { data: subcategories = [], refetch: refetchSubcategories } = useGetSubcategoriesQuery(
    { categoryId: selectedCatId, companyId: isGlobal ? undefined : activeCompany?.id },
    { skip: !selectedCatId }
  );

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const form = new FormData(e.currentTarget);
    try {
      await createCategory({
        companyId: isGlobal ? null : (activeCompany?.id || null),
        name: form.get("name")?.trim(),
        code: form.get("code")?.trim().toUpperCase(),
        description: form.get("description")?.trim(),
        active: true,
      }).unwrap();
      e.target.reset();
      refetchCategories?.();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.error || "Failed to create category");
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const form = new FormData(e.currentTarget);
    try {
      await createSubcategory({
        companyId: isGlobal ? null : (activeCompany?.id || null),
        categoryId: form.get("categoryId"),
        name: form.get("name")?.trim(),
        code: form.get("code")?.trim().toUpperCase(),
        active: true,
      }).unwrap();
      e.target.reset();
      refetchSubcategories?.();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.error || "Failed to create subcategory");
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const form = new FormData(e.currentTarget);
    try {
      await createUnit({
        companyId: isGlobal ? null : (activeCompany?.id || null),
        name: form.get("name")?.trim(),
        shortCode: form.get("shortCode")?.trim().toUpperCase(),
        decimalAllowed: form.get("decimalAllowed") === "on",
        active: true,
      }).unwrap();
      e.target.reset();
      refetchUnits?.();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.error || "Failed to create unit");
    }
  };

  const handleCreateTaxRate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const form = new FormData(e.currentTarget);
    const gst = Number(form.get("gstRate") || 0);
    const half = gst / 2;
    try {
      await createTaxRate({
        companyId: isGlobal ? null : (activeCompany?.id || null),
        name: form.get("name")?.trim(),
        gstRate: gst,
        cgstRate: Number(form.get("cgstRate") || half),
        sgstRate: Number(form.get("sgstRate") || half),
        igstRate: Number(form.get("igstRate") || gst),
        active: true,
      }).unwrap();
      e.target.reset();
      refetchTaxRates?.();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.error || "Failed to create tax rate");
    }
  };

  return (
    <div className="access-modal-backdrop">
      <div className="product-modal-dialog" style={{ width: "min(94vw, 680px)" }}>
        <div className="product-modal-head">
          <div>
            <p className="access-kicker">Master Data Management</p>
            <h2>Product Masters</h2>
          </div>
          <button type="button" className="access-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        {errorMsg && <ErrorMessage style={{ marginBottom: "12px" }}>{errorMsg}</ErrorMessage>}

        {isAdmin && (
          <div className="global-master-banner" style={{ marginBottom: "14px" }}>
            <label className="product-checkbox-label" style={{ color: "#5b21b6" }}>
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={(e) => setIsGlobal(e.target.checked)}
              />
              <strong>Save new entries as Global Master (Shared across TradeFlow)</strong>
            </label>
          </div>
        )}

        <div className="master-tabs">
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categories ({categories.length})
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "subcategories" ? "active" : ""}`}
            onClick={() => setActiveTab("subcategories")}
          >
            Subcategories
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "units" ? "active" : ""}`}
            onClick={() => setActiveTab("units")}
          >
            Units of Measure ({units.length})
          </button>
          <button
            type="button"
            className={`master-tab-btn ${activeTab === "taxes" ? "active" : ""}`}
            onClick={() => setActiveTab("taxes")}
          >
            GST / Tax Rates ({taxRates.length})
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <form onSubmit={handleCreateCategory} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <div className="product-dialog-field">
                <label>Code *</label>
                <input name="code" required placeholder="e.g. ELEC" maxLength={50} />
              </div>
              <div className="product-dialog-field">
                <label>Name *</label>
                <input name="name" required placeholder="e.g. Electronics" maxLength={150} />
              </div>
              <div className="product-dialog-field">
                <label>Description</label>
                <input name="description" placeholder="Optional notes" />
              </div>
              <Button size="sm" type="submit" isLoading={catState.isLoading}>
                Add
              </Button>
            </form>

            <div className="master-list-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="product-code-col">{c.code}</td>
                      <td>{c.name}</td>
                      <td>
                        <span className={`scope-badge ${c.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                          {c.isGlobal ? "Global" : "Company"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "16px", color: "#94a3b8" }}>
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subcategories Tab */}
        {activeTab === "subcategories" && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                Select Parent Category:
              </label>
              <select
                className="product-select-filter"
                style={{ width: "100%" }}
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}){c.isGlobal ? " [Global]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateSubcategory} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <input type="hidden" name="categoryId" value={selectedCatId} />
              <div className="product-dialog-field">
                <label>Subcategory Code *</label>
                <input name="code" required placeholder="e.g. MOBILE" maxLength={50} />
              </div>
              <div className="product-dialog-field">
                <label>Subcategory Name *</label>
                <input name="name" required placeholder="e.g. Smartphones" maxLength={150} />
              </div>
              <Button size="sm" type="submit" disabled={!selectedCatId} isLoading={subcatState.isLoading}>
                Add
              </Button>
            </form>

            <div className="master-list-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((s) => (
                    <tr key={s.id}>
                      <td className="product-code-col">{s.code}</td>
                      <td>{s.name}</td>
                      <td>
                        <span className={`scope-badge ${s.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                          {s.isGlobal ? "Global" : "Company"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {subcategories.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "16px", color: "#94a3b8" }}>
                        No subcategories for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === "units" && (
          <div>
            <form onSubmit={handleCreateUnit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "8px", alignItems: "flex-end" }}>
              <div className="product-dialog-field">
                <label>Code *</label>
                <input name="shortCode" required placeholder="e.g. PKT" maxLength={20} />
              </div>
              <div className="product-dialog-field">
                <label>Name *</label>
                <input name="name" required placeholder="e.g. Packet" maxLength={50} />
              </div>
              <div style={{ paddingBottom: "6px" }}>
                <label className="product-checkbox-label">
                  <input name="decimalAllowed" type="checkbox" />
                  Decimals
                </label>
              </div>
              <Button size="sm" type="submit" isLoading={unitState.isLoading}>
                Add
              </Button>
            </form>

            <div className="master-list-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Short Code</th>
                    <th>Unit Name</th>
                    <th>Decimals</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id}>
                      <td className="product-code-col">{u.shortCode}</td>
                      <td>{u.name}</td>
                      <td>{u.decimalAllowed ? "Allowed" : "No"}</td>
                      <td>
                        <span className={`scope-badge ${u.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                          {u.isGlobal ? "Global" : "Company"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Taxes Tab */}
        {activeTab === "taxes" && (
          <div>
            <form onSubmit={handleCreateTaxRate} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <div className="product-dialog-field">
                <label>Tax Name *</label>
                <input name="name" required placeholder="e.g. GST 18%" maxLength={50} />
              </div>
              <div className="product-dialog-field">
                <label>GST Rate (%) *</label>
                <input name="gstRate" required type="number" step="0.01" min="0" placeholder="18.00" />
              </div>
              <Button size="sm" type="submit" isLoading={taxState.isLoading}>
                Add
              </Button>
            </form>

            <div className="master-list-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>GST %</th>
                    <th>CGST %</th>
                    <th>SGST %</th>
                    <th>IGST %</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRates.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td><span className="badge-gst">{t.gstRate}%</span></td>
                      <td>{t.cgstRate ?? t.gstRate / 2}%</td>
                      <td>{t.sgstRate ?? t.gstRate / 2}%</td>
                      <td>{t.igstRate ?? t.gstRate}%</td>
                      <td>
                        <span className={`scope-badge ${t.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                          {t.isGlobal ? "Global" : "Company"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="product-modal-foot">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

