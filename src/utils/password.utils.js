// src/utils/password.utils.js
const bcrypt = require("bcryptjs");

const saltRounds = 10; // Jumlah putaran untuk hashing. Semakin tinggi, semakin aman, tapi semakin lambat. 10-12 adalah nilai umum.

/**
 * Hashes a plaintext password.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password.
 */ 
async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plaintext password with a hashed password.
 * @param {string} plaintextPassword - The plaintext password.
 * @param {string} hashedPassword - The hashed password from the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
async function comparePassword(plaintextPassword, hashedPassword) {
  return bcrypt.compare(plaintextPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
