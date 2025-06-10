const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require("../../utils/password.utils");
const { sendOtpEmail } = require("../../utils/email.utils"); // Menggunakan fungsi email yang sudah direvisi
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
    email,
    password,
    username,
    phone,
    dateOfBirth,
    kabupaten,
    profinsi,
    referralCode,
  } = userData;

  // Cek duplikasi email dan phone dalam satu query (atau terpisah untuk pesan error spesifik)
  // Ini memastikan tidak ada data yang disimpan jika salah satu sudah terdaftar
  const existingEmailUser = await prisma.user.findUnique({ where: { email } });
  if (existingEmailUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Hanya cek phone jika phone disediakan
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

  // Buat user
  const user = await prisma.user.create({
    data: {
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
      lastOtpRequest: new Date(), // Set initial request time saat user dibuat
      otpAttempts: 1, // First attempt saat user dibuat
    },
    select: {
      id: true,
      email: true,
      username: true,
      isVerified: true,
      role: true,
    },
  });

  // Kirim OTP via Email
  // Template ID untuk verifikasi akun
  const verificationTemplateId = process.env.EMAIL_VERIFICATION_TEMPLATE_ID;
  if (!verificationTemplateId) {
    // Jika template ID tidak ada, hapus user yang baru dibuat
    await prisma.user.delete({ where: { id: user.id } });
    const error = new Error(
      "Email verification template ID is not configured."
    );
    error.statusCode = 500;
    throw error;
  }

  try {
    await sendOtpEmail(user.email, otp, verificationTemplateId, "VERIFICATION");
  } catch (emailError) {
    // Jika gagal kirim email, hapus user yang baru dibuat agar tidak ada data tersimpan
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

  // Log the OTP request for rate limiting
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
 * @returns {Promise<boolean>} True if verification successful.
 */
async function verifyOtp(email, submittedOtp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404; // Not Found
    throw error;
  }
  if (user.isVerified) {
    const error = new Error("Account already verified.");
    error.statusCode = 400; // Bad Request
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

  // OTP is valid, verify user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
      lastOtpRequest: null,
    }, // Clear OTP after successful verification
  });

  return true;
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
    error.statusCode = 401; // Unauthorized
    throw error;
  }
  if (!user.isVerified) {
    const error = new Error(
      "Account not verified. Please verify your email first."
    );
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const { accessToken, refreshToken } = await generateAuthTokens(payload);

  // Store refresh token in DB
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
    },
  };
}
/**
 * Handles forgotten password request by sending OTP via Email.
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

  // --- Rate Limiting for OTP Request ---
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
      `You have exceeded the daily OTP request limit (${OTP_RATE_LIMIT_DAILY} times).`
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
      `Please wait ${remainingTime} seconds before requesting another OTP.`
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

  // Kirim OTP via Email untuk reset password
  // Template ID untuk reset password
  const resetTemplateId = process.env.EMAIL_RESET_TEMPLATE_ID;
  if (!resetTemplateId) {
    const error = new Error("Email reset template ID is not configured.");
    error.statusCode = 500;
    throw error;
  }

  try {
    await sendOtpEmail(user.email, otp, resetTemplateId, "RESET_PASSWORD");
  } catch (emailError) {
    console.error(`Failed to send reset email: ${emailError.message}`);
    const error = new Error(
      `Failed to send reset email. ${emailError.message}`
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
    select: { // Pilih field yang relevan untuk profil
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
