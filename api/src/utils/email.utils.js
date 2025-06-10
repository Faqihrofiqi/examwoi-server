// src/utils/email.utils.js
const nodemailer = require("nodemailer"); // Masih bisa digunakan jika mau fallback ke SMTP biasa
const fetch = require("node-fetch"); // Untuk melakukan HTTP request ke SMTP2GO API

// Karena kita akan menggunakan API SMTP2GO langsung dengan template, nodemailer bisa dipertimbangkan
// untuk dihapus atau digunakan sebagai fallback jika API gagal. Untuk simplisitas,
// kita fokus ke API SMTP2GO langsung.

/**
 * Sends an email with OTP using SMTP2GO API template.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} otp - The One-Time Password.
 * @param {string} templateId - The SMTP2GO Template ID.
 * @param {'VERIFICATION' | 'RESET_PASSWORD'} type - Type of email (for context/logging).
 */
async function sendOtpEmail(toEmail, otp, templateId, type) {
  const apiKey = process.env.SMTP2GO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;
  const productName = process.env.APP_NAME || "Examwoi App"; // Bisa ditambahkan APP_NAME di .env
  const confirmUrl = `${
    process.env.APP_URL
  }/auth/verify?email=${encodeURIComponent(toEmail)}&otp=${otp}`; // Contoh confirm URL
  const resetUrl = `${
    process.env.APP_URL
  }/auth/reset?email=${encodeURIComponent(toEmail)}&otp=${otp}`; // Contoh reset URL

  if (!apiKey) {
    const error = new Error("SMTP2GO API Key is not configured.");
    error.statusCode = 500;
    throw error;
  }
  if (!senderEmail) {
    const error = new Error("Sender email (EMAIL_FROM) is not configured.");
    error.statusCode = 500;
    throw error;
  }
  if (!templateId) {
    const error = new Error("Email template ID is missing.");
    error.statusCode = 500;
    throw error;
  }

  let templateData = {
    product_name: productName,
    otp_code: otp, // Nama variabel di template SMTP2GO mungkin 'otp_code' atau 'confirm_code'
  };

  // Tambahkan URL jika template membutuhkannya
  if (type === "VERIFICATION") {
    templateData.confirm_url = confirmUrl;
  } else if (type === "RESET_PASSWORD") {
    templateData.reset_url = resetUrl;
  }

  const payload = {
    api_key: apiKey,
    to: [toEmail],
    sender: senderEmail,
    template_id: templateId,
    template_data: templateData,
    // custom_headers: [ // Opsional
    //   { header: "Reply-To", value: senderEmail }
    // ]
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
        `SMTP2GO API Error (Status: ${response.status}):`,
        responseData
      );
      const error = new Error(
        `Failed to send email via SMTP2GO API: ${
          responseData.error_data || responseData.data.error || "Unknown error"
        }`
      );
      error.statusCode = response.status || 500;
      throw error;
    }

    console.log(
      `Email OTP (${type}) sent successfully to ${toEmail} via template ${templateId}`
    );
    // console.log('SMTP2GO Response:', responseData); // Untuk debugging
  } catch (error) {
    console.error(`Failed to send email OTP (${type}) to ${toEmail}:`, error);
    const err = new Error(
      `Network or API error sending email: ${error.message}`
    );
    err.statusCode = error.statusCode || 500;
    throw err;
  }
}

module.exports = {
  sendOtpEmail,
};
