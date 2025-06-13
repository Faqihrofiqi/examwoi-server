// src/routes/questions/questions.controller.js
const express = require("express");
const router = express.Router();
const questionService = require("./questions.service");
const { body, query, param, validationResult } = require("express-validator");
const { authenticate, authorize } = require("../../middleware/auth.middleware");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Custom validator untuk Base64
const isBase64Image = (value) => {
  if (!value) return true;
  const base64Regex = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
  if (!base64Regex.test(value)) {
    throw new Error("URL Gambar harus berupa Base64 Data URI gambar yang valid.");
  }
  return true;
};

const isBase64Audio = (value) => {
  if (!value) return true;
  const base64Regex = /^data:audio\/(mpeg|wav|ogg|mp3);base64,([A-Za-z0-9+/=])+$/;
  if (!base64Regex.test(value)) {
    throw new Error("URL Audio harus berupa Base64 Data URI audio yang valid.");
  }
  return true;
};

// --- API Endpoints ---

// POST /questions/preview - Preview soal dari raw text (bisa batch)
router.post(
  "/preview",
  [
    body("rawText").notEmpty().withMessage("rawText diperlukan untuk pratinjau."),
    body("isBatch").optional().isBoolean().withMessage("isBatch harus boolean.") // <-- Tambah validasi isBatch
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { rawText, isBatch } = req.body; // Ambil isBatch
    const parsedContent = await questionService.previewQuestion(rawText, isBatch); // Teruskan isBatch
    res.status(200).json({
      message: "Pratinjau soal berhasil dibuat!",
      data: parsedContent,
    });
  })
);

// POST /questions - Membuat soal baru (Admin atau Guru, bisa batch)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    body("facultyId").isUUID().withMessage("ID Fakultas tidak valid."),
    body("rawText").optional().isString(),
    body("content")
      .optional()
      .isObject()
      .withMessage("Konten harus berupa objek JSON valid."),
    body("status")
      .optional()
      .isIn(["DRAFT", "PUBLISHED"])
      .withMessage("Status harus DRAFT atau PUBLISHED."),
    body("isBatch").optional().isBoolean().withMessage("isBatch harus boolean."), // <-- Tambah validasi isBatch
    body("content.imageUrl").optional().custom(isBase64Image),
    body("content.audioUrl").optional().custom(isBase64Audio),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rawText, content, facultyId, status, isBatch } = req.body; // Ambil isBatch

    // Validasi input rawText/content dan isBatch
    if (isBatch) {
      if (!rawText) { // RawText wajib untuk batch
        return res.status(400).json({ message: "rawText diperlukan untuk pembuatan soal secara batch." });
      }
      if (content) { // Content tidak diizinkan untuk batch
        return res.status(400).json({ message: "Konten terstruktur tidak diizinkan untuk pembuatan soal secara batch." });
      }
    } else { // Single question mode
      if (!rawText && !content) {
        return res.status(400).json({ message: "rawText atau konten terstruktur harus disediakan untuk satu soal." });
      }
      if (rawText && content) {
        return res.status(400).json({ message: "Tidak dapat menyediakan rawText dan konten sekaligus untuk satu soal." });
      }
    }

    const newQuestion = await questionService.createQuestion(
      facultyId,
      { rawText, content },
      status,
      isBatch // Teruskan isBatch
    );

    if (isBatch) {
      res.status(201).json({ message: `Berhasil menambahkan ${newQuestion.count} soal dalam batch!`, data: newQuestion });
    } else {
      res.status(201).json({ message: "Soal berhasil ditambahkan sebagai DRAFT!", data: newQuestion });
    }
  })
);

// GET /questions - Mengambil daftar soal (dengan filter)
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
    const questions = await questionService.getQuestions(req.query);
    res
      .status(200)
      .json({ message: "Soal berhasil diambil!", data: questions });
  })
);

// GET /questions/:id - Mengambil detail soal
router.get(
  "/:id", // <-- PERBAIKAN PATH: Hapus /status
  [param("id").isUUID().withMessage("ID Soal tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const question = await questionService.getQuestionById(req.params.id);
    res
      .status(200)
      .json({ message: "Detail soal berhasil diambil!", data: question });
  })
);

// PUT /questions/:id - Memperbarui soal (Admin atau Guru)
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    param("id").isUUID().withMessage("ID Soal tidak valid."),
    body("facultyId")
      .optional()
      .isUUID()
      .withMessage("ID Fakultas tidak valid."),
    body("rawText").optional().isString(),
    body("content")
      .optional()
      .isObject()
      .withMessage("Konten harus berupa objek JSON valid."),
    body("status")
      .optional()
      .isIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
      .withMessage("Status harus DRAFT, PUBLISHED, atau ARCHIVED."),
    body("content.imageUrl").optional().custom(isBase64Image),
    body("content.audioUrl").optional().custom(isBase64Audio),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.rawText && req.body.content) {
      return res
        .status(400)
        .json({
          message:
            "Tidak dapat menyediakan rawText dan konten sekaligus untuk pembaruan. Pilih salah satu.",
        });
    }

    const updatedQuestion = await questionService.updateQuestion(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({
        message: "Soal berhasil diperbarui!",
        data: updatedQuestion,
      });
  })
);

// PUT /questions/:id/publish - Menerbitkan soal (khusus DRAFT -> PUBLISHED)
router.put(
  "/:id/publish",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [param("id").isUUID().withMessage("ID Soal tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const publishedQuestion = await questionService.publishQuestion(
      req.params.id
    );
    res.status(200).json({
      message: "Soal berhasil diterbitkan!",
      data: publishedQuestion,
    });
  })
);

// PUT /questions/:id/status - Mengubah status soal (PUBLISHED -> ARCHIVED, ARCHIVED -> DRAFT)
router.put(
  "/:id/status",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [
    param("id").isUUID().withMessage("ID Soal tidak valid."),
    // Memungkinkan DRAFT, PUBLISHED, ARCHIVED karena validasi transisi ada di service
    body("status").isIn(["DRAFT", "PUBLISHED", "ARCHIVED"]).withMessage("Status baru tidak valid. Harus DRAFT, PUBLISHED, atau ARCHIVED.").notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { status: newStatus } = req.body;
    const updatedQuestion = await questionService.updateQuestionStatus(
      req.params.id,
      newStatus
    );
    res.status(200).json({
      message: `Status soal berhasil diperbarui menjadi ${newStatus}!`,
      data: updatedQuestion,
    });
  })
);

// DELETE /questions/:id - Menghapus soal (Admin atau Guru)
router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN", "TEACHER"]),
  [param("id").isUUID().withMessage("ID Soal tidak valid.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const deletedQuestion = await questionService.deleteQuestion(req.params.id);
    res.status(200).json({
      message: "Soal berhasil dihapus!",
      data: deletedQuestion,
    });
  })
);

module.exports = router;