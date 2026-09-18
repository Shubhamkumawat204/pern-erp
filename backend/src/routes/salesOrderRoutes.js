const express = require("express");

const {
  convertQuotationToSalesOrder,
  confirmSalesOrder,
  getSalesOrders,
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
  
module.exports = router;