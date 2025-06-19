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
    body("isBatch").optional().isBoolean().withMessage("isBatch harus boolean.")
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { rawText, isBatch } = req.body;
    const parsedContent = await questionService.previewQuestion(rawText, isBatch);
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
    body("examPackageId").isUUID().withMessage("ID Paket Ujian tidak valid."),
    body("rawText").optional().isString(), // Izinkan rawText
    body("content")
      .optional()
      .isObject()
      .withMessage("Konten harus berupa objek JSON valid."), // Izinkan content
    body("isBatch").optional().isBoolean().withMessage("isBatch harus boolean."),
    body("content.imageUrl").optional().custom(isBase64Image),
    body("content.audioUrl").optional().custom(isBase64Audio),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rawText, content, examPackageId, isBatch } = req.body;

    // Perbaikan: Hapus validasi ketat "rawText DAN content tidak boleh bersamaan" di controller
    // Biarkan service yang menangani prioritas atau error jika input tidak sesuai logika.
    // Validasi isBatch dan rawText/content tetap relevan:
    if (isBatch && (!rawText || content)) { // Jika isBatch=true, rawText wajib, content tidak boleh ada
      return res.status(400).json({ message: "Untuk pembuatan soal secara batch, hanya field rawText yang diizinkan." });
    }
    // Jika tidak isBatch (single mode), harus ada rawText ATAU content
    if (!isBatch && (!rawText && !content)) {
      return res.status(400).json({ message: "rawText atau konten terstruktur harus disediakan untuk satu soal." });
    }

    // Service akan menerima kedua `rawText` dan `content` dan memprioritaskan `content` jika ada
    const newQuestion = await questionService.createQuestion(
      examPackageId,
      { rawText, content }, // Kirim kedua field ini ke service
      isBatch
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
    query("examPackageId").optional().isUUID().withMessage("ID Paket Ujian tidak valid."),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { examPackageId } = req.query;
    const questions = await questionService.getQuestions({ examPackageId });
    res
      .status(200)
      .json({ message: "Soal berhasil diambil!", data: questions });
  })
);

// GET /questions/:id - Mengambil detail soal
router.get(
  "/:id",
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
    body("examPackageId")
      .optional()
      .isUUID()
      .withMessage("ID Paket Ujian tidak valid."),
    body("rawText").optional().isString(), // Izinkan rawText
    body("content")
      .optional()
      .isObject()
      .withMessage("Konten harus berupa objek JSON valid."), // Izinkan content
    body("content.imageUrl").optional().custom(isBase64Image),
    body("content.audioUrl").optional().custom(isBase64Audio),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Perbaikan: Hapus validasi ketat "rawText DAN content tidak boleh bersamaan" di controller
    // Biarkan service yang menangani prioritas atau error jika input tidak sesuai logika.
    // Jika tidak ada rawText maupun content yang dikirim, service akan mempertahankan yang lama.
    if (Object.keys(req.body).length === 0) { // Jika body kosong sama sekali
      return res.status(400).json({ message: "Setidaknya satu field (rawText, content, atau examPackageId) harus disediakan untuk pembaruan." });
    }

    const updatedQuestion = await questionService.updateQuestion(
      req.params.id,
      req.body // Kirim semua body yang valid ke service
    );
    res.status(200).json({
      message: "Soal berhasil diperbarui!",
      data: updatedQuestion,
    });
  })
);

// ... (DELETE /questions/:id tetap sama) ...

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