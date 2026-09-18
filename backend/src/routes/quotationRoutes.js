const express = require("express");

const {
  createQuotation,
  updateQuotationStatus,
  getQuotations,    
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

router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN", "SALES_USER"),
    getQuotations
  );

module.exports = router;