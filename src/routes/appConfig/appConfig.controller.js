// src/routes/appConfig/appConfig.controller.js
const express = require('express');
const router = express.Router();
const appConfigService = require('./appConfig.service');
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Custom validator for Base64 Image (reuse from auth.controller.js or extract to a common util)
// For now, let's copy it here for simplicity, but best practice is to make it a common util.
const isBase64Image = (value) => {
    if (!value) return true;
    const base64Regex = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
    if (!base64Regex.test(value)) {
        throw new Error('Image URL must be a valid Base64 image data URI (e.g., data:image/png;base64,...).');
    }
    return true;
};

// --- API Endpoints for AppConfig (Admin Only) ---

// GET /app-configs - Get all configurations (Admin Only)
router.get('/', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const configs = await appConfigService.getAllAppConfigs();
    res.status(200).json({ message: 'App configurations retrieved successfully!', data: configs });
}));

// GET /app-configs/:key - Get a single configuration by key (Public, for frontend consumption)
router.get('/:key', asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const config = await appConfigService.getAppConfigByKey(req.params.key);
    if (!config) {
        return res.status(404).json({ message: `AppConfig with key '${req.params.key}' not found.` });
    }
    res.status(200).json({ message: 'App configuration retrieved successfully!', data: config });
}));

// POST /app-configs - Create a new configuration (Admin Only)
router.post('/', authenticate, authorize(['ADMIN']), [
    body('key').notEmpty().withMessage('Config key is required.'),
    body('value').notEmpty().withMessage('Config value is required.'),
    body('description').optional().isString(),
    body('type').optional().isIn(['TEXT', 'IMAGE_URL', 'COLOR']).withMessage('Invalid config type.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Specific validation for IMAGE_URL type: value must be Base64
    if (req.body.type === 'IMAGE_URL') {
        const valueErrors = validationResult({ value: req.body.value }); // Validate value as if it's an image
        if (!isBase64Image(req.body.value)) { // Manual check using custom validator
            return res.status(400).json({ message: 'Value for IMAGE_URL type must be a valid Base64 image data URI.' });
        }
    }

    const newConfig = await appConfigService.createAppConfig(req.body);
    res.status(201).json({ message: 'App configuration created successfully!', data: newConfig });
}));

// PUT /app-configs/:key - Update an existing configuration (Admin Only)
router.put('/:key', authenticate, authorize(['ADMIN']), [
    param('key').notEmpty().withMessage('Config key is required.'),
    body('value').optional().notEmpty().withMessage('Config value cannot be empty.'),
    body('description').optional().isString(),
    body('type').optional().isIn(['TEXT', 'IMAGE_URL', 'COLOR']).withMessage('Invalid config type.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Specific validation for IMAGE_URL type on update
    if (req.body.type === 'IMAGE_URL' && req.body.value) {
        if (!isBase64Image(req.body.value)) {
            return res.status(400).json({ message: 'Value for IMAGE_URL type must be a valid Base64 image data URI.' });
        }
    }

    const updatedConfig = await appConfigService.updateAppConfig(req.params.key, req.body);
    res.status(200).json({ message: 'App configuration updated successfully!', data: updatedConfig });
}));

// DELETE /app-configs/:key - Delete a configuration (Admin Only)
router.delete('/:key', authenticate, authorize(['ADMIN']), [
    param('key').notEmpty().withMessage('Config key is required.'),
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const deletedConfig = await appConfigService.deleteAppConfig(req.params.key);
    res.status(200).json({ message: 'App configuration deleted successfully!', data: deletedConfig });
}));

module.exports = router;