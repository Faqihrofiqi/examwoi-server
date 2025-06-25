// src/app.js
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

app.use(morgan("combined"));

// --- Konfigurasi CORS (Penting: Posisi di sini) ---
const APP_URL = process.env.APP_URL;
const APP_URL1 = process.env.APP_URL1;

console.log(`CORS Config: APP_URL=${APP_URL}, APP_URL1=${APP_URL1}`);

const allowedOrigins = [
  "http://localhost:3001", // Frontend React di development
  "http://localhost:3000", // Jika ada bagian frontend yang dilayani di port yang sama
  /\.examwoi\.com$/, // Contoh wildcard untuk .examwoi.com
  /\.examwoi\.net$/, // Contoh wildcard untuk .examwoi.net
  // Tambahkan domain spesifik lain jika ada
  // 'https://your-specific-prod-domain.com',
];

if (APP_URL && APP_URL.trim() !== "") {
  allowedOrigins.push(APP_URL);
}
if (APP_URL1 && APP_URL1.trim() !== "") {
  allowedOrigins.push(APP_URL1);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Izinkan requests tanpa origin (misal: mobile apps, file://)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return allowedOrigin === origin;
      }
      return allowedOrigin.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(
        `CORS: Origin ${origin} diblokir oleh kebijakan CORS. Allowed: ${allowedOrigins.join(
          ", "
        )}`
      );
      callback(new Error("Tidak diizinkan oleh CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204, // Penting untuk preflight requests
};
app.use(cors(corsOptions));

app.use(apiKeyMiddleware);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
