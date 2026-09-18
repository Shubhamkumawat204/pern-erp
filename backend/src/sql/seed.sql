-- =========================
-- PRODUCTS
-- =========================

INSERT INTO products
(product_code, product_name, category, unit, base_price)
VALUES
('IND-001', 'Industrial Electric Motor 5 HP', 'Electric Motors', 'PCS', 28500.00),
('IND-002', 'Heavy Duty Bearing 6205', 'Bearings', 'PCS', 850.00),
('IND-003', 'Hydraulic Pump 10 LPM', 'Hydraulic Equipment', 'PCS', 12500.00),
('IND-004', 'Industrial Gearbox 20:1', 'Gearboxes', 'PCS', 32000.00),
('IND-005', 'PVC Industrial Hose 25mm', 'Industrial Hoses', 'MTR', 450.00),
('IND-006', 'Stainless Steel Valve 2 Inch', 'Valves', 'PCS', 2750.00);


-- =========================
-- INVENTORY
-- =========================

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 100, 0
FROM products
WHERE product_code = 'IND-001';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 250, 0
FROM products
WHERE product_code = 'IND-002';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 50, 0
FROM products
WHERE product_code = 'IND-003';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 30, 0
FROM products
WHERE product_code = 'IND-004';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 500, 0
FROM products
WHERE product_code = 'IND-005';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 100, 0
FROM products
WHERE product_code = 'IND-006';