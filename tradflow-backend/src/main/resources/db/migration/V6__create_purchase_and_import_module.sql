-- V6__create_purchase_and_import_module.sql
-- Parties (Suppliers), Imports (China LCL Shipments), Purchases, and Purchase Items

-- 1. Parties (Suppliers & Vendors)
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    party_type VARCHAR(20) NOT NULL DEFAULT 'SUPPLIER',
    party_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    country VARCHAR(100) DEFAULT 'China',
    currency_code VARCHAR(10) DEFAULT 'CNY',
    address TEXT,
    gstin VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parties_company ON parties(company_id);
CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(party_type);

-- 2. Imports (China LCL / Container Shipments Tracking)
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    import_number VARCHAR(50) NOT NULL,
    supplier_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    order_date DATE,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'CNY',
    rmb_price NUMERIC(18,4),
    exchange_rate NUMERIC(18,6),
    total_rmb NUMERIC(18,2),
    total_purchase_value NUMERIC(18,2),
    agent_rate_per_rmb NUMERIC(18,4),
    agent_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    silver_rate NUMERIC(18,2),
    copper_rate NUMERIC(18,2),
    advance_percentage NUMERIC(5,2) DEFAULT 30,
    advance_amount NUMERIC(18,2) DEFAULT 0,
    production_ready_date DATE,
    packing_list_date DATE,
    goods_loading_date DATE,
    port_arrival_date DATE,
    warehouse_arrival_date DATE,
    customs_status VARCHAR(30),
    hold_reason TEXT,
    transportation_expense NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_import_expense NUMERIC(18,2) NOT NULL DEFAULT 0,
    landed_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(30),
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_import_number UNIQUE(company_id, import_number)
);

CREATE INDEX IF NOT EXISTS idx_imports_company ON imports(company_id);
CREATE INDEX IF NOT EXISTS idx_imports_supplier ON imports(supplier_id);
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);

-- 3. Purchases (Invoices)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    purchase_number VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    supplier_invoice_number VARCHAR(100),
    supplier_invoice_date DATE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('GST','NON_GST')),
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    taxable_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    other_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    round_off NUMERIC(18,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(18,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    outstanding_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    import_id UUID REFERENCES imports(id) ON DELETE SET NULL,
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_purchase_number UNIQUE(company_id, purchase_number)
);

CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_import ON purchases(import_id);

-- 4. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
    rate NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    taxable_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

-- 5. Seed Permissions for Purchase & Import Modules
INSERT INTO permissions (id, code, name, module, description) VALUES
    (gen_random_uuid(), 'IMPORT_VIEW',   'View Imports',   'IMPORT',   'View China import shipments and LCL tracking'),
    (gen_random_uuid(), 'IMPORT_CREATE', 'Create Import',  'IMPORT',   'Book and initiate new China import shipments'),
    (gen_random_uuid(), 'IMPORT_UPDATE', 'Update Import',  'IMPORT',   'Update progressive import stages, customs & expenses'),
    (gen_random_uuid(), 'IMPORT_DELETE', 'Delete Import',  'IMPORT',   'Delete or cancel import shipments'),
    (gen_random_uuid(), 'PURCHASE_VIEW',   'View Purchase',   'PURCHASE', 'View purchase invoices and items'),
    (gen_random_uuid(), 'PURCHASE_CREATE', 'Create Purchase', 'PURCHASE', 'Record supplier purchase invoices'),
    (gen_random_uuid(), 'PURCHASE_UPDATE', 'Update Purchase', 'PURCHASE', 'Update purchase invoices'),
    (gen_random_uuid(), 'PURCHASE_DELETE', 'Delete Purchase', 'PURCHASE', 'Delete purchase invoices'),
    (gen_random_uuid(), 'PARTY_VIEW',   'View Parties',   'PARTY',    'View suppliers and party masters'),
    (gen_random_uuid(), 'PARTY_MANAGE', 'Manage Parties', 'PARTY',    'Create and update supplier parties')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to ADMIN role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111101', p.id
FROM permissions p
WHERE p.module IN ('IMPORT', 'PURCHASE', 'PARTY')
ON CONFLICT DO NOTHING;

-- Grant permissions to ACCOUNTANT role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111102', p.id
FROM permissions p
WHERE p.module IN ('IMPORT', 'PURCHASE', 'PARTY')
ON CONFLICT DO NOTHING;

-- 6. Seed Sample Global China Suppliers
INSERT INTO parties (id, company_id, party_type, party_name, contact_person, email, phone, country, currency_code, address, active) VALUES
    ('b1000000-0000-0000-0000-000000000001', NULL, 'SUPPLIER', 'VEXON Electrical (Wenzhou) Co., Ltd', 'Mr. Li Wei', 'sales@vexonelectric.cn', '+86 577 6278 1234', 'China', 'CNY', 'No. 88 Liushi Electrical Industrial Zone, Yueqing, Wenzhou, Zhejiang, China', TRUE),
    ('b1000000-0000-0000-0000-000000000002', NULL, 'SUPPLIER', 'Zhejiang Chint Electrics Co., Ltd', 'Ms. Chen Ming', 'export@chint.cn', '+86 577 6277 8888', 'China', 'CNY', 'Chint High-Tech Industrial Zone, Yueqing, Zhejiang, China', TRUE),
    ('b1000000-0000-0000-0000-000000000003', NULL, 'SUPPLIER', 'Shanghai Delixi Group Co., Ltd', 'Mr. Wang Jun', 'orders@delixi-electric.com', '+86 21 5888 9900', 'China', 'CNY', 'Delixi Building, No. 1555 Kaixuan Road, Shanghai, China', TRUE)
ON CONFLICT DO NOTHING;

