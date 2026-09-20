-- V8__create_sales_and_stock_module.sql
-- Sales Invoices (GST & Non-GST) and Stock Management Ledger

-- 1. Add current_stock column to products table if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS current_stock NUMERIC(18,3) NOT NULL DEFAULT 0;

-- 2. Create sales invoices table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('GST', 'NON_GST')),
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'CREDIT',
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
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sale_invoice_number UNIQUE (company_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_sales_company ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_type ON sales(transaction_type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(invoice_date);

-- 3. Create sales_items line items table
CREATE TABLE IF NOT EXISTS sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,3) NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(18,2) DEFAULT 0,
    taxable_amount NUMERIC(18,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    cgst_amount NUMERIC(18,2) DEFAULT 0,
    sgst_amount NUMERIC(18,2) DEFAULT 0,
    igst_amount NUMERIC(18,2) DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id);

-- 4. Create stock_movements ledger table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    reference_type VARCHAR(30) NOT NULL CHECK (reference_type IN ('PURCHASE', 'SALE', 'OPENING_STOCK', 'MANUAL_ADJUSTMENT')),
    reference_id UUID,
    quantity NUMERIC(18,3) NOT NULL,
    unit_cost NUMERIC(18,2),
    stock_before NUMERIC(18,3) NOT NULL DEFAULT 0,
    stock_after NUMERIC(18,3) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);

-- 5. Seed default customer parties if none exist
INSERT INTO parties (id, company_id, party_type, party_name, contact_person, email, phone, country, currency_code, address, gstin, active)
SELECT 
    gen_random_uuid(), 
    c.id, 
    'CUSTOMER', 
    'Apex Electricals Ltd', 
    'Rajesh Sharma', 
    'rajesh@apexelectricals.in', 
    '+91 98765 43210', 
    'India', 
    'INR', 
    'Plot 42, Industrial Area, Phase II, New Delhi', 
    '07AAAAA0000A1Z5', 
    TRUE
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM parties p WHERE p.company_id = c.id AND p.party_type = 'CUSTOMER')
LIMIT 1;

INSERT INTO parties (id, company_id, party_type, party_name, contact_person, email, phone, country, currency_code, address, gstin, active)
SELECT 
    gen_random_uuid(), 
    c.id, 
    'CUSTOMER', 
    'Shreeji Traders (Local Retail)', 
    'Bhavik Patel', 
    'bhavik@shreejitraders.com', 
    '+91 98250 12345', 
    'India', 
    'INR', 
    'Market Yard, Station Road, Ahmedabad, Gujarat', 
    '24BBBBB1111B1Z2', 
    TRUE
FROM companies c
WHERE (SELECT COUNT(*) FROM parties p WHERE p.company_id = c.id AND p.party_type = 'CUSTOMER') < 2
LIMIT 1;

-- 6. Seed sales and stock permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (gen_random_uuid(), 'SALE_CREATE', 'Create Sale Invoice', 'SALE', 'Create GST and Non-GST sales invoices'),
    (gen_random_uuid(), 'SALE_UPDATE', 'Update Sale Invoice', 'SALE', 'Edit draft sales invoices'),
    (gen_random_uuid(), 'SALE_DELETE', 'Cancel Sale Invoice', 'SALE', 'Cancel sales invoices and restore stock'),
    (gen_random_uuid(), 'SALE_VIEW',   'View Sales Invoices', 'SALE', 'View sales invoices list and details'),
    (gen_random_uuid(), 'STOCK_VIEW',  'View Stock Levels',  'STOCK', 'View current product stock and movements'),
    (gen_random_uuid(), 'STOCK_ADJUST', 'Adjust Stock',      'STOCK', 'Manually adjust stock balances')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to ADMIN
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111101', p.id
FROM permissions p
WHERE p.module IN ('SALE', 'STOCK')
ON CONFLICT DO NOTHING;

-- Grant permissions to ACCOUNTANT
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111102', p.id
FROM permissions p
WHERE p.code IN ('SALE_CREATE', 'SALE_VIEW', 'STOCK_VIEW')
ON CONFLICT DO NOTHING;

