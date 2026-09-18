const express = require("express");

const {
  convertQuotationToSalesOrder,
  confirmSalesOrder,
  getSalesOrders,
  getSalesOrderById,
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

router.patch(
    "/:id/confirm",
    authenticate,
    authorizeRoles("ADMIN"),
    confirmSalesOrder
  );

  router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN", "SALES_USER"),
    getSalesOrders
  );

  // Get Sales Order details with products
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "SALES_USER"),
  getSalesOrderById
);
  
module.exports = router;