// src/routes/examProgress/examProgress.controller.js
const express = require("express");
const router = express.Router();
const examProgressService = require("./examProgress.service");
const { body, param, query, validationResult } = require("express-validator");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints ---

// POST /exam-progress - Menyimpan atau memperbarui progres ujian (Student Only)
router.post(
  "/",
  authenticate,
  authorize(["STUDENT"]),
  [
    body("examPackageId").isUUID().withMessage("ID Paket Ujian tidak valid."),
    body("currentQuestionId")
      .optional()
      .isUUID()
      .withMessage("ID Soal Saat Ini tidak valid."),
    body("completedQuestions")
      .optional()
      .isObject()
      .withMessage("Soal yang diselesaikan harus berupa objek."),
    body("score")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Skor harus angka non-negatif."),
    body("status")
      .optional()
      .isIn(["IN_PROGRESS", "COMPLETED", "PAUSED"])
      .withMessage("Status tidak valid.")
      .notEmpty(),
    body("completedAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Format tanggal selesai tidak valid (ISO 8601)."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { examPackageId } = req.body;
    const progress = await examProgressService.saveExamProgress(
      userId,
      examPackageId,
      req.body
    );
    res
      .status(200)
      .json({ message: "Progres ujian berhasil disimpan!", data: progress });
  })
);

// GET /exam-progress/:examPackageId - Mengambil progres ujian siswa untuk paket tertentu (Student Only)
router.get(
  "/:examPackageId",
  authenticate,
  authorize(["STUDENT"]),
  [param("examPackageId").isUUID().withMessage("ID Paket Ujian tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { examPackageId } = req.params;
    const progress = await examProgressService.getExamProgress(
      userId,
      examPackageId
    );
    if (!progress) {
      return res
        .status(404)
        .json({
          message: "Progres ujian tidak ditemukan untuk user dan paket ini.",
        });
    }
    res
      .status(200)
      .json({ message: "Progres ujian berhasil diambil!", data: progress });
  })
);

// GET /exam-progress - Mengambil semua progres ujian (Admin Only for Reporting)
router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  [
    query("userId").optional().isUUID().withMessage("ID User tidak valid."),
    query("examPackageId")
      .optional()
      .isUUID()
      .withMessage("ID Paket Ujian tidak valid."),
    query("status")
      .optional()
      .isIn(["IN_PROGRESS", "COMPLETED", "PAUSED"])
      .withMessage("Status tidak valid."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const progresses = await examProgressService.getAllExamProgress(req.query);
    res
      .status(200)
      .json({
        message: "Semua progres ujian berhasil diambil!",
        data: progresses,
      });
  })
);

// GET /export/:examPackageId - Download soal per paket (untuk offline sync) (Public)
router.get(
  "/export/:examPackageId",
  [param("examPackageId").isUUID().withMessage("ID Paket Ujian tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { examPackageId } = req.params;
    const downloadData = await examProgressService.getDownloadDataForPackage(
      examPackageId
    ); // Mengganti nama fungsi
    res
      .status(200)
      .json({
        message: "Data ujian dan aset berhasil diambil!",
        data: downloadData,
      });
  })
);

module.exports = router;
