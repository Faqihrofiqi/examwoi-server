// src/routes/users/user.service.js
const { PrismaClient, Role } = require('@prisma/client'); // Import Role enum jika digunakan untuk validasi role
const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require('../../utils/password.utils'); // Untuk update password jika ada

/**
 * Retrieves all users with optional search filter.
 * @param {string} searchTerm - Optional term to search by username, email, or phone.
 * @returns {Promise<Array<object>>} List of users.
 */
async function getAllUsers(searchTerm = '') {
    const where = {};
    if (searchTerm) {
        where.OR = [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    const users = await prisma.user.findMany({
        where,
        select: { // Pilih hanya field yang relevan untuk dashboard admin
            id: true,
            username: true,
            email: true,
            phone: true,
            role: true,
            isVerified: true,
            dateOfBirth: true,
            kabupaten: true,
            profinsi: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return users;
}

/**
 * Retrieves a single user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
async function getUserById(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            role: true,
            isVerified: true,
            dateOfBirth: true,
            kabupaten: true,
            profinsi: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        const error = new Error('Pengguna tidak ditemukan.');
        error.statusCode = 404;
        throw error;
    }
    return user;
}

/**
 * Updates an existing user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Data to update the user (e.g., username, email, phone, role, password, profileImageUrl, etc.).
 * @returns {Promise<object>} The updated user.
 */
async function updateUser(userId, updateData) {
    const { password, email, phone, ...otherUpdateData } = updateData;

    // Pastikan user ada
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
        const error = new Error('Pengguna tidak ditemukan untuk diperbarui.');
        error.statusCode = 404;
        throw error;
    }

    // Handle password update if provided
    if (password) {
        otherUpdateData.password = await hashPassword(password);
    }

    // Handle email update (check for uniqueness if different from current)
    if (email && email !== existingUser.email) {
        const existingEmailUser = await prisma.user.findUnique({ where: { email } });
        if (existingEmailUser) {
            const error = new Error('Email sudah terdaftar untuk pengguna lain.');
            error.statusCode = 409;
            throw error;
        }
    }

    // Handle phone update (check for uniqueness if different from current)
    if (phone && phone !== existingUser.phone) {
        const existingPhoneUser = await prisma.user.findUnique({ where: { phone } });
        if (existingPhoneUser) {
            const error = new Error('Nomor telepon sudah terdaftar untuk pengguna lain.');
            error.statusCode = 409;
            throw error;
        }
    }

    // Validasi role jika ada perubahan
    if (otherUpdateData.role && !Object.values(Role).includes(otherUpdateData.role)) {
        const error = new Error('Peran (role) yang tidak valid.');
        error.statusCode = 400;
        throw error;
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...otherUpdateData,
                email, // Include email and phone explicitly if they were part of updateData
                phone,
            },
            select: { // Pilih field yang akan dikembalikan
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                isVerified: true,
                dateOfBirth: true,
                kabupaten: true,
                profinsi: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return updatedUser;
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error code for record not found
            const err = new Error('Pengguna tidak ditemukan untuk diperbarui.');
            err.statusCode = 404;
            throw err;
        }
        throw error; // Re-throw other errors
    }
}

/**
 * Deletes a user by ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<object>} The deleted user.
 */
async function deleteUser(userId) {
    try {
        // Delete related OTP logs first to avoid foreign key constraints
        await prisma.otpRequestLog.deleteMany({ where: { userId } });

        // Delete exam progress records for this user (assuming cascade delete is not set for ExamProgress on User)
        await prisma.examProgress.deleteMany({ where: { userId } });

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });
        return deletedUser;
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error code for record not found
            const err = new Error('Pengguna tidak ditemukan untuk penghapusan.');
            err.statusCode = 404;
            throw err;
        }
        // Handle other potential foreign key constraints if user has related data (e.g., questions they created)
        if (error.code === 'P2003') {
            const err = new Error('Tidak dapat menghapus pengguna karena memiliki catatan terkait (misalnya, soal yang dibuat). Harap hapus terlebih dahulu.');
            err.statusCode = 400;
            throw err;
        }
        throw error;
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};