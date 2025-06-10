// src/utils/fetchData.js
import axios from 'axios';

const API_BASE_URL = 'process.env.REACT_APP_API_BASE_URL'; // Pastikan ini sesuai dengan URL backend Anda

/**
 * Fungsi utilitas untuk melakukan HTTP request ke API backend.
 * @param {string} urlPath - Path endpoint API (misal: '/auth/login', '/faculties').
 * @param {string} method - Metode HTTP (GET, POST, PUT, DELETE).
 * @param {object|null} body - Body request dalam format JSON.
 * @param {boolean} isAuthRequired - Apakah request ini memerlukan Authorization header (Access Token).
 * @param {boolean} throwOnNotFound - Jika true, akan melempar error jika response status 404. Jika false, mengembalikan null.
 * @returns {Promise<object|null>} Data response dari API, atau null/throw error.
 * @throws {Error} Untuk error jaringan, server, atau autentikasi/otorisasi.
 */
export const fetchData = async (urlPath, method = 'GET', body = null, isAuthRequired = true, throwOnNotFound = true) => {
    try {
        const headers  = {
            'Content-Type': 'application/json',
        };

        // Ambil Access Token hanya jika diperlukan dan tersedia
        if (isAuthRequired) {
            const ACCESS_TOKEN = localStorage.getItem('accessToken');
            if (!ACCESS_TOKEN) {
                const err = new Error('Authentication required. Please log in.');
                err.statusCode = 401; // Custom status code untuk error
                throw err;
            }
            headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
        }

        const url = `${API_BASE_URL}${urlPath}`;

        const options = {
            method,
            headers,
            data: body, // Axios menggunakan 'data' untuk body pada method POST/PUT
            validateStatus: (status) => {
                // Jangan melempar error untuk 4xx, biarkan kita handle manual
                // Kecuali jika itu 404 dan kita ingin melemparnya (throwOnNotFound)
                return status < 500 || (status === 404 && !throwOnNotFound);
            }
        };

        const response = await axios(url, options);
        return response.data;

    } catch (err) {
        console.error(`Error in fetchData for ${urlPath}:`, err.response ? err.response.data : err.message);
        let errorMessage = 'Terjadi kesalahan tak terduga pada server.';
        let statusCode = 500;

        if (err.response) {
            errorMessage = err.response.data.message || (err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].msg) || errorMessage;
            statusCode = err.response.status;
        } else if (err.message) {
            errorMessage = err.message;
        }

        // Jika 404 dan tidak ingin melempar error, kembalikan null
        if (statusCode === 404 && !throwOnNotFound) {
            return null;
        }

        // Handle 401/403 for general errors (login/permission)
        if (statusCode === 401 || statusCode === 403) {
            alert("Sesi berakhir atau tidak punya izin. Silakan login kembali.");
            localStorage.clear();
            window.location.href = '/admin/login'; // Redirect ke halaman login
        }

        const customError = new Error(errorMessage);
        customError.statusCode = statusCode;
        throw customError; // Lempar custom error
    }
};