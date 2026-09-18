const express = require("express");

const {
  createQuotation,
  updateQuotationStatus,
} = require("../controllers/quotationController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

// Create Quotation
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES_USER"),
  createQuotation
);

// Update Quotation Status
router.patch(
    "/:id/status",
    authenticate,
    authorizeRoles("ADMIN", "SALES_USER"),
    updateQuotationStatus
  );

module.exports = router;