const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require("../../utils/password.utils");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../../utils/email.utils");
const jwt = require("jsonwebtoken");

// Variabel Lingkungan untuk JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION;

const OTP_VALIDITY_HOURS = 24;
const OTP_RATE_LIMIT_DAILY = 3;
const OTP_COOLDOWN_SECONDS = 60 * 5;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateAuthTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
  return { accessToken, refreshToken };
}

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
    profileImageUrl, // <-- 1. TAMBAHKAN DI SINI
  } = userData;

  const existingEmailUser = await prisma.user.findUnique({ where: { email } });
  if (existingEmailUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }

  if (phone) {
    const existingPhoneUser = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhoneUser) {
      const error = new Error("Phone number already registered.");
      error.statusCode = 409;
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
      profileImageUrl, // <-- 2. TAMBAHKAN DI SINI
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

  // ... (sisa fungsi untuk mengirim email tetap sama)
  const verificationTemplateId = process.env.EMAIL_VERIFICATION_TEMPLATE_ID;
  if (!verificationTemplateId) {
    await prisma.user.delete({ where: { id: user.id } });
    const error = new Error("Email verification template ID is not configured.");
    error.statusCode = 500;
    throw error;
  }
  const verificationUrl = `${process.env.APP_URL}/verify?email=${encodeURIComponent(
    user.email
  )}&otp=${otp}`;

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
    select: { id: true, email: true, username: true, role: true, isVerified: true }
  });

  return updatedUser;
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }
  // --- Perubahan di sini: Pesan spesifik untuk akun belum terverifikasi (tanpa kirim ulang email otomatis) ---
  if (!user.isVerified) {
    // Hapus blok kode yang secara otomatis mengirim OTP dan mengupdate user di DB.
    // Frontend akan bertanggung jawab untuk meminta pengiriman ulang OTP jika diperlukan.
    const error = new Error("Akun belum diverifikasi. Silakan verifikasi email Anda.");
    error.statusCode = 401; // Unauthorized
    error.isVerified = false; // Flag kustom untuk frontend
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

async function resetPassword(email, newPassword, submittedOtp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
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

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
      lastOtpRequest: null,
      refreshToken: null,
    },
  });

  return true;
}

async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      const error = new Error("Invalid or revoked refresh token.");
      error.statusCode = 401;
      throw error;
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const { accessToken } = await generateAuthTokens(payload);

    return { accessToken };
  } catch (err) {
    console.error("Refresh token error:", err.message);
    const error = new Error(
      "Invalid or expired refresh token. Please log in again."
    );
    error.statusCode = 401;
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