import { useState, useMemo } from "react";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import Loader from "../../../components/common/Loader/Loader";
import { useAuth } from "../../../hooks/useAuth";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetUnitsQuery,
  useGetTaxRatesQuery,
} from "../productsApi";
import ProductDialog from "../components/ProductDialog";
import ProductMasterDialog from "../components/ProductMasterDialog";
import "../products.css";

const EMPTY_PRODUCT = {
  productCode: "",
  productName: "",
  categoryId: "",
  subcategoryId: "",
  unitId: "",
  taxRateId: "",
  brand: "",
  modelNo: "",
  partNumber: "",
  hsnCode: "",
  purchasePrice: 0,
  sellingPrice: 0,
  minimumSellingPrice: 0,
  reorderLevel: 0,
  minimumStock: 0,
  maximumStock: "",
  description: "",
  active: true,
  isGlobal: false,
};

export default function ProductsPage() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const isAdmin = user?.roles?.some((r) =>
    typeof r === "string" ? r === "ROLE_ADMIN" || r === "ADMIN" : r.code === "ROLE_ADMIN" || r.name === "ADMIN"
  ) ?? false;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isGlobalOnly, setIsGlobalOnly] = useState(false);

  // Dialog states
  const [productDraft, setProductDraft] = useState(null);
  const [masterOpen, setMasterOpen] = useState(false);

  // Master queries
  const { data: categories = [], refetch: refetchCategories } = useGetCategoriesQuery(activeCompany?.id);
  const { data: units = [], refetch: refetchUnits } = useGetUnitsQuery(activeCompany?.id);
  const { data: taxRates = [], refetch: refetchTaxRates } = useGetTaxRatesQuery(activeCompany?.id);

  // Products query
  const { data, isLoading, isFetching, error, refetch: refetchProducts } = useGetProductsQuery({
    page: Math.max(page - 1, 0),
    size: pageSize,
    search: search.trim(),
    categoryId: selectedCategory,
    companyId: activeCompany?.id,
    isGlobalOnly,
  });

  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const products = data?.records || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleSaveProduct = async (payload) => {
    try {
      if (productDraft?.id) {
        await updateProduct({ id: productDraft.id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      setProductDraft(null);
      refetchProducts();
    } catch {
      // Error handled via dialog props
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Deactivate product "${product.productName}" (${product.productCode})?`)) {
      try {
        await deleteProduct(product.id).unwrap();
        refetchProducts();
      } catch (err) {
        alert(err?.data?.message || "Failed to deactivate product");
      }
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="product-page">
      {/* Page Header */}
      <div className="product-page-heading">
        <div>
          <p className="access-kicker">Inventory &amp; Catalog</p>
          <h1>Products</h1>
        </div>
        <div className="heading-actions">
          <Button variant="ghost" size="sm" onClick={() => setMasterOpen(true)}>
            ⚙ Manage Masters
          </Button>
          <Button size="sm" onClick={() => setProductDraft({ ...EMPTY_PRODUCT, isGlobal: !activeCompany && isAdmin })}>
            + Add Product
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Counter */}
      <div className="product-toolbar">
        <div className="product-toolbar__left">
          <div className="product-search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="product-search-input"
              placeholder="Search by code, name, brand, HSN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                ×
              </button>
            )}
          </div>

          <select
            className="product-select-filter"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`product-filter-chip ${isGlobalOnly ? "active" : ""}`}
            onClick={() => {
              setIsGlobalOnly(!isGlobalOnly);
              setPage(1);
            }}
          >
            🌐 Global Masters Only
          </button>
        </div>

        <div className="product-toolbar__right">
          <span className="product-count-badge">
            {totalCount} Product{totalCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {error && (
        <ErrorMessage style={{ marginBottom: "12px" }}>
          {error?.data?.message || error?.error || "Error loading products."}
        </ErrorMessage>
      )}

      {/* High-Density Products Table */}
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "130px" }}>Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>GST</th>
              <th style={{ textAlign: "right" }}>Purchase (₹)</th>
              <th style={{ textAlign: "right" }}>Selling (₹)</th>
              <th style={{ textAlign: "center" }}>Reorder Lvl</th>
              <th>Scope</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "40px 0" }}>
                  <Loader />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "36px 0", color: "#64748b" }}>
                  No products found. Click <strong>+ Add Product</strong> to create your first item.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="product-code-col">{p.productCode}</td>
                  <td className="product-name-col" title={p.productName}>
                    {p.productName}
                    {p.brand && <small style={{ color: "#64748b", marginLeft: "6px" }}>({p.brand})</small>}
                  </td>
                  <td>{p.categoryName || "—"}</td>
                  <td>{p.unitShortCode || p.unitName || "—"}</td>
                  <td>
                    {p.gstRate != null ? (
                      <span className="badge-gst">{p.gstRate}%</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="product-price-col">{formatCurrency(p.purchasePrice)}</td>
                  <td className="product-price-col product-price-selling">{formatCurrency(p.sellingPrice)}</td>
                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>{p.reorderLevel ?? 0}</td>
                  <td>
                    <span className={`scope-badge ${p.isGlobal ? "scope-badge--global" : "scope-badge--company"}`}>
                      {p.isGlobal ? "Global" : p.companyName || "Company"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`product-status-dot ${p.active ? "active" : "inactive"}`}
                      title={p.active ? "Active" : "Inactive"}
                    />
                    <span style={{ fontSize: "11px", color: p.active ? "#15803d" : "#64748b" }}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="table-btn-icon"
                        title="Edit Product"
                        onClick={() => setProductDraft(p)}
                      >
                        ✏
                      </button>
                      <button
                        type="button"
                        className="table-btn-icon danger"
                        title="Deactivate Product"
                        onClick={() => handleDeleteProduct(p)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="product-pagination">
        <div>
          Showing {products.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} products
          {isFetching && <span style={{ marginLeft: "8px", fontStyle: "italic" }}>(refreshing...)</span>}
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Product Create/Edit Dialog */}
      {productDraft && (
        <ProductDialog
          draft={productDraft}
          onClose={() => setProductDraft(null)}
          onSave={handleSaveProduct}
          isLoading={createState.isLoading || updateState.isLoading}
          error={createState.error || updateState.error}
          isAdmin={isAdmin}
          activeCompany={activeCompany}
          categories={categories}
          units={units}
          taxRates={taxRates}
        />
      )}

      {/* Master Data Management Dialog */}
      {masterOpen && (
        <ProductMasterDialog
          onClose={() => setMasterOpen(false)}
          isAdmin={isAdmin}
          activeCompany={activeCompany}
          categories={categories}
          units={units}
          taxRates={taxRates}
          refetchCategories={refetchCategories}
          refetchUnits={refetchUnits}
          refetchTaxRates={refetchTaxRates}
        />
      )}
    </div>
  );
}

