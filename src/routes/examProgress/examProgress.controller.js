// src/routes/examProgress/examProgress.controller.js
const express = require("express");
const router = express.Router();
const examProgressService = require("./examProgress.service"); // Import service
const { body, param, query, validationResult } = require("express-validator"); // Untuk validasi input
const { authenticate, authorize } = require("../../middleware/auth.middleware"); // Import middleware

// Middleware pembantu untuk menangani promise (async/await) di route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints ---

// POST /exam-progress - Menyimpan atau memperbarui progres ujian (Student Only)
router.post(
  "/",
  authenticate,
  authorize(["STUDENT"]),
  [
    body("facultyId").isUUID().withMessage("Valid Faculty ID is required."),
    body("currentQuestionId")
      .optional()
      .isUUID()
      .withMessage("Invalid Current Question ID format."),
    body("completedQuestions")
      .optional()
      .isObject()
      .withMessage("Completed questions must be an object."),
    body("score")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Score must be a non-negative integer."),
    body("status")
      .optional()
      .isIn(["IN_PROGRESS", "COMPLETED", "PAUSED"])
      .withMessage("Status must be IN_PROGRESS, COMPLETED, or PAUSED."),
    body("completedAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Invalid completedAt date format (ISO 8601)."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id; // Get userId from authenticated user
    const { facultyId } = req.body;
    const progress = await examProgressService.saveExamProgress(
      userId,
      facultyId,
      req.body
    );
    res
      .status(200)
      .json({ message: "Exam progress saved successfully!", data: progress });
  })
);

// GET /exam-progress/:facultyId - Mengambil progres ujian siswa untuk fakultas tertentu (Student Only)
router.get(
  "/:facultyId",
  authenticate,
  authorize(["STUDENT"]),
  [param("facultyId").isUUID().withMessage("Invalid Faculty ID format.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id; // Get userId from authenticated user
    const { facultyId } = req.params;
    const progress = await examProgressService.getExamProgress(
      userId,
      facultyId
    );
    if (!progress) {
      return res
        .status(404)
        .json({
          message: "Exam progress not found for this user and faculty.",
        });
    }
    res
      .status(200)
      .json({
        message: "Exam progress retrieved successfully!",
        data: progress,
      });
  })
);

// GET /exam-progress - Mengambil semua progres ujian (Admin Only for Reporting)
router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  [
    query("userId").optional().isUUID().withMessage("Invalid User ID format."),
    query("facultyId")
      .optional()
      .isUUID()
      .withMessage("Invalid Faculty ID format."),
    query("status")
      .optional()
      .isIn(["IN_PROGRESS", "COMPLETED", "PAUSED"])
      .withMessage("Status must be IN_PROGRESS, COMPLETED, or PAUSED."),
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
        message: "All exam progresses retrieved successfully!",
        data: progresses,
      });
  })
);

// GET /export/:facultyId - Download soal per fakultas (untuk offline sync) (Public)
// Ini adalah endpoint yang akan digunakan oleh Flutter untuk mengunduh semua soal dan aset untuk offline mode.
router.get(
  "/export/:facultyId",
  [param("facultyId").isUUID().withMessage("Invalid Faculty ID format.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { facultyId } = req.params;
    const downloadData = await examProgressService.getDownloadDataForFaculty(
      facultyId
    );
    res
      .status(200)
      .json({
        message: "Faculty exam data and assets retrieved successfully!",
        data: downloadData,
      });
  })
);

module.exports = router;
