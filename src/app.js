// src/app.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const app = express();
const morgan = require('morgan');
const apiKeyMiddleware = require('./middleware/apiKey.middleware');

const prisma = new PrismaClient();
app.set("prisma", prisma);

app.use(morgan('combined', )); 

// --- Konfigurasi CORS ---
// Cara Paling Sederhana (Izinkan semua origin - TIDAK DIREKOMENDASIKAN UNTUK PRODUKSI)
// app.use(cors());

// Cara yang Direkomendasikan (Izinkan hanya origin spesifik)
const allowedOrigins = [
  'http://localhost:63847/',
  'https://examwoi-server-frontend.vercel.app',
  'http://147.139.243.222:3000',
  'http://localhost:3001', // Frontend React di development
  'http://localhost:3000', // Jika ada bagian frontend yang dilayani di port yang sama
  // Tambahkan domain lain yang Anda izinkan secara spesifik di sini
];

const corsOptions = {
  origins: allowedOrigins,
  // origin: (origin, callback) => {
  //   // Izinkan requests tanpa origin (misal: mobile apps, file://)
  //   if (!origin) return callback(null, true);

  //   // Periksa apakah origin ada di daftar allowedOrigins
  //   const isAllowed = allowedOrigins.some(allowedOrigin => {
  //     if (typeof allowedOrigin === 'string') {
  //       return allowedOrigin === origin;
  //     }
  //     // Jika allowedOrigin adalah regex, test origin
  //     return allowedOrigin.test(origin);
  //   });

  //   if (isAllowed) {
  //     callback(null, true);
  //   } else {
  //     console.warn(`CORS: Origin ${origin} diblokir oleh kebijakan CORS.`);
  //     callback(new Error('Tidak diizinkan oleh CORS'));
  //   }
  // },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(apiKeyMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Melayani file statis dari folder public
app.use(express.static(path.join(__dirname, "../public")));

// Import router utama
const apiRouter = require("./routes");
app.use(`/${process.env.API_VERSION}`, apiRouter);

// Basic health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Hybrid LMS Backend API is running!",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || "An unexpected error occurred.",
    error: err.name || "InternalServerError",
  });
});

// Hook untuk menutup koneksi Prisma
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Prisma client disconnected.");
});

module.exports = app;
// Jika ingin menjalankan server secara langsung