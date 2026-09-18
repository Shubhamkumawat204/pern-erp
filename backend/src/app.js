const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Mini ERP API is running",
  });
});

module.exports = app;