// src/routes/faculties/faculties.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Creates a new faculty.
 * @param {object} facultyData - Data for the new faculty (name, description, imageUrl).
 * @returns {Promise<object>} The created faculty.
 */
async function createFaculty(facultyData) {
  const { name, description, imageUrl } = facultyData;

  const existingFaculty = await prisma.faculty.findUnique({ where: { name } });
  if (existingFaculty) {
    const error = new Error("Faculty with this name already exists.");
    error.statusCode = 409; // Conflict
    throw error;
  }

  const faculty = await prisma.faculty.create({
    data: {
      name,
      description,
      imageUrl, // Store Base64 image directly (or path if saved to storage)
    },
  });
  return faculty;
}

/**
 * Retrieves all faculties.
 * @returns {Promise<Array<object>>} List of all faculties.
 */
async function getAllFaculties() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: "asc" }, // Order alphabetically
  });
  return faculties;
}

/**
 * Retrieves a single faculty by ID.
 * @param {string} facultyId - The ID of the faculty.
 * @returns {Promise<object|null>} The faculty object or null if not found.
 */
async function getFacultyById(facultyId) {
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
  });
  if (!faculty) {
    const error = new Error("Faculty not found.");
    error.statusCode = 404; // Not Found
    throw error;
  }
  return faculty;
}

/**
 * Updates an existing faculty.
 * @param {string} facultyId - The ID of the faculty to update.
 * @param {object} updateData - Data to update the faculty (name, description, imageUrl).
 * @returns {Promise<object>} The updated faculty.
 */
async function updateFaculty(facultyId, updateData) {
  const { name } = updateData;

  // Check if new name already exists for another faculty
  if (name) {
    const existingFacultyByName = await prisma.faculty.findFirst({
      where: {
        name,
        id: { not: facultyId }, // Exclude current faculty
      },
    });
    if (existingFacultyByName) {
      const error = new Error("Another faculty with this name already exists.");
      error.statusCode = 409; // Conflict
      throw error;
    }
  }

  try {
    const updatedFaculty = await prisma.faculty.update({
      where: { id: facultyId },
      data: updateData,
    });
    return updatedFaculty;
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma error code for record not found
      const err = new Error("Faculty not found for update.");
      err.statusCode = 404;
      throw err;
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Deletes a faculty by ID.
 * @param {string} facultyId - The ID of the faculty to delete.
 * @returns {Promise<object>} The deleted faculty.
 */
async function deleteFaculty(facultyId) {
  try {
    const deletedFaculty = await prisma.faculty.delete({
      where: { id: facultyId },
    });
    return deletedFaculty;
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma error code for record not found
      const err = new Error("Faculty not found for deletion.");
      err.statusCode = 404;
      throw err;
    }
    // Handle cases where faculty has related questions or users (e.g., P2003 Foreign key constraint failed)
    if (error.code === "P2003") {
      const err = new Error(
        "Cannot delete faculty because it has related questions or users. Please remove them first."
      );
      err.statusCode = 400; // Bad Request
      throw err;
    }
    throw error; // Re-throw other errors
  }
}

module.exports = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};
