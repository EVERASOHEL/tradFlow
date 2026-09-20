-- V5__add_product_specifications.sql
-- Add JSONB specifications column and seed industrial contactor product master

-- 1. Add specifications JSONB column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;

-- 2. Seed Contactor category if missing
INSERT INTO product_categories (id, company_id, name, code, description, active)
VALUES ('c1000000-0000-0000-0000-000000000001', NULL, 'Contactor', 'CONT', 'Electrical contactors and heavy-duty switching devices', TRUE)
ON CONFLICT (code) WHERE company_id IS NULL DO NOTHING;

-- 3. Seed AC Contactor subcategory if missing
INSERT INTO product_subcategories (id, company_id, category_id, name, code, active)
SELECT 'c2000000-0000-0000-0000-000000000001', NULL, pc.id, 'AC Contactor', 'AC-CONT', TRUE
FROM product_categories pc
WHERE pc.code = 'CONT' AND pc.company_id IS NULL
ON CONFLICT (category_id, code) WHERE company_id IS NULL DO NOTHING;

-- 4. Seed VEXON CJX2-F115 AC Contactor Product
INSERT INTO products (
    id,
    company_id,
    product_code,
    product_name,
    category_id,
    subcategory_id,
    unit_id,
    brand,
    model_no,
    part_number,
    hsn_code,
    tax_rate_id,
    purchase_price,
    selling_price,
    minimum_selling_price,
    reorder_level,
    minimum_stock,
    maximum_stock,
    description,
    active,
    specifications
)
VALUES (
    'd1000000-0000-0000-0000-000000000001',
    NULL,
    'VEX-CJX2-F115-3P',
    'VEXON CJX2-F115 3P AC Contactor',
    (SELECT id FROM product_categories WHERE code = 'CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM product_subcategories WHERE code = 'AC-CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM units WHERE short_code = 'PCS' AND company_id IS NULL LIMIT 1),
    'VEXON',
    'CJX2-F115',
    'CJX2-F115-3P-B',
    '85364900',
    (SELECT id FROM tax_rates WHERE gst_rate = 18.00 AND company_id IS NULL LIMIT 1),
    2850.00,
    3450.00,
    3200.00,
    10.000,
    5.000,
    30.000,
    'VEXON CJX2-F115 3P AC Contactor. CJX2-F series, 115A AC-3 rated contactor with 3 poles. Variant B with silver alloy contact material specified as 30% silver. Rated/application voltage 415V AC. Suitable for three-phase motor control, industrial control panels, agricultural panels, pump control panels and general electrical switching applications. Exact coil voltage, contact material specification and other technical parameters should be verified against the manufacturer''s product datasheet before commercial use.',
    TRUE,
    '{
      "electricalSpecifications": {
        "ratedCurrent": 115.0,
        "ratedCurrentUnit": "A",
        "numberOfPoles": 3,
        "poleConfiguration": "3P",
        "coilVoltage": 220.0,
        "coilVoltageUnit": "V AC",
        "ratedVoltage": 415.0,
        "ratedVoltageUnit": "V AC",
        "utilizationCategory": "AC-3"
      },
      "physicalConstruction": {
        "contactMaterial": "Silver Alloy",
        "silverContent": 30.0,
        "silverContentUnit": "%",
        "mountingType": "Panel Mount",
        "constructionType": "Electromagnetic AC Contactor"
      },
      "variantInformation": {
        "series": "CJX2-F",
        "variant": "B",
        "productType": "AC Contactor"
      },
      "application": {
        "primaryApplication": "Three Phase Motor Control",
        "applications": [
          "Industrial Control Panels",
          "Motor Control Panels",
          "Agricultural Panels",
          "Pump Control Panels",
          "Compressor Control",
          "HVAC Control",
          "Industrial Automation"
        ]
      }
    }'::jsonb
)
ON CONFLICT (product_code) WHERE company_id IS NULL DO UPDATE
SET specifications = EXCLUDED.specifications,
    description = EXCLUDED.description;

