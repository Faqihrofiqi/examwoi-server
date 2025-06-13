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
    throw new Error('Raw text cannot be empty.');
  }

  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    throw new Error('No content found in raw text.');
  }

  let questionText = '';
  const options = [];
  let correctOptionId = null;
  let imageUrl = null;
  let audioUrl = null;
  let questionType = 'TEXT'; // Default type

  // Tambahkan flag untuk melacak apakah pertanyaan sudah ditemukan
  let questionTextFound = false;

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (questionTextFound) {
        // Ini adalah error yang ingin kita hindari untuk parser tunggal
        throw new Error('Multiple question texts (lines starting with #) found within a single question block. Please use only one # per question.');
      }
      questionText = line.substring(1).trim();
      questionTextFound = true;
    } else if (line.startsWith('--')) {
      const optionId = String.fromCharCode(97 + options.length); // 'a'=97, 'b'=98, etc. for lowercase IDs
      options.push({ id: optionId, text: line.substring(2).trim() });
    } else if (line.startsWith('@')) {
      if (correctOptionId) {
        throw new Error('Multiple correct options (lines starting with @) found within a single question block. Please use only one @ per question.');
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
    throw new Error('Question text (starting with #) is missing.');
  }
  if (options.length === 0) {
    throw new Error('Options (starting with --) are missing.');
  }
  if (!correctOptionId) {
    throw new Error('Correct option (starting with @) is missing.');
  }

  if (!options.some(opt => opt.id === correctOptionId)) {
    throw new Error(`Correct option ID '${correctOptionId}' does not match any provided options.`);
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
 * @returns {Array<object>} An array of structured JSON objects, each representing a question.
 * @throws {Error} If any individual question block is malformed.
 */
function parseRawQuestionsBatch(batchRawText) {
  if (!batchRawText || batchRawText.trim() === '') {
    throw new Error('Teks batch tidak boleh kosong.');
  }

  // Normalisasi semua jenis newline ke \n dan hapus whitespace berlebih
  let cleanedText = batchRawText.replace(/\r\n|\r/g, '\n').trim();

  // Pastikan blok pertama juga dimulai dengan '#' jika belum
  if (!cleanedText.startsWith('#')) {
    // Ini mungkin menunjukkan masalah format, tapi kita coba tambahkan agar parser bisa bekerja
    // Atau, user harus memastikan block pertama juga dimulai dengan #
    // Untuk sekarang, kita bisa asumsikan input selalu dimulai dengan # jika dimaksudkan sebagai soal.
  }

  // Split based on a newline followed by '#' (and optional whitespace in between).
  // This regex ensures we split each question block, while keeping the leading '#'.
  // `\n` : matches a newline
  // `\s*` : matches any whitespace characters (including newlines) zero or more times
  // `(?=#)` : positive lookahead to split right before a '#' character
  const questionBlocks = cleanedText
    .split(/\n\s*(?=#)/)
    .filter(block => block.trim().length > 0);

  // Jika setelah split masih tidak ada blok yang dimulai dengan #,
  // atau jika inputnya memang hanya satu soal tanpa delimiter tambahan,
  // coba parse seluruhnya sebagai soal tunggal.
  if (questionBlocks.length === 0 || (questionBlocks.length === 1 && !questionBlocks[0].trim().startsWith('#'))) {
    try {
      const singleParsed = parseRawQuestion(cleanedText);
      return [singleParsed];
    } catch (singleError) {
      // Jika bahkan sebagai single pun gagal, lempar error asli yang lebih informatif
      throw new Error(`Tidak ada blok soal yang valid ditemukan. Pastikan setiap soal dimulai dengan '#' dan dipisahkan dengan benar. Detail error pada parsing tunggal: ${singleError.message}`);
    }
  }

  const parsedQuestions = [];
  for (const [index, block] of questionBlocks.entries()) {
    try {
      let currentBlock = block.trim();
      // Jika block tidak dimulai dengan '#', dan ini bukan block pertama,
      // atau jika block pertama tidak dimulai dengan '#', ini adalah masalah format.
      // Kita harus memastikan setiap blok valid.
      if (!currentBlock.startsWith('#') && index === 0) {
        // Ini kasus jika rawText tidak dimulai dengan #, tapi ada soal di dalamnya
        throw new Error('Blok soal pertama harus dimulai dengan #.');
      }
      if (!currentBlock.startsWith('#') && index > 0) {
        // Ini kasus jika ada pemisahan aneh, atau delimiter yang tidak valid
        throw new Error(`Blok soal ke-${index + 1} tidak dimulai dengan '#'. Pastikan format setiap soal benar.`);
      }

      const parsed = parseRawQuestion(currentBlock); // Gunakan parser soal tunggal
      parsedQuestions.push(parsed);
    } catch (error) {
      // Re-throw dengan lebih banyak konteks
      const err = new Error(`Error pada blok soal ke-${index + 1}: ${error.message}`);
      err.statusCode = 400; // Bad Request
      throw err;
    }
  }
  return parsedQuestions;
}

module.exports = {
  parseRawQuestion,
  parseRawQuestionsBatch 
};