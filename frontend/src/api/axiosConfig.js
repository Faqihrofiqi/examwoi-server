// frontend/src/api/axiosConfig.js
import axios from 'axios';
import API_CONFIG  from './apiConfig';
//#TODO ensure that the .env file is in the root of the monorepo or adjust the path accordingly in craco.config.js

const API_BASE_URL = API_CONFIG.API_BASE_URL; // Ganti dengan URL API Anda jika diperlukan,
const API_KEY = API_CONFIG.API_KEY;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        if (API_KEY && API_KEY !== 'YOUR_STATIC_SECURE_API_KEY_HERE') {
            config.headers['x-api-key'] = API_KEY;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.log(error);
        
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert("Sesi Anda telah berakhir atau Anda tidak memiliki izin. Silakan login kembali.");
            localStorage.clear();
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;