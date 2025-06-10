// src/routes/examProgress/examProgress.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Saves or updates a student's exam progress for a specific faculty.
 * @param {string} userId - The ID of the student.
 * @param {string} facultyId - The ID of the faculty.
 * @param {object} progressData - The progress data from the client (currentQuestionId, completedQuestions, score, status, completedAt).
 * @returns {Promise<object>} The updated exam progress record.
 */
async function saveExamProgress(userId, facultyId, progressData) {
  const { currentQuestionId, completedQuestions, score, status, completedAt } =
    progressData;

  // Find existing progress or create a new one
  let examProgress = await prisma.examProgress.findFirst({
    where: { userId, facultyId },
  });

  if (examProgress) {
    // Update existing progress
    examProgress = await prisma.examProgress.update({
      where: { id: examProgress.id },
      data: {
        currentQuestionId,
        completedQuestions, // JSON field
        score,
        status,
        completedAt: completedAt ? new Date(completedAt) : null,
        updatedAt: new Date(), // Manually update updatedAt for clarity
      },
    });
  } else {
    // Create new progress
    examProgress = await prisma.examProgress.create({
      data: {
        userId,
        facultyId,
        currentQuestionId,
        completedQuestions,
        score,
        status: status || "IN_PROGRESS", // Default to IN_PROGRESS
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });
  }
  return examProgress;
}

/**
 * Retrieves a student's exam progress for a specific faculty.
 * @param {string} userId - The ID of the student.
 * @param {string} facultyId - The ID of the faculty.
 * @returns {Promise<object|null>} The exam progress record or null if not found.
 */
async function getExamProgress(userId, facultyId) {
  const examProgress = await prisma.examProgress.findFirst({
    where: { userId, facultyId },
    include: {
      faculty: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, username: true } },
    },
  });
  return examProgress;
}

/**
 * Retrieves all exam progress records (for admin/reporting).
 * @param {object} filters - Optional filters (e.g., userId, facultyId, status).
 * @returns {Promise<Array<object>>} List of exam progress records.
 */
async function getAllExamProgress(filters = {}) {
  const { userId, facultyId, status } = filters;
  const where = {};

  if (userId) where.userId = userId;
  if (facultyId) where.facultyId = facultyId;
  if (status) where.status = status;

  const progresses = await prisma.examProgress.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, username: true } },
      faculty: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return progresses;
}

/**
 * Prepares data for question download by faculty (for mobile app offline sync).
 * This includes all PUBLISHED questions for a faculty and a simple asset manifest.
 * @param {string} facultyId - The ID of the faculty.
 * @returns {Promise<object>} Object containing faculty details, questions, and asset manifest.
 */
async function getDownloadDataForFaculty(facultyId) {
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true, // Faculty banner image
      questions: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          content: true, // Structured question content (includes imageUrl/audioUrl)
          questionType: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!faculty) {
    const error = new Error("Faculty not found.");
    error.statusCode = 404;
    throw error;
  }

  const assets = [];
  faculty.questions.forEach((question) => {
    // Collect asset paths/Base64 from question content if they exist
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

  // Add faculty image to assets
  if (faculty.imageUrl) {
    assets.push({
      id: `faculty_img_${faculty.id}`,
      type: "image",
      data: faculty.imageUrl,
    });
  }

  // Return data for Flutter
  return {
    faculty: {
      id: faculty.id,
      name: faculty.name,
      description: faculty.description,
      imageUrl: faculty.imageUrl, // Send directly for Flutter to use
    },
    questions: faculty.questions.map((q) => ({
      id: q.id,
      content: q.content,
      questionType: q.questionType,
      publishedAt: q.publishedAt,
    })),
    assetManifest: assets, // List of assets for Flutter to download/cache
    totalQuestions: faculty.questions.length,
  };
}

module.exports = {
  saveExamProgress,
  getExamProgress,
  getAllExamProgress,
  getDownloadDataForFaculty,
};
