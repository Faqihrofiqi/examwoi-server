// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors'); // <-- Import CORS

const app = express();

const prisma = new PrismaClient();
app.set('prisma', prisma);

// --- Konfigurasi CORS ---
// Cara Paling Sederhana (Izinkan semua origin - TIDAK DIREKOMENDASIKAN UNTUK PRODUKSI)
// app.use(cors());

// Cara yang Direkomendasikan (Izinkan hanya origin spesifik)
const corsOptions = {
  origin: 'http://localhost:3001', // <-- Ganti dengan URL frontend React-mu
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Izinkan pengiriman cookies dan header Authorization
  optionsSuccessStatus: 204 // Untuk preflight requests
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Melayani file statis dari folder public
app.use(express.static(path.join(__dirname, '../public')));

// Import router utama
const apiRouter = require('./routes');
app.use(`/${process.env.API_VERSION}`, apiRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Hybrid LMS Backend API is running!'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || 'An unexpected error occurred.',
    error: err.name || 'InternalServerError'
  });
});

// Hook untuk menutup koneksi Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('Prisma client disconnected.');
});

module.exports = app;