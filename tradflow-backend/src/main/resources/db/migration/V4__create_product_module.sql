-- V4__create_product_module.sql
-- Product and Inventory Catalog Schema with Global and Company Scoping

-- 1. Product Categories (company_id is NULL for Global Master)
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_category_code_company ON product_categories(company_id, code) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_category_code_global ON product_categories(code) WHERE company_id IS NULL;

-- 2. Product Subcategories
CREATE TABLE product_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_subcategory_code_company ON product_subcategories(company_id, code) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_subcategory_code_global ON product_subcategories(category_id, code) WHERE company_id IS NULL;

-- 3. Units of Measure
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    short_code VARCHAR(20) NOT NULL,
    decimal_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_unit_code_company ON units(company_id, short_code) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_unit_code_global ON units(short_code) WHERE company_id IS NULL;

-- 4. Tax Rates (GST)
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_tax_rates_nonnegative CHECK (gst_rate >= 0 AND cgst_rate >= 0 AND sgst_rate >= 0 AND igst_rate >= 0)
);

CREATE UNIQUE INDEX uq_tax_rate_company ON tax_rates(company_id, name) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_tax_rate_global ON tax_rates(name) WHERE company_id IS NULL;

-- 5. Price Lists
CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_price_list_company ON price_lists(company_id, name) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_price_list_global ON price_lists(name) WHERE company_id IS NULL;

-- 6. Products Master
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES product_subcategories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    model_no VARCHAR(100),
    part_number VARCHAR(100),
    hsn_code VARCHAR(20),
    tax_rate_id UUID REFERENCES tax_rates(id) ON DELETE SET NULL,
    purchase_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    minimum_selling_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(18,3) NOT NULL DEFAULT 0,
    minimum_stock NUMERIC(18,3) NOT NULL DEFAULT 0,
    maximum_stock NUMERIC(18,3),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_product_prices_nonnegative CHECK (purchase_price >= 0 AND selling_price >= 0 AND minimum_selling_price >= 0)
);

CREATE UNIQUE INDEX uq_product_code_company ON products(company_id, product_code) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_product_code_global ON products(product_code) WHERE company_id IS NULL;

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_hsn ON products(hsn_code);

-- 7. Product Prices
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    selling_price NUMERIC(18,2) NOT NULL,
    minimum_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_product_price_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_list ON product_prices(price_list_id);

-- 8. Seed Master Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (gen_random_uuid(), 'PRODUCT_CREATE', 'Create Product', 'PRODUCT', 'Create new products'),
    (gen_random_uuid(), 'PRODUCT_UPDATE', 'Update Product', 'PRODUCT', 'Update existing products'),
    (gen_random_uuid(), 'PRODUCT_DELETE', 'Delete Product', 'PRODUCT', 'Deactivate products'),
    (gen_random_uuid(), 'PRODUCT_VIEW',   'View Product',   'PRODUCT', 'View product catalog and prices'),
    (gen_random_uuid(), 'PRODUCT_MASTER_MANAGE', 'Manage Product Masters', 'PRODUCT', 'Manage categories, units, and tax rates')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to ADMIN
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111101', p.id
FROM permissions p
WHERE p.module = 'PRODUCT'
ON CONFLICT DO NOTHING;

-- Grant view and create permissions to ACCOUNTANT
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111102', p.id
FROM permissions p
WHERE p.code IN ('PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE')
ON CONFLICT DO NOTHING;

-- 9. Seed Default Global Units (company_id is NULL)
INSERT INTO units (id, company_id, name, short_code, decimal_allowed, active) VALUES
    (gen_random_uuid(), NULL, 'Pieces', 'PCS', FALSE, TRUE),
    (gen_random_uuid(), NULL, 'Kilograms', 'KG', TRUE, TRUE),
    (gen_random_uuid(), NULL, 'Meters', 'MTR', TRUE, TRUE),
    (gen_random_uuid(), NULL, 'Boxes', 'BOX', FALSE, TRUE),
    (gen_random_uuid(), NULL, 'Liters', 'LTR', TRUE, TRUE),
    (gen_random_uuid(), NULL, 'Packets', 'PKT', FALSE, TRUE),
    (gen_random_uuid(), NULL, 'Hours', 'HRS', TRUE, TRUE),
    (gen_random_uuid(), NULL, 'Sets', 'SET', FALSE, TRUE);

-- 10. Seed Default Global GST Tax Rates (company_id is NULL)
INSERT INTO tax_rates (id, company_id, name, gst_rate, cgst_rate, sgst_rate, igst_rate, active) VALUES
    (gen_random_uuid(), NULL, 'GST 0% (Exempt)', 0.00, 0.00, 0.00, 0.00, TRUE),
    (gen_random_uuid(), NULL, 'GST 5%', 5.00, 2.50, 2.50, 5.00, TRUE),
    (gen_random_uuid(), NULL, 'GST 12%', 12.00, 6.00, 6.00, 12.00, TRUE),
    (gen_random_uuid(), NULL, 'GST 18%', 18.00, 9.00, 9.00, 18.00, TRUE),
    (gen_random_uuid(), NULL, 'GST 28%', 28.00, 14.00, 14.00, 28.00, TRUE);

-- 11. Seed Sample Global Categories
INSERT INTO product_categories (id, company_id, name, code, description, active) VALUES
    (gen_random_uuid(), NULL, 'Raw Materials', 'RAW', 'Direct production inputs and materials', TRUE),
    (gen_random_uuid(), NULL, 'Finished Goods', 'FG', 'Manufactured or purchased resale products', TRUE),
    (gen_random_uuid(), NULL, 'Electronics & Hardware', 'ELEC', 'Electronic components and assemblies', TRUE),
    (gen_random_uuid(), NULL, 'Services & Consulting', 'SRV', 'Professional and operational billable services', TRUE),
    (gen_random_uuid(), NULL, 'Packaging Materials', 'PKG', 'Boxes, wraps, and packaging essentials', TRUE);

