# Mini ERP System

A full-stack Mini ERP (Enterprise Resource Planning) application built using the PERN stack.

The application manages the complete business workflow:

Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch

---

## 🚀 Project Overview

Mini ERP is a role-based ERP application designed to manage customer enquiries, quotations, sales orders, inventory reservation, and dispatch operations.

The application provides JWT-based authentication and role-based authorization for ADMIN and SALES_USER users.

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt
- PostgreSQL
- REST APIs

### Database

- PostgreSQL

---

## ✨ Features

### Authentication

- User registration
- User login
- JWT authentication
- Password hashing using bcrypt
- Protected frontend routes
- Backend role-based authorization
- Logout

### Customer Enquiries

- Create customer enquiry
- Company information
- Contact person
- Mobile
- Email
- City
- Multiple products
- Product quantity
- Enquiry status

### Quotations

- Create quotation from enquiry
- Multiple quotation products
- Quantity and unit price
- Discount percentage
- GST percentage
- Automatic line total calculation
- Automatic grand total calculation
- Quotation status workflow

Quotation workflow:

DRAFT → SENT → ACCEPTED / REJECTED

### Sales Orders

- Convert ACCEPTED quotation into Sales Order
- Prevent duplicate Sales Orders
- Sales Order status management
- ADMIN-only Sales Order confirmation
- Inventory reservation during confirmation

Sales Order workflow:

PENDING → CONFIRMED → DISPATCHED

### Inventory

Inventory maintains:

- Physical quantity
- Reserved quantity
- Available quantity

Available quantity is calculated as:

Physical Quantity - Reserved Quantity

The backend prevents reservation beyond available inventory.

### Dispatch

ADMIN users can dispatch confirmed Sales Orders.

Dispatch includes:

- Sales Order
- Products
- Quantity
- Vehicle number
- Driver name
- Dispatch date

During dispatch:

- Physical stock decreases
- Reserved stock decreases
- Sales Order becomes DISPATCHED

The backend prevents dispatching more than the reserved quantity.

---

## 👥 User Roles

### ADMIN

ADMIN users can:

- View enquiries
- Create/view quotations
- Convert accepted quotations to Sales Orders
- View Sales Orders
- Confirm Sales Orders
- Reserve inventory
- Dispatch Sales Orders
- View inventory

### SALES_USER

SALES_USER users can:

- Create enquiries
- View enquiries
- Create/view quotations
- Convert accepted quotations to Sales Orders
- View Sales Orders
- View inventory

SALES_USER cannot:

- Confirm Sales Orders
- Dispatch Sales Orders

Role authorization is enforced on the backend using JWT middleware.

---

## 🔄 Main ERP Workflow

```text
Customer Enquiry
       ↓
Quotation
       ↓
Quotation Accepted
       ↓
Sales Order
       ↓
ADMIN Confirms Sales Order
       ↓
Inventory Reserved
       ↓
ADMIN Creates Dispatch
       ↓
Physical Stock Decreases
       ↓
Reserved Stock Decreases
       ↓
Sales Order DISPATCHED