// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken"); // Import jsonwebtoken langsung
const { PrismaClient } = require("@prisma/client"); // Import PrismaClient
const prisma = new PrismaClient(); // Inisialisasi Prisma Client di middleware

// Middleware untuk autentikasi (verifikasi Access Token)
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token format invalid." });
  }

  try {
    // Verify access token using JWT_SECRET from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request object
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    console.error("Authentication Error:", err.message);
    // Handle specific JWT errors
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          message: "Unauthorized: Access token has expired.",
          error: "TokenExpiredError",
        });
    }
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({
          message: "Unauthorized: Invalid token.",
          error: "JsonWebTokenError",
        });
    }
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid token.", error: err.message });
  }
};

// Middleware untuk otorisasi (Role-Based Access Control)
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Ensure user information from authentication is available
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: "Forbidden: User role not found in token." });
    }

    // Check if the user's role is included in the allowed roles
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    next(); // User is authorized, proceed
  };
};

module.exports = {
  authenticate,
  authorize,
};
