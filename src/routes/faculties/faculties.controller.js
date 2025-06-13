// src/routes/faculties/faculties.controller.js
const express = require("express");
const router = express.Router();
const facultyService = require("./faculties.service"); // Import service
const { body, param, validationResult } = require("express-validator"); // Untuk validasi input
const { authenticate, authorize } = require("../../middleware/auth.middleware"); // Import middleware

// Middleware pembantu untuk menangani promise (async/await) di route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints ---

// GET /faculties - Mengambil semua fakultas
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const faculties = await facultyService.getAllFaculties();
    res
      .status(200)
      .json({ message: "Faculties retrieved successfully!", data: faculties });
  })
);

// GET /faculties/:id - Mengambil fakultas berdasarkan ID
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid Faculty ID format.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const faculty = await facultyService.getFacultyById(req.params.id);
    res
      .status(200)
      .json({ message: "Faculty retrieved successfully!", data: faculty });
  })
);

// POST /faculties - Membuat fakultas baru (hanya Admin)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  [
    body("name").notEmpty().withMessage("Faculty name is required."),
    body("description").optional().isString(),
    body("imageUrl").optional().isString(), // Validate if it's a string (Base64)
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newFaculty = await facultyService.createFaculty(req.body);
    res
      .status(201)
      .json({ message: "Faculty created successfully!", data: newFaculty });
  })
);

// PUT /faculties/:id - Memperbarui fakultas (hanya Admin)
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  [
    param("id").isUUID().withMessage("Invalid Faculty ID format."),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Faculty name cannot be empty."),
    body("description").optional().isString(),
    body("imageUrl").optional().isString(), // Validate if it's a string (Base64)
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const updatedFaculty = await facultyService.updateFaculty(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({ message: "Faculty updated successfully!", data: updatedFaculty });
  })
);

// DELETE /faculties/:id - Menghapus fakultas (hanya Admin)
router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  [param("id").isUUID().withMessage("Invalid Faculty ID format.")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const deletedFaculty = await facultyService.deleteFaculty(req.params.id);
    res
      .status(200)
      .json({ message: "Faculty deleted successfully!", data: deletedFaculty });
  })
);

module.exports = router;
