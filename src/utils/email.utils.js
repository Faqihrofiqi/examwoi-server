// src/utils/email.utils.js
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

// Fungsi internal untuk mengirim email menggunakan SMTP2GO API template.
async function _sendEmailApi(toEmail, templateId, templateData, typeForLog) {
  const apiKey = process.env.SMTP2GO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;

  if (!apiKey) {
    const error = new Error("SMTP2GO API Key tidak dikonfigurasi.");
    error.statusCode = 500;
    throw error;
  }
  if (!senderEmail) {
    const error = new Error("Email pengirim (EMAIL_FROM) tidak dikonfigurasi.");
    error.statusCode = 500;
    throw error;
  }
  if (!templateId) {
    const error = new Error("ID template email tidak ditemukan.");
    error.statusCode = 500;
    throw error;
  }

  const payload = {
    api_key: apiKey,
    to: [toEmail],
    sender: senderEmail,
    template_id: templateId,
    template_data: templateData, // templateData sudah disiapkan di fungsi pemanggil
  };

  try {
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.error) {
      console.error(
        `SMTP2GO API Error (${typeForLog}, Status: ${response.status}):`,
        responseData
      );
      const error = new Error(
        `Gagal mengirim email ${typeForLog} via SMTP2GO API: ${responseData.error_data || responseData.data?.error || "Unknown error"
        }`
      );
      error.statusCode = response.status || 500;
      throw error;
    }

    console.log(
      `Email ${typeForLog} berhasil dikirim ke ${toEmail} via template ${templateId}`
    );
  } catch (error) {
    console.error(`Gagal mengirim email ${typeForLog} ke ${toEmail}:`, error);
    const err = new Error(`Kesalahan jaringan atau API saat mengirim email: ${error.message}`);
    err.statusCode = error.statusCode || 500;
    throw err;
  }
}

/**
 * Mengirim email verifikasi akun dengan OTP dan link konfirmasi.
 * @param {string} toEmail - Alamat email penerima.
 * @param {string} otpCode - Kode OTP untuk verifikasi.
 * @param {string} verificationUrl - URL untuk konfirmasi verifikasi (akan diklik user).
 */
async function sendVerificationEmail(toEmail, otpCode, verificationUrl) {
  const templateId = process.env.EMAIL_VERIFICATION_TEMPLATE_ID;
  const productName = process.env.APP_NAME || "Examwoi App";
  const otpValidityHours = process.env.OTP_VALIDITY_HOURS || 24;

  if (!templateId) {
    const error = new Error("EMAIL_VERIFICATION_TEMPLATE_ID tidak dikonfigurasi.");
    error.statusCode = 500;
    throw error;
  }

  const templateData = {
    product_name: productName,
    confirm_url: verificationUrl, // Sesuai dengan "confirm_url" di cURL
    otp: otpCode, // Sesuai dengan "otp" di cURL
    otp_validity_hours: otpValidityHours,
  };

  await _sendEmailApi(toEmail, templateId, templateData, 'VERIFICATION');
}

/**
 * Mengirim email reset password dengan OTP dan link reset.
 * @param {string} toEmail - Alamat email penerima.
 * @param {string} otpCode - Kode OTP untuk reset password.
 * @param {string} resetUrl - URL untuk halaman reset password (akan diklik user).
 */
async function sendResetPasswordEmail(toEmail, otpCode, resetUrl) {
  const templateId = process.env.EMAIL_RESET_TEMPLATE_ID;
  const productName = process.env.APP_NAME || "Examwoi App";
  const otpValidityHours = process.env.OTP_VALIDITY_HOURS || 24;

  if (!templateId) {
    const error = new Error("EMAIL_RESET_TEMPLATE_ID tidak dikonfigurasi.");
    error.statusCode = 500;
    throw error;
  }

  const templateData = {
    product_name: productName,
    reset_url: resetUrl, // Sesuai dengan "reset_url" di cURL
    otp_code: otpCode, // Tambahkan ini jika template reset juga menampilkan OTP
    otp_validity_hours: otpValidityHours,
  };

  await _sendEmailApi(toEmail, templateId, templateData, 'RESET_PASSWORD');
}

/**
 * Mengirim email OTP generik.
 * @param {string} toEmail - Alamat email penerima.
 * @param {string} otpCode - Kode OTP.
 */
async function sendGenericOtpEmail(toEmail, otpCode) {
  const templateId = process.env.EMAIL_GENERIC_OTP_TEMPLATE_ID || process.env.EMAIL_VERIFICATION_TEMPLATE_ID;
  const productName = process.env.APP_NAME || "Examwoi App";
  const otpValidityHours = process.env.OTP_VALIDITY_HOURS || 24;

  if (!templateId) {
    const error = new Error("EMAIL_GENERIC_OTP_TEMPLATE_ID tidak dikonfigurasi.");
    error.statusCode = 500;
    throw error;
  }

  const templateData = {
    product_name: productName,
    otp_code: otpCode,
    otp_validity_hours: otpValidityHours
  };

  await _sendEmailApi(toEmail, templateId, templateData, 'GENERIC_OTP');
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendGenericOtpEmail,
};