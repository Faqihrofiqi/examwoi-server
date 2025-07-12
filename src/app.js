require("dotenv").config();
const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const apiKeyMiddleware = require("./middleware/apiKey.middleware");

const prisma = new PrismaClient();
app.set("prisma", prisma);

// Middleware untuk logging (disarankan untuk diletakkan di atas)
app.use(morgan('combined'));

// --- Konfigurasi CORS yang Sudah Diperbaiki ---
const allowedOrigins = [
  // Tambahkan semua origin yang Anda izinkan di sini.
  // Regex bisa digunakan untuk port dinamis Flutter web, misal: /^http:\/\/localhost:\d+$/
  'https://examwoi-server-frontend.vercel.app',
  'https://examwoi.vercel.app',
  'http://147.139.243.222:3000',
  'http://localhost:3001',
  'http://localhost:3000',
];

const corsOptions = {
  // Opsi 'origin' menggunakan fungsi untuk validasi yang lebih kuat
  origin: (origin, callback) => {
    // Izinkan requests tanpa 'origin' (seperti dari aplikasi mobile atau Postman)
    if (!origin) return callback(null, true);

    // Periksa apakah origin yang masuk ada di dalam daftar yang diizinkan
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Jika tidak, tolak permintaan dengan error CORS
      console.warn(`CORS: Origin ${origin} diblokir oleh kebijakan.`);
      callback(new Error('Origin ini tidak diizinkan oleh kebijakan CORS.'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  // Header yang diizinkan untuk dibawa oleh klien
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204, // Untuk pre-flight requests
};

// Terapkan middleware CORS dengan konfigurasi di atas
app.use(cors(corsOptions));

// Middleware lain setelah CORS
app.use(apiKeyMiddleware);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// --- Router Utama ---
const apiRouter = require("./routes");
app.use(`/${process.env.API_VERSION}`, apiRouter); // Menggunakan /v1 sebagai versi API

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Examwoi Backend API is running!",
  });
});

// --- Global Error Handler ---
// Ini akan menangkap semua error yang dilempar dari rute Anda
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack untuk debugging
  res.status(err.statusCode || 500).json({
    message: err.message || "An unexpected error occurred.",
    error: err.name || "InternalServerError",
  });
});

// Hook untuk memastikan koneksi Prisma ditutup dengan baik saat aplikasi berhenti
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Prisma client disconnected.");
});

module.exports = app;
