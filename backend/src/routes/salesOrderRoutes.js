const express = require("express");

const {
  convertQuotationToSalesOrder,
} = require("../controllers/salesOrderController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

// Convert Accepted Quotation to Sales Order
router.post(
  "/quotations/:id/convert",
  authenticate,
  authorizeRoles("ADMIN", "SALES_USER"),
  convertQuotationToSalesOrder
);

module.exports = router;