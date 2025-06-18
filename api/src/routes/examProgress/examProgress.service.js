// src/routes/examProgress/examProgress.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Saves or updates a student's exam progress for a specific exam package.
 * @param {string} userId - The ID of the student.
 * @param {string} examPackageId - The ID of the exam package.
 * @param {object} progressData - The progress data from the client (currentQuestionId, completedQuestions, score, status, completedAt).
 * @returns {Promise<object>} The updated exam progress record.
 */
async function saveExamProgress(userId, examPackageId, progressData) {
  const { currentQuestionId, completedQuestions, score, status, completedAt } =
    progressData;

  // Pastikan examPackageId valid
  const examPackage = await prisma.examPackage.findUnique({
    where: { id: examPackageId },
  });
  if (!examPackage) {
    const error = new Error("Paket ujian tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  // Cari progres yang sudah ada atau buat yang baru
  let examProgress = await prisma.examProgress.findFirst({
    where: { userId, examPackageId },
  });

  if (examProgress) {
    // Update progres yang sudah ada
    examProgress = await prisma.examProgress.update({
      where: { id: examProgress.id },
      data: {
        currentQuestionId,
        completedQuestions, // JSON field
        score,
        status,
        completedAt: completedAt ? new Date(completedAt) : null,
        updatedAt: new Date(), // Perbarui timestamp
      },
    });
  } else {
    // Buat progres baru
    examProgress = await prisma.examProgress.create({
      data: {
        userId,
        examPackageId, // Mengaitkan ke examPackage
        currentQuestionId,
        completedQuestions,
        score,
        status: status || "IN_PROGRESS", // Default status
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });
  }
  return examProgress;
}

/**
 * Retrieves a student's exam progress for a specific exam package.
 * @param {string} userId - The ID of the student.
 * @param {string} examPackageId - The ID of the exam package.
 * @returns {Promise<object|null>} The exam progress record or null if not found.
 */
async function getExamProgress(userId, examPackageId) {
  const examProgress = await prisma.examProgress.findFirst({
    where: { userId, examPackageId },
    include: {
      examPackage: {
        select: {
          id: true,
          name: true,
          faculty: { select: { id: true, name: true } },
        },
      }, // Include package and its faculty info
      user: { select: { id: true, email: true, username: true } },
    },
  });
  return examProgress;
}

/**
 * Retrieves all exam progress records (for admin/reporting).
 * @param {object} filters - Optional filters (e.g., userId, examPackageId, status).
 * @returns {Promise<Array<object>>} List of exam progress records.
 */
async function getAllExamProgress(filters = {}) {
  const { userId, examPackageId, status } = filters;
  const where = {};

  if (userId) where.userId = userId;
  if (examPackageId) where.examPackageId = examPackageId;
  if (status) where.status = status;

  const progresses = await prisma.examProgress.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, username: true } },
      examPackage: {
        select: {
          id: true,
          name: true,
          faculty: { select: { id: true, name: true } },
        },
      }, // Include package and its faculty info
    },
    orderBy: { updatedAt: "desc" },
  });
  return progresses;
}

/**
 * Prepares data for question download by exam package (for mobile app offline sync).
 * This includes all questions for a PUBLISHED exam package and a simple asset manifest.
 * @param {string} examPackageId - The ID of the exam package.
 * @returns {Promise<object>} Object containing package details, questions, and asset manifest.
 */
async function getDownloadDataForPackage(examPackageId) {
  // Mengganti nama fungsi
  const examPackage = await prisma.examPackage.findUnique({
    where: { id: examPackageId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true, // Crucial: Check package status
      questions: {
        select: {
          id: true,
          content: true, // Structured question content (includes imageUrl/audioUrl)
          questionType: true,
        },
      },
      faculty: { select: { imageUrl: true } }, // Mengambil gambar fakultas jika perlu untuk banner
    },
  });

  if (!examPackage) {
    const error = new Error("Paket ujian tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  if (examPackage.status !== "PUBLISHED") {
    // Hanya izinkan download untuk paket PUBLISHED
    const error = new Error(
      "Paket ujian belum diterbitkan dan tidak dapat diunduh."
    );
    error.statusCode = 403; // Forbidden
    throw error;
  }

  const assets = [];
  // Extract assets from questions
  examPackage.questions.forEach((question) => {
    if (question.content && typeof question.content === "object") {
      if (question.content.imageUrl) {
        assets.push({
          id: `q_img_${question.id}`,
          type: "image",
          data: question.content.imageUrl,
        });
      }
      if (question.content.audioUrl) {
        assets.push({
          id: `q_audio_${question.id}`,
          type: "audio",
          data: question.content.audioUrl,
        });
      }
    }
  });

  // Tambahkan gambar fakultas ke assets jika ada
  if (examPackage.faculty && examPackage.faculty.imageUrl) {
    assets.push({
      id: `faculty_img_${examPackage.faculty.id}`,
      type: "image",
      data: examPackage.faculty.imageUrl,
    });
  }

  // Return data for Flutter
  return {
    examPackage: {
      id: examPackage.id,
      name: examPackage.name,
      description: examPackage.description,
      // Perhatikan: imageUrl paket mungkin dari fakultas terkait
      facultyImageUrl: examPackage.faculty?.imageUrl || null,
    },
    questions: examPackage.questions.map((q) => ({
      id: q.id,
      content: q.content,
      questionType: q.questionType,
      // Tidak ada publishedAt di soal lagi
    })),
    assetManifest: assets, // List of assets for Flutter to download/cache
    totalQuestions: examPackage.questions.length,
  };
}

module.exports = {
  saveExamProgress,
  getExamProgress,
  getAllExamProgress,
  getDownloadDataForPackage, // Ekspor dengan nama baru
};
