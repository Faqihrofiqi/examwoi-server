// src/routes/examPackages/examPackage.controller.js
const express = require("express");
const router = express.Router();
const examPackageService = require("./examPackage.service");
const { body, query, param, validationResult } = require("express-validator");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints for ExamPackage (Admin/Teacher Only for CUD, Public for Read specific) ---

// GET /exam-packages - Get all exam packages (Public/Student can see published ones)
router.get(
  "/",
  [
    query("facultyId")
      .optional()
      .isUUID()
      .withMessage("ID Fakultas tidak valid."),
    query("status")
      .optional()
      .isIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
      .withMessage("Status harus DRAFT, PUBLISHED, atau ARCHIVED."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const packages = await examPackageService.getAllExamPackages(req.query);
    res
      .status(200)
      .json({ message: "Paket ujian berhasil diambil!", data: packages });
  })
);

// GET /exam-packages/:id - Get a single exam package by ID (Public)
router.get(
  "/:id",
  [param("id").isUUID().withMessage("ID Paket Ujian tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const examPackage = await examPackageService.getExamPackageById(
      req.params.id
    );
    res.status(200).json({
      message: "Detail paket ujian berhasil diambil!",
      data: examPackage,
    });
  })
);

// POST /exam-packages - Create a new exam package (Admin/Teacher Only)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    body("name").notEmpty().withMessage("Nama paket ujian diperlukan."),
    body("facultyId").isUUID().withMessage("ID Fakultas tidak valid."),
    body("description").optional().isString(),
    body("durationMinutes")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Durasi ujian harus angka positif."),
    body("totalQuestions")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Jumlah soal harus angka non-negatif."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newPackage = await examPackageService.createExamPackage(req.body);
    res
      .status(201)
      .json({ message: "Paket ujian berhasil dibuat!", data: newPackage });
  })
);

// PUT /exam-packages/:id - Update an existing exam package (Admin/Teacher Only)
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    param("id").isUUID().withMessage("ID Paket Ujian tidak valid."),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama paket ujian tidak boleh kosong."),
    body("facultyId")
      .optional()
      .isUUID()
      .withMessage("ID Fakultas tidak valid."),
    body("description").optional().isString(),
    body("durationMinutes")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Durasi ujian harus angka positif."),
    body("totalQuestions")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Jumlah soal harus angka non-negatif."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const updatedPackage = await examPackageService.updateExamPackage(
      req.params.id,
      req.body
    );
    res.status(200).json({
      message: "Paket ujian berhasil diperbarui!",
      data: updatedPackage,
    });
  })
);

// PUT /exam-packages/:id/status - Update exam package status (PUBLISHED, ARCHIVED, DRAFT)
router.put(
  "/:id/status",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    param("id").isUUID().withMessage("ID Paket Ujian tidak valid."),
    body("status")
      .isIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
      .withMessage("Status tidak valid. Harus DRAFT, PUBLISHED, atau ARCHIVED.")
      .notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { status: newStatus } = req.body;
    const updatedPackage = await examPackageService.updateExamPackageStatus(
      req.params.id,
      newStatus
    );
    res.status(200).json({
      message: `Status paket ujian berhasil diperbarui menjadi ${newStatus}!`,
      data: updatedPackage,
    });
  })
);

// DELETE /exam-packages/:id - Delete an exam package (Admin/Teacher Only)
router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [param("id").isUUID().withMessage("ID Paket Ujian tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const deletedPackage = await examPackageService.deleteExamPackage(
      req.params.id
    );
    res
      .status(200)
      .json({ message: "Paket ujian berhasil dihapus!", data: deletedPackage });
  })
);

module.exports = router;
