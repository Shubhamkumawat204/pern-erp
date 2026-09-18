const express = require("express");

const {
  register,
  login,
} = require("../controllers/authController");

const {
  authenticate,
  authorizeRoles,
} = require("../utils/authMiddleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Protected route
router.get(
  "/admin-test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      message: "Welcome Admin! You have access.",
      user: req.user,
    });
  }
);

module.exports = router;