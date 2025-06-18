// src/utils/question.parser.js

/**
 * Parses raw text content of a single question into a structured JSON format.
 * Expected raw format:
 * # Question Text
 * -- Option A
 * -- Option B
 * -- Option C
 * @<correct_option_letter> (e.g., @b)
 *
 * Optional:
 * [IMG:base64_image_data_here_or_url]
 * [AUDIO:base64_audio_data_here_or_url]
 *
 * @param {string} rawText - The raw text content of a SINGLE question.
 * @returns {object} Structured JSON object representing the question.
 * @throws {Error} If the format is invalid or required parts are missing.
 */
function parseRawQuestion(rawText) {
  if (!rawText || rawText.trim() === '') {
    throw new Error('Teks soal tidak boleh kosong.');
  }

  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    throw new Error('Tidak ada konten ditemukan di teks soal.');
  }

  let questionText = '';
  const options = [];
  let correctOptionId = null;
  let imageUrl = null;
  let audioUrl = null;
  let questionType = 'TEXT';

  let foundQuestionText = false; // Flag untuk memastikan hanya ada satu pertanyaan per blok

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (foundQuestionText) {
        throw new Error('Ditemukan lebih dari satu teks pertanyaan (dimulai dengan #) dalam satu blok soal. Harap gunakan hanya satu # per soal.');
      }
      questionText = line.substring(1).trim();
      foundQuestionText = true;
    } else if (line.startsWith('--')) {
      const optionId = String.fromCharCode(97 + options.length);
      options.push({ id: optionId, text: line.substring(2).trim() });
    } else if (line.startsWith('@')) {
      if (correctOptionId) {
        throw new Error('Ditemukan lebih dari satu jawaban benar (dimulai dengan @) dalam satu blok soal. Harap gunakan hanya satu @ per soal.');
      }
      correctOptionId = line.substring(1).trim().toLowerCase();
    } else if (line.startsWith('[IMG:')) {
      imageUrl = line.substring(5, line.length - 1).trim();
      questionType = 'IMAGE';
    } else if (line.startsWith('[AUDIO:')) {
      audioUrl = line.substring(7, line.length - 1).trim();
      questionType = 'AUDIO';
    }
  }

  if (!questionText) {
    throw new Error('Teks pertanyaan (dimulai dengan #) tidak ditemukan.');
  }
  if (options.length === 0) {
    throw new Error('Opsi jawaban (dimulai dengan --) tidak ditemukan.');
  }
  if (!correctOptionId) {
    throw new Error('Jawaban benar (dimulai dengan @) tidak ditemukan.');
  }
  if (!options.some(opt => opt.id === correctOptionId)) {
    throw new Error(`ID jawaban benar '${correctOptionId}' tidak cocok dengan opsi yang tersedia.`);
  }

  return {
    questionText,
    options,
    correctOptionId,
    imageUrl,
    audioUrl,
    questionType
  };
}

/**
* Parses raw text content containing multiple questions.
* Each question block should effectively start with '#' on a new line.
* @param {string} batchRawText - The raw text content of multiple questions.
* @returns {Array<{content: object, rawText: string}>} An array of objects, each with parsed content and original raw text block.
* @throws {Error} If any individual question block is malformed.
*/
function parseRawQuestionsBatch(batchRawText) {
  if (!batchRawText || batchRawText.trim() === '') {
    throw new Error('Teks batch tidak boleh kosong.');
  }

  // Normalisasi semua jenis newline ke \n dan hapus whitespace berlebih dari seluruh input
  let cleanedText = batchRawText.replace(/\r\n|\r/g, '\n').trim();

  // Strategy: Split by a newline followed by a '#'
  // This assumes each new question block starts with '#'.
  // `\n#` is the delimiter. `split()` will remove the delimiter.
  // We then re-add '#' to the beginning of each block.
  let blocks = cleanedText.split(/\n#/).map(block => block.trim());

  // If the first block doesn't start with '#' (meaning the original text started with '#'),
  // we need to prepend '#' to the first block.
  // If the original text started with something else, it's an error.
  if (!blocks[0].startsWith('#') && blocks[0].length > 0) {
    blocks[0] = `#${blocks[0]}`;
  }

  // Filter out any empty blocks that might result from splitting
  const questionBlocks = blocks.filter(block => block.length > 0);

  if (questionBlocks.length === 0) {
    // Fallback: If no '#' delimiters were found, try parsing the whole text as a single question.
    // This handles cases where user pastes a single question into batch mode.
    try {
      const singleParsed = parseRawQuestion(cleanedText);
      // Return with original cleanedText as rawText for the single block
      return [{ content: singleParsed, rawText: cleanedText }];
    } catch (singleError) {
      // If even as a single question it fails, then it's genuinely malformed input.
      throw new Error(`Tidak ada blok soal yang valid ditemukan. Pastikan setiap soal dimulai dengan '#' dan dipisahkan dengan benar. Detail error pada parsing tunggal: ${singleError.message}`);
    }
  }

  const parsedQuestions = [];
  for (const [index, block] of questionBlocks.entries()) {
    try {
      // Ensure each block starts with '#' (after split, it should, but double check for robustness)
      if (!block.startsWith('#')) {
        throw new Error(`Blok soal ke-${index + 1} tidak dimulai dengan '#'. Pastikan setiap soal diawali dengan '#'.`);
      }
      const parsedContent = parseRawQuestion(block); // Gunakan parser soal tunggal
      parsedQuestions.push({ content: parsedContent, rawText: block }); // <-- Simpan rawText asli blok ini
    } catch (error) {
      const err = new Error(`Error pada blok soal ke-${index + 1}: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }
  return parsedQuestions;
}

module.exports = {
  parseRawQuestion,
  parseRawQuestionsBatch
};