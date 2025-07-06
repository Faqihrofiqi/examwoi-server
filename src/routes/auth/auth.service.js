const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require("../../utils/password.utils");
// --- Perubahan di sini: Impor fungsi email yang spesifik ---
const { sendVerificationEmail, sendResetPasswordEmail } = require("../../utils/email.utils");
const jwt = require("jsonwebtoken");

// Variabel Lingkungan untuk JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION;

const OTP_VALIDITY_HOURS = 24; // OTP valid for 24 hours
const OTP_RATE_LIMIT_DAILY = 3; // Max 3 OTP requests per identifier per day
const OTP_COOLDOWN_SECONDS = 60 * 5; // Cooldown for 5 minutes (300 seconds) between requests

/**
 * Generates a random 6-digit OTP.
 * @returns {string} The OTP.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends Access and Refresh Tokens.
 * @param {object} payload - The JWT payload (e.g., { id, email, role }).
 * @returns {Promise<object>} Object containing accessToken and refreshToken.
 */
async function generateAuthTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
  return { accessToken, refreshToken };
}

/**
 * Handles user registration and sends OTP via Email.
 * @param {object} userData - User registration data.
 * @returns {Promise<object>} Created user data (excluding password).
 */
async function registerUser(userData) {
  const {
    name,
    email,
    password,
    username,
    phone,
    dateOfBirth,
    kabupaten,
    profinsi,
    referralCode,
  } = userData;

  const existingEmailUser = await prisma.user.findUnique({ where: { email } });
  if (existingEmailUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409; // Conflict
    throw error;
  }

  if (phone) {
    const existingPhoneUser = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhoneUser) {
      const error = new Error("Phone number already registered.");
      error.statusCode = 409; // Conflict
      throw error;
    }
  }

  const hashedPassword = await hashPassword(password);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_VALIDITY_HOURS * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      username,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      kabupaten,
      profinsi,
      referralCode,
      otp,
      otpExpiry,
      isVerified: false,
      lastOtpRequest: new Date(),
      otpAttempts: 1,
    },
    select: {
      id: true,
      email: true,
      username: true,
      isVerified: true,
      role: true,
    },
  });

  // --- Perubahan di sini: Panggil sendVerificationEmail ---
  const verificationTemplateId = process.env.EMAIL_VERIFICATION_TEMPLATE_ID;
  if (!verificationTemplateId) {
    await prisma.user.delete({ where: { id: user.id } });
    const error = new Error("Email verification template ID is not configured.");
    error.statusCode = 500;
    throw error;
  }
  const verificationUrl = `${process.env.APP_URL}/verify?email=${encodeURIComponent(user.email)}&otp=${otp}`;

  try {
    await sendVerificationEmail(user.email, otp, verificationUrl);
  } catch (emailError) {
    await prisma.user.delete({ where: { id: user.id } });
    console.error(
      `Failed to send verification email during registration: ${emailError.message}`
    );
    const error = new Error(
      `Failed to send verification email. ${emailError.message}`
    );
    error.statusCode = emailError.statusCode || 500;
    throw error;
  }

  await prisma.otpRequestLog.create({
    data: {
      identifier: user.email,
      type: "EMAIL_OTP",
      userId: user.id,
    },
  });

  return user;
}

/**
 * Handles OTP verification.
 * @param {string} email - User's email.
 * @param {string} submittedOtp - OTP submitted by user.
 * @returns {Promise<object>} User info object if verification successful.
 */
async function verifyOtp(email, submittedOtp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  if (user.isVerified) {
    const error = new Error("Account already verified.");
    error.statusCode = 400;
    throw error;
  }
  if (!user.otp || !user.otpExpiry) {
    const error = new Error(
      "No OTP generated for this account or it has expired. Please request a new one."
    );
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > user.otpExpiry) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
        lastOtpRequest: null,
      },
    });
    const error = new Error("OTP has expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  if (user.otp !== submittedOtp) {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
      lastOtpRequest: null,
    },
    select: { id: true, email: true, username: true, role: true, isVerified: true } // Mengembalikan data user yang terverifikasi
  });

  return updatedUser;
}

/**
 * Handles user login and generates JWTs.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Access token, Refresh token, and user info.
 */
async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }
  // --- Perubahan di sini: Pesan spesifik untuk akun belum terverifikasi ---
  if (!user.isVerified) {
    const error = new Error("Akun belum terverifikasi. OTP telah dikirim ulang ke email Anda.");
    error.statusCode = 401; // Unauthorized
    error.isVerified = false; // Flag kustom untuk frontend

    // Kirim ulang OTP jika user mencoba login akun belum terverifikasi
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_VALIDITY_HOURS * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry, lastOtpRequest: new Date(), otpAttempts: (user.otpAttempts || 0) + 1 }
    });
    const verificationUrl = `${process.env.APP_URL}/verify?email=${encodeURIComponent(user.email)}&otp=${otp}`;
    try {
      await sendVerificationEmail(user.email, otp, verificationUrl); // <-- Panggil sendVerificationEmail
    } catch (emailError) {
      console.error(`Gagal mengirim ulang email verifikasi saat login: ${emailError.message}`);
      // Jangan throw error ke user, karena mereka sudah dapat pesan unauthorized
    }
    throw error; // Tetap throw error agar login tidak berhasil
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const { accessToken, refreshToken } = await generateAuthTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      profileImageUrl: user.profileImageUrl || null, 
    },
  };
}

/**
 * Handles forgotten password request by sending OTP via Email with a reset link.
 * @param {string} email - User's email address.
 * @returns {Promise<boolean>} True if OTP sent successfully.
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const otpLogsToday = await prisma.otpRequestLog.count({
    where: {
      identifier: email,
      createdAt: { gte: today },
      type: "EMAIL_OTP",
    },
  });

  if (otpLogsToday >= OTP_RATE_LIMIT_DAILY) {
    const error = new Error(
      `Anda telah melampaui batas permintaan OTP harian (${OTP_RATE_LIMIT_DAILY} kali).`
    );
    error.statusCode = 429;
    throw error;
  }

  if (
    user.lastOtpRequest &&
    Date.now() - user.lastOtpRequest.getTime() < OTP_COOLDOWN_SECONDS * 1000
  ) {
    const remainingTime = Math.ceil(
      (OTP_COOLDOWN_SECONDS * 1000 -
        (Date.now() - user.lastOtpRequest.getTime())) /
      1000
    );
    const error = new Error(
      `Harap tunggu ${remainingTime} detik sebelum meminta OTP lagi.`
    );
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_VALIDITY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
      lastOtpRequest: new Date(),
      otpAttempts: { increment: 1 },
    },
  });

  // --- Perubahan di sini: Panggil sendResetPasswordEmail ---
  const resetUrl = `${process.env.APP_URL}/reset-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;
  try {
    await sendResetPasswordEmail(user.email, otp, resetUrl);
  } catch (emailError) {
    console.error(`Gagal mengirim email reset password: ${emailError.message}`);
    const error = new Error(
      `Gagal mengirim email reset password. ${emailError.message}`
    );
    error.statusCode = emailError.statusCode || 500;
    throw error;
  }

  await prisma.otpRequestLog.create({
    data: {
      identifier: user.email,
      type: "EMAIL_OTP",
      userId: user.id,
    },
  });

  return true;
}

/**
 * Handles password reset using OTP.
 * @param {string} email - User's email.
 * @param {string} newPassword - New password.
 * @param {string} submittedOtp - OTP submitted by user.
 * @returns {Promise<boolean>} True if password reset successful.
 */
async function resetPassword(email, newPassword, submittedOtp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404; // Not Found
    throw error;
  }
  if (!user.otp || !user.otpExpiry) {
    const error = new Error(
      "No OTP generated for this account or it has expired. Please request a new one."
    );
    error.statusCode = 400; // Bad Request
    throw error;
  }

  // Check OTP validity time
  if (new Date() > user.otpExpiry) {
    // Clear OTP details if expired
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
        lastOtpRequest: null,
      },
    });
    const error = new Error("OTP has expired. Please request a new one.");
    error.statusCode = 400; // Bad Request
    throw error;
  }

  // Compare OTP
  if (user.otp !== submittedOtp) {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400; // Bad Request
    throw error;
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null, // Clear OTP after successful reset
      otpExpiry: null,
      otpAttempts: 0,
      lastOtpRequest: null,
      refreshToken: null, // Invalidate refresh token for security after password reset
    },
  });

  return true;
}

/**
 * Handles refreshing access token using refresh token.
 * @param {string} refreshToken - The refresh token from client.
 * @returns {Promise<object>} New access token.
 */
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      const error = new Error("Invalid or revoked refresh token.");
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const { accessToken } = await generateAuthTokens(payload); // Hanya perlu access token baru

    return { accessToken };
  } catch (err) {
    console.error("Refresh token error:", err.message);
    const error = new Error(
      "Invalid or expired refresh token. Please log in again."
    );
    error.statusCode = 401; // Unauthorized
    throw error;
  }
}
async function getLoggedInUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      id: true,
      email: true,
      username: true,
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

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getLoggedInUser
};