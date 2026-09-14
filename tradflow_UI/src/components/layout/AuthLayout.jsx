import "./AuthLayout.css";

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-premium-shell">
      {/* Left Column: Premium Dark Fintech Showcase */}
      <section className="auth-hero-pane">
        <div className="auth-hero-glow" aria-hidden="true" />
        <div className="auth-hero-grid-pattern" aria-hidden="true" />

        <div className="auth-hero-body">
          {/* Brand Header */}
          <div className="auth-hero-brand">
            <div className="auth-hero-mark">TF</div>
            <div className="auth-hero-brand-text">
              <span className="auth-hero-brand-name">TradeFlow</span>
              <span className="auth-hero-brand-tag">FINANCIAL OS &amp; ERP</span>
            </div>
          </div>

          {/* Heading */}
          <div className="auth-hero-intro">
            <h1 className="auth-hero-headline">
              Financial precision &amp; control at enterprise scale.
            </h1>
            <p className="auth-hero-subline">
              Real-time multi-entity ledgers, automated GST compliance, and granular role-based security in one unified platform.
            </p>
          </div>

          {/* Luxury Floating Live Financial Widget */}
          <div className="auth-ledger-card">
            <div className="auth-ledger-card__header">
              <div className="auth-ledger-card__org">
                <span className="auth-ledger-dot" />
                <span>Demo Trading Co Pvt Ltd</span>
              </div>
              <span className="auth-ledger-badge">FY 2026-27 • LIVE</span>
            </div>

            <div className="auth-ledger-metrics">
              <div className="auth-ledger-metric">
                <span className="metric-label">Total Receivables</span>
                <strong className="metric-val">₹ 48,25,000</strong>
                <span className="metric-trend metric-trend--up">↑ +14.8%</span>
              </div>
              <div className="auth-ledger-metric">
                <span className="metric-label">Total Payables</span>
                <strong className="metric-val">₹ 19,40,000</strong>
                <span className="metric-trend metric-trend--neutral">Settled</span>
              </div>
              <div className="auth-ledger-metric">
                <span className="metric-label">Net Working Capital</span>
                <strong className="metric-val">₹ 28,85,000</strong>
                <span className="metric-trend metric-trend--positive">Positive</span>
              </div>
            </div>

            <div className="auth-ledger-list">
              <div className="auth-ledger-row">
                <div className="auth-ledger-row-left">
                  <span className="ledger-icon ledger-icon--invoice">INV</span>
                  <div>
                    <strong>INV-2026-9842 • Apex Logistics</strong>
                    <small>GST E-Way Bill Generated</small>
                  </div>
                </div>
                <div className="auth-ledger-row-right">
                  <strong>₹ 3,45,000</strong>
                  <span className="ledger-tag ledger-tag--verified">Verified</span>
                </div>
              </div>

              <div className="auth-ledger-row">
                <div className="auth-ledger-row-left">
                  <span className="ledger-icon ledger-icon--bill">BILL</span>
                  <div>
                    <strong>PO-4412 • Horizon Supply Chain</strong>
                    <small>Input Tax Credit Reconciled</small>
                  </div>
                </div>
                <div className="auth-ledger-row-right">
                  <strong>₹ 1,18,500</strong>
                  <span className="ledger-tag ledger-tag--reconciled">Reconciled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="auth-hero-trust">
            <div className="trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>SOC-2 Certified</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-Bit SSL Encryption</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Multi-Company Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Clean Luxury Authentication Terminal */}
      <main className="auth-form-pane">
        <div className="auth-form-card">
          <div className="auth-form-card__head">
            <div className="auth-form-brand-mobile">
              <span className="auth-brand-mark">TF</span>
              <span className="auth-brand-title">TradeFlow</span>
            </div>

            {eyebrow && <span className="auth-card-eyebrow">{eyebrow}</span>}
            <h2 className="auth-card-title">{title}</h2>
            {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
          </div>

          <div className="auth-form-card__body">
            {children}
          </div>

          <div className="auth-form-card__footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Authorized corporate access only. All sessions are logged.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
