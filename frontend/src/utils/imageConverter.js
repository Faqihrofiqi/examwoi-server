// src/utils/imageConverter.js

/**
 * Konversi objek File (gambar) menjadi string Base64 Data URL.
 * @param {File} fileObj - Objek File yang didapat dari input type="file" event.
 * @returns {Promise<string|null>} Promise yang resolve dengan string Base64 Data URL, atau null jika gagal.
 */
export const fileToBase64 = (fileObj) => {
    return new Promise((resolve, reject) => {
        if (!fileObj) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(fileObj);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Validasi dasar untuk format Base64 gambar.
 * @param {string} base64String - String Base64 yang akan divalidasi.
 * @returns {boolean} True jika format Base64 gambar valid, false sebaliknya.
 */
export const isValidBase64Image = (base64String) => {
    if (!base64String) return false;
    const base64Regex = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=])+$/;
    return base64Regex.test(base64String);
};

/**
 * Fungsi untuk mengambil file gambar pertama dari event input file.
 * @param {Event} event - Event dari input type="file".
 * @returns {File|null} Objek File atau null.
 */
export const getFileFromEvent = (event) => {
    return event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
  };