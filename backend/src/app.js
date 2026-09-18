const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const salesOrderRoutes = require("./routes/salesOrderRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/inventory", inventoryRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Mini ERP API is running",
  });
});

module.exports = app;