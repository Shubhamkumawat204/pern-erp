const express = require("express");

const {
  getInventory,
} = require("../controllers/inventoryController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES_USER"),
  getInventory
);

module.exports = router;