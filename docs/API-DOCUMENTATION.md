# Mini ERP API Documentation

## Base URL

http://localhost:5000/api

## Authentication

Protected APIs require JWT token:

Authorization: Bearer <JWT_TOKEN>

---

# 1. Authentication APIs

## Login

**Method:** POST

**Endpoint:**

/api/auth/login

**Request Body:**

```json
{
  "email": "admin@minierp.com",
  "password": "<password>"
}
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>"
}

# 2. Enquiry APIs

## Create Enquiry

**Method:** POST

**Endpoint:**

/api/enquiries

**Allowed Roles:**

- ADMIN
- SALES_USER

## Get Enquiries

**Method:** GET

**Endpoint:**

/api/enquiries

**Allowed Roles:**

- ADMIN
- SALES_USER


---

# 3. Quotation APIs

## Create Quotation

**Method:** POST

**Endpoint:**

/api/quotations

**Allowed Roles:**

- ADMIN
- SALES_USER

### Request Body

```json
{
  "enquiryId": 1,
  "validUntil": "2026-10-01",
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "discountPercent": 5,
      "gstPercent": 18
    }
  ]
}


---

# 4. Sales Order APIs

## Convert Quotation to Sales Order

**Method:** POST

**Endpoint:**

/api/sales-orders/quotations/:id/convert

**Allowed Roles:**

- ADMIN
- SALES_USER

### Purpose

Converts an ACCEPTED quotation into a Sales Order.

Only quotations with ACCEPTED status can be converted.

Duplicate Sales Orders for the same quotation are prevented.

---

## Get Sales Orders

**Method:** GET

**Endpoint:**

/api/sales-orders

**Allowed Roles:**

- ADMIN
- SALES_USER

### Purpose

Returns the list of Sales Orders with customer information.

---

## Get Sales Order Details

**Method:** GET

**Endpoint:**

/api/sales-orders/:id

**Allowed Roles:**

- ADMIN
- SALES_USER

### Purpose

Returns the details of a specific Sales Order along with its products/items.

---

## Confirm Sales Order

**Method:** PATCH

**Endpoint:**

/api/sales-orders/:id/confirm

**Allowed Role:**

- ADMIN

### Purpose

Confirms a PENDING Sales Order and reserves inventory.

### Sales Order Status

PENDING → CONFIRMED

### Inventory Calculation

Available Quantity = Physical Quantity - Reserved Quantity

The system prevents reservation beyond available inventory.




---

# 5. Dispatch APIs

## Create Dispatch

**Method:** POST

**Endpoint:**

/api/dispatches

**Allowed Role:**

- ADMIN

### Request Body

```json
{
  "salesOrderId": 1,
  "vehicleNumber": "MP09AB1234",
  "driverName": "Ramesh",
  "products": [
    {
      "productId": 1,
      "quantity": 10
    },
    {
      "productId": 2,
      "quantity": 20
    }
  ]
}

---

# 6. Inventory APIs

## Get Inventory

**Method:** GET

**Endpoint:**

/api/inventory

**Allowed Roles:**

- ADMIN
- SALES_USER

### Purpose

Returns all products with their inventory details.

### Inventory Information

The API returns:

- Product code
- Product name
- Category
- Unit
- Base price
- Physical quantity
- Reserved quantity
- Available quantity

### Available Quantity Calculation

Available Quantity = Physical Quantity - Reserved Quantity

### Example Response

```json
{
  "inventory": [
    {
      "id": 1,
      "product_id": 1,
      "product_code": "IND-001",
      "product_name": "Industrial Electric Motor 5 HP",
      "category": "Electric Motors",
      "unit": "PCS",
      "base_price": "28500.00",
      "physical_quantity": 100,
      "reserved_quantity": 10,
      "available_quantity": 90
    }
  ]
}