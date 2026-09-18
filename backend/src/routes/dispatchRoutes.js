const express = require("express");

const {
  createDispatch,
} = require("../controllers/dispatchController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

// ADMIN can create dispatch
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createDispatch
);

module.exports = router;