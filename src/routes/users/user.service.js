// src/routes/users/user.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

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
            profileImageUrl: true, // Untuk ditampilkan jika perlu
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
            name: true,
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
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return user;
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

        // Potentially delete exam progress records for this user as well
        // await prisma.examProgress.deleteMany({ where: { userId } });

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });
        return deletedUser;
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error code for record not found
            const err = new Error('User not found for deletion.');
            err.statusCode = 404;
            throw err;
        }
        // Handle other potential foreign key constraints if user has related data (e.g., questions they created)
        if (error.code === 'P2003') {
            const err = new Error('Cannot delete user because they have associated records (e.g., exam progress, created questions). Please remove those first.');
            err.statusCode = 400; // Bad Request
            throw err;
        }
        throw error;
    }
}

// Tambahkan fungsi update user jika diperlukan nanti
//
async function updateUser(userId, updateData) {
  const { email, username, password, currentPassword, ...otherData } = updateData;

  try {
    // === 1. VALIDASI KEUNIKAN (EMAIL & USERNAME) ===
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        const err = new Error("Email is already taken.");
        err.statusCode = 409; // Conflict
        throw err;
      }
    }
    // (Anda bisa menambahkan logika serupa untuk 'username' jika unik)

    // === 2. VALIDASI & HASHING PASSWORD ===
    if (password) {
      // Wajibkan ada 'currentPassword' jika ingin ganti password baru
      if (!currentPassword) {
        const err = new Error("Current password is required to set a new one.");
        err.statusCode = 400; // Bad Request
        throw err;
      }

      // Ambil data user dari DB untuk membandingkan password lama
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        const err = new Error('User not found.');
        err.statusCode = 404;
        throw err;
      }
      
      // Bandingkan password lama yang diberikan dengan hash di DB
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        const err = new Error("Incorrect current password.");
        err.statusCode = 401; // Unauthorized
        throw err;
      }

      // Jika cocok, baru hash password yang baru
      otherData.password = await bcrypt.hash(password, 10);
    }
    
    // Siapkan data final untuk di-update
    const dataToUpdate = {
      ...otherData,
      email,
      username,
    };

    // === 3. EKSEKUSI UPDATE & KEMBALIKAN DATA AMAN ===
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });
    
    // Hapus field password dari response sebelum dikirim ke klien
    delete updatedUser.password;

    return updatedUser;
    
  } catch (error) {
    // Tangani error jika user tidak ditemukan saat update (fallback)
    if (error.code === 'P2025') {
      const err = new Error('User not found for update.');
      err.statusCode = 404;
      throw err;
    }
    // Lemparkan kembali error lain (termasuk error validasi yang kita buat)
    throw error;
  }
}

module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUser,
};