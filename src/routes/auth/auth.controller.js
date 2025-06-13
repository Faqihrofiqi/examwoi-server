// src/routes/auth/auth.controller.js
const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
const { body, validationResult } = require("express-validator");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Custom validator untuk Base64 Image (bisa di-extract ke utilitas terpisah jika banyak dipakai)
const isBase64Image = (value) => {
  if (!value) return true;
  // Pastikan ini adalah literal regex, bukan string dengan backtick atau quotes
  const base64Regex =
    /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
  if (!base64Regex.test(value)) {
    throw new Error(
      "Image URL must be a valid Base64 image data URI (e.g., data:image/png;base64,...)."
    );
  }
  return true;
};
// --- API Endpoints ---

// POST /auth/register
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // req.user akan berisi payload JWT (id, email, role) setelah middleware authenticate berjalan
  const userId = req.user.id; // Mengambil ID user dari token

  const userProfile = await authService.getLoggedInUser(userId);

  res.status(200).json({ message: 'User profile retrieved successfully!', data: userProfile });
}));

// GET /auth/profile (contoh rute yang dilindungi) - ini sebenarnya redundant dengan /me sekarang
// Kita bisa menghapus ini atau membiarkannya jika ada tujuan berbeda.
// Untuk saat ini, /me lebih umum digunakan dan bisa menggantikan /profile.
// Jika ingin menghapus: hapus seluruh block router.get('/profile', ...)
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  // req.user berisi payload JWT (id, email, role) yang ditambahkan oleh middleware authenticate
  const userId = req.user.id;
  const prisma = req.app.get('prisma'); // Akses prisma client dari app object
  const user = await prisma.user.findUnique({
    where: { id: userId }, // Hapus customerId dari where jika tidak menggunakan multi-tenancy
    select: {
      id: true, email: true, username: true, role: true, phone: true,
      isVerified: true, profileImageUrl: true, dateOfBirth: true,
      kabupaten: true, profinsi: true
    }
  });
  if (!user) {
    const error = new Error('User profile not found.');
    error.statusCode = 404;
    throw error;
  }
  res.status(200).json({ message: 'User profile retrieved successfully!', user });
}));

router.post(
  "/register",
  [
    // ... (validasi lainnya) ...
    body("profileImageUrl").optional().custom(isBase64Image), // Tambahkan validasi Base64
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      message:
        "User registered successfully. Please verify your account with OTP sent to your email.",
      user,
    });
  })
);

// GET /auth/profile (Tambahkan juga `profileImageUrl` di `select` jika belum ada)
router.get(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const prisma = req.app.get("prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        isVerified: true,
        profileImageUrl: true,
        dateOfBirth: true, // <-- Pastikan ini ada
        kabupaten: true,
        profinsi: true,
      },
    });
    if (!user) {
      const error = new Error("User profile not found.");
      error.statusCode = 404;
      throw error;
    }
    res
      .status(200)
      .json({ message: "User profile retrieved successfully!", user });
  })
);

// POST /auth/verify
router.post(
  "/verify",
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits long."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authService.verifyOtp(req.body.email, req.body.otp);
    res.status(200).json({ message: "Account verified successfully!" });
  })
);

// POST /auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { accessToken, refreshToken, user } = await authService.loginUser(
      req.body.email,
      req.body.password
    );
    res
      .status(200)
      .json({ message: "Login successful!", accessToken, refreshToken, user });
  })
);

// POST /auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authService.forgotPassword(req.body.email);
    // Generic success message to prevent user enumeration
    res.status(200).json({
      message:
        "If the email is registered, an OTP has been sent to your email.",
    });
  })
);

// POST /auth/reset-password
router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long."),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits long."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authService.resetPassword(
      req.body.email,
      req.body.newPassword,
      req.body.otp
    );
    res.status(200).json({
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  })
);

// POST /auth/refresh-token
router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { accessToken } = await authService.refreshAccessToken(
      req.body.refreshToken
    );
    res
      .status(200)
      .json({ message: "Access token refreshed successfully!", accessToken });
  })
);

// GET /auth/profile (Contoh rute yang dilindungi)
router.get(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    // req.user berisi payload JWT (id, email, role)
    const userId = req.user.id;
    const user = await req.app.get("prisma").user.findUnique({
      // Access prisma from app object
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        isVerified: true,
        profileImageUrl: true,
        dateOfBirth: true,
        kabupaten: true,
        profinsi: true,
      },
    });
    if (!user) {
      const error = new Error("User profile not found.");
      error.statusCode = 404; // Not Found
      throw error;
    }
    res
      .status(200)
      .json({ message: "User profile retrieved successfully!", user });
  })
);

// GET /auth/admin-dashboard (Contoh rute yang dilindungi dengan otorisasi)
router.get(
  "/admin-dashboard",
  authenticate,
  authorize(["ADMIN"]),
  (req, res) => {
    res.status(200).json({
      message: `Welcome, ${req.user.email}! This is the admin dashboard.`,
    });
  }
);

module.exports = router;
