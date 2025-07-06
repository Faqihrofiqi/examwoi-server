// src/routes/users/user.controller.js
const express = require('express');
const router = express.Router();
const userService = require('./user.service');
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Custom validator untuk Base64 Image (bisa di-extract ke common util jika belum)
const isBase64Image = (value) => {
    if (!value) return true;
    const base64Regex = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
    if (!base64Regex.test(value)) {
        throw new Error('URL Gambar harus berupa Base64 Data URI gambar yang valid.');
    }
    return true;
};

// GET /users - Get all users (Admin Only)
router.get('/', authenticate), 
    asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const users = await userService.getAllUsers(req.query.search);
    res.status(200).json({ message: 'Pengguna berhasil diambil!', data: users });
})

// GET /users/:id - Get user by ID (Admin Only)
router.get('/:id', authenticate, authorize(['ADMIN']), [
    param('id').isUUID().withMessage('ID Pengguna tidak valid.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ message: 'Detail pengguna berhasil diambil!', data: user });
}));

// PUT /users/:id - Update a user (Admin Only)
router.put('/:id', authenticate, authorize(['ADMIN']), [
    param('id').isUUID().withMessage('ID Pengguna tidak valid.'),
    body('username').optional().isString().notEmpty().withMessage('Nama pengguna tidak boleh kosong.'),
    body('email').optional().isEmail().withMessage('Format email tidak valid.'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Format nomor telepon tidak valid.'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
    body('role').optional().isIn(['ADMIN', 'TEACHER', 'STUDENT']).withMessage('Peran (role) tidak valid.'),
    body('isVerified').optional().isBoolean().withMessage('Status verifikasi harus boolean.'),
    body('dateOfBirth').optional().isISO8601().toDate().withMessage('Format tanggal lahir tidak valid (YYYY-MM-DD).'),
    body('kabupaten').optional().isString(),
    body('profinsi').optional().isString(),
    body('profileImageUrl').optional().custom(isBase64Image).withMessage('URL Gambar Profil tidak valid.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Tidak bisa mengubah ID pengguna itu sendiri
    const { id, ...updateData } = req.body;
    const updatedUser = await userService.updateUser(req.params.id, updateData);
    res.status(200).json({ message: 'Pengguna berhasil diperbarui!', data: updatedUser });
}));

// DELETE /users/:id - Delete a user (Admin Only)
router.delete('/:id', authenticate, authorize(['ADMIN']), [
    param('id').isUUID().withMessage('ID Pengguna tidak valid.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const deletedUser = await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'Pengguna berhasil dihapus!', data: deletedUser });
}));

module.exports = router;