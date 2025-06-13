// src/routes/appConfig/appConfig.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Retrieves a single app configuration by key.
 * @param {string} key - The unique key of the configuration.
 * @returns {Promise<object|null>} The config object or null if not found.
 */
async function getAppConfigByKey(key) {
    const config = await prisma.appConfig.findUnique({
        where: { key },
    }); 
    return config;
}

/**
 * Retrieves all app configurations.
 * @returns {Promise<Array<object>>} List of all configurations.
 */
async function getAllAppConfigs() {
    const configs = await prisma.appConfig.findMany();
    return configs;
}

/**
 * Creates a new app configuration.
 * @param {object} configData - Data for the new config (key, value, description, type).
 * @returns {Promise<object>} The created config.
 */
async function createAppConfig(configData) {
    const { key, value, description, type } = configData;
    const existingConfig = await prisma.appConfig.findUnique({ where: { key } });
    if (existingConfig) {
        const error = new Error(`AppConfig with key '${key}' already exists.`);
        error.statusCode = 409;
        throw error;
    }
    const config = await prisma.appConfig.create({
        data: { key, value, description, type }
    });
    return config;
}

/**
 * Updates an existing app configuration.
 * @param {string} key - The key of the config to update.
 * @param {object} updateData - Data to update (value, description, type).
 * @returns {Promise<object>} The updated config.
 */
async function updateAppConfig(key, updateData) {
    try {
        const updatedConfig = await prisma.appConfig.update({
            where: { key },
            data: updateData,
        });
        return updatedConfig;
    } catch (error) {
        if (error.code === 'P2025') { // Record not found
            const err = new Error(`AppConfig with key '${key}' not found.`);
            err.statusCode = 404;
            throw err;
        }
        throw error;
    }
}

/**
 * Deletes an app configuration by key.
 * @param {string} key - The key of the config to delete.
 * @returns {Promise<object>} The deleted config.
 */
async function deleteAppConfig(key) {
    try {
        const deletedConfig = await prisma.appConfig.delete({
            where: { key }
        });
        return deletedConfig;
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error(`AppConfig with key '${key}' not found.`);
            err.statusCode = 404;
            throw err;
        }
        throw error;
    }
}

module.exports = {
    getAppConfigByKey,
    getAllAppConfigs,
    createAppConfig,
    updateAppConfig,
    deleteAppConfig,
};