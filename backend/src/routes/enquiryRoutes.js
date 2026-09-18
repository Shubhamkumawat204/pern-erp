const express = require("express");

const {
  createEnquiry,
  getEnquiries,
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

// Get All Enquiries
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN", "SALES_USER"),
    getEnquiries
  );

module.exports = router;