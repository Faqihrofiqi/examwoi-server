import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk menambahkan Access Token ke setiap request yang dilindungi
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk menangani expired token atau unauthorized response
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Tangani Refresh Token jika Access Token expired (status 401)
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Tandai bahwa request ini sudah dicoba ulang
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const rs = await axios.post(
                        `${process.env.REACT_APP_API_BASE_URL}/auth/refresh-token`,
                        { refreshToken }
                    );
                    const { accessToken } = rs.data;
                    localStorage.setItem('accessToken', accessToken);
                    // Update Authorization header untuk request asli yang gagal
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    // Lanjutkan request yang gagal
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Jika refresh token juga gagal atau tidak ada, paksa logout
                console.error("Refresh token failed, forcing logout:", refreshError);
                localStorage.clear();
                window.location.href = '/admin/login'; // Redirect ke login
                return Promise.reject(refreshError);
            }
        } else if (error.response.status === 403) {
            // Jika Forbidden, langsung redirect ke access denied
            console.warn("Access Forbidden:", error.response.data.message);
            window.location.href = '/access-denied';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
