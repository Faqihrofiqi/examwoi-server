// src/routes/users/user.controller.js
const express = require('express');
const router = express.Router();
const userService = require('./user.service');
const { query, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints for User Management (Admin Only) ---

// GET /users - Get all users (Admin Only)
router.get('/', authenticate, authorize(['ADMIN']), [
    query('search').optional().isString().trim().escape().withMessage('Search term must be a string.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const users = await userService.getAllUsers(req.query.search);
    res.status(200).json({ message: 'Users retrieved successfully!', data: users });
}));

// GET /users/:id - Get user by ID (Admin Only)
router.get('/:id', authenticate, authorize(['ADMIN']), [
    param('id').isUUID().withMessage('Invalid User ID format.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ message: 'User retrieved successfully!', data: user });
}));

// DELETE /users/:id - Delete a user (Admin Only)
router.delete('/:id', authenticate, authorize(['ADMIN']), [
    param('id').isUUID().withMessage('Invalid User ID format.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const deletedUser = await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'User deleted successfully!', data: deletedUser });
}));

module.exports = router;