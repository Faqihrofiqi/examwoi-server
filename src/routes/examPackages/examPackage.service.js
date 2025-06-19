// src/routes/examPackages/examPackage.service.js
const { PrismaClient, PackageStatus } = require("@prisma/client"); // Import PackageStatus
const prisma = new PrismaClient();

/**
 * Creates a new exam package.
 * @param {object} packageData - Data for the new package (name, description, facultyId, durationMinutes, totalQuestions).
 * @returns {Promise<object>} The created exam package.
 */
async function createExamPackage(packageData) {
  const { name, facultyId, description, durationMinutes, totalQuestions } =
    packageData;

  const existingPackage = await prisma.examPackage.findUnique({
    where: { name },
  });
  if (existingPackage) {
    const error = new Error("Paket ujian dengan nama ini sudah ada.");
    error.statusCode = 409;
    throw error;
  }

  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) {
    const error = new Error("Fakultas tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const examPackage = await prisma.examPackage.create({
    data: {
      name,
      description,
      faculty: { connect: { id: facultyId } },
      status: PackageStatus.DRAFT, // Default status
      durationMinutes,
      totalQuestions, // Bisa diisi manual atau diupdate setelah soal ditambahkan
    },
  });
  return examPackage;
}

/**
 * Retrieves all exam packages with optional filters.
 * @param {object} filters - Filters like facultyId, status.
 * @returns {Promise<Array<object>>} List of exam packages.
 */
async function getAllExamPackages(filters) {
  const { facultyId, status } = filters;
  const where = {};

  if (facultyId) {
    where.facultyId = facultyId;
  }
  if (status) {
    where.status = status;
  }

  const packages = await prisma.examPackage.findMany({
    where,
    include: {
      faculty: { select: { id: true, name: true } },
      questions: { select: { id: true } },
    }, // Include faculty and count questions
    orderBy: { createdAt: "desc" },
  });
  return packages;
}

/**
 * Retrieves a single exam package by ID.
 * @param {string} packageId - The ID of the exam package.
 * @returns {Promise<object|null>} The exam package object or null if not found.
 */
async function getExamPackageById(packageId) {
  const examPackage = await prisma.examPackage.findUnique({
    where: { id: packageId },
    include: {
      faculty: { select: { id: true, name: true } },
      questions: { select: { id: true } },
    },
  });
  if (!examPackage) {
    const error = new Error("Paket ujian tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }
  return examPackage;
}

/**
 * Updates an existing exam package.
 * @param {string} packageId - The ID of the exam package to update.
 * @param {object} updateData - Data to update the package.
 * @returns {Promise<object>} The updated exam package.
 */
async function updateExamPackage(packageId, updateData) {
  const { name, facultyId } = updateData;

  // Check if new name already exists for another package
  if (name) {
    const existingPackageByName = await prisma.examPackage.findFirst({
      where: {
        name,
        id: { not: packageId },
      },
    });
    if (existingPackageByName) {
      const error = new Error("Paket ujian lain dengan nama ini sudah ada.");
      error.statusCode = 409;
      throw error;
    }
  }
  // Verify faculty exists if facultyId is provided
  if (facultyId) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });
    if (!faculty) {
      const error = new Error("Fakultas tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
  }

  try {
    const updatedPackage = await prisma.examPackage.update({
      where: { id: packageId },
      data: updateData,
    });
    return updatedPackage;
  } catch (error) {
    if (error.code === "P2025") {
      const err = new Error("Paket ujian tidak ditemukan untuk diperbarui.");
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Updates the status of an exam package.
 * Handles transitions: DRAFT -> PUBLISHED, PUBLISHED -> ARCHIVED, ARCHIVED -> DRAFT.
 * This replaces the question-level status update.
 * @param {string} packageId - The ID of the exam package.
 * @param {PackageStatus} newStatus - The new status (DRAFT, PUBLISHED, ARCHIVED).
 * @returns {Promise<object>} The updated exam package.
 * @throws {Error} If the transition is invalid.
 */
async function updateExamPackageStatus(packageId, newStatus) {
  const examPackage = await prisma.examPackage.findUnique({
    where: { id: packageId },
    select: { id: true, status: true, questions: { select: { id: true } } },
  });

  if (!examPackage) {
    const error = new Error("Paket ujian tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = examPackage.status;

  // Validasi transisi status
  switch (newStatus) {
    case PackageStatus.PUBLISHED:
      if (currentStatus !== PackageStatus.DRAFT) {
        const error = new Error(
          `Tidak dapat memublikasikan paket yang berstatus ${currentStatus}. Hanya paket DRAFT yang dapat dipublikasikan.`
        );
        error.statusCode = 400;
        throw error;
      }
      if (examPackage.questions.length === 0) {
        const error = new Error(
          "Tidak dapat memublikasikan paket tanpa soal. Harap tambahkan soal terlebih dahulu."
        );
        error.statusCode = 400;
        throw error;
      }
      break;
    case PackageStatus.ARCHIVED:
      if (currentStatus !== PackageStatus.PUBLISHED) {
        const error = new Error(
          `Tidak dapat mengarsipkan paket yang berstatus ${currentStatus}. Hanya paket PUBLISHED yang dapat diarsipkan.`
        );
        error.statusCode = 400;
        throw error;
      }
      break;
    case PackageStatus.DRAFT:
      if (
        currentStatus !== PackageStatus.ARCHIVED &&
        currentStatus !== PackageStatus.DRAFT
      ) {
        const error = new Error(
          `Tidak dapat mengubah status ke DRAFT dari ${currentStatus}. Hanya paket ARCHIVED yang dapat dikembalikan ke DRAFT.`
        );
        error.statusCode = 400;
        throw error;
      }
      break;
    default:
      const error = new Error(
        "Status baru tidak valid. Harus DRAFT, PUBLISHED, atau ARCHIVED."
      );
      error.statusCode = 400;
      throw error;
  }

  try {
    const updatedPackage = await prisma.examPackage.update({
      where: { id: packageId },
      data: {
        status: newStatus,
        publishedAt:
          newStatus === PackageStatus.PUBLISHED
            ? new Date()
            : newStatus === PackageStatus.DRAFT
            ? null
            : undefined,
      },
    });
    return updatedPackage;
  } catch (error) {
    if (error.code === "P2025") {
      const err = new Error(
        "Paket ujian tidak ditemukan untuk pembaruan status."
      );
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Deletes an exam package by ID.
 * @param {string} packageId - The ID of the exam package to delete.
 * @returns {Promise<object>} The deleted exam package.
 */
async function deleteExamPackage(packageId) {
  try {
    // Handle cascading deletes: first delete related questions and exam progresses
    await prisma.question.deleteMany({ where: { examPackageId: packageId } });
    await prisma.examProgress.deleteMany({
      where: { examPackageId: packageId },
    });

    const deletedPackage = await prisma.examPackage.delete({
      where: { id: packageId },
    });
    return deletedPackage;
  } catch (error) {
    if (error.code === "P2025") {
      const err = new Error("Paket ujian tidak ditemukan untuk penghapusan.");
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  createExamPackage,
  getAllExamPackages,
  getExamPackageById,
  updateExamPackage,
  updateExamPackageStatus,
  deleteExamPackage,
};
