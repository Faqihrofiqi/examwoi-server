// src/routes/questions/questions.service.js
const { PrismaClient, PackageStatus } = require('@prisma/client'); // Hapus 'Status' dari import karena tidak lagi di Question
const prisma = new PrismaClient();
const { parseRawQuestion, parseRawQuestionsBatch } = require('../../utils/question.parser');

/**
 * Previews question(s) from raw text without saving them to the database.
 * Can handle single or batch raw text.
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

/**
 * Creates new question(s) from raw text or structured content, linking to an ExamPackage.
 * @param {string} examPackageId - The ID of the ExamPackage this question(s) belong to.
 * @param {object} questionData - Data for the new question(s) (rawText or content).
 * @param {boolean} isBatch - True if the rawText is expected to contain multiple questions.
 * @returns {Promise<object|Array<object>>} The created question(s).
 */
async function createQuestion(examPackageId, questionData, isBatch = false) {
  const { rawText, content } = questionData;
  let questionsToCreate = [];

  if (isBatch) {
    if (!rawText) {
      const error = new Error('rawText diperlukan untuk pembuatan soal secara batch.');
      error.statusCode = 400;
      throw error;
    }
    const parsedBatchResults = parseRawQuestionsBatch(rawText);
    questionsToCreate = parsedBatchResults.map(item => ({
      content: item.content,
      rawText: item.rawText, // Simpan raw text asli blok ini
      examPackageId: examPackageId,
      questionType: item.content.questionType || 'TEXT'
    }));
  } else { // Single question mode (raw or structured)
    let parsedContent;
    let questionType;
    let finalRawText;

    if (rawText) { // Jika input dari raw text
      parsedContent = parseRawQuestion(rawText);
      questionType = parsedContent.questionType || 'TEXT';
      finalRawText = rawText;
    } else if (content) { // Jika input dari structured form
      parsedContent = content;
      if (parsedContent.imageUrl) questionType = 'IMAGE';
      else if (parsedContent.audioUrl) questionType = 'AUDIO';
      else questionType = 'TEXT';
      const optionsMap = parsedContent.options.map(opt => `-- ${opt.text}`).join('\n');
      finalRawText = `# ${parsedContent.questionText}\n` + optionsMap + `\n@${parsedContent.correctOptionId}`;
      if (parsedContent.imageUrl) finalRawText = `[IMG:${parsedContent.imageUrl}]\n` + finalRawText;
      if (parsedContent.audioUrl) finalRawText = `[AUDIO:${parsedContent.audioUrl}]\n` + finalRawText;
    } else {
      const error = new Error('rawText atau konten terstruktur harus disediakan untuk satu soal.');
      error.statusCode = 400;
      throw error;
    }
    questionsToCreate.push({
      content: parsedContent,
      rawText: finalRawText,
      examPackageId: examPackageId,
      questionType
    });
  }

  const examPackage = await prisma.examPackage.findUnique({ where: { id: examPackageId } });
  if (!examPackage) {
    const error = new Error('Paket ujian tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  if (isBatch) {
    const result = await prisma.question.createMany({
      data: questionsToCreate
    });
    await prisma.examPackage.update({
      where: { id: examPackageId },
      data: { totalQuestions: { increment: result.count } }
    });
    console.log(`Berhasil membuat ${result.count} soal dalam batch.`);
    return { count: result.count, message: `Berhasil membuat ${result.count} soal.` };
  } else {
    const question = await prisma.question.create({
      data: questionsToCreate[0]
    });
    await prisma.examPackage.update({
      where: { id: examPackageId },
      data: { totalQuestions: { increment: 1 } }
    });
    return question;
  }
}

/**
 * Retrieves questions based on filters. Now filtered by examPackageId.
 * @param {object} filters - Filters like examPackageId.
 * @returns {Promise<Array<object>>} List of questions.
 */
async function getQuestions(filters) {
  const { examPackageId } = filters;
  const where = {};

  if (examPackageId) {
    where.examPackageId = examPackageId;
  }

  const questions = await prisma.question.findMany({
    where,
    include: {
      examPackage: {
        select: {
          id: true,
          name: true,
          status: true,
          publishedAt: true,
          faculty: { select: { id: true, name: true } }
        }
      }
    },
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
    include: {
      examPackage: {
        select: {
          id: true,
          name: true,
          status: true,
          publishedAt: true,
          faculty: { select: { id: true, name: true } }
        }
      }
    },
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
 * @param {object} updateData - Data to update the question (rawText, content, examPackageId).
 * @returns {Promise<object>} The updated question.
 */
async function updateQuestion(questionId, updateData) {
  // Pastikan `isBatch` tidak ada di updateData sebelum diakses oleh Prisma
  const { isBatch, ...dataForPrisma } = updateData; // <--- Hapus isBatch dari updateData

  const { rawText, content, examPackageId } = dataForPrisma; // Gunakan dataForPrisma
  let finalContent;
  let questionType;
  let finalRawText;

  const existingQuestion = await prisma.question.findUnique({
    where: { id: questionId },
    select: { content: true, rawText: true, questionType: true, examPackageId: true },
  });
  if (!existingQuestion) {
    const error = new Error("Soal tidak ditemukan untuk diperbarui.");
    error.statusCode = 404;
    throw error;
  }

  if (rawText !== undefined) {
    finalContent = parseRawQuestion(rawText);
    questionType = finalContent.questionType || "TEXT";
    finalRawText = rawText;
  } else if (content !== undefined) {
    finalContent = content;
    if (finalContent.imageUrl) questionType = "IMAGE";
    else if (finalContent.audioUrl) questionType = "AUDIO";
    else questionType = "TEXT";
    const optionsMap = finalContent.options.map(opt => `-- ${opt.text}`).join('\n');
    finalRawText = `# ${finalContent.questionText}\n` + optionsMap + `\n@${finalContent.correctOptionId}`;
    if (finalContent.imageUrl) finalRawText = `[IMG:${finalContent.imageUrl}]\n` + finalRawText;
    if (finalContent.audioUrl) finalRawText = `[AUDIO:${finalContent.audioUrl}]\n` + finalRawText;
  } else {
    finalContent = existingQuestion.content;
    questionType = existingQuestion.questionType || "TEXT";
    finalRawText = existingQuestion.rawText;
  }

  if (examPackageId && examPackageId !== existingQuestion.examPackageId) {
    const examPackage = await prisma.examPackage.findUnique({
      where: { id: examPackageId },
    });
    if (!examPackage) {
      const error = new Error("Paket ujian baru tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
  }

  try {
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        content: finalContent,
        rawText: finalRawText,
        examPackageId: examPackageId || existingQuestion.examPackageId,
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

// Hapus fungsi publishQuestion dan updateQuestionStatus karena status sekarang diurus oleh ExamPackage
/*
async function publishQuestion(questionId) { ... }
async function updateQuestionStatus(questionId, newStatus) { ... }
*/

/**
 * Deletes a question by ID.
 * @param {string} questionId - The ID of the question to delete.
 * @returns {Promise<object>} The deleted question.
 */
async function deleteQuestion(questionId) {
  try {
    const deletedQuestion = await prisma.question.delete({
      where: { id: questionId },
    });
    // Opsional: Kurangi totalQuestions di ExamPackage
    if (deletedQuestion.examPackageId) {
      await prisma.examPackage.update({
        where: { id: deletedQuestion.examPackageId },
        data: {
          totalQuestions: {
            decrement: 1
          }
        }
      });
    }
    return deletedQuestion;
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error('Soal tidak ditemukan untuk penghapusan.');
      err.statusCode = 404;
      throw err;
    }
    if (error.code === 'P2003') {
      const err = new Error('Tidak dapat menghapus soal karena terkait dengan progres ujian siswa. Harap hapus progres ujian terkait terlebih dahulu.');
      err.statusCode = 400; // Bad Request
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
  // publishQuestion, // Hapus export ini
  // updateQuestionStatus, // Hapus export ini
  deleteQuestion
};