// src/routes/questions/questions.service.js
const { PrismaClient, Status } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseRawQuestion, parseRawQuestionsBatch } = require('../../utils/question.parser');

/**
 * Previews question(s) from raw text without saving them to the database.
 * Can handle single or batch raw text.
 * @param {string} rawText - The raw text content of the question(s).
 * @param {boolean} isBatch - True if the rawText is expected to contain multiple questions.
 * @returns {object|Array<object>} The parsed question content (single or array).
 */
async function previewQuestion(rawText, isBatch = false) {
  try {
    if (isBatch) {
      const parsedContent = parseRawQuestionsBatch(rawText);
      return parsedContent;
    } else {
      const parsedContent = parseRawQuestion(rawText);
      return parsedContent;
    }
  } catch (error) {
    const err = new Error(`Gagal mengurai soal: ${error.message}`);
    err.statusCode = 400; // Bad Request for parsing errors
    throw err;
  }
}
async function createQuestion(facultyId, questionData, status = 'DRAFT', isBatch = false) {
  const { rawText, content } = questionData;
  let questionsToCreate = [];

  if (isBatch) {
    if (!rawText) {
      const error = new Error('rawText diperlukan untuk pembuatan soal secara batch.');
      error.statusCode = 400;
      throw error;
    }
    const parsedBatch = parseRawQuestionsBatch(rawText);
    questionsToCreate = parsedBatch.map(parsedContent => ({
      content: parsedContent,
      rawText: JSON.stringify(parsedContent),
      status,
      facultyId: facultyId, // <-- PERBAIKAN PENTING DI SINI: Langsung berikan facultyId
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      questionType: parsedContent.questionType || 'TEXT'
    }));
  } else {
    let parsedContent;
    let questionType = 'TEXT';

    if (rawText) {
      parsedContent = parseRawQuestion(rawText);
      questionType = parsedContent.questionType || 'TEXT';
    } else if (content) {
      parsedContent = content;
      if (parsedContent.imageUrl) questionType = 'IMAGE';
      else if (parsedContent.audioUrl) questionType = 'AUDIO';
      else questionType = 'TEXT';
    } else {
      const error = new Error('rawText atau konten terstruktur harus disediakan untuk satu soal.');
      error.statusCode = 400;
      throw error;
    }
    questionsToCreate.push({
      content: parsedContent,
      rawText: rawText || JSON.stringify(content),
      status,
      faculty: { connect: { id: facultyId } }, // Ini tetap untuk single question karena create() mendukung relasi
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      questionType
    });
  }

  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) {
    const error = new Error('Fakultas tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  if (isBatch) {
    const result = await prisma.question.createMany({
      data: questionsToCreate
    });
    console.log(`Berhasil membuat ${result.count} soal dalam batch.`);
    return { count: result.count, message: `Berhasil membuat ${result.count} soal.` };
  } else {
    const question = await prisma.question.create({
      data: questionsToCreate[0]
    });
    return question;
  }
}

/**
 * Retrieves questions based on filters.
 * @param {object} filters - Filters like facultyId, status.
 * @returns {Promise<Array<object>>} List of questions.
 */
async function getQuestions(filters) {
  const { facultyId, status } = filters;
  const where = {};

  if (facultyId) {
    where.facultyId = facultyId;
  }
  if (status) {
    where.status = status;
  }

  const questions = await prisma.question.findMany({
    where,
    include: { faculty: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return questions;
}

/**
 * Retrieves a single question by ID.
 * @param {string} questionId - The ID of the question.
 * @returns {Promise<object|null>} The question object or null if not found.
 */
async function getQuestionById(questionId) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { faculty: { select: { id: true, name: true } } },
  });
  if (!question) {
    const error = new Error("Soal tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }
  return question;
}

/**
 * Updates an existing question.
 * @param {string} questionId - The ID of the question to update.
 * @param {object} updateData - Data to update the question (rawText, content, status, facultyId).
 * @returns {Promise<object>} The updated question.
 */
async function updateQuestion(questionId, updateData) {
  const { rawText, content, status, facultyId } = updateData;
  let finalContent;
  let questionType;

  // Perbaikan di sini: Gunakan parseRawQuestion untuk single update
  if (rawText) {
    finalContent = parseRawQuestion(rawText); // <-- PERBAIKAN: Gunakan parseRawQuestion
    questionType = finalContent.questionType || "TEXT";
  } else if (content) {
    finalContent = content;
    if (finalContent.imageUrl) questionType = "IMAGE";
    else if (finalContent.audioUrl) questionType = "AUDIO";
    else questionType = "TEXT";
  } else {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: { content: true, questionType: true },
    });
    if (existingQuestion) {
      finalContent = existingQuestion.content;
      questionType = existingQuestion.questionType || "TEXT";
    } else {
      const error = new Error("Soal tidak ditemukan untuk diperbarui.");
      error.statusCode = 404;
      throw error;
    }
  }

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
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        content: finalContent,
        rawText: rawText || JSON.stringify(finalContent),
        status,
        facultyId,
        publishedAt:
          status === "PUBLISHED" && !updateData.publishedAt
            ? new Date()
            : updateData.publishedAt,
        questionType,
      },
    });
    return updatedQuestion;
  } catch (error) {
    if (error.code === "P2025") {
      const err = new Error("Soal tidak ditemukan untuk diperbarui.");
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Publishes a question (changes its status to PUBLISHED).
 * This function specifically handles the DRAFT -> PUBLISHED transition.
 * @param {string} questionId - The ID of the question to publish.
 * @returns {Promise<object>} The published question.
 * @throws {Error} If the question is not found or is not in DRAFT status.
 */
async function publishQuestion(questionId) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, status: true }
  });

  if (!question) {
    const error = new Error('Soal tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  if (question.status !== Status.DRAFT) {
    const error = new Error(`Tidak dapat menerbitkan soal yang berstatus ${question.status}. Hanya soal DRAFT yang dapat diterbitkan.`);
    error.statusCode = 400; // Bad Request
    throw error;
  }

  try {
    const publishedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: Status.PUBLISHED,
        publishedAt: new Date(), // Set waktu publikasi
      }
    });
    return publishedQuestion;
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error('Soal tidak ditemukan untuk diterbitkan.');
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Updates the status of a question to ARCHIVED or DRAFT.
 * Handles transitions: PUBLISHED -> ARCHIVED, ARCHIVED -> DRAFT.
 * @param {string} questionId - The ID of the question.
 * @param {Status} newStatus - The new status (ARCHIVED or DRAFT).
 * @returns {Promise<object>} The updated question.
 * @throws {Error} If the transition is invalid.
 */
async function updateQuestionStatus(questionId, newStatus) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, status: true }
  });

  if (!question) {
    const error = new Error('Soal tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = question.status;

  switch (newStatus) {
    case Status.ARCHIVED:
      if (currentStatus !== Status.PUBLISHED) {
        const error = new Error(`Tidak dapat mengarsipkan soal yang berstatus ${currentStatus}. Hanya soal PUBLISHED yang dapat diarsipkan.`);
        error.statusCode = 400;
        throw error;
      }
      break;
    case Status.DRAFT:
      if (currentStatus !== Status.ARCHIVED) {
        const error = new Error(`Tidak dapat mengubah status ke DRAFT dari ${currentStatus}. Hanya soal ARCHIVED yang dapat dikembalikan ke DRAFT.`);
        error.statusCode = 400;
        throw error;
      }
      break;
    default:
      const error = new Error('Status baru tidak valid. Hanya ARCHIVED atau DRAFT yang diizinkan untuk endpoint ini.');
      error.statusCode = 400;
      throw error;
  }

  try {
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: newStatus,
        publishedAt: (newStatus === Status.DRAFT) ? null : undefined,
      }
    });
    return updatedQuestion;
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error('Soal tidak ditemukan untuk pembaruan status.');
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Deletes a question by ID.
 * @param {string} questionId - The ID of the question to delete.
 * @returns {Promise<object>} The deleted question.
 */
async function deleteQuestion(questionId) {
  try {
    const deletedQuestion = await prisma.question.delete({
      where: { id: questionId }
    });
    return deletedQuestion;
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error('Soal tidak ditemukan untuk penghapusan.');
      err.statusCode = 404;
      throw err;
    }
    if (error.code === 'P2003') {
      const err = new Error('Tidak dapat menghapus soal karena terkait dengan progres ujian siswa. Harap hapus progres ujian terkait terlebih dahulu.');
      err.statusCode = 400;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  previewQuestion,
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  publishQuestion,
  updateQuestionStatus,
  deleteQuestion
};