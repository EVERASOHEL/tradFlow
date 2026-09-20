import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useActiveCompany } from "../../../hooks/useActiveCompany";
import { useLogoutMutation } from "../../auth/authApi";
import Button from "../../../components/common/Button/Button";
import { ROUTES } from "../../../constants/route.constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const [logout, { isLoading }] = useLogoutMutation();

  const userRole = Array.isArray(user?.roles)
    ? (user.roles[0]?.name || user.roles[0]?.code || user.roles[0] || "User")
    : "User";

  const isAdmin = Array.isArray(user?.roles)
    ? user.roles.some((r) => String(r?.code || r?.name || r).toUpperCase().includes("ADMIN"))
    : false;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "var(--font-body)" }}>
      {/* Top Header */}
      <header
        style={{
          height: 56,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 3vw, 36px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "grid",
              width: 30,
              height: 30,
              placeItems: "center",
              borderRadius: 6,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            TF
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.15 }}>
              TradeFlow
            </span>
            <small style={{ fontSize: 8, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em" }}>
              FINANCIAL OS &amp; ERP
            </small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to={ROUTES.PRODUCTS}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#0f766e",
              textDecoration: "none",
              padding: "5px 10px",
              borderRadius: 5,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>📦</span>
            <span>Products</span>
          </Link>

          <Link
            to={ROUTES.PURCHASES}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2563eb",
              textDecoration: "none",
              padding: "5px 10px",
              borderRadius: 5,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>🧾</span>
            <span>Purchases</span>
          </Link>

          <Link
            to={ROUTES.IMPORTS}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#d97706",
              textDecoration: "none",
              padding: "5px 10px",
              borderRadius: 5,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>🚢</span>
            <span>China Imports (LCL)</span>
          </Link>

          {isAdmin && (
            <Link
              to={ROUTES.SETTINGS_OVERVIEW}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                padding: "5px 10px",
                borderRadius: 5,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
              }}
            >
              Settings &amp; Access →
            </Link>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 12, color: "#0f172a" }}>
              {user?.fullName || user?.username}
            </strong>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                padding: "2px 6px",
                borderRadius: 99,
                textTransform: "uppercase",
              }}
            >
              {userRole}
            </span>
          </div>

          <Button size="sm" variant="secondary" isLoading={isLoading} onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main style={{ padding: "clamp(20px, 3vw, 36px)", maxWidth: 1200, margin: "0 auto" }}>
        {/* Active Company Banner */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Company Workspace
              </span>
              {activeCompany?.companyCode && (
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#1e40af",
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    padding: "1px 5px",
                    borderRadius: 3,
                  }}
                >
                  {activeCompany.companyCode}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "2px 0 6px", letterSpacing: "-0.02em" }}>
              {activeCompany?.companyName || "No Company Selected"}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#475569" }}>
              {activeCompany?.tradeName && (
                <span><strong>Trade Name:</strong> {activeCompany.tradeName}</span>
              )}
              {activeCompany?.city && (
                <span><strong>City:</strong> {activeCompany.city}</span>
              )}
              {activeCompany?.gstin && (
                <span><strong>GSTIN:</strong> {activeCompany.gstin}</span>
              )}
              {activeCompany?.currencyCode && (
                <span><strong>Currency:</strong> {activeCompany.currencyCode}</span>
              )}
            </div>
          </div>

          <Link
            to={ROUTES.SELECT_COMPANY}
            className="btn btn--primary btn--sm"
            style={{ textDecoration: "none" }}
          >
            ⇄ Switch Company
          </Link>
        </div>

        {/* Dashboard Quick Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #0f766e" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Inventory &amp; Catalog</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>Products</strong>
            <small style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 10 }}>Master items, technical specs &amp; pricing</small>
            <Link
              to={ROUTES.PRODUCTS}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#0f766e",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Open Products Catalog →
            </Link>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #2563eb" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Procurement &amp; Payables</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>Purchases</strong>
            <small style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 10 }}>Vendor invoices, GST breakdowns &amp; balances</small>
            <Link
              to={ROUTES.PURCHASES}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#2563eb",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Manage Purchases →
            </Link>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #d97706" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>International Logistics</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>China Imports</strong>
            <small style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 10 }}>LCL shipments, RMB conversions &amp; landed costs</small>
            <Link
              to={ROUTES.IMPORTS}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#d97706",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Track LCL Shipments →
            </Link>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #2563eb" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>General Ledger</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>Active</strong>
            <small style={{ color: "#10b981", fontSize: 11 }}>Ready for vouchers &amp; entries</small>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #10b981" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>GST &amp; Tax Compliance</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>Configured</strong>
            <small style={{ color: "#64748b", fontSize: 11 }}>Auto e-Invoicing enabled</small>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", borderTop: "3px solid #8b5cf6" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Financial Year</span>
            <strong style={{ display: "block", fontSize: 20, color: "#0f172a", margin: "6px 0 2px" }}>2026-2027</strong>
            <small style={{ color: "#64748b", fontSize: 11 }}>Period open</small>
          </div>
        </div>
      </main>
    </div>
  );
}
