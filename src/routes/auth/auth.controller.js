// src/routes/auth/auth.controller.js
const express = require('express');
const router = express.Router();
const authService = require('./auth.service'); // Untuk login, register, verify, forgot, reset, refresh
const userService = require('../users/user.service'); // Untuk update user (baik oleh admin maupun user sendiri)
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { Role } = require('@prisma/client');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Custom validator untuk Base64 Image
const isBase64Image = (value) => {
  if (!value) return true;
  const base64Regex = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
  if (!base64Regex.test(value)) {
    throw new Error("Image URL must be a valid Base64 image data URI (e.g., data:image/png;base64,...).");
  }
  return true;
};

// --- API Endpoints ---

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // req.user akan berisi payload JWT (id, email, role) setelah middleware authenticate berjalan
  const userId = req.user.id; // Mengambil ID user dari token

  // Gunakan userService untuk mendapatkan detail user (bukan authService.getLoggedInUser)
  const userProfile = await userService.getUserById(userId);

  res.status(200).json({ message: 'Profil pengguna berhasil diambil!', data: userProfile });
}));

// PUT /auth/me - Memperbarui data profil user yang sedang login
router.put('/me', authenticate, [
  body('name').optional().isString().notEmpty().withMessage('Nama tidak boleh kosong.'),
  body('username').optional().isString().notEmpty().withMessage('Nama pengguna tidak boleh kosong.'),
  body('email').optional().isEmail().withMessage('Format email tidak valid.'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Format nomor telepon tidak valid.'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('dateOfBirth').optional().isISO8601().toDate().withMessage('Format tanggal lahir tidak valid (YYYY-MM-DD).'),
  body('kabupaten').optional().isString(),
  body('profinsi').optional().isString(),
  body('profileImageUrl').optional().custom(isBase64Image).withMessage('URL Gambar Profil tidak valid.'),
  // Penting: Pastikan user biasa TIDAK BISA mengubah role atau isVerified
  body('role').not().exists().withMessage('Peran (role) tidak dapat diubah melalui endpoint ini.'),
  body('isVerified').not().exists().withMessage('Status verifikasi tidak dapat diubah melalui endpoint ini.'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Ambil data yang diizinkan untuk diupdate oleh user biasa
  const allowedUpdates = [
    'name', 'username', 'email', 'phone', 'password', 'dateOfBirth',
    'kabupaten', 'profinsi', 'profileImageUrl'
  ];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) { // Hanya ambil field yang benar-benar ada di body
      updateData[key] = req.body[key];
    }
  }

  // Pastikan setidaknya ada satu field yang diupdate
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "Setidaknya satu field harus disediakan untuk pembaruan profil." });
  }

  // Panggil userService.updateUser dengan ID dari token user yang terautentikasi
  const updatedUser = await userService.updateUser(req.user.id, updateData);
  res.status(200).json({ message: 'Profil berhasil diperbarui!', data: updatedUser });
}));

// POST /auth/register
router.post(
  "/register",
  [
    body("name").isString().notEmpty().withMessage("Nama pengguna tidak boleh kosong."),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('username').notEmpty().withMessage('Username is required.'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Valid Indonesian phone number format is required (optional field).'),
    body('dateOfBirth').optional().isISO8601().toDate().withMessage('Invalid date of birth format (YYYY-MM-DD).'),
    body('kabupaten').optional().isString(),
    body('profinsi').optional().isString(),
    body("profileImageUrl").optional().custom(isBase64Image).withMessage('URL Gambar Profil tidak valid.'),
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
    const user = await authService.verifyOtp(req.body.email, req.body.otp); // verifyOtp sekarang mengembalikan user
    res.status(200).json({ message: "Account verified successfully!", data: user }); // Kirim user data
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
    res.status(200).json({
      message:
        "If the email is registered, a password reset link has been sent to your email.",
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
        "Password reset successfully. You can now log in with your new password.",
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

// Contoh rute yang hanya bisa diakses admin (tetap di sini)
router.get('/admin-dashboard', authenticate, authorize(['ADMIN']), async (req, res) => {
  res.status(200).json({ message: `Welcome, ${req.user.email}! This is the admin dashboard.` });
});

module.exports = router;