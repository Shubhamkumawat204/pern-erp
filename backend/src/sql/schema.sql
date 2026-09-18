-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SALES_USER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- CUSTOMERS
-- =========================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- PRODUCTS
-- =========================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(30) NOT NULL,
    base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- INVENTORY
-- =========================

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,

    physical_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (physical_quantity >= 0),

    reserved_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (reserved_quantity >= 0),

    CHECK (reserved_quantity <= physical_quantity)
);


-- =========================
-- ENQUIRIES
-- =========================

CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,

    enquiry_number VARCHAR(50) UNIQUE NOT NULL,

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE,

    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- ENQUIRY ITEMS
-- =========================

CREATE TABLE enquiry_items (
    id SERIAL PRIMARY KEY,

    enquiry_id INTEGER NOT NULL
        REFERENCES enquiries(id) ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0)
);


-- =========================
-- QUOTATIONS
-- =========================

CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,

    quotation_number VARCHAR(50) UNIQUE NOT NULL,

    enquiry_id INTEGER UNIQUE NOT NULL
        REFERENCES enquiries(id),

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    valid_until DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),

    base_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (base_amount >= 0),

    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (discount_amount >= 0),

    gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (gst_amount >= 0),

    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- QUOTATION ITEMS
-- =========================

CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,

    quotation_id INTEGER NOT NULL
        REFERENCES quotations(id) ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),

    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),

    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (gst_percent >= 0 AND gst_percent <= 100),

    line_amount NUMERIC(12,2) NOT NULL
        CHECK (line_amount >= 0)
);


-- =========================
-- SALES ORDERS
-- =========================

CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,

    order_number VARCHAR(50) UNIQUE NOT NULL,

    quotation_id INTEGER UNIQUE NOT NULL
        REFERENCES quotations(id),

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    total_amount NUMERIC(12,2) NOT NULL
        CHECK (total_amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'DISPATCHED',
                'CANCELLED'
            )
        ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- SALES ORDER ITEMS
-- =========================

CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,

    sales_order_id INTEGER NOT NULL
        REFERENCES sales_orders(id) ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0)
);


-- =========================
-- DISPATCHES
-- =========================

CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,

    dispatch_number VARCHAR(50) UNIQUE NOT NULL,

    sales_order_id INTEGER UNIQUE NOT NULL
        REFERENCES sales_orders(id),

    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,

    vehicle_number VARCHAR(50),

    driver_name VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- DISPATCH ITEMS
-- =========================

CREATE TABLE dispatch_items (
    id SERIAL PRIMARY KEY,

    dispatch_id INTEGER NOT NULL
        REFERENCES dispatches(id) ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0)
);