const express = require("express");

const {
  createEnquiry,
} = require("../controllers/enquiryController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

// Create Enquiry
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES_USER"),
  createEnquiry
);

module.exports = router;