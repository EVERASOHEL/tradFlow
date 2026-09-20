-- V7__add_product_packaging_and_agent_fee_basis.sql
-- Adds packaging dimensions, single-select agent fee basis, per-box configuration, and seeds 12A AC Contactor.

-- 1. Alter purchase_items table
ALTER TABLE purchase_items
    ADD COLUMN IF NOT EXISTS packaging_type VARCHAR(20) DEFAULT 'PIECE',
    ADD COLUMN IF NOT EXISTS pieces_per_box INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS box_count NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_pieces NUMERIC(18,3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS length NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS width NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS height NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS dimension_unit VARCHAR(10) DEFAULT 'CM',
    ADD COLUMN IF NOT EXISTS net_weight NUMERIC(10,3),
    ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(10,3),
    ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'KG',
    ADD COLUMN IF NOT EXISTS total_cbm NUMERIC(10,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10,3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_landed_cost NUMERIC(18,2) DEFAULT 0;

-- 2. Alter imports table
ALTER TABLE imports
    ADD COLUMN IF NOT EXISTS agent_fee_basis VARCHAR(20) DEFAULT 'PER_RMB',
    ADD COLUMN IF NOT EXISTS agent_rate NUMERIC(18,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agent_rate_per_kg NUMERIC(18,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agent_rate_per_cbm NUMERIC(18,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_boxes INT DEFAULT 0;

-- 3. Alter purchases table
ALTER TABLE purchases
    ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'CNY',
    ADD COLUMN IF NOT EXISTS rmb_price NUMERIC(18,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_rmb NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agent_fee_basis VARCHAR(20) DEFAULT 'PER_RMB',
    ADD COLUMN IF NOT EXISTS agent_rate NUMERIC(18,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_boxes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_cbm NUMERIC(10,4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10,3) DEFAULT 0;

-- 4. Update VEXON CJX2-F115-3P with packaging specifications
UPDATE products
SET specifications = jsonb_set(
    COALESCE(specifications, '{}'::jsonb),
    '{packagingAndDimensions}',
    '{
      "dimensionUnit": "CM",
      "pieceLength": 15.5,
      "pieceWidth": 12.0,
      "pieceHeight": 14.5,
      "weightUnit": "KG",
      "pieceNetWeight": 2.20,
      "defaultPackagingType": "BOX",
      "piecesPerBox": 10,
      "boxLength": 48.0,
      "boxWidth": 32.0,
      "boxHeight": 31.0,
      "boxDimensionUnit": "CM",
      "boxGrossWeight": 23.50,
      "boxNetWeight": 22.00,
      "boxWeightUnit": "KG",
      "boxCbm": 0.0476
    }'::jsonb
)
WHERE product_code = 'VEX-CJX2-F115-3P';

-- 5. Seed 12A AC Contactor (50 pieces per box, weight & CBM configuration)
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
) VALUES (
    'd1000000-0000-0000-0000-000000000012',
    NULL,
    'VEX-CJX2-1210-3P',
    'VEXON CJX2-1210 12A 3P AC Contactor',
    (SELECT id FROM product_categories WHERE code = 'CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM product_subcategories WHERE code = 'AC-CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM units WHERE short_code = 'PCS' AND company_id IS NULL LIMIT 1),
    'VEXON',
    'CJX2-1210',
    'CJX2-1210-220V',
    '85364900',
    (SELECT id FROM tax_rates WHERE gst_rate = 18.00 AND company_id IS NULL LIMIT 1),
    380.00,
    520.00,
    480.00,
    50.000,
    20.000,
    500.000,
    'VEXON CJX2-1210 12A AC Contactor with 1NO auxiliary contact. 50 pieces per master carton. 220V AC coil voltage, 3-pole switching for motor starters and industrial automation control.',
    TRUE,
    '{
      "electricalSpecifications": {
        "ratedCurrent": 12.0,
        "ratedCurrentUnit": "A",
        "numberOfPoles": 3,
        "poleConfiguration": "3P + 1NO",
        "coilVoltage": 220.0,
        "coilVoltageUnit": "V AC",
        "ratedVoltage": 415.0,
        "ratedVoltageUnit": "V AC",
        "utilizationCategory": "AC-3"
      },
      "physicalConstruction": {
        "contactMaterial": "Silver Alloy",
        "silverContent": 25.0,
        "silverContentUnit": "%",
        "mountingType": "DIN Rail / Panel Mount",
        "constructionType": "Compact Electromagnetic Contactor"
      },
      "packagingAndDimensions": {
        "dimensionUnit": "CM",
        "pieceLength": 7.5,
        "pieceWidth": 4.5,
        "pieceHeight": 8.5,
        "weightUnit": "KG",
        "pieceNetWeight": 0.35,
        "defaultPackagingType": "PIECE",
        "piecesPerBox": 50,
        "boxLength": 42.0,
        "boxWidth": 32.0,
        "boxHeight": 26.0,
        "boxDimensionUnit": "CM",
        "boxGrossWeight": 18.50,
        "boxNetWeight": 17.50,
        "boxWeightUnit": "KG",
        "boxCbm": 0.0349
      },
      "application": {
        "primaryApplication": "Small Three Phase Motors & Industrial Control",
        "applications": [
          "Motor Starters",
          "Water Pump Starters",
          "Distribution Panels",
          "Lighting Control"
        ]
      }
    }'::jsonb
)
ON CONFLICT (product_code) WHERE company_id IS NULL DO UPDATE
SET specifications = EXCLUDED.specifications,
    description = EXCLUDED.description,
    purchase_price = EXCLUDED.purchase_price;

-- 6. Seed 265A AC Contactor (1 piece per box, heavy industrial contactor)
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
) VALUES (
    'd1000000-0000-0000-0000-000000000265',
    NULL,
    'VEX-CJX2-F265-3P',
    'VEXON CJX2-F265 265A 3P AC Contactor',
    (SELECT id FROM product_categories WHERE code = 'CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM product_subcategories WHERE code = 'AC-CONT' AND company_id IS NULL LIMIT 1),
    (SELECT id FROM units WHERE short_code = 'PCS' AND company_id IS NULL LIMIT 1),
    'VEXON',
    'CJX2-F265',
    'CJX2-F265-220V',
    '85364900',
    (SELECT id FROM tax_rates WHERE gst_rate = 18.00 AND company_id IS NULL LIMIT 1),
    310.00,
    4800.00,
    4500.00,
    10.000,
    5.000,
    100.000,
    'VEXON CJX2-F265 265A heavy-duty 3P AC Contactor. 1 piece per carton. 220V AC coil voltage, robust high-power industrial switching.',
    TRUE,
    '{
      "electricalSpecifications": {
        "ratedCurrent": 265.0,
        "ratedCurrentUnit": "A",
        "numberOfPoles": 3,
        "poleConfiguration": "3P",
        "coilVoltage": 220.0,
        "coilVoltageUnit": "V AC",
        "ratedVoltage": 690.0,
        "ratedVoltageUnit": "V AC",
        "utilizationCategory": "AC-3"
      },
      "physicalConstruction": {
        "contactMaterial": "Silver Cadmium Oxide",
        "silverContent": 40.0,
        "silverContentUnit": "%",
        "mountingType": "Panel Mount",
        "constructionType": "Heavy-duty Industrial Contactor"
      },
      "packagingAndDimensions": {
        "dimensionUnit": "CM",
        "pieceLength": 20.0,
        "pieceWidth": 16.0,
        "pieceHeight": 18.0,
        "weightUnit": "KG",
        "pieceNetWeight": 5.00,
        "defaultPackagingType": "PIECE",
        "piecesPerBox": 1,
        "boxLength": 25.0,
        "boxWidth": 20.0,
        "boxHeight": 22.0,
        "boxDimensionUnit": "CM",
        "boxGrossWeight": 5.60,
        "boxNetWeight": 5.00,
        "boxWeightUnit": "KG",
        "boxCbm": 0.0110
      },
      "application": {
        "primaryApplication": "Heavy Motor Starters & Power Distribution",
        "applications": [
          "Heavy Industrial Motors",
          "HVAC Chillers",
          "Distribution Panels",
          "Capacitor Bank Switching"
        ]
      }
    }'::jsonb
)
ON CONFLICT (product_code) WHERE company_id IS NULL DO UPDATE
SET specifications = EXCLUDED.specifications,
    description = EXCLUDED.description,
    purchase_price = EXCLUDED.purchase_price;

